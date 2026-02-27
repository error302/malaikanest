from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Order
from .tasks import send_order_confirmation


@receiver(post_save, sender=Order)
def order_status_changed(sender, instance, created, **kwargs):
    # send email when order marked as paid
    if not created and instance.status == 'paid':
        send_order_confirmation.delay(instance.id)
