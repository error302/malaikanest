from typing import Dict, Any, List, Optional
from django.db.models import QuerySet
from apps.products.models import Product, Category
from .ollama_client import ollama_client


SYSTEM_PROMPT = """You are Malaika Nest's AI Shopping Assistant, a helpful and friendly expert in baby and children's products for the Kenyan market.

Your role is to:
1. Understand what the customer needs
2. Recommend appropriate products from the catalog
3. Consider age group, gender, climate (Kenya), and budget
4. Be conversational but concise
5. Always be honest about product availability

When making recommendations:
- Ask clarifying questions if needed
- Consider Kenya's climate (usually warm, but can be cool in highlands)
- Factor in age appropriateness
- Keep responses friendly and helpful

Never:
- Make up products that don't exist
- Discuss pricing specifics (direct to product pages)
- Handle payments or orders directly

Respond in JSON format with these fields:
{
    "intent": "shopping|search|support|general",
    "response": "Your friendly response to the customer",
    "filters": {
        "categories": ["category names"],
        "age_group": "0-3 months|3-6 months|6-12 months|1-3 years|3-5 years|5+ years",
        "gender": "boy|girl|unisex"
    },
    "suggested_products": ["product names if any"],
    "needs_more_info": true/false
}
"""


def get_product_context(limit: int = 50) -> str:
    products = Product.objects.filter(is_active=True).select_related("category")[:limit]
    categories = Category.objects.all()

    context = "Available Categories:\n"
    for cat in categories:
        context += f"- {cat.name}\n"

    context += "\nProduct Catalog:\n"
    for product in products:
        context += f"- {product.name} ({product.category.name}) - KES {product.price}\n"
        if product.description:
            context += f"  Description: {product.description[:100]}...\n"

    return context


def chat(message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
    context = get_product_context()

    full_prompt = f"""Product Catalog:
{context}

Customer message: {message}

Provide your recommendation in JSON format."""

    try:
        result = ollama_client.chat_json(
            message=full_prompt, system_prompt=SYSTEM_PROMPT
        )
        return result
    except Exception as e:
        return {
            "intent": "error",
            "response": "I'm sorry, I'm having right trouble understanding now. Please try again.",
            "error": str(e),
        }


def get_filtered_products(filters: Dict[str, Any]) -> QuerySet:
    products = Product.objects.filter(is_active=True).select_related("category")

    if filters.get("categories"):
        products = products.filter(category__name__in=filters["categories"])

    if filters.get("age_group"):
        age_map = {
            "0-3 months": "newborn",
            "3-6 months": "3-6m",
            "6-12 months": "6-12m",
            "1-3 years": "1-3y",
            "3-5 years": "3-5y",
            "5+ years": "5y+",
        }

    return products


def process_message(message: str, session_id: Optional[str] = None) -> Dict[str, Any]:
    ai_response = chat(message, session_id)

    products = []
    if ai_response.get("filters"):
        filtered = get_filtered_products(ai_response["filters"])
        products = list(
            filtered.values("id", "name", "price", "category__name", "slug")[:10]
        )

    return {
        "ai_response": ai_response.get("response", ""),
        "intent": ai_response.get("intent", "general"),
        "products": products,
        "filters_applied": ai_response.get("filters", {}),
    }
