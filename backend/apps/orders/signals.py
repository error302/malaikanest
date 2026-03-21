import logging

from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Order
from .tasks import send_order_confirmation

logger = logging.getLogger('apps.orders')


@receiver(post_save, sender=Order)
def order_status_changed(sender, instance, created, **kwargs):
    if not created:
        return

    try:
        send_order_confirmation.delay(instance.id)
    except Exception as exc:
        logger.error('Failed to enqueue order confirmation for order %s: %s', instance.id, exc)
