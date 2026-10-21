
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-08-10 - Avoid N+1 queries when evaluating images in Django Serializers
**Learning:** In Django serializers, calling `.filter(is_primary=True)` on the `images` related manager bypasses the `prefetch_related` cache for images, causing an N+1 query issue for every product loaded.
**Action:** Always verify if `_prefetched_objects_cache` contains the related objects ("images" in this case), and if so, perform the filtering in Python by iterating through `.all()` to avoid database hits.
