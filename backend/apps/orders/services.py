from django.db import transaction
from django.db.models import F

from apps.products.models import (
    Inventory,
    InventoryLog,
    Product,
    ProductVariant,
    VariantInventory,
    sync_product_stock,
)
from .models import DELIVERY_FEES


class OrderService:
    @staticmethod
    def _get_locked_inventory(product):
        inventory, _ = Inventory.objects.select_for_update().get_or_create(
            product=product,
            defaults={"quantity": product.stock},
        )
        return inventory

    @staticmethod
    def _get_locked_variant_inventory(variant):
        inventory, _ = VariantInventory.objects.select_for_update().get_or_create(
            variant=variant,
            defaults={"quantity": 0},
        )
        return inventory

    @staticmethod
    def _get_locked_variant_inventory_by_reference(variant_reference):
        if not variant_reference:
            return None
        return (
            VariantInventory.objects.select_for_update()
            .select_related("variant")
            .filter(variant_id=variant_reference)
            .first()
        )

    @staticmethod
    def process_checkout(
        cart,
        user=None,
        guest_email=None,
        guest_phone=None,
        coupon=None,
        delivery_region="nairobi",
        is_gift=False,
        gift_message="",
        shipping_name="",
        shipping_phone="",
        shipping_address="",
        shipping_city="",
        shipping_postal_code="",
        notes="",
    ):
        """
        Handles the business logic of creating an order from a cart, atomic inventory locking,
        and pricing logic.
        """
        if not cart.items.exists():
            raise ValueError("Cart is empty")

        with transaction.atomic():
            cart_items = cart.items.select_related("product", "variant").all()
            product_ids = [ci.product_id for ci in cart_items]
            variant_ids = [ci.variant_id for ci in cart_items if ci.variant_id]

            inventories = {
                inv.product_id: inv
                for inv in Inventory.objects.select_for_update().filter(product_id__in=product_ids)
            }
            variant_inventories = {
                inv.variant_id: inv
                for inv in VariantInventory.objects.select_for_update().filter(variant_id__in=variant_ids)
            }

            subtotal = 0
            items = []

            for ci in cart_items:
                if ci.variant_id:
                    variant = ci.variant
                    inv = variant_inventories.get(ci.variant_id)
                    if inv is None:
                        inv = OrderService._get_locked_variant_inventory(variant)
                        variant_inventories[ci.variant_id] = inv
                    if inv.available() < ci.quantity:
                        raise ValueError(
                            f"Color {variant.get_color_display() if variant.color else variant.sku or variant.id} is out of stock. Available: {inv.available()}"
                        )
                    unit_price = ci.unit_price or (ci.product.price + variant.price_modifier)
                    line_total = unit_price * ci.quantity
                    subtotal += line_total
                    items.append((ci.product, variant, ci.quantity, unit_price, inv, True))
                    continue

                inv = inventories.get(ci.product_id)
                if inv is None:
                    inv = OrderService._get_locked_inventory(ci.product)
                    inventories[ci.product_id] = inv
                if inv.available() < ci.quantity:
                    raise ValueError(f"Product {ci.product.name} out of stock. Available: {inv.available()}")
                unit_price = ci.unit_price or ci.product.price
                line_total = unit_price * ci.quantity
                subtotal += line_total
                items.append((ci.product, None, ci.quantity, unit_price, inv, False))

            discount_amount = coupon.calculate_discount(subtotal) if coupon and coupon.is_active and coupon.is_valid() else 0
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
                guest_email=guest_email,
                guest_phone=guest_phone,
                delivery_region=delivery_region,
                is_gift=is_gift,
                gift_message=gift_message if is_gift else "",
                shipping_name=shipping_name or (user.get_full_name() if user else ""),
                shipping_phone=shipping_phone or (user.phone_number if user and hasattr(user, 'phone_number') else guest_phone or ""),
                shipping_address=shipping_address,
                shipping_city=shipping_city,
                shipping_postal_code=shipping_postal_code,
                shipping_notes=notes,
            )

            for product, variant, qty, price, inv, is_variant in items:
                # Reserve stock only. Deduction happens after payment confirmation.
                if is_variant:
                    updated = VariantInventory.objects.filter(
                        pk=inv.pk,
                        quantity__gte=F("reserved") + qty,
                    ).update(reserved=F("reserved") + qty)
                else:
                    updated = Inventory.objects.filter(
                        pk=inv.pk,
                        quantity__gte=F("reserved") + qty,
                    ).update(reserved=F("reserved") + qty)
                if updated != 1:
                    raise ValueError(f"Product {product.name} out of stock. Available: {inv.available()}")
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    variant_reference=str(variant.pk) if variant else None,
                    variant_details=(
                        {
                            "id": str(variant.pk),
                            "color": variant.color,
                            "color_label": variant.get_color_display() if variant.color else "",
                            "size": variant.size,
                            "size_label": variant.get_size_display() if variant.size else "",
                            "sku": variant.sku,
                        }
                        if variant
                        else None
                    ),
                    price=price,
                    quantity=qty,
                )
                InventoryLog.objects.create(
                    product=product,
                    order=order,
                    change_type="order_placed",
                    quantity_change=0,
                    reason=(
                        f"Stock reserved for {variant.get_color_display()} variant on order {order.receipt_number}"
                        if variant and variant.color
                        else f"Stock reserved for order {order.receipt_number}"
                    ),
                )
                if is_variant:
                    sync_product_stock(product)

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
                if item.variant_reference:
                    variant_inventory = OrderService._get_locked_variant_inventory_by_reference(item.variant_reference)
                    if variant_inventory:
                        VariantInventory.objects.filter(
                            pk=variant_inventory.pk,
                            reserved__gte=item.quantity,
                        ).update(reserved=F("reserved") - item.quantity)
                        sync_product_stock(item.product)
                    color_label = ""
                    if isinstance(item.variant_details, dict):
                        color_label = item.variant_details.get("color_label") or item.variant_details.get("color") or ""
                else:
                    color_label = ""
                if not item.variant_reference:
                    Inventory.objects.filter(
                        product=item.product,
                        reserved__gte=item.quantity,
                    ).update(reserved=F("reserved") - item.quantity)
                InventoryLog.objects.create(
                    product=item.product,
                    order=order,
                    change_type="order_cancelled",
                    quantity_change=0,
                    reason=(
                        f"Stock reservation released for {color_label} after cancellation of order {order.receipt_number}"
                        if color_label
                        else f"Stock reservation released after cancellation of order {order.receipt_number}"
                    ),
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
