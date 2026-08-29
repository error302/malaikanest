
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-08-05 - Optimize N+1 queries for product images
**Learning:** Calling `.filter(is_primary=True).first()` on a related manager like `obj.images` bypasses the `prefetch_related` cache and causes N+1 queries, similar to `.count()`.
**Action:** Always check `hasattr(obj, '_prefetched_objects_cache')` and iterate using Python (e.g., `next((img for img in images if img.is_primary), None)`) when the relation is prefetched.
