
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-11-20 - Optimizing get_total_orders with database annotations
**Learning:** Calling `Order.objects.filter(user=obj).count()` in a serializer property (`get_total_orders`) generates an N+1 query issue for list views like `AdminUserViewSet`. Pre-fetching related objects isn't sufficient for aggregations.
**Action:** Use `annotate(total_orders_count=Count('order'))` on the ViewSet queryset and consume it in the serializer using `getattr(obj, "total_orders_count", obj.order_set.count())` to eliminate the N+1 queries.
