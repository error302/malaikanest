
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-09-03 - N+1 optimization with annotated counts needs distinct=True
**Learning:** When using `Count()` in Django to annotate a queryset that might have other joins, it can result in duplicate rows being counted multiple times, leading to inflated counts.
**Action:** Always use `Count("model", distinct=True)` instead of `Count("model")` to ensure accurate counts and prevent over-counting bugs when using annotations to solve N+1 queries.
