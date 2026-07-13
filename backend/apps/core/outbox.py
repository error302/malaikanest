"""Transactional Outbox helpers.

Write domain events with the state change that produced them; a relay task
(apps.core.tasks.process_outbox) publishes them to the async workers so side
effects (invoicing, inventory, emails) are never lost on process crashes.
"""
from django.utils import timezone

from .models import OutboxEvent


def publish_event(aggregate_type, aggregate_id, event_type, payload=None):
    """Persist an outbox event. Call inside the DB transaction that made the change."""
    return OutboxEvent.objects.create(
        aggregate_type=aggregate_type,
        aggregate_id=str(aggregate_id),
        event_type=event_type,
        payload=payload or {},
    )
