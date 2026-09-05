
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-09-05 - Avoid `.order_by()` on prefetched related managers
**Learning:** In Django serializers, using `.order_by()` on a related manager (like `obj.children.all().order_by("name")`) bypasses the `prefetch_related` cache and issues an N+1 query.
**Action:** When working with related collections that may be prefetched, check `_prefetched_objects_cache` and perform sorting in-memory in Python (e.g., `list().sort(key=...)`) instead of relying on database-level `.order_by()`.
