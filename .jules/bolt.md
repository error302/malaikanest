
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-10-24 - Prevent Cartesian Product Blowup in Annotations
**Learning:** In Django, annotating over multiple independent reverse relations (like `Avg('reviews__rating')` and `Sum('orderitem__quantity')`) in a single `.annotate()` call generates multiple `LEFT OUTER JOIN`s. This causes an N x M Cartesian product blowup in SQL, ruining query performance and returning drastically inflated sum aggregates.
**Action:** Always replace these with correlated `Subquery` annotations, wrapping them in `Coalesce` to safely handle missing relations without blowing up the data rows.
