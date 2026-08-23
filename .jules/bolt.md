
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-08-23 - Optimize N+1 count queries in Django AdminUserViewSet
**Learning:** In Django serializers used by list views, calculating counts via `.filter().count()` on related models triggers an N+1 query problem. Using `.annotate(count_field=Count('relation'))` in the ViewSet's `get_queryset` method and conditionally fetching it in the serializer (using `hasattr`) resolves this efficiently.
**Action:** When adding counts to serializers for list endpoints, always annotate the count in the queryset and check for it in the serializer instead of running separate `.count()` queries for each instance.
