
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-09-04 - Optimize N+1 queries in Django serializers using reverse relations
**Learning:** When annotating a reverse relation without an explicit `related_name`, use the lowercase model name and `distinct=True` (e.g., `Count('order', distinct=True)`), NOT the default manager name (e.g., `Count('order_set')`), as the `_set` suffix will cause a `FieldError`. Always use `distinct=True` to prevent duplicate counts from joins.
**Action:** When fixing N+1 queries for reverse relations in Django serializers, check the model definition for `related_name`. If absent, annotate the viewset's queryset with `Count('<model_name_lowercase>', distinct=True)` and check for `hasattr(obj, 'annotated_field')` in the serializer.
