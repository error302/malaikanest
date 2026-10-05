
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-05 - Optimize N+1 queries for users list in AdminUserViewSet
**Learning:** In Django serializers for list views, querying related managers (like `Order.objects.filter(user=obj).count()`) inside SerializerMethodFields causes an N+1 query problem. This could be solved by annotating the parent queryset in the viewset with the count (e.g. `annotated_total_orders=Count('order', distinct=True)`).
**Action:** When serializing objects that include the count of a related model, always annotate the count in the `get_queryset` method and check for the annotated field in the serializer (`if hasattr(obj, 'annotated_total_orders')`) instead of performing the count query directly in the serializer method.
