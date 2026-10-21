
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-08-22 - Optimize N+1 query in AdminUserSerializer
**Learning:** AdminUserSerializer list view generates N+1 queries when using `Order.objects.filter(user=obj).count()` in serializer method field. This cannot be solved via `prefetch_related`.
**Action:** Annotate `Count('order')` onto the `queryset` inside `AdminUserViewSet.get_queryset()`. In the serializer, use `hasattr(obj, "annotated_total_orders")` to fetch the annotated field with a fallback.
