from django.db import models


class SiteSettings(models.Model):
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

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Settings"
        verbose_name_plural = "Site Settings"

    def __str__(self) -> str:  # pragma: no cover
        return f"SiteSettings({self.pk})"

    @classmethod
    def get_solo(cls) -> "SiteSettings":
        obj, _ = cls.objects.get_or_create(pk=1, defaults={})
        return obj

