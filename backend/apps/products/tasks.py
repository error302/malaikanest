import logging

from django.db.models import F

try:
    from celery import shared_task
except ImportError:

    def shared_task(func=None, **kwargs):
        if func is not None:
            return func

        def decorator(f):
            return f

        return decorator


logger = logging.getLogger("apps.products")


@shared_task(bind=True, max_retries=3, default_retry_delay=60, acks_late=True, reject_on_worker_lost=True)
def low_stock_check(self, threshold=10):
    """
    Daily low-stock check (idempotent).
    Logs products whose available stock (quantity - reserved) is below threshold.
    """
    try:
        from apps.products.models import Inventory

        low = (
            Inventory.objects.select_related("product")
            .annotate(available=F("quantity") - F("reserved"))
            .filter(available__lt=int(threshold))
            .order_by("available")[:200]
        )
        if not low:
            return "ok"

        for inv in low:
            logger.warning(
                "Low stock: product_id=%s name=%s available=%s",
                inv.product_id,
                getattr(inv.product, "name", ""),
                max(inv.quantity - inv.reserved, 0),
            )
        return f"low_stock={len(low)}"
    except Exception as exc:
        logger.error("low_stock_check failed: %s", exc)
        try:
            raise self.retry(exc=exc)
        except Exception:
            return "failed"

