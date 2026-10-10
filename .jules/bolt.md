
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-10 - [Optimize N+1 query on AdminUserViewSet]
**Learning:** Found an N+1 query issue in `AdminUserViewSet` where computing `total_orders` resulted in an extra query for every user.
**Action:** When returning list structures that aggregate related data, use `.annotate(field=Count("related", distinct=True))` in the viewset and verify its existence with `hasattr()` in the serializer to gracefully fall back on single lookups where needed.
