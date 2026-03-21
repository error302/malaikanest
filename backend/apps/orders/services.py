from django.db import transaction
from django.db.models import F
from django.utils.crypto import get_random_string

from apps.products.models import Inventory, InventoryLog, Product
from .models import DELIVERY_FEES


class OrderService:
    @staticmethod
    def process_checkout(cart, user=None, guest_email=None, guest_phone=None, coupon=None, delivery_region="nairobi"):
        """
        Handles the business logic of creating an order from a cart, atomic inventory locking,
        and pricing logic.
        """
        if not cart.items.exists():
            raise ValueError("Cart is empty")

        receipt_number = get_random_string(32)

        with transaction.atomic():
            cart_items = cart.items.select_related("product").all()
            product_ids = [ci.product_id for ci in cart_items]

            inventories = {
                inv.product_id: inv
                for inv in Inventory.objects.select_for_update().filter(product_id__in=product_ids)
            }

            subtotal = 0
            items = []

            for ci in cart_items:
                inv = inventories.get(ci.product_id)
                if inv is None:
                    raise ValueError(f"No inventory record found for {ci.product.name}")
                if inv.available() < ci.quantity:
                    raise ValueError(f"Product {ci.product.name} out of stock. Available: {inv.available()}")
                line_total = ci.product.price * ci.quantity
                subtotal += line_total
                items.append((ci.product, ci.quantity, ci.product.price, inv))

            discount_amount = coupon.calculate_discount(subtotal) if coupon and coupon.active else 0
            delivery_fee = DELIVERY_FEES.get(delivery_region, 0)
            total = max(subtotal - discount_amount, 0) + delivery_fee

            from .models import Order, OrderItem

            order = Order.objects.create(
                user=user,
                subtotal=subtotal,
                discount_amount=discount_amount,
                delivery_fee=delivery_fee,
                tax_amount=0,
                total=total,
                status="pending",
                coupon=coupon,
                receipt_number=receipt_number,
                guest_email=guest_email,
                guest_phone=guest_phone,
                delivery_region=delivery_region,
            )

            for product, qty, price, inv in items:
                # Reserve stock only. Deduction happens after payment confirmation.
                updated = Inventory.objects.filter(
                    pk=inv.pk,
                    quantity__gte=F("reserved") + qty,
                ).update(reserved=F("reserved") + qty)
                if updated != 1:
                    raise ValueError(f"Product {product.name} out of stock. Available: {inv.available()}")
                OrderItem.objects.create(order=order, product=product, price=price, quantity=qty)
                InventoryLog.objects.create(
                    product=product,
                    order=order,
                    change_type="order_placed",
                    quantity_change=0,
                    reason=f"Stock reserved for order {order.receipt_number}",
                )

            cart.items.all().delete()
            return order

    @staticmethod
    def cancel_order(order):
        """
        Cancels an order and atomically releases reserved inventory.
        """
        if order.status in ["paid", "initiated", "processing", "shipped"]:
            raise ValueError("Cannot cancel this order in its current state")

        if order.status == "cancelled":
            raise ValueError("Order is already cancelled")

        with transaction.atomic():
            for item in order.items.select_related("product").all():
                Inventory.objects.filter(
                    product=item.product,
                    reserved__gte=item.quantity,
                ).update(reserved=F("reserved") - item.quantity)
                InventoryLog.objects.create(
                    product=item.product,
                    order=order,
                    change_type="order_cancelled",
                    quantity_change=0,
                    reason=f"Stock reservation released after cancellation of order {order.receipt_number}",
                )
            order.status = "cancelled"
            order.save(update_fields=["status"])

        return order

    @staticmethod
    def retry_payment(order):
        """
        Resets order to pending so a new payment can be initiated.
        Deletes the failed payment to allow a new one.
        """
        if order.status != "payment_failed":
            raise ValueError("Can only retry payment for orders with payment_failed status")

        with transaction.atomic():
            if hasattr(order, "payment") and order.payment.status == "failed":
                order.payment.delete()
            order.status = "pending"
            order.save(update_fields=["status"])

        return order
