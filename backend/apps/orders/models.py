from django.db import models, transaction
from apps.core.models import BaseModel
from django.conf import settings
from django.utils import timezone
from apps.products.models import Product, ProductVariant, Inventory, InventoryLog, VariantInventory, sync_product_stock
import uuid
import random
from datetime import datetime
from django.db.models import F
from decimal import Decimal


def generate_receipt_number() -> str:
    """
    Human-friendly public order reference.

    Kept as `receipt_number` for backwards compatibility with existing API/UI.
    """
    return f"MN-{uuid.uuid4().hex[:12].upper()}"


class Invoice(BaseModel):
    """Model for storing generated invoices linked to orders."""
    
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    pdf_file = models.FileField(upload_to='invoices/%Y/%m/', null=True, blank=True)
    pdf_url = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"Invoice {self.invoice_number} for Order {self.order.id}"
    
    @classmethod
    def generate_invoice_number(cls):
        """Generate a unique invoice number: INV-YYYY-XXXXXX"""
        today = datetime.now()
        year = today.strftime('%Y')
        with transaction.atomic():
            last_invoice = cls.objects.select_for_update().filter(
                invoice_number__startswith=f'INV-{year}-'
            ).order_by('-invoice_number').first()
            if last_invoice:
                try:
                    last_seq = int(last_invoice.invoice_number.split('-')[-1])
                    new_seq = last_seq + 1
                except (ValueError, IndexError):
                    new_seq = 1
            else:
                new_seq = 1
            return f"INV-{year}-{new_seq:06d}"


class Coupon(BaseModel):
    DISCOUNT_TYPE_FLAT = "flat"
    DISCOUNT_TYPE_PERCENT = "percentage"
    DISCOUNT_TYPE_CHOICES = [
        (DISCOUNT_TYPE_FLAT, "Flat Amount"),
        (DISCOUNT_TYPE_PERCENT, "Percentage"),
    ]

    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(
        max_length=20, choices=DISCOUNT_TYPE_CHOICES, default=DISCOUNT_TYPE_FLAT
    )
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_value = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField(null=True, blank=True)
    valid_to = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.code

    def clean(self):
        super().clean()
        if self.code:
            self.code = self.code.strip().upper()
        if self.discount_type == self.DISCOUNT_TYPE_PERCENT:
            # Clamp to 0..100
            try:
                dv = Decimal(str(self.discount_value))
            except Exception:
                dv = Decimal("0")
            if dv < 0:
                self.discount_value = Decimal("0")
            elif dv > 100:
                self.discount_value = Decimal("100")

    def is_valid(self, *, now=None):
        now = now or timezone.now()
        if not self.is_active:
            return False
        if self.valid_from and now < self.valid_from:
            return False
        if self.valid_to and now > self.valid_to:
            return False
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False
        return True

    def calculate_discount(self, subtotal):
        try:
            subtotal = Decimal(str(subtotal))
        except Exception:
            subtotal = Decimal("0")

        if subtotal <= 0:
            return Decimal("0")

        if self.min_order_value and subtotal < Decimal(str(self.min_order_value)):
            return Decimal("0")

        if self.discount_type == self.DISCOUNT_TYPE_PERCENT:
            pct = Decimal(str(self.discount_value or 0))
            return (subtotal * pct / Decimal("100")).quantize(Decimal("0.01"))

        return min(Decimal(str(self.discount_value or 0)), subtotal).quantize(Decimal("0.01"))


class Cart(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL, related_name="carts")
    coupon_applied_at = models.DateTimeField(null=True, blank=True)
    delivery_region = models.CharField(
        max_length=20,
        choices=[
            ("mombasa", "Mombasa (Same Day)"),
            ("nairobi", "Nairobi (1-2 Days)"),
            ("upcountry", "Upcountry (2-3 Days)"),
        ],
        default="nairobi",
    )

    class Meta:
        indexes = [
            models.Index(fields=['session_key']),
            models.Index(fields=['user', 'session_key']),
        ]

    def __str__(self):
        # LOW-01: Added __str__ so admin panel shows useful info instead of "Cart object (1)"
        if self.user:
            return f"Cart for {self.user.email}"
        return f"Guest cart ({self.session_key or 'no session'})"

    def subtotal_amount(self) -> Decimal:
        total = Decimal("0")
        for item in self.items.all():
            price = item.unit_price or getattr(item.product, "price", 0) or 0
            total += Decimal(str(price)) * Decimal(str(item.quantity or 0))
        return total.quantize(Decimal("0.01"))

    def discount_amount(self) -> Decimal:
        subtotal = self.subtotal_amount()
        if not self.coupon:
            return Decimal("0.00")
        if not self.coupon.is_valid():
            return Decimal("0.00")
        return self.coupon.calculate_discount(subtotal)


class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product"],
                condition=models.Q(variant__isnull=True),
                name="uniq_cart_product_no_variant",
            ),
            models.UniqueConstraint(
                fields=["cart", "variant"],
                condition=models.Q(variant__isnull=False),
                name="uniq_cart_variant",
            ),
        ]

    @property
    def effective_variant(self):
        if self.variant:
            return self.variant
        return self.product.variants.filter(size='one-size').first() or self.product.variants.first()


class Order(BaseModel):
    """Order model with state machine for status transitions."""
    
    # Status constants for the state machine
    STATUS_PENDING = 'pending'
    STATUS_INITIATED = 'initiated'
    STATUS_PAID = 'paid'
    STATUS_PAYMENT_FAILED = 'payment_failed'
    STATUS_FAILED = 'failed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_REFUNDED = 'refunded'
    STATUS_PROCESSING = 'processing'
    STATUS_SHIPPED = 'shipped'
    STATUS_DELIVERED = 'delivered'
    
    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_INITIATED, 'Initiated'),
        (STATUS_PAID, 'Paid'),
        (STATUS_PAYMENT_FAILED, 'Payment Failed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_CANCELLED, 'Cancelled'),
        (STATUS_REFUNDED, 'Refunded'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_SHIPPED, 'Shipped'),
        (STATUS_DELIVERED, 'Delivered'),
    ]
    
    # Valid status transitions for the state machine
    STATUS_TRANSITIONS = {
        STATUS_PENDING: [STATUS_INITIATED, STATUS_PAID, STATUS_CANCELLED],
        STATUS_INITIATED: [STATUS_PAID, STATUS_PAYMENT_FAILED, STATUS_CANCELLED],
        STATUS_PAID: [STATUS_PROCESSING, STATUS_CANCELLED, STATUS_REFUNDED],
        STATUS_PAYMENT_FAILED: [STATUS_PENDING, STATUS_CANCELLED],
        STATUS_PROCESSING: [STATUS_SHIPPED, STATUS_CANCELLED],
        STATUS_SHIPPED: [STATUS_DELIVERED, STATUS_CANCELLED],
        STATUS_DELIVERED: [STATUS_REFUNDED],
        STATUS_CANCELLED: [],
        STATUS_REFUNDED: [],
        STATUS_FAILED: [],
    }
    
    # Order event triggers
    ORDER_EVENTS = {
        (STATUS_PENDING, STATUS_PAID): ['generate_invoice', 'reduce_inventory', 'send_payment_confirmation'],
        (STATUS_PAID, STATUS_PROCESSING): ['prepare_shipment'],
        (STATUS_PROCESSING, STATUS_SHIPPED): ['send_shipping_email'],
        (STATUS_SHIPPED, STATUS_DELIVERED): ['send_delivery_confirmation'],
    }
    
    DELIVERY_CHOICES = [
        ('mombasa', 'Mombasa (Same Day)'),
        ('nairobi', 'Nairobi (1-2 Days)'),
        ('upcountry', 'Upcountry (2-3 Days)')
    ]
    
    PAYMENT_METHODS = [
        ('mpesa', 'M-Pesa'),
        ('card', 'Credit/Debit Card'),
        ('bank', 'Bank Transfer'),
        ('cash', 'Cash on Delivery'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, db_index=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL)
    receipt_number = models.CharField(
        max_length=128,
        unique=True,
        db_index=True,
        default=generate_receipt_number,
        editable=False,
    )
    delivery_region = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='nairobi')
    
    # Shipping address fields
    shipping_first_name = models.CharField(max_length=100, blank=True, null=True)
    shipping_last_name = models.CharField(max_length=100, blank=True, null=True)
    shipping_phone = models.CharField(max_length=20, blank=True, null=True)
    shipping_address = models.TextField(blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_region = models.CharField(max_length=100, blank=True, null=True)
    shipping_postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Billing address fields
    billing_first_name = models.CharField(max_length=100, blank=True, null=True)
    billing_last_name = models.CharField(max_length=100, blank=True, null=True)
    billing_phone = models.CharField(max_length=20, blank=True, null=True)
    billing_address = models.TextField(blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_region = models.CharField(max_length=100, blank=True, null=True)
    billing_postal_code = models.CharField(max_length=20, blank=True, null=True)
    
    # Payment details
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True, null=True)

    # Guards idempotency of inventory restoration. Set True once stock has been
    # released/restored for this order so a retried/duplicated restore_inventory
    # task cannot create phantom stock.
    inventory_restored = models.BooleanField(default=False)
    
    # Gift order
    is_gift = models.BooleanField(default=False)
    gift_message = models.TextField(blank=True, null=True)
    
    # Guest checkout
    guest_email = models.EmailField(blank=True, null=True)
    guest_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # Shipping tracking
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    shipping_carrier = models.CharField(max_length=50, blank=True, null=True)
    shipping_notes = models.TextField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['receipt_number']),
            models.Index(fields=['guest_email']),
            models.Index(fields=['transaction_id']),
            models.Index(fields=['mpesa_receipt_number']),
        ]

    def __str__(self):
        return f"Order {self.id} - {self.user.email if self.user else self.guest_email} - {self.status}"
    
    def can_transition_to(self, new_status):
        """Check if transition to new_status is valid."""
        allowed_transitions = self.STATUS_TRANSITIONS.get(self.status, [])
        return new_status in allowed_transitions
    
    def transition_to(self, new_status, save=True):
        """
        Transition to a new status with validation.
        Returns (success: bool, error_message: str)
        """
        if not self.can_transition_to(new_status):
            return False, f"Invalid transition from {self.status} to {new_status}"
        
        old_status = self.status
        self.status = new_status
        
        # Update timestamp fields
        now = timezone.now()
        if new_status == self.STATUS_PAID:
            self.paid_at = now
        elif new_status == self.STATUS_PROCESSING:
            self.processed_at = now
        elif new_status == self.STATUS_SHIPPED:
            self.shipped_at = now
        elif new_status == self.STATUS_DELIVERED:
            self.delivered_at = now
        elif new_status == self.STATUS_CANCELLED:
            self.cancelled_at = now
        
        if save:
            self.save(update_fields=['status', 'updated_at', 'paid_at', 'processed_at', 
                                     'shipped_at', 'delivered_at', 'cancelled_at'])
        
        return True, None
    
    @property
    def triggered_events(self):
        """Get events that should be triggered for status changes."""
        events = []
        # This would be populated based on status change in the service layer
        return events
    
    @property
    def customer_name(self):
        """Get customer name for display."""
        if self.user:
            return f"{self.user.first_name} {self.user.last_name}".strip() or self.user.email
        return f"{self.shipping_first_name} {self.shipping_last_name}".strip() or self.guest_email or "Guest"
    
    @property
    def customer_email(self):
        """Get customer email for display."""
        if self.user:
            return self.user.email
        return self.guest_email
    
    @property
    def customer_phone(self):
        """Get customer phone for display."""
        if self.user:
            return getattr(self.user, 'phone_number', None)
        return self.guest_phone or self.shipping_phone
    
    @property
    def billing_name(self):
        """Get billing name for display."""
        if self.billing_first_name or self.billing_last_name:
            return f"{self.billing_first_name} {self.billing_last_name}".strip()
        return self.customer_name
    
    @property
    def shipping_name(self):
        """Get shipping name for display."""
        if self.shipping_first_name or self.shipping_last_name:
            return f"{self.shipping_first_name} {self.shipping_last_name}".strip()
        return self.customer_name


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant_reference = models.CharField(max_length=64, blank=True, null=True, db_index=True)
    variant_details = models.JSONField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        color_label = ""
        if isinstance(self.variant_details, dict):
            color_label = self.variant_details.get("color_label") or self.variant_details.get("color") or ""
        if color_label:
            return f"{self.product.name} ({color_label}) x {self.quantity}"
        return f"{self.product.name} x {self.quantity}"


DELIVERY_FEES = {
    'mombasa': 0,
    'nairobi': 300,
    'upcountry': 500,
}


def create_order_from_cart(user, cart, coupon=None, delivery_region='nairobi'):
    """
    Create an order from a cart with proper inventory locking to prevent race conditions.
    Uses select_for_update to lock all inventory rows within a single transaction.
    """
    with transaction.atomic():
        # Lock all inventory rows at once to prevent race conditions
        cart_items = cart.items.select_related('product', 'variant').all()
        product_ids = [item.product_id for item in cart_items]
        variant_ids = [item.variant_id for item in cart_items if item.variant_id]
        
        # Lock all inventory rows for the products in the cart
        inventories = {
            inv.product_id: inv 
            for inv in Inventory.objects.select_for_update().filter(product_id__in=product_ids)
        }
        variant_inventories = {
            inv.variant_id: inv
            for inv in VariantInventory.objects.select_for_update().filter(variant_id__in=variant_ids)
        }
        
        # Validate stock and calculate totals
        subtotal = Decimal("0.00")
        items = []
        
        for ci in cart_items:
            if ci.variant_id:
                inv = variant_inventories.get(ci.variant_id)
                if inv is None:
                    inv, _ = VariantInventory.objects.select_for_update().get_or_create(
                        variant=ci.variant,
                        defaults={"quantity": 0, "reserved": 0},
                    )
                    variant_inventories[ci.variant_id] = inv

                if inv.available() < ci.quantity:
                    raise ValueError(
                        f'Color {ci.variant.get_color_display() if ci.variant and ci.variant.color else ci.product.name} is out of stock. Available: {inv.available()}'
                    )

                unit_price = ci.product.price + (ci.variant.price_modifier if ci.variant else Decimal("0.00"))
                line_total = unit_price * ci.quantity
                subtotal += line_total
                items.append((ci.product, ci.variant, ci.quantity, unit_price, inv, True))
                continue

            inv = inventories.get(ci.product_id)
            if inv is None:
                raise ValueError(f'No inventory record found for {ci.product.name}')

            if inv.available() < ci.quantity:
                raise ValueError(f'Product {ci.product.name} is out of stock. Available: {inv.available()}')

            unit_price = ci.product.price
            line_total = unit_price * ci.quantity
            subtotal += line_total
            items.append((ci.product, None, ci.quantity, unit_price, inv, False))

        discount_amount = Decimal("0.00")
        if coupon and getattr(coupon, "is_active", False) and hasattr(coupon, "calculate_discount") and coupon.is_valid():
            discount_amount = coupon.calculate_discount(subtotal)

        # Apply delivery fee
        delivery_fee = DELIVERY_FEES.get(delivery_region, 0)

        total = max(subtotal - discount_amount, 0) + delivery_fee

        # Create the order
        order = Order.objects.create(
            user=user,
            subtotal=subtotal,
            discount_amount=discount_amount,
            delivery_fee=delivery_fee,
            tax_amount=0,
            total=total,
            status='pending',
            coupon=coupon,
            delivery_region=delivery_region,
        )

        # Reserve inventory (do not deduct stock until payment is confirmed).
        for product, variant, qty, price, inv, is_variant in items:
            if is_variant:
                updated = VariantInventory.objects.filter(
                    pk=inv.pk,
                    quantity__gte=models.F("reserved") + qty,
                ).update(reserved=models.F("reserved") + qty)
            else:
                updated = Inventory.objects.filter(
                    pk=inv.pk,
                    quantity__gte=models.F("reserved") + qty,
                ).update(reserved=models.F("reserved") + qty)
            if updated != 1:
                raise ValueError(f"Product {product.name} is out of stock.")
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
            if is_variant:
                sync_product_stock(product)

        return order

