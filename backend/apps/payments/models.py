from django.db import models


class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ("mpesa", "M-Pesa"),
        ("paypal", "PayPal"),
        ("card", "Debit/Credit Card"),
    ]
    STATUS_CHOICES = [
        ("initiated", "Initiated"),
        ("completed", "Completed"),
        ("failed", "Failed"),
        ("pending", "Pending"),
        ("cancelled", "Cancelled"),
    ]

    order = models.OneToOneField(
        "orders.Order", related_name="payment", on_delete=models.CASCADE
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, default="mpesa"
    )
    phone = models.CharField(max_length=20, blank=True, null=True)
    checkout_request_id = models.CharField(max_length=128, unique=True, null=True, blank=True)
    mpesa_receipt_number = models.CharField(max_length=128, unique=True, null=True, blank=True)
    paypal_transaction_id = models.CharField(max_length=128, unique=True, null=True, blank=True)
    card_last_four = models.CharField(max_length=4, null=True, blank=True)
    card_brand = models.CharField(max_length=20, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="initiated")
    raw_callback = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["payment_method"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"Payment {self.id} {self.payment_method} {self.status} KES {self.amount}"


class PaymentAuditLog(models.Model):
    EVENT_CHOICES = [
        ("callback_received", "Callback Received"),
        ("callback_blocked", "Callback Blocked"),
        ("callback_unmatched", "Callback Unmatched"),
        ("callback_duplicate", "Callback Duplicate"),
        ("callback_failed", "Callback Failed"),
        ("callback_completed", "Callback Completed"),
        ("stk_initiated", "STK Initiated"),
        ("stk_failed", "STK Failed"),
        ("reconcile_query", "Reconcile Query"),
        ("reconcile_queued", "Reconcile Queued"),
        ("reconcile_completed", "Reconcile Completed"),
    ]

    payment = models.ForeignKey(
        Payment,
        related_name="audit_logs",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    event_type = models.CharField(max_length=40, choices=EVENT_CHOICES)
    source = models.CharField(max_length=40, default="system")
    request_ip = models.GenericIPAddressField(null=True, blank=True)
    checkout_request_id = models.CharField(max_length=128, null=True, blank=True)
    merchant_request_id = models.CharField(max_length=128, null=True, blank=True)
    result_code = models.CharField(max_length=32, null=True, blank=True)
    payload_hash = models.CharField(max_length=64)
    payload = models.JSONField()
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["event_type", "-created_at"]),
            models.Index(fields=["checkout_request_id"]),
            models.Index(fields=["merchant_request_id"]),
            models.Index(fields=["result_code"]),
            models.Index(fields=["payload_hash"]),
            models.Index(fields=["-created_at"]),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"PaymentAuditLog {self.id} {self.event_type} payment={self.payment_id}"
