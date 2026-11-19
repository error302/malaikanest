import logging
import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.core.tasks import process_outbox
from apps.orders.tasks import cancel_stale_pending_orders, cleanup_old_guest_carts

logger = logging.getLogger("apps.core")


class Command(BaseCommand):
    help = "Processes the outbox queue, cancels stale pending orders, and cleans expired guest carts."

    def add_arguments(self, parser):
        parser.add_argument(
            "--loop",
            action="store_true",
            help="Run continuously in a loop sleeping between iterations",
        )
        parser.add_argument(
            "--interval",
            type=int,
            default=60,
            help="Sleep interval in seconds when running in --loop mode (default: 60)",
        )

    def handle(self, *args, **options):
        is_loop = options.get("loop", False)
        interval = options.get("interval", 60)

        self.stdout.write(self.style.NOTICE(f"Starting shop queue processor (loop={is_loop})..."))

        while True:
            start = time.time()
            try:
                # 1. Process pending outbox events (order.paid, order.cancelled)
                outbox_result = process_outbox(limit=100)
                self.stdout.write(f"Outbox: {outbox_result}")

                # 2. Release stale reservations from abandoned pending checkouts (> 24h)
                cancel_result = cancel_stale_pending_orders()
                self.stdout.write(f"Stale orders: {cancel_result}")

                # 3. Clean up guest carts (> 7 days)
                cleanup_result = cleanup_old_guest_carts()
                self.stdout.write(f"Guest carts: {cleanup_result}")

            except Exception as exc:
                logger.exception("Error processing shop queue: %s", exc)
                self.stderr.write(self.style.ERROR(f"Queue error: {exc}"))

            if not is_loop:
                break

            elapsed = time.time() - start
            sleep_time = max(1.0, interval - elapsed)
            time.sleep(sleep_time)
