
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-10-28 - Optimize NxM Cartesian product and N+1 images queries in Django views and serializers
**Learning:** In Django, aggregating over multiple independent reverse relations (e.g., `Avg('reviews__rating')` and `Sum('orderitem__quantity')`) within a single `.annotate()` call creates multiple `LEFT OUTER JOIN`s, resulting in an N x M Cartesian product blowup. Furthermore, `.first()` inside a serializer bypasses the `prefetch_related` cache.
**Action:** Optimize by replacing the `Avg`, `Count`, and `Sum` annotations with correlated `Subquery` annotations. In the serializer, check `hasattr(obj, '_prefetched_objects_cache')` and use Python-level iteration to find the first matching item when the cache is present.
