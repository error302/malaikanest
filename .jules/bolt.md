
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-08-19 - N+1 query annotation reverse relation naming
**Learning:** When annotating a reverse relation count on a queryset using Django's `Count` without an explicitly defined `related_name`, you must use the lowercase model name (e.g., `Count('order')`), NOT the default manager name (e.g., `Count('order_set')`). Using the `_set` suffix inside an annotation will raise a `FieldError`.
**Action:** When fixing N+1 queries by annotating reverse relationships in ViewSets, double check the exact query name required by `Count()`.
