
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-10-01 - Optimize N+1 queries for reverse relations in Django
**Learning:** When fetching counts for reverse relations (e.g., `Order.objects.filter(user=obj).count()`) in serializers used by list viewsets, an N+1 query problem occurs.
**Action:** Annotate the queryset in the ViewSet using `Count('<model_name>', distinct=True)` (if no related_name is explicitly set), and retrieve the annotated value in the serializer using `hasattr(obj, 'annotated_field_name')`.
