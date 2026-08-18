import logging
import uuid

from django.core.cache import cache
from django.db.models.signals import post_delete, post_save, pre_save
from django.dispatch import receiver
from django.utils.text import slugify

from .models import Brand, Category, Product, ProductVariant

logger = logging.getLogger(__name__)


def _invalidate_catalog_caches():
    """
    Cache invalidation discipline (system-design-101: cache aside / explicit
    invalidation). When admin changes a product or variant (price, stock, image,
    etc.), any cached catalog list / detail pages must be busted immediately.
    """
    try:
        for key in cache.keys("products_list_*"):
            cache.delete(key)
    except Exception:
        logger.debug("Cache invalidation failed for products_list_*")
    # Nested caches keyed on the well-known names.
    for key in ("categories_list", "banners_list_active"):
        try:
            cache.delete(key)
        except Exception:
            logger.debug("Cache invalidation failed for key=%s", key)


@receiver(pre_save, sender=Product)
def product_pre_save(sender, instance, **kwargs):
    """Handle Product business logic before saving."""
    if not instance.sku:
        instance.sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"


@receiver(post_save, sender=Product)
@receiver(post_delete, sender=Product)
def product_cache_invalidate(sender, instance, **kwargs):
    _invalidate_catalog_caches()


@receiver(post_save, sender=ProductVariant)
@receiver(post_delete, sender=ProductVariant)
def variant_cache_invalidate(sender, instance, **kwargs):
    # Variant price/availability flows into product-list rendering.
    _invalidate_catalog_caches()


@receiver(pre_save, sender=Brand)
def brand_pre_save(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = slugify(instance.name)


@receiver(pre_save, sender=Category)
def category_pre_save(sender, instance, **kwargs):
    if not instance.slug:
        instance.slug = slugify(instance.name)
    if instance.parent is None and not instance.group:
        instance.group = instance.name
