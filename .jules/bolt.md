
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-09-23 - Optimize N+1 queries in Django serializers for related counts
**Learning:** When generating counts of reverse related objects for list view serializers (e.g., total orders per user), avoiding N+1 queries requires both annotating the queryset in the viewset and checking for that annotation in the serializer using `hasattr`. If using Django's standard `RequestFactory` in tests for DRF viewsets, the test may fail with `AttributeError: 'WSGIRequest' object has no attribute 'query_params'`, so `rest_framework.test.APIClient` (with `HTTP_HOST` set if needed) or `APIRequestFactory` should be used instead.
**Action:** When adding counts to serializers used in list endpoints, always annotate the count in the viewset's `get_queryset` (e.g. `Count('order', distinct=True)`) and use `hasattr(obj, 'annotated_field')` in the serializer to retrieve it, falling back to `.count()` if missing to support reuse.
