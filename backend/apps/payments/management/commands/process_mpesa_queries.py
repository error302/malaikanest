import time

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.payments.models import Payment
from apps.payments.mpesa_verification import verify_payment


class Command(BaseCommand):
    help = "Drain due M-Pesa verification jobs from the durable payment queue."

    def add_arguments(self, parser):
        parser.add_argument("--run-seconds", type=int, default=0)

    def handle(self, *args, **options):
        deadline = time.monotonic() + min(55, max(0, options["run_seconds"]))
        while True:
            due = list(Payment.objects.filter(
                payment_method="mpesa", status="initiated",
                mpesa_next_query_at__lte=timezone.now(),
            ).exclude(mpesa_checkout_request_id__isnull=True).order_by(
                "mpesa_next_query_at", "pk",
            ).values_list("pk", flat=True)[:10])
            for payment_id in due:
                verify_payment(payment_id)
                if options["run_seconds"] and time.monotonic() >= deadline:
                    return
            if time.monotonic() >= deadline:
                return
            time.sleep(3)
