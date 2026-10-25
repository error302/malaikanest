
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-10-25 - Avoid N+1 queries in Django ListSerializer using Subquery and OuterRef
**Learning:** In Django DRF serializers, executing `.count()` on related models inside a `SerializerMethodField` triggers an N+1 query problem, as it queries the DB for each item in the list endpoint.
**Action:** Use `.annotate()` with `Coalesce(Subquery(RelatedModel.objects.filter(parent=OuterRef("pk")).order_by().values("parent").annotate(count=Count("pk")).values("count")[:1]), 0)` on the ViewSet's `get_queryset()` to fetch the count in a single query, and check for `hasattr(obj, "annotated_field")` in the serializer.
