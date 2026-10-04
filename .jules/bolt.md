
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-04 - Eliminate N+1 Queries in AdminUserViewSet
**Learning:** Returning counts of related objects (like total_orders) on large list endpoints without query annotation causes N+1 queries. When attempting to use `.annotate()` with a reverse relation without an explicit `related_name`, using the default manager name (e.g., `Count('order_set')`) will cause a `FieldError`.
**Action:** When counting related objects for a list endpoint, use `.annotate()` in the view's `get_queryset`. Crucially, use the lowercase model name (e.g., `Count('order', distinct=True)`) when a reverse relation lacks a custom `related_name`. Always use `distinct=True` to prevent duplicate counts from joins.
