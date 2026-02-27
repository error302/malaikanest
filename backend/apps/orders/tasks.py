from celery import shared_task
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order, Cart
import logging

logger = logging.getLogger('apps.orders')


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation(self, order_id):
    try:
        order = Order.objects.select_related('user').get(pk=order_id)
    except Order.DoesNotExist:
        return 'order not found'

    subject = f'Order confirmation #{order.id}'
    to = [order.user.email]
    context = {'order': order}
    html_body = render_to_string('emails/order_confirmation.html', context)
    text_body = f'Your order {order.id} has been received. Total: KSH {order.total}'

    msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, to)
    msg.attach_alternative(html_body, 'text/html')
    msg.send()
    return 'sent'


@shared_task
def send_abandoned_cart_reminder():
    """
    Send email reminders to users with abandoned carts.
    Runs daily via Celery Beat.
    """
    from apps.products.serializers import ProductSerializer
    
    reminder_delay_hours = 24
    cutoff_time = timezone.now() - timedelta(hours=reminder_delay_hours)
    
    carts = Cart.objects.filter(
        user__isnull=False,
        created_at__lt=cutoff_time,
        items__isnull=False
    ).prefetch_related('items__product', 'user').distinct()
    
    sent_count = 0
    
    for cart in carts:
        if not cart.user or not cart.user.email:
            continue
            
        cart_items_data = []
        for item in cart.items.all():
            cart_items_data.append({
                'name': item.product.name,
                'price': str(item.product.price),
                'quantity': item.quantity,
                'image': item.product.image.url if item.product.image else None
            })
        
        if not cart_items_data:
            continue
            
        total = sum(float(item['price']) * item['quantity'] for item in cart_items_data)
        
        context = {
            'user': cart.user,
            'items': cart_items_data,
            'total': total,
            'cart_age_hours': reminder_delay_hours,
        }
        
        try:
            subject = 'You left something behind! Complete your order'
            to = [cart.user.email]
            html_body = render_to_string('emails/abandoned_cart.html', context)
            text_body = f'You have items waiting in your cart at Malaika Nest. Complete your order now!'
            
            msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, to)
            msg.attach_alternative(html_body, 'text/html')
            msg.send()
            sent_count += 1
            logger.info(f"Sent abandoned cart reminder to {cart.user.email}")
            
        except Exception as e:
            logger.error(f"Failed to send abandoned cart email to {cart.user.email}: {e}")
    
    return f'Sent {sent_count} abandoned cart reminders'


@shared_task
def cleanup_old_guest_carts():
    """
    Clean up guest carts older than 7 days.
    Runs weekly via Celery Beat.
    """
    cutoff_time = timezone.now() - timedelta(days=7)
    deleted_count = Cart.objects.filter(
        user__isnull=True,
        created_at__lt=cutoff_time
    ).delete()[0]
    
    logger.info(f"Cleaned up {deleted_count} old guest carts")
    return f'Cleaned up {deleted_count} guest carts'
