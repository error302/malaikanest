from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
from apps.products.models import Product, ProductVariant, Inventory, InventoryLog, VariantInventory
import uuid
import random
from datetime import datetime


class Invoice(models.Model):
    """Model for storing generated invoices linked to orders."""
    
    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    pdf_file = models.FileField(upload_to='invoices/%Y/%m/', null=True, blank=True)
    pdf_url = models.URLField(null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    download_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['order']),
            models.Index(fields=['-generated_at']),
        ]
    
    def __str__(self):
        return f"Invoice {self.invoice_number} for Order {self.order.id}"
    
    @classmethod
    def generate_invoice_number(cls):
        """Generate a unique invoice number: INV-YYYY-XXXXXX"""
        today = datetime.now()
        year = today.strftime('%Y')
        
        # Get the last invoice number for this year
        last_invoice = cls.objects.filter(
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
        
        # Format: INV-2026-000184
        return f"INV-{year}-{new_seq:06d}"


class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('flat', 'Flat Amount'),
        ('percentage', 'Percentage'),
    ]

    code = models.CharField(max_length=50, unique=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='flat')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    times_used = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code

    def is_valid(self):
        if not self.active:
            return False
        if self.usage_limit and self.times_used >= self.usage_limit:
            return False
        return True

    def calculate_discount(self, subtotal):
        if self.discount_type == 'percentage':
            return (subtotal * self.amount / 100)
        return min(self.amount, subtotal)


class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

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


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'variant')

    @property
    def effective_variant(self):
        if self.variant:
            return self.variant
        return self.product.variants.filter(size='one-size').first() or self.product.variants.first()


class Order(models.Model):
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
        STATUS_PENDING: [STATUS_INITIATED, STATUS_CANCELLED],
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
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL)
    receipt_number = models.CharField(max_length=128, unique=True)
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
            return getattr(self.user, 'phone', None)
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


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


DELIVERY_FEES = {
    'mombasa': 0,
    'nairobi': 300,
    'upcountry': 500,
}


def create_order_from_cart(user, cart, coupon=None, receipt_number=None, delivery_region='nairobi'):
    """
    Create an order from a cart with proper inventory locking to prevent race conditions.
    Uses select_for_update to lock all inventory rows within a single transaction.
    """
    with transaction.atomic():
        # Lock all inventory rows at once to prevent race conditions
        cart_items = cart.items.select_related('product').all()
        product_ids = [item.product_id for item in cart_items]
        
        # Lock all inventory rows for the products in the cart
        inventories = {
            inv.product_id: inv 
            for inv in Inventory.objects.select_for_update().filter(product_id__in=product_ids)
        }
        
        # Validate stock and calculate total
        total = 0
        items = []
        
        for ci in cart_items:
            inv = inventories.get(ci.product_id)
            
            # Handle case where inventory record doesn't exist
            if inv is None:
                raise ValueError(f'No inventory record found for {ci.product.name}')
            
            if inv.available() < ci.quantity:
                raise ValueError(f'Product {ci.product.name} is out of stock. Available: {inv.available()}')
            
            total += ci.product.price * ci.quantity
            items.append((ci.product, ci.quantity, ci.product.price, inv))

        # Apply coupon discount
        if coupon and coupon.active:
            total = max(total - coupon.amount, 0)

        # Apply delivery fee
        delivery_fee = DELIVERY_FEES.get(delivery_region, 0)
        total += delivery_fee

        # Create the order
        order = Order.objects.create(
            user=user,
            total=total,
            status='pending',
            coupon=coupon,
            receipt_number=receipt_number,
            delivery_region=delivery_region,
        )

        # Deduct inventory and create order items
        for product, qty, price, inv in items:
            # Atomically deduct quantity, and never let `reserved` go negative.
            # Also guard against oversell without relying solely on row locking.
            updated = Inventory.objects.filter(pk=inv.pk, quantity__gte=qty).update(
                quantity=models.F("quantity") - qty,
                reserved=models.Case(
                    models.When(reserved__gte=qty, then=models.F("reserved") - qty),
                    default=models.Value(0),
                    output_field=models.IntegerField(),
                ),
            )
            if updated != 1:
                raise ValueError(f"Product {product.name} is out of stock.")
            OrderItem.objects.create(order=order, product=product, price=price, quantity=qty)

        return order

