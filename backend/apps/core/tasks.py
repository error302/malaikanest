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
