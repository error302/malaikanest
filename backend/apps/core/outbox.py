"""Transactional Outbox helpers.

Write domain events with the state change that produced them; a relay task
(apps.core.tasks.process_outbox) publishes them to the async workers so side
effects (invoicing, inventory, emails) are never lost on process crashes.

WHY publish_and_drain() EXISTS
------------------------------
The relay only ever runs from Celery beat ("outbox-process-every-30s" in
settings/base.py). On a single-container deployment with no Redis there is no
beat and no worker, so nothing ever calls process_outbox and every event sits
pending forever. For order.paid that means: stock is never deducted (oversell),
no invoice PDF is generated, and the customer never receives a receipt email.

publish_and_drain() keeps the durable row but guarantees the event is processed:
it tries the broker, and if none is reachable it dispatches inline in the
request process. Downstream handlers are documented as idempotent, so a later
beat run re-processing the same row is harmless. Costs zero resident memory,
which matters on a 1 GB VM.
"""
import logging

from django.db import transaction
from django.utils import timezone

from .models import OutboxEvent

logger = logging.getLogger("apps.core")

#: Events whose side effects move money or stock and therefore must not be left
#: sitting in the outbox waiting for a worker that may not exist.
CRITICAL_EVENTS = frozenset({"order.paid", "order.cancelled"})


def publish_event(aggregate_type, aggregate_id, event_type, payload=None):
    """Persist an outbox event. Call inside the DB transaction that made the change."""
    return OutboxEvent.objects.create(
        aggregate_type=aggregate_type,
        aggregate_id=str(aggregate_id),
        event_type=event_type,
        payload=payload or {},
    )


def drain_event(event):
    """Dispatch a single OutboxEvent inline if it is still pending. Idempotent."""
    from .tasks import _dispatch_outbox_event

    try:
        event.refresh_from_db()
    except OutboxEvent.DoesNotExist:
        return False
    if event.status != "pending":
        return False
    try:
        _dispatch_outbox_event(event)
    except Exception as exc:
        # Leave it pending so the next drain / beat run retries.
        logger.error(
            "Outbox: inline dispatch failed for %s (event %s): %s",
            event.event_type, event.id, exc,
        )
        return False
    event.status = "published"
    event.published_at = timezone.now()
    event.save(update_fields=["status", "published_at", "updated_at"])
    return True


def _broker_is_reachable(timeout=2):
    """Cheap liveness probe. Never blocks the request for long."""
    try:
        from config.celery import app as celery_app

        if not getattr(celery_app.conf, "broker_url", None):
            return False
        conn = celery_app.connection()
        try:
            conn.ensure_connection(max_retries=0, timeout=timeout)
        finally:
            conn.close()
        return True
    except Exception:
        return False


def publish_and_drain(aggregate_type, aggregate_id, event_type, payload=None):
    """Persist an outbox event AND guarantee it gets processed.

    1. Write the durable row inside the caller's transaction (never lost).
    2. After commit, if a broker is reachable, hand off to the async relay so
       the HTTP request stays fast.
    3. Otherwise dispatch this event inline.
    """
    event = publish_event(aggregate_type, aggregate_id, event_type, payload)

    def _drain():
        if _broker_is_reachable():
            try:
                from .tasks import process_outbox

                process_outbox.delay(limit=50)
                return
            except Exception as exc:
                logger.info("Outbox: enqueue failed (%s) - draining inline", exc)
        else:
            logger.info("Outbox: no broker reachable - draining %s inline", event_type)
        drain_event(event)

    transaction.on_commit(_drain)
    return event


def publish_auto(aggregate_type, aggregate_id, event_type, payload=None):
    """Publish, draining inline only for money/stock-critical events."""
    if event_type in CRITICAL_EVENTS:
        return publish_and_drain(aggregate_type, aggregate_id, event_type, payload)
    return publish_event(aggregate_type, aggregate_id, event_type, payload)
