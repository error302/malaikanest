import uuid
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Product, Brand, Category


@receiver(pre_save, sender=Product)
def product_pre_save(sender, instance, **kwargs):
    """Handle Product business logic before saving"""
    # Auto-generate SKU if not provided
    if not instance.sku:
        instance.sku = f"SKU-{uuid.uuid4().hex[:8].upper()}"
    
    # Auto-hide product when out of stock (if it was published)
    if instance.stock <= 0 and instance.status == 'published':
        instance.is_active = False
    elif instance.stock > 0 and instance.status == 'published':
        instance.is_active = True


@receiver(pre_save, sender=Brand)
def brand_pre_save(sender, instance, **kwargs):
    """Handle Brand slug generation before saving"""
    if not instance.slug:
        from django.utils.text import slugify
        instance.slug = slugify(instance.name)


@receiver(pre_save, sender=Category)
def category_pre_save(sender, instance, **kwargs):
    """Handle Category slug and group generation before saving"""
    if not instance.slug:
        from django.utils.text import slugify
        instance.slug = slugify(instance.name)
    if instance.parent is None and not instance.group:
        instance.group = instance.name
