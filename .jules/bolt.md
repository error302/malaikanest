
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-10-03 - Optimize N+1 query in AdminUserViewSet
**Learning:** In Django DRF, serializers that iterate over a list of objects and access related counts (e.g. `Order.objects.filter(user=obj).count()`) will cause N+1 queries. Adding an annotation to the viewset `get_queryset` with `Count('related_model', distinct=True)` allows the serializer to retrieve the pre-calculated count (`hasattr(obj, 'annotated_count')`) and reduce O(N) queries to O(1).
**Action:** When creating DRF serializers that fetch counts for a list view, check if the value is annotated on the object first, and fallback to `filter().count()` if it isn't. Remember to use `distinct=True` inside `Count` when annotating to avoid inflated counts when other JOINs are added.
