"""Stock-aware presentation and filtering, without per-card inventory queries."""
from django.db.models import Exists, F, OuterRef, Prefetch, Q
from django.db.models.functions import Coalesce

from apps.products.models import Product, ProductVariant


def shopping_queryset(queryset):
    return queryset.select_related('inventory').prefetch_related(
        Prefetch('variants', queryset=ProductVariant.objects.all().select_related('inventory'), to_attr='all_shop_variants'),
        Prefetch('variants', queryset=ProductVariant.objects.filter(is_active=True).select_related('inventory'), to_attr='shop_variants')
    )


def filter_size(queryset, size):
    active = ProductVariant.objects.filter(product_id=OuterRef('pk'), is_active=True)
    matching = active.filter(size=size, inventory__quantity__gt=F('inventory__reserved'))
    return queryset.annotate(
        _has_variants=Exists(active), _matching_size=Exists(matching),
        _simple_stock=Coalesce(F('inventory__quantity'), F('stock')) - Coalesce(F('inventory__reserved'), 0),
    ).filter(Q(_matching_size=True) | Q(_has_variants=False, size_label=size, _simple_stock__gt=0))


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
