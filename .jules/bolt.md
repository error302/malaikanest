
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-09-27 - Optimize AdminUserSerializer N+1 Orders Query
**Learning:** In Django DRF Serializers, methods doing queries like `Order.objects.filter(user=obj).count()` create a classic N+1 query problem because they execute a separate database query for every item serialized. Furthermore, annotating reverse relations in Django requires knowing the related name. If no `related_name` is explicitly set, use the lowercase model name (e.g. `order`), NOT the default manager name (e.g. `order_set`), otherwise Django will raise a `FieldError`.
**Action:** Optimize list serializers by annotating the base viewset's queryset (e.g., `.annotate(total_orders_annotated=Count('order', distinct=True))`) and checking for that attribute in the serializer method (`hasattr(obj, 'total_orders_annotated')`). Always use `distinct=True` when counting across joins.
