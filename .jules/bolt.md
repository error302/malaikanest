
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-11-10 - Fix N+1 queries in AdminUserViewSet list queries
**Learning:** Returning `Order.objects.filter(user=obj).count()` in `SerializerMethodField` within `AdminUserSerializer` causes an N+1 problem on list endpoints.
**Action:** Use `Subquery` with `OuterRef` and `Count`, and handle nulls with `Coalesce` when annotating the count in the `get_queryset` of `AdminUserViewSet`. Retrieve it via `getattr(obj, "annotated_field", ...)` in the serializer to avoid N+1 queries while maintaining the same output structure.
