from typing import Dict, Any, List
from apps.products.models import Product, Category
from .ollama_client import ollama_client


DESCRIPTION_SYSTEM_PROMPT = """You are a product description writer for a baby and children's clothing store in Kenya.

Write compelling, SEO-friendly product descriptions that:
- Highlight key features and benefits
- Use parent-friendly language
- Include relevant keywords for search
- Mention age appropriateness
- Consider Kenya's climate
- Are 50-150 words

Return JSON:
{"description": "your description here"}
"""


def generate_product_description(product: Product) -> str:
    prompt = f"""Write a product description for:
Name: {product.name}
Category: {product.category.name}
Existing description: {product.description or "None"}

Write a new, improved description."""

    try:
        result = ollama_client.chat_json(
            message=prompt, system_prompt=DESCRIPTION_SYSTEM_PROMPT
        )
        return result.get("description", "")
    except Exception as e:
        return f"Error generating description: {str(e)}"


def bulk_generate_descriptions(
    category_id: int = None, limit: int = 20
) -> Dict[str, Any]:
    products = Product.objects.filter(description="")
    if category_id:
        products = products.filter(category_id=category_id)

    products = list(products[:limit])

    results = {"success": 0, "failed": 0, "products": []}

    for product in products:
        try:
            new_description = generate_product_description(product)
            product.description = new_description
            product.save()
            results["success"] += 1
            results["products"].append(
                {
                    "id": product.id,
                    "name": product.name,
                    "description": new_description[:100] + "...",
                }
            )
        except Exception as e:
            results["failed"] += 1

    return results


SEO_SYSTEM_PROMPT = """You are an SEO expert for a Kenyan e-commerce store.

Generate SEO metadata for products:
- Meta title (max 60 chars)
- Meta description (max 160 chars)
- Search keywords
- Consider local search patterns in Kenya

Return JSON:
{
    "meta_title": "...",
    "meta_description": "...",
    "keywords": ["...", "..."]
}
"""


def generate_seo_metadata(product: Product) -> Dict[str, str]:
    prompt = f"""Generate SEO metadata for:
Name: {product.name}
Category: {product.category.name}
Current description: {product.description[:200] if product.description else "None"}"""

    try:
        result = ollama_client.chat_json(
            message=prompt, system_prompt=SEO_SYSTEM_PROMPT
        )
        return {
            "meta_title": result.get("meta_title", ""),
            "meta_description": result.get("meta_description", ""),
            "keywords": result.get("keywords", []),
        }
    except Exception as e:
        return {
            "meta_title": product.name,
            "meta_description": product.description[:160]
            if product.description
            else "",
            "keywords": [product.category.name.lower()],
        }


def suggest_tags(product: Product) -> List[str]:
    prompt = f"""Suggest tags for search/filters for:
Name: {product.name}
Category: {product.category.name}
Description: {product.description or "None"}

Return JSON with array of tags:
{"tags": ["tag1", "tag2", ...]}"""

    try:
        result = ollama_client.chat_json(
            message=prompt,
            system_prompt="You are a tagging expert. Suggest relevant tags.",
        )
        return result.get("tags", [])
    except Exception:
        return [product.category.name.lower()]


def generate_product_name(category: str, features: str) -> str:
    prompt = f"""Generate a catchy product name for:
Category: {category}
Features: {features}

Return JSON:
{"name": "product name here"}
"""
    try:
        result = ollama_client.chat_json(
            message=prompt,
            system_prompt="You are a product naming expert. Create attractive names.",
        )
        return result.get("name", "")
    except Exception as e:
        return ""


def optimize_existing_descriptions(quality_threshold: float = 0.5) -> Dict[str, Any]:
    products = Product.objects.filter(description__isnull=False).exclude(
        description=""
    )[:50]

    results = {"optimized": 0, "skipped": 0}

    for product in products:
        if len(product.description) < 50:
            new_desc = generate_product_description(product)
            product.description = new_desc
            product.save()
            results["optimized"] += 1
        else:
            results["skipped"] += 1

    return results
