
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2024-03-21 - Optimize N+1 product list aggregations
**Learning:** In Django backend, aggregating over multiple independent reverse relations (like `Avg('reviews__rating')` and `Sum('orderitem__quantity')`) in a single `.annotate()` call causes an N x M Cartesian product blowup (row duplication) because it creates multiple `LEFT OUTER JOIN`s. Using `Subquery` annotations instead avoids the join-based blowup and provides massive performance improvement.
**Action:** Always use correlated `Subquery` with `OuterRef` and `order_by().values('rel_field').annotate(...)` inside `Coalesce` when aggregating multiple independent reverse relationships.
