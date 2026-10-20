
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-20 - Avoid N+1 queries in Django serializers using Annotated Count
**Learning:** In Django serializers with nested queries like `Order.objects.filter(user=obj).count()`, replacing it with an annotated Subquery in the ViewSet `get_queryset` reduces N+1 queries drastically. Specifically, `hasattr(obj, 'annotated_field')` allows serializers to fall back to regular counts if annotation is missing while using the optimized Subquery count when properly prepared in `get_queryset`.
**Action:** Always prefer annotating counts on the parent queryset using `Subquery` and `OuterRef` in `get_queryset`, then checking `hasattr(obj, 'field_name')` inside `SerializerMethodField`s.
