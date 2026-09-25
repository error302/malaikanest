
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-08-05 - Avoid N+1 queries when ordering/filtering prefetched relations
**Learning:** In Django serializers, operations like `.order_by()` and `.filter().first()` on related managers bypass the `prefetch_related` cache and trigger N+1 database queries. `_prefetched_objects_cache` is a dictionary, so check `"related_name" in obj._prefetched_objects_cache` instead of just `hasattr`.
**Action:** Optimize by checking `hasattr(obj, "_prefetched_objects_cache") and "<related_name>" in obj._prefetched_objects_cache` and using Python-level equivalents (e.g., in-memory sorting `list(obj.related.all()).sort()` or `next((item for item in obj.related.all() if item.condition), default)`) when the cache is present.
