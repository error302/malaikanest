from typing import List, Dict, Any, Optional
import numpy as np
from django.db.models import QuerySet
from apps.products.models import Product
from .ollama_client import ollama_client


DIMENSION = 1536


def get_text_for_embedding(product: Product) -> str:
    text = f"{product.name}. {product.description or ''}. Category: {product.category.name}"
    return text


def generate_product_embedding(product: Product) -> List[float]:
    text = get_text_for_embedding(product)
    return ollama_client.get_embedding(text)


def generate_all_embeddings(limit: int = None) -> Dict[int, List[float]]:
    queryset = Product.objects.filter(is_active=True)
    if limit:
        queryset = queryset[:limit]

    products = list(queryset)
    texts = [get_text_for_embedding(p) for p in products]

    if not texts:
        return {}

    embeddings = ollama_client.batch_embeddings(texts)
    return {p.id: emb for p, emb in zip(products, embeddings)}


def cosine_similarity(a: List[float], b: List[float]) -> float:
    a = np.array(a)
    b = np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def search_similar_products(
    query: str, limit: int = 10, exclude_ids: List[int] = None
) -> List[Dict[str, Any]]:
    query_embedding = ollama_client.get_embedding(query)

    products = Product.objects.filter(is_active=True)
    if exclude_ids:
        products = products.exclude(id__in=exclude_ids)

    products = list(products.select_related("category"))

    if not products:
        return []

    texts = [get_text_for_embedding(p) for p in products]
    embeddings = ollama_client.batch_embeddings(texts)

    similarities = []
    for product, embedding in zip(products, embeddings):
        sim = cosine_similarity(query_embedding, embedding)
        similarities.append(
            {
                "id": product.id,
                "name": product.name,
                "slug": product.slug,
                "price": str(product.price),
                "category": product.category.name,
                "image": product.image.url if product.image else None,
                "similarity": sim,
            }
        )

    similarities.sort(key=lambda x: x["similarity"], reverse=True)
    return similarities[:limit]


def index_all_products(limit: int = None) -> int:
    embeddings_data = generate_all_embeddings(limit)

    from apps.ai.models import ProductEmbedding

    count = 0
    for product_id, embedding in embeddings_data.items():
        embedding_str = ",".join(map(str, embedding))
        ProductEmbedding.objects.update_or_create(
            product_id=product_id, defaults={"embedding": embedding_str}
        )
        count += 1

    return count
