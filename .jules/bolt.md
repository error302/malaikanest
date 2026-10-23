
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-10-23 - Prevent N x M Cartesian Product Blowup with Subquery Annotations
**Learning:** Using Django's `.annotate()` with implicit joins (e.g. `Avg("reviews__rating")` and `Sum("orderitem__quantity")`) simultaneously creates multiple `LEFT OUTER JOIN`s. While techniques like `distinct=True` inside `Count` can fix row duplication for exact counts, multiple distinct table aggregations via Joins leads to a massive Cartesian product blowup. This increases query execution time drastically as dataset size grows.
**Action:** Always prefer `Subquery` with `OuterRef` wrapped in `Coalesce` when annotating multiple independent reverse relations to preserve SQL efficiency and execution speed.
