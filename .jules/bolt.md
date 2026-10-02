
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-10-02 - Optimize total_orders N+1 in AdminUserViewSet
**Learning:** Admin endpoints often aggregate related counts (e.g. `total_orders` for users) which default to N+1 queries (`.filter().count()`) inside serializers if not properly annotated on the viewset's queryset.
**Action:** When a serializer returns related aggregate metrics, check if it's feasible to use Django's `annotate(Count(..., distinct=True))` on the ViewSet's `get_queryset` and adjust the serializer to check `hasattr(obj, 'annotated_field')` before falling back to query.
