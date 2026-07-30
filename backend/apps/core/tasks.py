"""Core Celery tasks: outbox relay + lightweight payment health alerting."""
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

logger = logging.getLogger("apps.core")

try:
    from celery import shared_task
except ImportError:

    def shared_task(func=None, **kwargs):
        if func is not None:
            return func

        def decorator(f):
            return f

        return decorator


def _dispatch_outbox_event(event):
    """Map an outbox event to its downstream side-effect. Handlers are idempotent."""
    from apps.orders.tasks import restore_inventory
    from apps.payments.services import PaymentService

    if event.event_type == "order.paid":
        # Reduce inventory, generate invoice, send confirmation email.
        PaymentService.trigger_post_payment_tasks(event.payload["order_id"])
    elif event.event_type == "order.cancelled":
        restore_inventory.delay(event.payload["order_id"])
    else:
        logger.warning("Outbox: unknown event_type %s (event %s)", event.event_type, event.id)


@shared_task
def process_outbox(limit=200):
    """Relay pending OutboxEvents to async workers. Idempotent: downstream tasks
    are safe to run more than once, so a failed publish is simply retried next run.
    """
    from .models import OutboxEvent

    pending = list(
        OutboxEvent.objects.filter(status="pending").order_by("created_at")[:limit]
    )
    processed = 0
    for event in pending:
        try:
            _dispatch_outbox_event(event)
            event.status = "published"
            event.published_at = timezone.now()
            event.save(update_fields=["status", "published_at", "updated_at"])
            processed += 1
        except Exception as exc:
            # Leave pending so the next run retries; downstream handlers are idempotent.
            logger.error("Outbox: dispatch failed for event %s: %s", event.id, exc)
    return f"processed {processed}/{len(pending)}"


@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def email_health_check(self):
    """Send a test email to the admin address and alert on failure.
    Runs every 30 minutes via Celery Beat. If the SMTP send fails,
    dispatches a critical alert so operators know email is down.
    """
    from django.conf import settings
    from apps.core.email_service import EmailService

    admin_email = getattr(settings, "SERVER_EMAIL", None) or getattr(settings, "DEFAULT_FROM_EMAIL", None)
    if not admin_email:
        logger.warning("email_health_check: no admin email configured, skipping")
        return "no admin email"

    from django.utils import timezone
    now = timezone.now()
    text_body = f"Email system health check passed at {now.isoformat()}"

    ok, msg = EmailService.send(
        email_type=EmailService.HEALTH_CHECK,
        to=[admin_email],
        subject="[Malaika Nest] Email Health Check",
        text_body=text_body,
    )
    if ok:
        logger.info("email_health_check: OK to %s", admin_email)
        return "OK"
    else:
        logger.error("email_health_check: FAILED to %s: %s", admin_email, msg)
        try:
            from apps.orders.tasks import send_critical_alert
            send_critical_alert.delay(
                "email_down",
                f"SMTP health check failed for {admin_email}: {msg}",
                {"component": "email"},
            )
        except Exception as alert_exc:
            logger.error("email_health_check: alert dispatch also failed: %s", alert_exc)
        return f"FAILED: {msg}"


@shared_task
def generate_data_export_task(export_id: str) -> str:
    """
    Generate a JSON archive of the user's personal data and store it on
    the ``DataExportRequest`` record.

    Called asynchronously after the user requests a data export. Gathers:
    - Profile information
    - Orders and payments
    - Addresses
    - Reviews
    - Cart and wishlist history
    - Product views (recently-viewed, if tracked)

    Sets ``archive_file`` and ``expires_at`` on success, or ``error_message``
    on failure, then sends a notification email to the user.
    """
    import json
    import uuid
    from datetime import timedelta

    from django.utils import timezone
    from django.core.files.base import ContentFile

    from .models import DataExportRequest

    try:
        export = DataExportRequest.objects.select_related("user").get(
            id=export_id, status=DataExportRequest.STATUS_PENDING
        )
    except DataExportRequest.DoesNotExist:
        logger.warning("DataExportRequest %s not found or already processed", export_id)
        return "not found"

    export.status = DataExportRequest.STATUS_PROCESSING
    export.save(update_fields=["status", "updated_at"])

    user = export.user

    try:
        # ── Gather data ──
        profile = {
            "email": user.email,
            "phone_number": user.phone_number,
            "first_name": user.first_name or "",
            "last_name": user.last_name or "",
            "full_name": user.full_name or "",
            "role": user.role,
            "is_email_verified": user.is_email_verified,
            "date_joined": user.date_joined.isoformat() if user.date_joined else None,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }

        # Addresses
        addresses = []
        for addr in user.addresses.all():
            addresses.append({
                "label": addr.label,
                "street": addr.street,
                "city": addr.city,
                "county": addr.county,
                "postal_code": addr.postal_code,
                "is_default": addr.is_default,
                "created_at": addr.created_at.isoformat() if addr.created_at else None,
            })

        # Orders with payments (N+1 fix: prefetch items and products)
        orders = []
        orders_qs = user.orders.select_related(
            "payment", "coupon"
        ).prefetch_related("items__product")
        for order in orders_qs.all():
            items = []
            for item in order.items.all():
                items.append({
                    "product_name": item.product.name,
                    "product_slug": item.product.slug,
                    "quantity": item.quantity,
                    "price": str(item.price),
                })

            order_data = {
                "id": str(order.id),
                "receipt_number": order.receipt_number,
                "status": order.status,
                "subtotal": str(order.subtotal),
                "delivery_fee": str(order.delivery_fee),
                "total": str(order.total),
                "payment_method": order.payment_method,
                "delivery_region": order.delivery_region,
                "shipping_address": {
                    "first_name": order.shipping_first_name or "",
                    "last_name": order.shipping_last_name or "",
                    "phone": order.shipping_phone or "",
                    "address": order.shipping_address or "",
                    "city": order.shipping_city or "",
                    "region": order.shipping_region or "",
                    "postal_code": order.shipping_postal_code or "",
                },
                "items": items,
                "created_at": order.created_at.isoformat() if order.created_at else None,
                "paid_at": order.paid_at.isoformat() if order.paid_at else None,
                "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
                "delivered_at": order.delivered_at.isoformat() if order.delivered_at else None,
            }

            # Include payment info if present
            payment = getattr(order, "payment", None)
            if payment:
                order_data["payment"] = {
                    "method": payment.payment_method,
                    "amount": str(payment.amount),
                    "status": payment.status,
                    "receipt_number": payment.mpesa_receipt_number or "",
                    "phone": payment.phone_number or "",
                    "completed_at": payment.completed_at.isoformat() if payment.completed_at else None,
                }

            orders.append(order_data)

        # Reviews
        reviews = []
        for review in user.reviews.select_related("product").all():
            reviews.append({
                "product_name": review.product.name if review.product else "",
                "product_slug": review.product.slug if review.product else "",
                "rating": review.rating,
                "title": review.title or "",
                "body": review.body or "",
                "created_at": review.created_at.isoformat() if review.created_at else None,
            })

        # Wishlist
        wishlist = []
        for wl in user.wishlist.select_related("product").all():
            wishlist.append({
                "product_name": wl.product.name,
                "product_slug": wl.product.slug,
                "added_at": wl.created_at.isoformat() if wl.created_at else None,
            })

        archive = {
            "export_generated_at": timezone.now().isoformat(),
            "exporter": "Malaika Nest",
            "contact": "hello@malaikanest.com",
            "profile": profile,
            "addresses": addresses,
            "orders": orders,
            "reviews": reviews,
            "wishlist": wishlist,
        }

        archive_bytes = json.dumps(archive, indent=2, ensure_ascii=False, default=str).encode("utf-8")
        archive_size = len(archive_bytes)

        # Store as a ChunkedFile / ContentFile
        filename = f"malaikanest-data-export-{uuid.uuid4().hex[:12]}.json"
        export.archive_file.save(filename, ContentFile(archive_bytes), save=False)
        export.archive_size = archive_size
        export.expires_at = timezone.now() + timedelta(days=DataExportRequest.EXPIRY_DAYS)
        export.status = DataExportRequest.STATUS_READY
        export.save(update_fields=[
            "archive_file", "archive_size", "expires_at", "status", "updated_at",
        ])

        # Notify the user
        frontend_url = getattr(settings, "FRONTEND_URL", "https://malaikanest.com").rstrip("/")
        download_url = f"{frontend_url}/account/data-exports/{export.id}/download/"
        from apps.core.email_service import EmailService
        EmailService.send_data_export_ready(
            email=user.email,
            first_name=user.first_name or user.full_name or "",
            download_url=download_url,
        )

        export.notification_sent_at = timezone.now()
        export.save(update_fields=["notification_sent_at", "updated_at"])

        logger.info("DataExport %s: %d bytes, email sent to %s", export.id, archive_size, user.email)
        return f"OK ({archive_size} bytes)"

    except Exception as exc:
        logger.error("DataExport %s failed: %s", export.id, exc, exc_info=True)
        export.status = DataExportRequest.STATUS_FAILED
        export.error_message = str(exc)[:2000]
        export.save(update_fields=["status", "error_message", "updated_at"])
        return f"FAILED: {exc}"


@shared_task
def clean_expired_data_exports() -> str:
    """
    Mark ``DataExportRequest`` records whose ``expires_at`` has passed as
    ``expired`` and delete the archive file from storage.

    Runs daily via Celery Beat. Protects user privacy by ensuring personal
    data archives aren't retained beyond the 7-day window.
    """
    from django.core.files.storage import default_storage
    from .models import DataExportRequest

    now = timezone.now()
    expired = DataExportRequest.objects.filter(
        status=DataExportRequest.STATUS_READY,
        expires_at__lte=now,
    )

    count = 0
    for export in expired.iterator():
        try:
            if export.archive_file and export.archive_file.name:
                storage_path = export.archive_file.name
                try:
                    if default_storage.exists(storage_path):
                        default_storage.delete(storage_path)
                except Exception as exc:
                    logger.warning("DataExport %s: could not delete file %s: %s", export.id, storage_path, exc)
            export.archive_file = None
            export.archive_size = 0
            export.status = DataExportRequest.STATUS_EXPIRED
            export.save(update_fields=["archive_file", "archive_size", "status", "updated_at"])
            count += 1
        except Exception as exc:
            logger.error("DataExport %s cleanup failed: %s", export.id, exc)

    if count:
        logger.info("Expired %d data export archives", count)
    return f"expired {count}"


@shared_task
def payments_failure_alert(window_minutes=5, failure_threshold=20, failure_ratio=0.3):
    """RED-style alerting: if M-Pesa failures spike, page admins via the existing
    critical-alert task. Reads lightweight Redis counters (see apps.core.metrics).
    """
    from .metrics import get

    try:
        from apps.orders.tasks import send_critical_alert
    except Exception:
        return "metrics/alert unavailable"

    completed = get("payments.completed")
    failed = get("payments.failed")

    triggered = failed >= failure_threshold and (
        completed == 0 or (failed / max(completed + failed, 1)) >= failure_ratio
    )
    if triggered:
        send_critical_alert.delay(
            "mpesa_failure_spike",
            f"M-Pesa failures={failed}, completed={completed} in last window.",
            {"window_minutes": window_minutes},
        )
        return "alert sent"
    return "ok"
