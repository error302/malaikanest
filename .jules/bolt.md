
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-09-11 - Optimize N+1 queries in AdminUserViewSet
**Learning:** The `AdminUserViewSet` was suffering from an N+1 query issue when rendering `total_orders`. `AdminUserSerializer.get_total_orders` was making an explicit `Order.objects.filter(user=obj).count()` call for each user in the paginated response.
**Action:** Optimize by annotating the viewset's queryset with `total_orders_count = Count('order', distinct=True)` and updating the serializer to check `hasattr(obj, 'total_orders_count')`.
