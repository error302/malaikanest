from django.db import models
from django.conf import settings


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('mpesa', 'M-Pesa'),
        ('paypal', 'PayPal'),
        ('card', 'Debit/Credit Card'),
    ]
    STATUS_CHOICES = [
        ('initiated', 'Initiated'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
    ]
    order = models.OneToOneField('orders.Order', related_name='payment', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='mpesa')
    phone = models.CharField(max_length=20, blank=True, null=True)
    checkout_request_id = models.CharField(max_length=128, unique=True, null=True, blank=True)
    mpesa_receipt_number = models.CharField(max_length=128, unique=True, null=True, blank=True)
    paypal_transaction_id = models.CharField(max_length=128, unique=True, null=True, blank=True)
    card_last_four = models.CharField(max_length=4, null=True, blank=True)
    card_brand = models.CharField(max_length=20, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='initiated')
    raw_callback = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['payment_method']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Payment {self.id} {self.payment_method} {self.status} KES {self.amount}"
