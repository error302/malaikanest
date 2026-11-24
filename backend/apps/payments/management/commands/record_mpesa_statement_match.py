from uuid import UUID

from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.orders.models import Order
from apps.payments.models import Payment
from apps.payments.mpesa_verification import amount, order_transaction_reference, receipt_number


class Command(BaseCommand):
    help = "Record a receipt matched to an already confirmed STK payment on the official merchant statement."

    def add_arguments(self, parser):
        parser.add_argument("payment_id", type=UUID)
        parser.add_argument("--receipt", required=True)
        parser.add_argument("--amount", required=True)
        parser.add_argument("--till", required=True)
        parser.add_argument("--statement-matched", action="store_true")

    def handle(self, *args, **options):
        receipt = receipt_number(options["receipt"].strip().upper())
        statement_amount = amount(options["amount"])
        if not options["statement_matched"] or not receipt or not statement_amount:
            raise CommandError("Match the statement entry before recording a valid receipt and amount.")
        try:
            with transaction.atomic():
                payment = Payment.objects.select_for_update().filter(
                    pk=options["payment_id"], payment_method="mpesa", status="completed",
                ).first()
                if not payment or not payment.checkout_request_id or not payment.mpesa_sent_amount:
                    raise CommandError("No confirmed STK payment with a stored payment intent.")
                if payment.mpesa_sent_amount != statement_amount or payment.mpesa_destination != options["till"]:
                    raise CommandError("Statement amount or till differs from the payment intent.")
                if payment.mpesa_receipt_number and payment.mpesa_receipt_number != receipt:
                    raise CommandError("Payment already has a different verified receipt.")
                if payment.mpesa_statement_verified_at:
                    self.stdout.write("Receipt was already matched.")
                    return
                payment.mpesa_receipt_number = receipt
                payment.mpesa_statement_verified_at = timezone.now()
                if payment.mpesa_issue in {"receipt_unverified", "callback_metadata_mismatch"}:
                    payment.mpesa_issue = ""
                payment.save(update_fields=[
                    "mpesa_receipt_number", "mpesa_statement_verified_at", "mpesa_issue", "updated_at",
                ])
                order = Order.objects.select_for_update().get(pk=payment.order_id)
                if order.transaction_id == order_transaction_reference(payment):
                    order.mpesa_receipt_number = receipt
                    order.save(update_fields=["mpesa_receipt_number", "updated_at"])
        except IntegrityError:
            raise CommandError("Receipt is already tied to another payment.") from None
        self.stdout.write(self.style.SUCCESS("Receipt matched against the merchant statement."))
