
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-11-05 - Avoid implicit JOINs causing Cartesian Product blowups in Django annotations
**Learning:** In Django, aggregating over multiple independent reverse relations (like `Avg('reviews__rating')` and `Sum('orderitem__quantity')`) in a single `.annotate()` call generates multiple `LEFT OUTER JOIN`s, resulting in an N x M Cartesian product blowup which affects correctness and massive performance degradation.
**Action:** Use correlated `Subquery` annotations coupled with `OuterRef` and wrapped in `Coalesce` instead of passing relational fields directly to aggregations. Ensure the subquery utilizes `.order_by()` to clear default ordering that could break grouping.
