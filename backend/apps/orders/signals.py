import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Order
from .tasks import send_order_confirmation

logger = logging.getLogger('apps.orders')


@receiver(post_save, sender=Order)
def order_status_changed(sender, instance, created, **kwargs):
    if not created:
        return

    def enqueue_confirmation():
        try:
            send_order_confirmation.delay(instance.id)
        except Exception as exc:
            # No broker on this host. .delay() raised, and previously the except
            # swallowed it so the customer silently received nothing. Fall back to
            # running the task body inline - this is the first email of the
            # relationship and, for a guest, the only thing carrying their
            # tracking token. The task is idempotent (renders and sends).
            logger.warning(
                'Broker unavailable for order confirmation (order %s: %s) - sending inline',
                instance.id, exc,
            )
            try:
                send_order_confirmation(instance.id)
            except Exception as inline_exc:
                logger.error(
                    'Inline order confirmation failed for order %s: %s',
                    instance.id, inline_exc,
                )

    transaction.on_commit(enqueue_confirmation)
