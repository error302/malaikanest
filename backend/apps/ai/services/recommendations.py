from typing import List, Dict, Any, Optional
from django.db.models import QuerySet
from apps.products.models import Product, Category


def get_same_category_products(product: Product, limit: int = 5) -> List[Dict[str, Any]]:
    products = Product.objects.filter(
        category=product.category,
        is_active=True
    ).exclude(id=product.id)[:limit]
    
    return _serialize_products(products)


def get_frequently_bought_together(product: Product, limit: int = 5) -> List[Dict[str, Any]]:
    from apps.orders.models import OrderItem
    
    order_ids = OrderItem.objects.filter(product=product).values_list('order_id', flat=True)
    
    related_products = Product.objects.filter(
        orderitem__order_id__in=order_ids,
        is_active=True
    ).exclude(id=product.id)
    
    from django.db.models import Count
    related_products = related_products.annotate(
        order_count=Count('orderitem')
    ).order_by('-order_count')[:limit]
    
    return _serialize_products(related_products)


def get_age_group_recommendations(age_group: str, limit: int = 10) -> List[Dict[str, Any]]:
    age_category_map = {
        'newborn': ['Bodysuits', 'Sleepwear', 'Swaddles', 'Baby Hats', 'Socks'],
        '0-3m': ['Bodysuits', 'Sleepwear', 'Swaddles', 'Baby Hats', 'Socks'],
        '3-6m': ['Bodysuits', 'Rompers', 'Play Mats', 'Toys'],
        '6-12m': ['Rompers', 'Trousers', 'Toys', 'Feeding Bottles'],
        '1-3y': ['T-Shirts', 'Trousers', 'Dresses', 'Shoes', 'Toys'],
        '3-5y': ['T-Shirts', 'Trousers', 'Dresses', 'Shoes', 'School Bags'],
        '5+': ['T-Shirts', 'Trousers', 'School Uniforms', 'Shoes'],
    }
    
    categories = age_category_map.get(age_group.lower(), [])
    
    products = Product.objects.filter(
        category__name__in=categories,
        is_active=True
    )[:limit]
    
    return _serialize_products(products)


def get_personalized_recommendations(
    user_email: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    from apps.orders.models import Order, OrderItem
    
    try:
        orders = Order.objects.filter(email=user_email, status='completed')
        order_items = OrderItem.objects.filter(order__in=orders)
        
        purchased_categories = Product.objects.filter(
            orderitem__in=order_items
        ).values_list('category_id', flat=True).distinct()
        
        products = Product.objects.filter(
            category_id__in=purchased_categories,
            is_active=True
        ).exclude(
            orderitem__in=order_items
        )[:limit]
        
        return _serialize_products(products)
    except Exception:
        return get_trending_products(limit)


def get_trending_products(limit: int = 10) -> List[Dict[str, Any]]:
    from apps.orders.models import OrderItem
    
    product_ids = OrderItem.objects.filter(
        order__status='completed'
    ).values_list('product_id', flat=True)
    
    from django.db.models import Count
    trending = Product.objects.filter(
        id__in=product_ids,
        is_active=True
    ).annotate(
        purchase_count=Count('orderitem')
    ).order_by('-purchase_count')[:limit]
    
    return _serialize_products(trending)


def get_related_products(product: Product, limit: int = 5) -> List[Dict[str, Any]]:
    same_category = get_same_category_products(product, limit=limit)
    
    bought_together = get_frequently_bought_together(product, limit=limit)
    
    seen_ids = {product.id}
    combined = []
    
    for p in same_category + bought_together:
        if p['id'] not in seen_ids:
            combined.append(p)
            seen_ids.add(p['id'])
            if len(combined) >= limit:
                break
    
    return combined


def _serialize_products(products: QuerySet) -> List[Dict[str, Any]]:
    result = []
    for p in products:
        result.append({
            'id': p.id,
            'name': p.name,
            'slug': p.slug,
            'price': str(p.price),
            'category': p.category.name,
            'image': p.image.url if p.image else None,
        })
    return result
