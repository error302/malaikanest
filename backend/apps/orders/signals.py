import logging

from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Order
from .tasks import send_order_confirmation
from apps.core.email_service import EmailService

logger = logging.getLogger('apps.orders')


@receiver(post_save, sender=Order)
def order_status_changed(sender, instance, created, **kwargs):
    if not created:
        return

    def send_confirmation_on_commit():
        try:
            EmailService.send_order_confirmation(instance)
        except Exception as exc:
            logger.error('Failed to send order confirmation for order %s: %s', instance.id, exc)

    transaction.on_commit(send_confirmation_on_commit)
