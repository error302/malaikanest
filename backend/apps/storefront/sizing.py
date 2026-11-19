"""Stock-aware presentation and filtering, without per-card inventory queries."""
from django.db.models import Exists, F, OuterRef, Prefetch, Q
from django.db.models.functions import Coalesce

from apps.products.models import Product, ProductVariant


def shopping_queryset(queryset):
    return queryset.select_related('inventory').prefetch_related(
        Prefetch('variants', queryset=ProductVariant.objects.all().select_related('inventory'), to_attr='all_shop_variants'),
        Prefetch('variants', queryset=ProductVariant.objects.filter(is_active=True).select_related('inventory'), to_attr='shop_variants')
    )


AGE_INTERVAL_MAP = {
    "newborn": ["newborn", "0-1m"],
    "0-3m": ["newborn", "0-3m"],
    "3-6m": ["3-6m"],
    "6-9m": ["6-9m", "6-12m"],
    "9-12m": ["9-12m", "6-12m"],
    "6-12m": ["6-12m", "6-9m", "9-12m"],
    "1-2y": ["1y", "2y", "12-18m", "18-24m", "1-2 years"],
    "2-4y": ["2y", "3y", "4y", "2-3 years", "3-4 years", "2-4 years"],
    "4-6y": ["4y", "5y", "6y", "4-5 years", "5-6 years", "4-6 years"],
    "6-8y": ["6y", "7y", "8y", "6-7 years", "7-8 years", "6-8 years"],
    "8-10y": ["8y", "9y", "10y", "8-9 years", "9-10 years"],
    "10-12y": ["10y", "11y", "12y", "10-11 years", "11-12 years"],
}


def filter_size(queryset, size):
    if not size:
        return queryset
    target_sizes = AGE_INTERVAL_MAP.get(size.lower(), [size])
    if size not in target_sizes:
        target_sizes.append(size)

    any_variant = ProductVariant.objects.filter(product_id=OuterRef('pk'))
    active = any_variant.filter(is_active=True)
    matching = active.filter(size__in=target_sizes, inventory__quantity__gt=F('inventory__reserved'))
    return queryset.annotate(
        _has_variants=Exists(any_variant), _matching_size=Exists(matching),
        _simple_stock=Coalesce(F('inventory__quantity'), F('stock')) - Coalesce(F('inventory__reserved'), 0),
    ).filter(
        Q(_matching_size=True) |
        Q(_has_variants=False, size_label__in=target_sizes, _simple_stock__gt=0) |
        Q(_has_variants=False, age_group=size, _simple_stock__gt=0)
    )


def prepare_product(product):
    labels = dict(Product.SIZE_CHOICES)
    sizes = set()
    if getattr(product, 'all_shop_variants', None):
        stock = 0
        for variant in product.shop_variants:
            inventory = getattr(variant, 'inventory', None)
            variant.shop_stock = inventory.available() if inventory else 0
            variant.shop_price = product.price + variant.price_modifier
            stock += variant.shop_stock
            if variant.shop_stock and variant.size:
                sizes.add(variant.size)
    else:
        inventory = getattr(product, 'inventory', None)
        stock = inventory.available() if inventory else product.stock
        if stock and product.size_label:
            sizes.add(product.size_label)
    product.shop_stock = stock
    product.shop_sizes = [label for key, label in labels.items() if key in sizes]
    return product
