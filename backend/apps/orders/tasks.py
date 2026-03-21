try:
    from celery import shared_task
except ImportError:
    def shared_task(func):
        return func


from django.core.mail import EmailMultiAlternatives, EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order, Cart, Invoice
from apps.products.models import Inventory
from django.db import transaction
from django.db.models import F
import logging

logger = logging.getLogger("apps.orders")


# ==================== ORDER EMAIL TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_confirmation(self, order_id):
    """
    Send order confirmation email after order is created.
    """
    try:
        order = Order.objects.select_related("user").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for confirmation email")
        return "order not found"

    try:
        subject = f"Order Confirmation - #{order.id}"
        to = [order.customer_email]
        
        context = {
            "order": order,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
            "company_email": "malaikanest7@gmail.com",
        }
        
        html_body = render_to_string("emails/order_confirmation.html", context)
        text_body = f"""Dear {order.customer_name},

Thank you for your order #{order.id}!

Your order has been received and is being processed. Here's a summary:

Order Number: {order.id}
Total: KSH {order.total}
Status: {order.status.upper()}

We'll send you another email once your payment is confirmed.

Thank you for shopping with Malaika Nest!
"""

        msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, to)
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        
        logger.info(f"Order confirmation email sent for order {order_id}")
        return "sent"
        
    except Exception as e:
        logger.error(f"Failed to send order confirmation for order {order_id}: {e}")
        try:
            raise self.retry(exc=e)
        except Exception:
            return f"failed: {str(e)}"


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_payment_confirmation(self, order_id):
    """
    Send payment confirmation email with invoice attached.
    This is triggered when order status changes to 'paid'.
    """
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for payment confirmation")
        return "order not found"

    try:
        # Generate and save invoice
        from apps.orders.invoice import save_invoice_pdf
        invoice = save_invoice_pdf(order)
        
        subject = f"Your Order Invoice {invoice.invoice_number if invoice else order.id}"
        to = [order.customer_email]
        
        context = {
            "order": order,
            "invoice": invoice,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
            "company_email": "malaikanest7@gmail.com",
            "company_phone": "+254 726 771 321",
        }
        
        html_body = render_to_string("emails/payment_confirmation.html", context)
        text_body = f"""Dear {order.customer_name},

Thank you! Your payment has been confirmed.

Order Number: {order.id}
Invoice Number: {invoice.invoice_number if invoice else 'N/A'}
Amount Paid: KSH {order.total}
Payment Method: {order.get_payment_method_display() if order.payment_method else 'M-Pesa'}

Your order is now being processed and will be shipped soon.

Thank you for shopping with Malaika Nest!
"""

        msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, to)
        msg.attach_alternative(html_body, "text/html")
        
        # Attach PDF invoice if available
        if invoice and invoice.pdf_file:
            try:
                msg.attach_file(invoice.pdf_file.path)
            except Exception as e:
                logger.warning(f"Could not attach invoice PDF: {e}")
        
        msg.send(fail_silently=False)
        
        # Update invoice sent timestamp
        if invoice:
            invoice.sent_at = timezone.now()
            invoice.save(update_fields=['sent_at'])
        
        logger.info(f"Payment confirmation email sent for order {order_id}")
        return "sent"
        
    except Exception as e:
        logger.error(f"Failed to send payment confirmation for order {order_id}: {e}")
        try:
            raise self.retry(exc=e)
        except Exception:
            return f"failed: {str(e)}"


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_shipped(self, order_id):
    """
    Send order shipped notification email.
    This is triggered when order status changes to 'shipped'.
    """
    try:
        order = Order.objects.select_related("user").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for shipped notification")
        return "order not found"

    try:
        subject = f"Your Order Has Been Shipped - #{order.id}"
        to = [order.customer_email]
        
        context = {
            "order": order,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
            "company_email": "malaikanest7@gmail.com",
            "tracking_number": order.tracking_number,
            "shipping_carrier": order.shipping_carrier,
        }
        
        html_body = render_to_string("emails/order_shipped.html", context)
        text_body = f"""Dear {order.customer_name},

Great news! Your order has been shipped.

Order Number: {order.id}
Tracking Number: {order.tracking_number or 'N/A'}
Shipping Carrier: {order.shipping_carrier or 'Standard Delivery'}

You can expect delivery within the next 1-3 business days depending on your location.

Thank you for shopping with Malaika Nest!
"""

        msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, to)
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        
        logger.info(f"Shipped notification email sent for order {order_id}")
        return "sent"
        
    except Exception as e:
        logger.error(f"Failed to send shipped notification for order {order_id}: {e}")
        try:
            raise self.retry(exc=e)
        except Exception:
            return f"failed: {str(e)}"


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_order_delivered(self, order_id):
    """
    Send order delivered confirmation email.
    This is triggered when order status changes to 'delivered'.
    """
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for delivered notification")
        return "order not found"

    try:
        subject = f"Your Order Has Been Delivered - #{order.id}"
        to = [order.customer_email]
        
        context = {
            "order": order,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
            "company_email": "malaikanest7@gmail.com",
        }
        
        html_body = render_to_string("emails/order_delivered.html", context)
        text_body = f"""Dear {order.customer_name},

Your order has been delivered!

Order Number: {order.id}
Delivery Date: {timezone.now().strftime('%Y-%m-%d')}

We hope you enjoy your purchase! Please take a moment to leave a review for the products you ordered.

Thank you for shopping with Malaika Nest!
"""

        msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, to)
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        
        logger.info(f"Delivered notification email sent for order {order_id}")
        return "sent"
        
    except Exception as e:
        logger.error(f"Failed to send delivered notification for order {order_id}: {e}")
        try:
            raise self.retry(exc=e)
        except Exception:
            return f"failed: {str(e)}"


# ==================== INVOICE TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def generate_invoice(self, order_id):
    """
    Generate PDF invoice for an order.
    """
    from apps.orders.invoice import save_invoice_pdf
    
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for invoice generation")
        return "order not found"
    
    try:
        invoice = save_invoice_pdf(order)
        if invoice:
            logger.info(f"Invoice generated for order {order_id}: {invoice.invoice_number}")
            return f"generated: {invoice.invoice_number}"
        else:
            return "failed: could not generate PDF"
    except Exception as e:
        logger.error(f"Failed to generate invoice for order {order_id}: {e}")
        try:
            raise self.retry(exc=e)
        except Exception:
            return f"failed: {str(e)}"


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def resend_invoice_email(self, order_id):
    """
    Resend invoice email to customer.
    """
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for invoice resend")
        return "order not found"
    
    try:
        invoice = getattr(order, 'invoice', None)
        
        subject = f"Invoice - Order #{order.id}"
        to = [order.customer_email]
        
        context = {
            "order": order,
            "invoice": invoice,
            "customer_name": order.customer_name,
            "company_name": "Malaika Nest",
        }
        
        html_body = render_to_string("emails/invoice_email.html", context)
        text_body = f"Please find attached your invoice for order #{order.id}"
        
        msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, to)
        msg.attach_alternative(html_body, "text/html")
        
        # Attach PDF if exists
        if invoice and invoice.pdf_file:
            try:
                msg.attach_file(invoice.pdf_file.path)
            except Exception as e:
                logger.warning(f"Could not attach invoice PDF: {e}")
        
        msg.send(fail_silently=False)
        
        # Update sent timestamp
        if invoice:
            invoice.sent_at = timezone.now()
            invoice.save(update_fields=['sent_at'])
        
        logger.info(f"Invoice resent for order {order_id}")
        return "sent"
        
    except Exception as e:
        logger.error(f"Failed to resend invoice for order {order_id}: {e}")
        return f"failed: {str(e)}"


# ==================== REVIEW REQUEST TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def send_review_request(self, order_id):
    """
    Send product review request email after order is delivered.
    Sent 3 days after delivery.
    """
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for review request")
        return "order not found"
    
    try:
        subject = "How was your purchase? Share your review!"
        to = [order.customer_email]
        
        items = []
        for item in order.items.all():
            items.append({
                'name': item.product.name,
                'product_id': item.product.id,
            })
        
        context = {
            "order": order,
            "customer_name": order.customer_name,
            "items": items,
            "company_name": "Malaika Nest",
            "company_email": "malaikanest7@gmail.com",
        }
        
        html_body = render_to_string("emails/review_request.html", context)
        text_body = f"""Dear {order.customer_name},

We hope you're enjoying your purchase from Malaika Nest!

Your order #{order.id} has been delivered. We'd love to hear your feedback!

Please take a moment to review the products you purchased.

Thank you for shopping with Malaika Nest!
"""

        msg = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, to)
        msg.attach_alternative(html_body, "text/html")
        msg.send(fail_silently=False)
        
        logger.info(f"Review request sent for order {order_id}")
        return "sent"
        
    except Exception as e:
        logger.error(f"Failed to send review request for order {order_id}: {e}")
        return f"failed: {str(e)}"


# ==================== CART TASKS ====================

@shared_task
def send_abandoned_cart_reminder():
    """
    Send email reminders to users with abandoned carts.
    Runs daily via Celery Beat.
    """
    from apps.products.serializers import ProductSerializer

    reminder_delay_hours = 24
    cutoff_time = timezone.now() - timedelta(hours=reminder_delay_hours)

    carts = (
        Cart.objects.filter(
            user__isnull=False, created_at__lt=cutoff_time, items__isnull=False
        )
        .prefetch_related("items__product", "user")
        .distinct()
    )

    sent_count = 0

    for cart in carts:
        if not cart.user or not cart.user.email:
            continue

        cart_items_data = []
        for item in cart.items.all():
            cart_items_data.append(
                {
                    "name": item.product.name,
                    "price": str(item.product.price),
                    "quantity": item.quantity,
                    "image": item.product.image.url if item.product.image else None,
                }
            )

        if not cart_items_data:
            continue

        total = sum(float(item["price"]) * item["quantity"] for item in cart_items_data)

        context = {
            "user": cart.user,
            "items": cart_items_data,
            "total": total,
            "cart_age_hours": reminder_delay_hours,
        }

        try:
            subject = "You left something behind! Complete your order"
            to = [cart.user.email]
            html_body = render_to_string("emails/abandoned_cart.html", context)
            text_body = f"You have items waiting in your cart at Malaika Nest. Complete your order now!"

            msg = EmailMultiAlternatives(
                subject, text_body, settings.DEFAULT_FROM_EMAIL, to
            )
            msg.attach_alternative(html_body, "text/html")
            msg.send()
            sent_count += 1
            logger.info(f"Sent abandoned cart reminder to {cart.user.email}")

        except Exception as e:
            logger.error(
                f"Failed to send abandoned cart email to {cart.user.email}: {e}"
            )

    return f"Sent {sent_count} abandoned cart reminders"


@shared_task
def cleanup_old_guest_carts():
    """
    Clean up guest carts older than 7 days.
    Runs weekly via Celery Beat.
    """
    cutoff_time = timezone.now() - timedelta(days=7)
    deleted_count = Cart.objects.filter(
        user__isnull=True, created_at__lt=cutoff_time
    ).delete()[0]

    logger.info(f"Cleaned up {deleted_count} old guest carts")
    return f"Cleaned up {deleted_count} guest carts"


# ==================== ORDER STATUS TASKS ====================

@shared_task
def cancel_stale_pending_orders():
    """
    Cancel pending orders older than 24 hours and restore their inventory.
    Runs periodically via Celery Beat.
    """
    cutoff_time = timezone.now() - timedelta(hours=24)
    stale_orders = Order.objects.filter(
        status='pending',
        created_at__lt=cutoff_time
    ).prefetch_related('items')

    cancelled_count = 0
    for order in stale_orders:
        with transaction.atomic():
            for item in order.items.all():
                Inventory.objects.filter(product_id=item.product_id).update(
                    quantity=F('quantity') + item.quantity,
                    reserved=F('reserved') - item.quantity
                )
            order.status = 'cancelled'
            order.save(update_fields=['status'])
            cancelled_count += 1

    if cancelled_count > 0:
        logger.info(f"Cancelled {cancelled_count} stale pending orders and restored inventory.")
    return f"Cancelled {cancelled_count} orders"


# ==================== INVENTORY TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def reduce_inventory(self, order_id):
    """
    Deduct inventory when payment is confirmed.
    Idempotent via conditional updates against the `reserved` column.
    """
    try:
        order = Order.objects.prefetch_related('items').get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for inventory reduction")
        return "order not found"
    
    try:
        with transaction.atomic():
            from apps.products.models import Product

            for item in order.items.select_related('product').all():
                updated = Inventory.objects.filter(
                    product=item.product,
                    reserved__gte=item.quantity,
                    quantity__gte=item.quantity,
                ).update(
                    quantity=F("quantity") - item.quantity,
                    reserved=F("reserved") - item.quantity,
                )
                if updated != 1:
                    logger.info(
                        "reduce_inventory: skipped item product=%s qty=%s (already deducted or insufficient reserved)",
                        item.product_id,
                        item.quantity,
                    )
                else:
                    Product.objects.filter(pk=item.product_id).update(stock=F("stock") - item.quantity)
        logger.info(f"Inventory reduced for order {order_id}")
        return "success"
    except Exception as e:
        logger.error(f"Failed to reduce inventory for order {order_id}: {e}")
        try:
            raise self.retry(exc=e)
        except Exception:
            return f"failed: {str(e)}"


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def restore_inventory(self, order_id):
    """
    Release reserved inventory when order is cancelled/payment fails.
    If stock was already deducted, this will restock quantity and keep reserved non-negative.
    """
    try:
        order = Order.objects.prefetch_related('items').get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for inventory restoration")
        return "order not found"
    
    try:
        with transaction.atomic():
            from apps.products.models import Product

            for item in order.items.select_related('product').all():
                # First try to release reservation (pre-payment cancellation / failure).
                released = Inventory.objects.filter(
                    product=item.product,
                    reserved__gte=item.quantity,
                ).update(reserved=F("reserved") - item.quantity)

                if released == 1:
                    continue

                # If not reserved, assume it was already deducted and restock quantity.
                Inventory.objects.filter(product=item.product).update(
                    quantity=F("quantity") + item.quantity
                )
                Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)
        logger.info(f"Inventory restored for order {order_id}")
        return "success"
    except Exception as e:
        logger.error(f"Failed to restore inventory for order {order_id}: {e}")
        return f"failed: {str(e)}"


# ==================== ANALYTICS TASKS ====================

@shared_task
def update_analytics():
    """
    Update analytics data.
    Runs hourly via Celery Beat.
    """
    from django.db.models import Sum, Count, Avg
    from datetime import timedelta
    
    # This is a placeholder for analytics updates
    # In production, you would aggregate data and store it
    logger.info("Analytics update task ran")
    return "Analytics updated"


# ==================== ORDER STATUS CHANGE HANDLER ====================

@shared_task
def handle_order_status_change(order_id, old_status, new_status):
    """
    Handle all events triggered by order status changes.
    This is the main entry point for order state machine events.
    """
    from .models import Order
    
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for status change handling")
        return "order not found"
    
    events_triggered = []
    
    # Define status change events
    status_events = {
        ('pending', 'paid'): [
            ('generate_invoice', generate_invoice),
            ('send_payment_confirmation', send_payment_confirmation),
        ],
        ('paid', 'processing'): [
            # Prepare for shipment - no specific email
        ],
        ('processing', 'shipped'): [
            ('send_order_shipped', send_order_shipped),
        ],
        ('shipped', 'delivered'): [
            ('send_order_delivered', send_order_delivered),
            # Schedule review request for 3 days later
        ],
        ('paid', 'cancelled'): [
            ('restore_inventory', restore_inventory),
        ],
    }
    
    key = (old_status, new_status)
    events = status_events.get(key, [])
    
    for event_name, event_task in events:
        try:
            event_task.delay(order_id)
            events_triggered.append(event_name)
        except Exception as e:
            logger.error(f"Failed to trigger event {event_name} for order {order_id}: {e}")
    
    # Schedule review request 3 days after delivery
    if new_status == 'delivered':
        send_review_request.apply_async(args=[order_id], countdown=3 * 24 * 60 * 60)
        events_triggered.append('send_review_request_scheduled')
    
    logger.info(f"Status change handled for order {order_id}: {old_status} -> {new_status}, events: {events_triggered}")
    return f"events triggered: {events_triggered}"


# ==================== FAILED QUEUE HANDLING ====================

@shared_task(bind=True, max_retries=5, default_retry_delay=300)
def process_failed_task(self, task_name, task_args, task_kwargs, error_message):
    """
    Process failed tasks from the dead letter queue.
    Attempts to retry failed tasks with exponential backoff.
    """
    from celery import states
    from celery.result import AsyncResult
    
    logger.warning(f"Processing failed task: {task_name} with args {task_args}")
    
    # Map task names to their actual task functions
    task_map = {
        'send_order_confirmation': send_order_confirmation,
        'send_payment_confirmation': send_payment_confirmation,
        'send_order_shipped': send_order_shipped,
        'send_order_delivered': send_order_delivered,
        'generate_invoice': generate_invoice,
        'resend_invoice_email': resend_invoice_email,
        'send_review_request': send_review_request,
        'reduce_inventory': reduce_inventory,
        'restore_inventory': restore_inventory,
    }
    
    task_func = task_map.get(task_name)
    
    if not task_func:
        logger.error(f"Unknown task name: {task_name}")
        return f"failed: unknown task {task_name}"
    
    try:
        # Retry the task
        result = task_func.delay(*task_args, **task_kwargs)
        logger.info(f"Retried task {task_name} for order {task_args[0] if task_args else 'unknown'}")
        return f"retried: {task_name}"
    except Exception as e:
        logger.error(f"Failed to retry task {task_name}: {e}")
        # If max retries reached, log to failed tasks table
        return f"failed permanently: {task_name}"


@shared_task
def cleanup_failed_tasks():
    """
    Clean up old failed task records.
    Runs daily via Celery Beat.
    """
    from datetime import timedelta
    
    # This would clean up old failure records from a custom tracking table
    # For now, just log that it ran
    logger.info("Cleanup of failed tasks completed")
    return "Cleanup completed"


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def send_critical_alert(self, alert_type, message, context=None):
    """
    Send critical alert to administrators when something fails.
    """
    from django.conf import settings
    
    admin_emails = []
    if hasattr(settings, 'ADMINS'):
        admin_emails = [email for name, email in settings.ADMINS]
    
    if not admin_emails:
        # Fallback to default
        admin_emails = ['malaikanest7@gmail.com']
    
    try:
        subject = f"[Malaika Nest] Critical Alert: {alert_type}"
        text_body = f"""
Critical Alert: {alert_type}

Message: {message}

Context: {context or 'No additional context'}

Timestamp: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
        
        msg = EmailMultiAlternatives(
            subject,
            text_body,
            settings.DEFAULT_FROM_EMAIL,
            admin_emails
        )
        msg.send(fail_silently=False)
        
        logger.info(f"Critical alert sent: {alert_type}")
        return "alert sent"
        
    except Exception as e:
        logger.error(f"Failed to send critical alert: {e}")
        return f"alert failed: {str(e)}"
