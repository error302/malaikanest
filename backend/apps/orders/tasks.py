try:
    from celery import shared_task
    from celery.signals import task_failure
except ImportError:
    def shared_task(func):
        return func


from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from apps.orders.models import Order, Cart, Coupon
from apps.products.models import Inventory, VariantInventory, sync_product_stock
from apps.core.email_service import EmailService
from django.db import transaction
from django.db.models import F
import logging

logger = logging.getLogger("apps.orders")

@task_failure.connect
def route_to_dlq(sender=None, task_id=None, exception=None, args=None, kwargs=None, traceback=None, einfo=None, **kw):
    """Routes permanently failed tasks to the DLQ handler."""
    if sender and getattr(sender, "name", "") != 'apps.orders.tasks.process_failed_task':
        logger_dlq = logging.getLogger("apps.orders")
        logger_dlq.error(f"Task {sender.name}[{task_id}] failed permanently: {exception}")
        try:
            from apps.orders.tasks import process_failed_task
            process_failed_task.apply_async(
                args=[sender.name, args, kwargs, str(exception)],
            )
        except Exception as queue_exc:
            logger_dlq.critical(f"DLQ Routing failed: {queue_exc}")


# ==================== ORDER EMAIL TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def send_order_confirmation(self, order_id):
    """Send order confirmation email after order is created."""
    try:
        order = Order.objects.select_related("user").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for confirmation email")
        return "order not found"

    ok, msg = EmailService.send_order_confirmation(order)
    if ok:
        logger.info(f"Order confirmation email sent for order {order_id}")
        return "sent"
    raise Exception(msg)


@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def send_payment_confirmation(self, order_id):
    """Send payment confirmation email with invoice attached."""
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for payment confirmation")
        return "order not found"

    from apps.orders.invoice import save_invoice_pdf
    invoice = save_invoice_pdf(order)

    ok, msg = EmailService.send_payment_confirmation(order, invoice)
    if ok:
        if invoice:
            invoice.sent_at = timezone.now()
            invoice.save(update_fields=['sent_at'])
        logger.info(f"Payment confirmation email sent for order {order_id}")
        return "sent"
    raise Exception(msg)


@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def send_order_shipped(self, order_id):
    """Send order shipped notification email."""
    try:
        order = Order.objects.select_related("user").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for shipped notification")
        return "order not found"

    ok, msg = EmailService.send_order_shipped(order)
    if ok:
        logger.info(f"Shipped notification email sent for order {order_id}")
        return "sent"
    raise Exception(msg)


@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def send_order_delivered(self, order_id):
    """Send order delivered confirmation email."""
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for delivered notification")
        return "order not found"

    ok, msg = EmailService.send_order_delivered(order)
    if ok:
        logger.info(f"Delivered notification email sent for order {order_id}")
        return "sent"
    raise Exception(msg)


# ==================== REVIEW REQUEST TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=300, autoretry_for=(Exception,), retry_backoff=True)
def send_review_request(self, order_id):
    """Send product review request email after order is delivered (3 days later)."""
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for review request")
        return "order not found"

    ok, msg = EmailService.send_review_request(order)
    if ok:
        logger.info(f"Review request sent for order {order_id}")
        return "sent"
    raise Exception(msg)


# ==================== CART TASKS ====================

@shared_task
def send_abandoned_cart_reminder():
    """Send email reminders to users with abandoned carts. Runs daily via Celery Beat."""
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
            cart_items_data.append({
                "name": item.product.name,
                "price": str(item.product.price),
                "quantity": item.quantity,
                "image": item.product.image.url if item.product.image else None,
            })

        if not cart_items_data:
            continue

        total = sum(float(item["price"]) * item["quantity"] for item in cart_items_data)
        first_name = getattr(cart.user, "first_name", "")

        ok, _ = EmailService.send_abandoned_cart(
            cart.user.email, cart_items_data, total, first_name
        )
        if ok:
            sent_count += 1

    return f"Sent {sent_count} abandoned cart reminders"


@shared_task
def cleanup_old_guest_carts():
    """Clean up guest carts older than 7 days."""
    cutoff_time = timezone.now() - timedelta(days=7)
    deleted_count = Cart.objects.filter(
        user__isnull=True, created_at__lt=cutoff_time
    ).delete()[0]
    logger.info(f"Cleaned up {deleted_count} old guest carts")
    return f"Cleaned up {deleted_count} guest carts"


# ==================== INVOICE TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def generate_invoice(self, order_id):
    """Generate PDF invoice for an order."""
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
        return "failed: could not generate PDF"
    except Exception as e:
        logger.error(f"Failed to generate invoice for order {order_id}: {e}")
        raise e


@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def resend_invoice_email(self, order_id):
    """Resend invoice email to customer."""
    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for invoice resend")
        return "order not found"

    invoice = getattr(order, 'invoice', None)
    ok, msg = EmailService.send_invoice(order, invoice)
    if ok:
        if invoice:
            invoice.sent_at = timezone.now()
            invoice.save(update_fields=['sent_at'])
        logger.info(f"Invoice resent for order {order_id}")
        return "sent"
    logger.error(f"Invoice resend failed for order {order_id}: {msg}")
    return f"failed: {msg}"


# ==================== ORDER STATUS TASKS ====================

@shared_task
def cancel_stale_pending_orders():
    """Cancel pending orders older than 24 hours and restore their inventory."""
    cutoff_time = timezone.now() - timedelta(hours=24)
    stale_orders = Order.objects.filter(
        status='pending',
        created_at__lt=cutoff_time
    ).prefetch_related('items')

    cancelled_count = 0
    for order in stale_orders:
        success, error_msg = order.transition_to(Order.STATUS_CANCELLED, save=True)
        if success:
            with transaction.atomic():
                for item in order.items.all():
                    if item.variant_reference:
                        VariantInventory.objects.filter(
                            variant_id=item.variant_reference,
                            reserved__gte=item.quantity,
                        ).update(reserved=F('reserved') - item.quantity)
                        sync_product_stock(item.product_id)
                    else:
                        Inventory.objects.filter(
                            product_id=item.product_id,
                            reserved__gte=item.quantity,
                        ).update(reserved=F('reserved') - item.quantity)
                    if order.coupon_id:
                        Coupon.objects.filter(pk=order.coupon_id, used_count__gt=0).update(
                            used_count=F('used_count') - 1
                        )
                cancelled_count += 1
        else:
            logger.error(f"Failed to cancel stale order {order.id}: {error_msg}")

    if cancelled_count > 0:
        logger.info(f"Cancelled {cancelled_count} stale pending orders and restored inventory.")
    return f"Cancelled {cancelled_count} orders"


# ==================== INVENTORY TASKS ====================

@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def reduce_inventory(self, order_id):
    """Deduct inventory when payment is confirmed."""
    try:
        order = Order.objects.prefetch_related('items').get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for inventory reduction")
        return "order not found"

    try:
        with transaction.atomic():
            from apps.products.models import Product

            for item in order.items.select_related('product').all():
                if item.variant_reference:
                    updated = VariantInventory.objects.filter(
                        variant_id=item.variant_reference,
                        reserved__gte=item.quantity,
                        quantity__gte=item.quantity,
                    ).update(
                        quantity=F("quantity") - item.quantity,
                        reserved=F("reserved") - item.quantity,
                    )
                    if updated == 1:
                        sync_product_stock(item.product_id)
                else:
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
                        item.product_id, item.quantity,
                    )
                elif not item.variant_reference:
                    Product.objects.filter(pk=item.product_id).update(stock=F("stock") - item.quantity)
        logger.info(f"Inventory reduced for order {order_id}")
        return "success"
    except Exception as e:
        logger.error(f"Failed to reduce inventory for order {order_id}: {e}")
        raise e


@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def restore_inventory(self, order_id):
    """Release reserved inventory when order is cancelled/payment fails."""
    try:
        order = Order.objects.prefetch_related('items').get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for inventory restoration")
        return "order not found"

    if order.inventory_restored:
        logger.info(f"Inventory already restored for order {order_id}; skipping")
        return "already restored"

    try:
        with transaction.atomic():
            from apps.products.models import Product

            for item in order.items.select_related('product').all():
                if item.variant_reference:
                    released = VariantInventory.objects.filter(
                        variant_id=item.variant_reference,
                        reserved__gte=item.quantity,
                    ).update(reserved=F("reserved") - item.quantity)
                    if released == 1:
                        sync_product_stock(item.product_id)
                        continue
                    VariantInventory.objects.filter(variant_id=item.variant_reference).update(
                        quantity=F("quantity") + item.quantity
                    )
                    sync_product_stock(item.product_id)
                    continue

                released = Inventory.objects.filter(
                    product=item.product,
                    reserved__gte=item.quantity,
                ).update(reserved=F("reserved") - item.quantity)
                if released == 1:
                    continue
                Inventory.objects.filter(product=item.product).update(
                    quantity=F("quantity") + item.quantity
                )
                Product.objects.filter(pk=item.product_id).update(stock=F("stock") + item.quantity)

            order.inventory_restored = True
            order.save(update_fields=["inventory_restored", "updated_at"])
        logger.info(f"Inventory restored for order {order_id}")
        return "success"
    except Exception as e:
        logger.error(f"Failed to restore inventory for order {order_id}: {e}")
        return f"failed: {str(e)}"


# ==================== ANALYTICS TASKS ====================

@shared_task
def update_analytics():
    """Update analytics data. Runs hourly via Celery Beat."""
    logger.info("Analytics update task ran")
    return "Analytics updated"


# ==================== ORDER STATUS CHANGE HANDLER ====================

@shared_task
def handle_order_status_change(order_id, old_status, new_status):
    """Handle all events triggered by order status changes."""
    from .models import Order

    try:
        order = Order.objects.select_related("user").prefetch_related("items__product").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error(f"Order {order_id} not found for status change handling")
        return "order not found"

    events_triggered = []

    status_events = {
        ('pending', 'paid'): [
            ('reduce_inventory', reduce_inventory),
            ('generate_invoice', generate_invoice),
            ('send_payment_confirmation', send_payment_confirmation),
        ],
        ('paid', 'processing'): [],
        ('processing', 'shipped'): [
            ('send_order_shipped', send_order_shipped),
        ],
        ('shipped', 'delivered'): [
            ('send_order_delivered', send_order_delivered),
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

    if new_status == 'delivered':
        send_review_request.apply_async(args=[order_id], countdown=3 * 24 * 60 * 60)
        events_triggered.append('send_review_request_scheduled')

    logger.info(f"Status change handled for order {order_id}: {old_status} -> {new_status}, events: {events_triggered}")
    return f"events triggered: {events_triggered}"


# ==================== FAILED QUEUE HANDLING ====================

@shared_task(bind=True, max_retries=5, default_retry_delay=300, autoretry_for=(Exception,), retry_backoff=True)
def process_failed_task(self, task_name, task_args, task_kwargs, error_message):
    """Process failed tasks from the dead letter queue."""
    from celery import states
    from celery.result import AsyncResult

    logger.warning(f"Processing failed task: {task_name} with args {task_args}")

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
        result = task_func.delay(*task_args, **task_kwargs)
        logger.info(f"Retried task {task_name} for order {task_args[0] if task_args else 'unknown'}")
        return f"retried: {task_name}"
    except Exception as e:
        logger.error(f"Failed to retry task {task_name}: {e}")
        return f"failed permanently: {task_name}"


@shared_task
def cleanup_failed_tasks():
    """Clean up old failed task records. Runs daily via Celery Beat."""
    logger.info("Cleanup of failed tasks completed")
    return "Cleanup completed"


@shared_task(bind=True, max_retries=3, default_retry_delay=60, autoretry_for=(Exception,), retry_backoff=True)
def send_critical_alert(self, alert_type, message, context=None):
    """Send critical alert to administrators when something fails."""
    from apps.core.email_service import EmailService

    ok, msg = EmailService.send_critical_alert(alert_type, message, context)
    if ok:
        logger.info(f"Critical alert sent: {alert_type}")
        return "alert sent"
    logger.error(f"Failed to send critical alert: {msg}")
    return f"alert failed: {msg}"
