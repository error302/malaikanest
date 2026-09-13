import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.payments.models import Payment, PaymentAuditLog
from apps.payments.tasks import verify_mpesa_payment_async

logger = logging.getLogger("apps.payments.reconcile")


class Command(BaseCommand):
    help = "Reconcile pending/initiated M-Pesa payments directly without Celery"

    def add_arguments(self, parser):
        parser.add_argument(
            "--stale-minutes",
            type=int,
            default=2,
            help="Minimum age in minutes before a payment is eligible for reconciliation (default: 2)",
        )
        parser.add_argument(
            "--max-age-hours",
            type=int,
            default=24,
            help="Maximum age in hours to look back for pending payments (default: 24)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=50,
            help="Maximum number of payments to reconcile in one run (default: 50)",
        )

    def handle(self, *args, **options):
        stale_minutes = options["stale_minutes"]
        max_age_hours = options["max_age_hours"]
        limit = options["limit"]

        now = timezone.now()
        min_created = now - timedelta(hours=max_age_hours)
        max_created = now - timedelta(minutes=stale_minutes)

        candidates = (
            Payment.objects.filter(
                payment_method="mpesa",
                status="initiated",
                initiated_at__gte=min_created,
                initiated_at__lte=max_created,
            )
            .exclude(mpesa_checkout_request_id__isnull=True)
            .exclude(mpesa_checkout_request_id="")
            .order_by("initiated_at")[:limit]
        )

        candidate_count = candidates.count()
        self.stdout.write(f"Found {candidate_count} pending M-Pesa payment(s) to reconcile.")

        processed = 0
        completed = 0
        failed = 0

        for payment in candidates:
            # Re-check status inside loop to prevent double-processing
            payment.refresh_from_db()
            if payment.status != "initiated":
                self.stdout.write(f"Payment {payment.id} already {payment.status}; skipping.")
                continue

            processed += 1
            self.stdout.write(
                f"Reconciling payment={payment.id} order={payment.order_id} checkout_id={payment.checkout_request_id}..."
            )

            try:
                # Synchronous invocation without Celery
                result = verify_mpesa_payment_async(payment.id)
                payment.refresh_from_db()
                if payment.status == "completed":
                    completed += 1
                    self.stdout.write(self.style.SUCCESS(f"  -> Payment {payment.id} COMPLETED (Order {payment.order_id} marked paid)"))
                else:
                    self.stdout.write(f"  -> Payment {payment.id} result: {result} (status: {payment.status})")
            except Exception as exc:
                failed += 1
                logger.error("Error reconciling payment %s: %s", payment.id, exc, exc_info=True)
                self.stdout.write(self.style.ERROR(f"  -> Error reconciling payment {payment.id}: {exc}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Reconciliation finished. Total candidate(s): {candidate_count}, Processed: {processed}, Completed: {completed}, Errors: {failed}"
            )
        )
