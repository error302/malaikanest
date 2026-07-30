import uuid

from django.conf import settings
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model providing UUID primary keys and timestamp tracking.

    Migration `core.0004` aligns the model state with the UUID-serialised
    columns already present in every child table (products, orders, payments,
    carts, etc.) so that the Django model layer auto-generates UUIDs for new
    rows instead of sending ``id=NULL`` to the database.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class SiteSettings(BaseModel):
    """
    Singleton-ish site configuration.

    We store a single row (pk=1). This avoids relying on process memory for settings
    and survives restarts/deploys.
    """

    site_name = models.CharField(max_length=120, default="Malaika Nest")
    site_description = models.CharField(
        max_length=255, default="Premium Baby Products in Kenya", blank=True
    )

    contact_email = models.EmailField(default="hello@malaikanest.com")
    contact_phone = models.CharField(max_length=40, default="+254700000000", blank=True)
    address = models.CharField(max_length=180, default="Nairobi, Kenya", blank=True)

    facebook_url = models.URLField(blank=True, default="")
    instagram_url = models.URLField(blank=True, default="")
    twitter_url = models.URLField(blank=True, default="")

    # Amounts are stored as strings in the current frontend; keep them as decimals for safety.
    shipping_fee = models.DecimalField(max_digits=10, decimal_places=2, default=500)
    free_shipping_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=5000)
    minimum_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=1000)

    # Stored in Cloudinary via default storage in production.
    logo = models.ImageField(upload_to="site/logo/", null=True, blank=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self) -> str:
        return f"SiteSettings({self.pk})"

    @classmethod
    def get_solo(cls) -> "SiteSettings":
        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create()
        return obj


class ShopPhoto(BaseModel):
    image = models.ImageField(upload_to="shop_photos/")
    image_url = models.URLField(blank=True, null=True, help_text="Paste Cloudinary URL instead of uploading")
    caption = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["position", "-created_at"]
        verbose_name = "Shop Photo"
        verbose_name_plural = "Shop Photos"

    def __str__(self):
        return self.caption or f"Shop Photo {self.pk}"

    @property
    def get_image_url(self):
        if self.image_url:
            return self.image_url
        if self.image:
            return self.image.url
        return None


class OutboxEvent(BaseModel):
    """
    Transactional Outbox (system-design-101: event-driven / reliable messaging).

    Domain events are written in the SAME DB transaction as the state change that
    produced them, then a relay task publishes them to the async workers. This
    guarantees side effects (invoice generation, inventory reduction, emails,
    stock restoration) are never lost even if the web/Celery process crashes
    between committing the DB change and enqueuing the task.
    """

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("published", "Published"),
        ("failed", "Failed"),
    ]

    aggregate_type = models.CharField(max_length=40)
    aggregate_id = models.CharField(max_length=64, db_index=True)
    event_type = models.CharField(max_length=60)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending", db_index=True
    )
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(
                fields=["status", "created_at"],
                name="core_outbox_status_created_idx",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"OutboxEvent({self.aggregate_type}:{self.aggregate_id}:{self.event_type}:{self.status})"


class EmailLog(BaseModel):
    """
    Audit log for every outbound email.

    Written by ``EmailService`` after each send attempt so operators can
    verify delivery, inspect failures, and monitor email health over time.
    """

    email_type = models.CharField(max_length=40, db_index=True)
    recipient = models.EmailField(db_index=True)
    subject = models.CharField(max_length=255, blank=True, default="")
    template_name = models.CharField(max_length=120, blank=True, default="")
    success = models.BooleanField(default=False, db_index=True)
    duration_ms = models.PositiveIntegerField(default=0, help_text="SMTP round-trip in milliseconds")
    error_message = models.TextField(blank=True, default="")
    order_id = models.CharField(max_length=64, blank=True, default="", db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["email_type", "-created_at"]),
            models.Index(fields=["success", "-created_at"]),
        ]
        verbose_name = "Email Log"
        verbose_name_plural = "Email Logs"

    def __str__(self):
        return f"EmailLog({self.email_type} → {self.recipient}, {'✓' if self.success else '✗'})"


class DataExportRequest(BaseModel):
    """
    GDPR-compliant personal data export request.

    When a user requests their data, a ``DataExportRequest`` is created with
    status=``pending``. A Celery task generates the archive and updates the
    record. The archive is available for download for 7 days, then the cleanup
    task deletes it.
    """

    STATUS_PENDING = "pending"
    STATUS_PROCESSING = "processing"
    STATUS_READY = "ready"
    STATUS_EXPIRED = "expired"
    STATUS_FAILED = "failed"

    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSING, "Processing"),
        (STATUS_READY, "Ready"),
        (STATUS_EXPIRED, "Expired"),
        (STATUS_FAILED, "Failed"),
    ]

    EXPIRY_DAYS = 7

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="data_export_requests",
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING, db_index=True
    )
    archive_file = models.FileField(
        upload_to="data_exports/%Y/%m/",
        null=True,
        blank=True,
        help_text="Generated JSON archive file",
    )
    archive_size = models.PositiveIntegerField(
        default=0, help_text="Archive size in bytes"
    )
    error_message = models.TextField(blank=True, default="")
    expires_at = models.DateTimeField(null=True, blank=True)
    notification_sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"]),
            models.Index(fields=["status", "expires_at"]),
        ]
        verbose_name = "Data Export Request"
        verbose_name_plural = "Data Export Requests"

    def __str__(self):
        return f"DataExport({self.user.email}, {self.status})"
