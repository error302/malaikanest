from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from apps.products.models import Product, ProductVariant, VariantInventory


class Coupon(models.Model):
    DISCOUNT_TYPES = [
        ("flat", "Flat Amount"),
        ("percentage", "Percentage"),
    ]
    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPES, default="flat")
    amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Amount or % off")
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    usage_limit = models.PositiveIntegerField(null=True, blank=True, help_text="Max total uses")
    times_used = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        if not self.active:
            return False, "Coupon is inactive."
        if self.expires_at and self.expires_at < timezone.now():
            return False, "Coupon has expired."
        if self.usage_limit and self.times_used >= self.usage_limit:
            return False, "Coupon usage limit reached."
        return True, ""

    def apply(self, subtotal):
        """Returns the discount amount for a given subtotal."""
        if self.discount_type == "percentage":
            return round(subtotal * (self.amount / 100), 2)
        return min(self.amount, subtotal)

    def __str__(self):
        return f"{self.code} ({self.discount_type}: {self.amount})"


class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["session_key"]),
            models.Index(fields=["user", "session_key"]),
        ]

    def __str__(self):
        if self.user:
            return f"Cart for {self.user.email}"
        return f"Guest cart ({self.session_key or 'no session'})"

    @property
    def subtotal(self):
        return sum(item.line_total for item in self.items.all())

    @property
    def item_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """
    Cart item referencing a ProductVariant (size + color specific).
    This is the corrected architecture — cart items must track the exact variant.
    """
    cart = models.ForeignKey(Cart, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Specific variant (size/color). Null = product has no variants.",
    )
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        # Unique per cart + variant (or product if no variant)
        unique_together = ("cart", "variant")
        indexes = [
            models.Index(fields=["cart", "variant"]),
        ]

    @property
    def unit_price(self):
        if self.variant:
            return self.variant.effective_price
        return self.product.price

    @property
    def line_total(self):
        return self.unit_price * self.quantity

    def __str__(self):
        variant_str = f" [{self.variant.label}]" if self.variant else ""
        return f"{self.product.name}{variant_str} × {self.quantity}"


class Order(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("initiated", "Initiated"),
        ("paid", "Paid"),
        ("payment_failed", "Payment Failed"),
        ("failed", "Failed"),
        ("cancelled", "Cancelled"),
        ("processing", "Processing"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("refunded", "Refunded"),
    ]
    DELIVERY_CHOICES = [
        ("mombasa", "Mombasa (Same Day)"),
        ("nairobi", "Nairobi (1-2 Days)"),
        ("upcountry", "Upcountry (2-3 Days)"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    # Financial breakdown (transparent audit trail)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL)
    receipt_number = models.CharField(max_length=128, unique=True)
    delivery_region = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default="nairobi")
    is_gift = models.BooleanField(default=False)
    gift_message = models.TextField(blank=True, null=True)
    guest_email = models.EmailField(blank=True, null=True)
    guest_phone = models.CharField(max_length=20, blank=True, null=True)

    # Shipping address snapshot (denormalized to preserve history)
    shipping_name = models.CharField(max_length=200, blank=True)
    shipping_street = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100, blank=True)
    shipping_county = models.CharField(max_length=100, blank=True)
    shipping_phone = models.CharField(max_length=20, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status", "-created_at"]),
            models.Index(fields=["receipt_number"]),
            models.Index(fields=["guest_email"]),
        ]

    def __str__(self):
        identity = self.user.email if self.user else self.guest_email
        return f"Order {self.id} — {identity} — {self.status}"


class OrderItem(models.Model):
    """
    Immutable snapshot of what was ordered.
    References ProductVariant for size/color, with denormalized snapshot fields
    so historical records remain correct even if the product changes.
    """
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    # Snapshot fields — captured at time of order (immutable record)
    product_name = models.CharField(max_length=255)
    variant_label = models.CharField(max_length=100, blank=True)
    sku = models.CharField(max_length=100, blank=True)

    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    class Meta:
        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["product"]),
        ]

    @property
    def line_total(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.product_name} [{self.variant_label}] × {self.quantity} @ KES {self.price}"


DELIVERY_FEES = {
    "mombasa": 0,
    "nairobi": 300,
    "upcountry": 500,
}


def create_order_from_cart(
    user, cart, coupon=None, receipt_number=None,
    delivery_region="nairobi", is_gift=False, gift_message="",
    shipping_address=None,
):
    """
    Atomic order creation from cart.
    - Locks VariantInventory rows (select_for_update) to prevent race conditions.
    - Deducts stock from VariantInventory (not legacy Inventory).
    - Captures price/variant snapshots into OrderItem for immutable order history.
    """
    with transaction.atomic():
        cart_items = cart.items.select_related(
            "product", "variant", "variant__variant_inventory"
        ).all()

        if not cart_items.exists():
            raise ValueError("Cannot place an order with an empty cart.")

        variant_ids = [item.variant_id for item in cart_items if item.variant_id]
        product_ids = [item.product_id for item in cart_items]

        # Lock variant inventory rows first (prevents overselling)
        variant_inventories = {
            vi.variant_id: vi
            for vi in VariantInventory.objects.select_for_update().filter(
                variant_id__in=variant_ids
            )
        }

        # Validate stock and build order items
        subtotal = 0
        items_to_create = []

        for ci in cart_items:
            unit_price = ci.unit_price

            if ci.variant_id:
                vi = variant_inventories.get(ci.variant_id)
                if vi is None:
                    raise ValueError(f"No inventory for variant: {ci.variant}")
                if vi.available() < ci.quantity:
                    raise ValueError(
                        f"{ci.product.name} ({ci.variant.label}): "
                        f"Only {vi.available()} available, {ci.quantity} requested."
                    )
            else:
                # Fallback for products with no variants (check product stock directly)
                from apps.products.models import Inventory as LegacyInventory
                try:
                    inv = LegacyInventory.objects.select_for_update().get(product_id=ci.product_id)
                    if inv.available() < ci.quantity:
                        raise ValueError(
                            f"{ci.product.name}: Only {inv.available()} available."
                        )
                    vi = None
                except LegacyInventory.DoesNotExist:
                    raise ValueError(f"No inventory for {ci.product.name}")

            subtotal += unit_price * ci.quantity
            items_to_create.append({
                "product": ci.product,
                "variant": ci.variant,
                "product_name": ci.product.name,
                "variant_label": ci.variant.label if ci.variant else "",
                "sku": (ci.variant.sku or ci.product.sku or "") if ci.variant else (ci.product.sku or ""),
                "price": unit_price,
                "quantity": ci.quantity,
                "vi": vi,
                "ci": ci,
            })

        # Apply coupon
        discount_amount = 0
        if coupon:
            valid, msg = coupon.is_valid()
            if not valid:
                raise ValueError(f"Coupon error: {msg}")
            if subtotal < coupon.min_order_amount:
                raise ValueError(
                    f"Minimum order amount for coupon is KES {coupon.min_order_amount}."
                )
            discount_amount = coupon.apply(subtotal)

        delivery_fee = DELIVERY_FEES.get(delivery_region, 0)
        total = max(subtotal - discount_amount, 0) + delivery_fee

        # Build shipping snapshot
        addr = shipping_address or {}

        # Create the order
        order = Order.objects.create(
            user=user,
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            discount_amount=discount_amount,
            total=total,
            status="pending",
            coupon=coupon,
            receipt_number=receipt_number,
            delivery_region=delivery_region,
            is_gift=is_gift,
            gift_message=gift_message or "",
            shipping_name=addr.get("full_name", ""),
            shipping_street=addr.get("street", ""),
            shipping_city=addr.get("city", ""),
            shipping_county=addr.get("county", ""),
            shipping_phone=addr.get("phone", ""),
        )

        # Deduct inventory and create order items
        from apps.products.models import Inventory as LegacyInventory, models as product_models
        for item in items_to_create:
            if item["vi"]:
                VariantInventory.objects.filter(pk=item["vi"].pk).update(
                    quantity=models.F("quantity") - item["quantity"],
                )
            else:
                LegacyInventory.objects.filter(
                    product=item["product"]
                ).update(quantity=models.F("quantity") - item["quantity"])

            OrderItem.objects.create(
                order=order,
                product=item["product"],
                variant=item["variant"],
                product_name=item["product_name"],
                variant_label=item["variant_label"],
                sku=item["sku"],
                price=item["price"],
                quantity=item["quantity"],
            )

        # Increment coupon usage
        if coupon:
            Coupon.objects.filter(pk=coupon.pk).update(
                times_used=models.F("times_used") + 1
            )

        return order
