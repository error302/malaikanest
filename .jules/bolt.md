
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-11-11 - Resolve N+1 issues in Django serializers using correlated subqueries
**Learning:** Calling `.count()` on related managers in DRF serializers (e.g. `Order.objects.filter(user=obj).count()`) evaluates a new query for every item when listing instances. Even using `.annotate(count=Count('orders'))` in `get_queryset()` can lead to database issues like Cartesian products if not careful.
**Action:** Use a correlated `Subquery` with `OuterRef`, explicitly wrapped in `Coalesce` and combined with a `Count` on the related query directly before using it in the main annotation. In the serializer, first check for `hasattr(obj, 'annotated_total_orders')` before falling back to the database query.
