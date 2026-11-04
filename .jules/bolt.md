
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-11-04 - Fix Cartesian product blowup in Django annotates
**Learning:** In Django, aggregating over multiple independent reverse relations (e.g. `Avg('reviews__rating')` and `Sum('orderitem__quantity')`) within a single `.annotate()` call creates multiple `LEFT OUTER JOIN`s, resulting in an N x M Cartesian product blowup.
**Action:** Always use correlated `Subquery` annotations instead of implicit joins to prevent massive performance degradation and incorrect sums.
