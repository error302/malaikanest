
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-09-19 - Optimize N+1 queries by sorting prefetched objects in Python
**Learning:** Calling `.order_by("name")` on a related manager like `obj.children.all()` within a serializer bypasses the `prefetch_related` cache and causes N+1 queries.
**Action:** When a related manager needs ordering, check if the objects are already prefetched (e.g., `hasattr(obj, "_prefetched_objects_cache")`). If they are, sort the prefetched objects in memory using Python's `.sort()` rather than letting Django execute a new database query.
