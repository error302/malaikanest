"""
Redis Caching Layer for E-commerce API
Caches public product/category data to improve performance.
"""
import os
import json
import hashlib
from typing import Any, Optional, Callable
from functools import wraps

import redis
from django.conf import settings
from django.core.cache import cache


# Cache TTL constants (in seconds)
TTL_PRODUCTS_LIST = 60 * 10      # 10 minutes
TTL_PRODUCT_DETAIL = 60 * 30      # 30 minutes
TTL_CATEGORIES = 60 * 60          # 1 hour
TTL_BANNERS = 60 * 15             # 15 minutes
TTL_HOME_PAGE = 60 * 5            # 5 minutes


def get_redis_client():
    """Get Redis client from Django settings or environment."""
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    try:
        return redis.from_url(redis_url, decode_responses=True)
    except Exception:
        return None


_redis_client = None


def get_redis():
    """Lazy initialization of Redis client."""
    global _redis_client
    if _redis_client is None:
        _redis_client = get_redis_client()
    return _redis_client


def _make_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a consistent cache key."""
    key_parts = [prefix]
    key_parts.extend(str(arg) for arg in args)
    if kwargs:
        sorted_kwargs = sorted(kwargs.items())
        kwargs_str = json.dumps(sorted_kwargs, sort_keys=True)
        kwargs_hash = hashlib.md5(kwargs_str.encode()).hexdigest()[:8]
        key_parts.append(kwargs_hash)
    return ':'.join(key_parts)


def cache_key_products_list(page: int = 1, per_page: int = 20, category: str = None, search: str = None) -> str:
    """Generate cache key for products list."""
    return _make_cache_key('products', 'list', page, per_page, category=category, search=search)


def cache_key_product_detail(slug: str) -> str:
    """Generate cache key for product detail."""
    return _make_cache_key('products', 'detail', slug)


def cache_key_categories() -> str:
    """Generate cache key for categories list."""
    return 'categories:list:all'


def cache_key_banners() -> str:
    """Generate cache key for banners."""
    return 'banners:list:active'


def cache_key_homepage() -> str:
    """Generate cache key for homepage data."""
    return 'homepage:data'


class CacheService:
    """High-level caching service with fallback to Django cache."""
    
    def __init__(self):
        self.redis = get_redis()
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache."""
        if self.redis:
            try:
                value = self.redis.get(key)
                if value:
                    return json.loads(value)
            except Exception:
                pass
        
        # Fallback to Django cache
        return cache.get(key)
    
    def set(self, key: str, value: Any, ttl: int = 300) -> bool:
        """Set value in cache with TTL."""
        serialized = json.dumps(value)
        
        if self.redis:
            try:
                self.redis.setex(key, ttl, serialized)
                return True
            except Exception:
                pass
        
        # Fallback to Django cache
        cache.set(key, value, ttl)
        return True
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if self.redis:
            try:
                self.redis.delete(key)
            except Exception:
                pass
        
        cache.delete(key)
        return True
    
    def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern."""
        count = 0
        if self.redis:
            try:
                keys = self.redis.keys(pattern)
                if keys:
                    count = self.redis.delete(*keys)
            except Exception:
                pass
        return count


# Singleton instance
cache_service = CacheService()


def cached(ttl: int = 300, key_func: Callable = None):
    """
    Decorator to cache function results.
    
    Usage:
        @cached(ttl=600, key_func=lambda self, slug: f'product:{slug}')
        def get_product(self, slug):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_func:
                cache_key = key_func(*args, **kwargs)
            else:
                # Default key based on function name and args
                cache_key = _make_cache_key(func.__name__, *args, **kwargs)
            
            # Try to get from cache
            cached_value = cache_service.get(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_service.set(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator


def invalidate_products():
    """Invalidate all product-related caches."""
    cache_service.delete_pattern('products:*')
    cache_service.delete(cache_key_homepage())


def invalidate_categories():
    """Invalidate category caches."""
    cache_service.delete(cache_key_categories())


def invalidate_banners():
    """Invalidate banner caches."""
    cache_service.delete(cache_key_banners())


def invalidate_homepage():
    """Invalidate homepage cache."""
    cache_service.delete(cache_key_homepage())


# Cache invalidation signals for model changes
def setup_cache_signals():
    """Setup Django signals to auto-invalidate cache on model changes."""
    from django.db.models import signals
    from apps.products.models import Product, Category, Banner
    
    def invalidate_on_save(sender, instance, **kwargs):
        if sender == Product:
            invalidate_products()
        elif sender == Category:
            invalidate_categories()
        elif sender == Banner:
            invalidate_banners()
    
    def invalidate_on_delete(sender, instance, **kwargs):
        if sender == Product:
            invalidate_products()
        elif sender == Category:
            invalidate_categories()
        elif sender == Banner:
            invalidate_banners()
    
    signals.post_save.connect(invalidate_on_save, sender=Product)
    signals.post_save.connect(invalidate_on_save, sender=Category)
    signals.post_save.connect(invalidate_on_save, sender=Banner)
    signals.post_delete.connect(invalidate_on_delete, sender=Product)
    signals.post_delete.connect(invalidate_on_delete, sender=Category)
    signals.post_delete.connect(invalidate_on_delete, sender=Banner)
