"""
apps/core/cache.py

Production-grade Redis caching utilities for the Malaika Nest backend.

Cache TTLs:
  - Product list:       300  seconds (5 min)
  - Product detail:     300  seconds (5 min)
  - Category list:      1800 seconds (30 min)
  - Featured products:  300  seconds (5 min)
  - Banners:            600  seconds (10 min)

Cache keys are namespaced so invalidation is surgical (no full-cache flush).

NEVER cache user-specific data: carts, orders, authentication, checkout.
"""
import hashlib
import json
import logging
from functools import wraps

from django.core.cache import cache

logger = logging.getLogger("apps.core")

# ─── TTL constants ─────────────────────────────────────────────────────────────
PRODUCT_LIST_TTL = 300
PRODUCT_DETAIL_TTL = 300
CATEGORY_LIST_TTL = 1800
FEATURED_TTL = 300
BANNER_TTL = 600

# ─── Key builders ──────────────────────────────────────────────────────────────

def _make_key(prefix: str, *parts) -> str:
    """Build a cache key from a prefix and variable parts."""
    raw = ":".join(str(p) for p in parts)
    return f"malaika:{prefix}:{raw}"


def product_list_key(params: dict) -> str:
    """Unique cache key for a paginated + filtered product list request."""
    serialized = json.dumps(params, sort_keys=True)
    digest = hashlib.md5(serialized.encode()).hexdigest()[:12]
    return _make_key("products:list", digest)


def product_detail_key(slug: str) -> str:
    return _make_key("products:detail", slug)


def category_list_key() -> str:
    return _make_key("categories", "all")


def featured_products_key() -> str:
    return _make_key("products", "featured")


def banner_list_key() -> str:
    return _make_key("banners", "all")


# ─── Helpers ───────────────────────────────────────────────────────────────────

def cache_get(key: str):
    """Return cached value or None."""
    try:
        return cache.get(key)
    except Exception as exc:
        logger.warning("Cache GET failed for key %s: %s", key, exc)
        return None


def cache_set(key: str, value, ttl: int):
    """Set a cache value, swallowing errors so a Redis outage never breaks the API."""
    try:
        cache.set(key, value, timeout=ttl)
    except Exception as exc:
        logger.warning("Cache SET failed for key %s: %s", key, exc)


def cache_delete(key: str):
    """Delete a single cache key."""
    try:
        cache.delete(key)
    except Exception as exc:
        logger.warning("Cache DELETE failed for key %s: %s", key, exc)


def cache_delete_pattern(pattern: str):
    """
    Delete all keys matching a pattern (requires django-redis).
    Falls back gracefully if the backend doesn't support delete_pattern.
    """
    try:
        if hasattr(cache, "delete_pattern"):
            cache.delete_pattern(pattern)
        else:
            logger.info("Cache backend does not support delete_pattern; skipping pattern %s", pattern)
    except Exception as exc:
        logger.warning("Cache DELETE PATTERN failed for %s: %s", pattern, exc)


# ─── Invalidation helpers ──────────────────────────────────────────────────────

def invalidate_product_cache(slug: str = None):
    """
    Called after admin creates/updates/deletes a product.
    Clears product list caches (all variants) and the specific product detail.
    """
    cache_delete_pattern("malaika:products:list:*")
    cache_delete(featured_products_key())
    if slug:
        cache_delete(product_detail_key(slug))
    logger.info("Product cache invalidated (slug=%s)", slug)


def invalidate_category_cache():
    """Called after admin creates/updates/deletes a category."""
    cache_delete(category_list_key())
    cache_delete_pattern("malaika:products:list:*")
    logger.info("Category cache invalidated")


def invalidate_banner_cache():
    """Called after admin creates/updates/deletes a banner."""
    cache_delete(banner_list_key())
    logger.info("Banner cache invalidated")
