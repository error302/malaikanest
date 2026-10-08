
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-08 - Use `annotate` for optimized counting in Serializers
**Learning:** In Django REST Framework serializers, using `Model.objects.filter(related=obj).count()` inside a `SerializerMethodField` triggers an N+1 query pattern on list views.
**Action:** Optimize by appending `.annotate(annotated_field=Count('related', distinct=True))` to the ViewSet's `get_queryset()` method, and checking `hasattr(obj, 'annotated_field')` within the serializer's method field to use the cached value.
