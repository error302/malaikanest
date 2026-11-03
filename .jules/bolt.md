
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-11-03 - N+1 query optimization via Subqueries
**Learning:** Aggregating over multiple independent reverse relations (`reviews` and `orderitem`) within a single `.annotate()` call creates multiple LEFT OUTER JOINs, resulting in an N x M Cartesian product blowup which can tank performance and skew aggregate calculations.
**Action:** Replace multiple aggregate annotations with correlated subqueries using `Subquery` and `.values("product").annotate(...)` instead of implicit joins.
