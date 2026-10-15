
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-15 - Optimize total_orders N+1 query in AdminUserViewSet
**Learning:** When annotating a count using `Subquery` to prevent an N+1 query for a related object like `Order`, Django's automatic model ordering (e.g., `ordering = ["-created_at"]`) can silently corrupt the subquery grouping clause, causing it to return a count of `1` instead of the actual aggregate sum, because it attempts to GROUP BY individual rows.
**Action:** Always inject an empty `.order_by()` into the subquery filter chain *before* applying `.values()` and `.annotate()` to strip out default ordering (e.g., `Subquery(RelatedModel.objects.filter(parent=OuterRef('pk')).order_by().values('parent').annotate(count=Count('pk')).values('count')[:1])`).
