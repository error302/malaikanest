import uuid
from django.db import models


class BaseModel(models.Model):
    """
    Abstract base model providing UUID primary key and timestamp tracking.
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

    contact_email = models.EmailField(default="malaikanest7@gmail.com")
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
        # Note: With UUIDs, pk=1 doesn't make sense. We should get the first one.
        obj = cls.objects.first()
        if not obj:
            obj = cls.objects.create()
        return obj
