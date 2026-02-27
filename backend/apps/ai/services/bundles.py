from typing import Dict, Any, List, Optional
from django.db.models import QuerySet
from apps.products.models import Product, Category
from .openai_client import openai_client


BUNDLE_SYSTEM_PROMPT = """You are a baby product bundle expert for Malaika Nest, a Kenyan baby store.

Create thoughtful, practical baby product bundles based on customer needs.

Available bundle types:
- newborn_starter: Essential items for new parents
- baby_shower_gift: Celebratory gift for baby showers
- seasonal_pack: Climate-appropriate clothing
- milestone_gift: Gifts for birthdays or achievements

Consider:
- Kenya's warm climate (light, breathable fabrics)
- Age appropriateness
- Gender preferences (or neutral)
- Budget constraints
- Practicality for Kenyan parents

Return JSON with this structure:
{
    "bundle_name": "Descriptive bundle name",
    "description": "Why this bundle is great",
    "items": [
        {"category": "category name", "quantity": 1, "reason": "why this item"}
    ],
    "total_estimate": "KES X,XXX - Y,YYY"
}
"""


BUNDLE_TEMPLATES = {
    'newborn_starter': {
        'categories': ['Bodysuits', 'Sleepwear', 'Swaddles', 'Baby Hats', 'Socks'],
        'quantities': [3, 2, 2, 1, 2]
    },
    'baby_shower_gift': {
        'categories': ['Bodysuits', 'Dresses', 'Gift Sets', 'Toys'],
        'quantities': [2, 1, 1, 1]
    },
    'birthday_pack': {
        'categories': ['T-Shirts', 'Trousers', 'Dresses', 'Shoes', 'Toys'],
        'quantities': [2, 2, 1, 1, 1]
    },
}


def generate_bundle(
    bundle_type: str,
    budget: Optional[int] = None,
    age_group: Optional[str] = None,
    gender: Optional[str] = None,
    climate: str = 'warm'
) -> Dict[str, Any]:
    if bundle_type in BUNDLE_TEMPLATES:
        return _generate_template_bundle(bundle_type, budget, age_group, gender, climate)
    
    prompt = f"""Create a {bundle_type} bundle for:
- Budget: {budget if budget else 'any'}
- Age group: {age_group if age_group else 'any'}
- Gender: {gender if gender else 'neutral'}
- Climate: {climate}

Available categories: {', '.join(Category.objects.values_list('name', flat=True))}"""
    
    try:
        result = openai_client.chat_json(
            message=prompt,
            system_prompt=BUNDLE_SYSTEM_PROMPT
        )
        return _resolve_bundle_with_products(result, budget)
    except Exception as e:
        return {
            "error": str(e),
            "fallback": True,
            "products": _get_fallback_products(budget)
        }


def _generate_template_bundle(
    bundle_type: str,
    budget: Optional[int],
    age_group: Optional[str],
    gender: Optional[str],
    climate: str
) -> Dict[str, Any]:
    template = BUNDLE_TEMPLATES.get(bundle_type, BUNDLE_TEMPLATES['newborn_starter'])
    
    products = []
    total = 0
    
    for category_name, quantity in zip(template['categories'], template['quantities']):
        category_products = Product.objects.filter(
            category__name__icontains=category_name.split()[0],
            is_active=True
        )[:quantity]
        
        for i, prod in enumerate(category_products[:quantity]):
            if budget and total + float(prod.price) > budget:
                continue
            products.append({
                'id': prod.id,
                'name': prod.name,
                'price': str(prod.price),
                'category': prod.category.name,
                'image': prod.image.url if prod.image else None,
            })
            total += float(prod.price)
    
    bundle_names = {
        'newborn_starter': 'Newborn Starter Pack',
        'baby_shower_gift': 'Baby Shower Gift Set',
        'birthday_pack': 'Birthday Celebration Pack'
    }
    
    return {
        'bundle_name': bundle_names.get(bundle_type, 'Custom Bundle'),
        'items': products,
        'total': f'KES {total:,.0f}',
        'item_count': len(products)
    }


def _resolve_bundle_with_products(ai_response: Dict, budget: Optional[int]) -> Dict[str, Any]:
    products = []
    total = 0
    
    for item in ai_response.get('items', []):
        category_name = item.get('category', '')
        quantity = item.get('quantity', 1)
        
        category_products = Product.objects.filter(
            category__name__icontains=category_name,
            is_active=True
        )[:quantity]
        
        for prod in category_products:
            if budget and total + float(prod.price) > budget:
                continue
            products.append({
                'id': prod.id,
                'name': prod.name,
                'price': str(prod.price),
                'category': prod.category.name,
            })
            total += float(prod.price)
    
    return {
        'bundle_name': ai_response.get('bundle_name', 'Custom Bundle'),
        'description': ai_response.get('description', ''),
        'items': products,
        'total': f'KES {total:,.0f}',
        'item_count': len(products)
    }


def _get_fallback_products(budget: Optional[int] = None) -> List[Dict[str, Any]]:
    products = Product.objects.filter(is_active=True)[:6]
    
    result = []
    total = 0
    for prod in products:
        if budget and total + float(prod.price) > budget:
            break
        result.append({
            'id': prod.id,
            'name': prod.name,
            'price': str(prod.price),
            'category': prod.category.name,
        })
        total += float(prod.price)
    
    return result


def get_bundle_suggestions(budget: int, age_group: str = 'newborn') -> List[Dict[str, Any]]:
    suggestions = []
    
    for bundle_type in BUNDLE_TEMPLATES.keys():
        bundle = generate_bundle(bundle_type, budget=budget, age_group=age_group)
        if bundle.get('items'):
            suggestions.append(bundle)
    
    return suggestions
