
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-09-15 - Optimize N+1 queries in AdminUserViewSet
**Learning:** In Django viewsets that use serializers accessing reverse relations (like `Order.objects.filter(user=obj).count()`), it creates an N+1 query problem. Also, when annotating a reverse relation without an explicit `related_name`, you must use the lowercase model name (e.g., `Count('order', distinct=True)`), NOT the default manager name (e.g., `Count('order_set')`).
**Action:** Optimize by annotating the count in the viewset's `get_queryset` with `distinct=True` and modifying the serializer to check for this annotated attribute (e.g., `hasattr(obj, 'total_orders_annotated')`).
