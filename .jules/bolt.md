
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-08-16 - Optimize N+1 queries in ViewSets via Annotate
**Learning:** When counting related objects in a serializer (e.g., `Order.objects.filter(user=obj).count()`), it executes a query for each object in the list view, resulting in N+1 queries.
**Action:** Add an annotation in the ViewSet's `get_queryset` method (e.g., `.annotate(total_orders_count=Count('order'))`) and modify the serializer to use the annotated field (e.g., `hasattr(obj, 'total_orders_count')`) to prevent N+1 queries.
