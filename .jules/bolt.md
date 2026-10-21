
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-21 - Optimize N+1 queries in Django serializers with Subquery
**Learning:** In Django serializers for list views, checking `.count()` on related objects (e.g. `Order.objects.filter(user=obj).count()`) causes an N+1 problem. Implicit JOINs from default ordering can cause subquery grouping bugs or multiple rows returned.
**Action:** Use a `Subquery` with `OuterRef` and `.order_by()`, wrapped in `Coalesce(..., 0)` in the ViewSet's `get_queryset`. In the serializer, check if the annotated attribute exists before defaulting back to `.count()`.
