from django.db import models, transaction
from django.conf import settings
from apps.products.models import Product, Inventory


class Coupon(models.Model):
    code = models.CharField(max_length=50, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.code


class Cart(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_key = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['session_key']),
            models.Index(fields=['user', 'session_key']),
        ]


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('cart', 'product')


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('initiated', 'Initiated'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    DELIVERY_CHOICES = [
        ('mombasa', 'Mombasa (Same Day)'),
        ('nairobi', 'Nairobi (1-2 Days)'),
        ('upcountry', 'Upcountry (2-3 Days)')
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    coupon = models.ForeignKey(Coupon, null=True, blank=True, on_delete=models.SET_NULL)
    receipt_number = models.CharField(max_length=128, unique=True)
    delivery_region = models.CharField(max_length=20, choices=DELIVERY_CHOICES, default='nairobi')
    is_gift = models.BooleanField(default=False)
    gift_message = models.TextField(blank=True, null=True)
    guest_email = models.EmailField(blank=True, null=True)
    guest_phone = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['-created_at']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['receipt_number']),
            models.Index(fields=['guest_email']),
        ]

    def __str__(self):
        return f"Order {self.id} - {self.user.email if self.user else self.guest_email} - {self.status}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"


def create_order_from_cart(user, cart, coupon=None, receipt_number=None):
    with transaction.atomic():
        # Create order row with total calculation and reserve stock using select_for_update
        total = 0
        items = []
        for ci in cart.items.select_related('product').all():
            inv = Inventory.objects.select_for_update().get(product=ci.product)
            if inv.available() < ci.quantity:
                raise ValueError(f'Product {ci.product.name} out of stock')
            total += ci.product.price * ci.quantity
            items.append((ci.product, ci.quantity, ci.product.price, inv))

        if coupon and coupon.active:
            total = max(total - coupon.amount, 0)

        order = Order.objects.create(user=user, total=total, status='pending', coupon=coupon, receipt_number=receipt_number)

        for product, qty, price, inv in items:
            # Deduct from inventory atomically
            inv.quantity -= qty
            inv.reserved = max(inv.reserved - qty, 0)
            inv.save()
            OrderItem.objects.create(order=order, product=product, price=price, quantity=qty)

        return order
