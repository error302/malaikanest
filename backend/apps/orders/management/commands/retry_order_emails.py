import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.core.email_service import EmailService, ORDER_CONFIRMATION
from apps.core.models import EmailLog
from apps.orders.models import Order

logger = logging.getLogger("apps.orders.retry_emails")


class Command(BaseCommand):
    help = "Idempotently retry failed or missing order confirmation emails without Celery"

    def add_arguments(self, parser):
        parser.add_argument(
            "--max-age-days",
            type=int,
            default=7,
            help="Maximum age in days of orders to inspect (default: 7)",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=50,
            help="Maximum number of emails to attempt per execution (default: 50)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate and display candidates without sending emails",
        )

    def handle(self, *args, **options):
        max_age_days = options["max_age_days"]
        limit = options["limit"]
        dry_run = options["dry_run"]

        since = timezone.now() - timedelta(days=max_age_days)

        # Orders eligible for confirmation emails: orders that are paid or processing
        orders = (
            Order.objects.filter(
                status__in=[
                    Order.STATUS_PAID,
                    Order.STATUS_PROCESSING,
                    Order.STATUS_SHIPPED,
                    Order.STATUS_DELIVERED,
                ],
                created_at__gte=since,
            )
            .order_by("-created_at")[:limit * 2]  # Fetch buffer to account for already-sent
        )

        sent_count = 0
        skipped_count = 0
        failed_count = 0

        for order in orders:
            if sent_count >= limit:
                break

            order_id_str = str(order.id)

            # Idempotency check: has a successful confirmation email already been logged?
            already_sent = EmailLog.objects.filter(
                order_id=order_id_str,
                email_type=ORDER_CONFIRMATION,
                success=True,
            ).exists()

            if already_sent:
                skipped_count += 1
                continue

            recipient = order.guest_email or (order.user.email if order.user else None)
            if not recipient:
                self.stdout.write(self.style.WARNING(f"Order {order_id_str} has no recipient email; skipping."))
                skipped_count += 1
                continue

            if dry_run:
                self.stdout.write(f"[DRY-RUN] Would send confirmation for order={order_id_str} to={recipient}")
                sent_count += 1
                continue

            self.stdout.write(f"Sending confirmation for order={order_id_str} to={recipient}...")
            try:
                ok, msg = EmailService.send_order_confirmation(order)
                if ok:
                    sent_count += 1
                    self.stdout.write(self.style.SUCCESS(f"  -> Successfully sent to {recipient}"))
                else:
                    failed_count += 1
                    self.stdout.write(self.style.ERROR(f"  -> Failed to send: {msg}"))
            except Exception as exc:
                failed_count += 1
                logger.error("Failed sending confirmation email for order %s: %s", order_id_str, exc, exc_info=True)
                self.stdout.write(self.style.ERROR(f"  -> Exception sending email: {exc}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Retry email run complete. Sent: {sent_count}, Skipped (already delivered): {skipped_count}, Failed: {failed_count}"
            )
        )
