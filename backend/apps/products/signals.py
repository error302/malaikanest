import uuid

from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils.text import slugify

from .models import Brand, Category, Product


@receiver(pre_save, sender=Product)
def product_pre_save(sender, instance, **kwargs):
    """Handle Product business logic before saving."""
    if not instance.sku:
        instance.sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"

    if instance.stock <= 0 and instance.status == "published":
        instance.is_active = False
    elif instance.stock > 0 and instance.status == "published":
        instance.is_active = True


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
