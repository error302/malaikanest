from django.core.management.base import BaseCommand

from apps.payments.models import Payment
from apps.payments.tasks import reconcile_payments_task, verify_mpesa_payment_async


class Command(BaseCommand):
    help = "Queue payment reconciliation tasks"

    def add_arguments(self, parser):
        parser.add_argument("--payment-id", type=int, help="Queue reconciliation for one payment")
        parser.add_argument("--order-id", type=int, help="Queue reconciliation by order ID")
        parser.add_argument("--stale-minutes", type=int, default=30)
        parser.add_argument("--limit", type=int, default=200)

    def handle(self, *args, **options):
        payment_id = options.get("payment_id")
        order_id = options.get("order_id")

        if payment_id or order_id:
            payment = None
            if payment_id:
                payment = Payment.objects.filter(pk=payment_id, payment_method="mpesa").first()
            elif order_id:
                payment = Payment.objects.filter(order_id=order_id, payment_method="mpesa").first()

            if not payment:
                self.stdout.write(self.style.ERROR("Payment not found"))
                return

            verify_mpesa_payment_async.delay(payment.id)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Queued reconciliation for payment={payment.id}, order={payment.order_id}"
                )
            )
            return

        reconcile_payments_task.delay(
            stale_minutes=options["stale_minutes"],
            limit=options["limit"],
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Queued stale reconciliation (stale_minutes={options['stale_minutes']}, limit={options['limit']})"
            )
        )
