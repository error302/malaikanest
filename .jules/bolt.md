
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-19 - Fix N+1 Query in Django Serializers by respecting Prefetch Cache
**Learning:** Using related query methods like `.filter(condition).first()` in a serializer method (e.g. `obj.images.filter(...)`) bypasses the `prefetch_related` cache if one exists, resulting in an N+1 query problem. Checking if `obj` has a `_prefetched_objects_cache` dictionary (and if the relation key is in it) allows fetching the data in memory without causing extra queries.
**Action:** When accessing related items in serializers, use `prefetch_related` on the ViewSet query and then check for `hasattr(obj, "_prefetched_objects_cache") and "relation_name" in obj._prefetched_objects_cache`. Use Python methods like `next((item for item in obj.relation_name.all() if condition), None)` instead of `.filter(condition).first()` if the data is already prefetched.
