
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-11-09 - AdminUserViewSet N+1 Query Optimization
**Learning:** Returning a large queryset with `.count()` computations on related fields inside DRF serializers causes massive N+1 queries. Using a `Subquery` with `OuterRef` combined with `Coalesce` avoids implicit JOIN issues and correctly handles empty sets, bringing queries down to O(1).
**Action:** Always check `get_queryset()` in list views to precalculate counts for serializer method fields. Apply `.annotate(total_count=Coalesce(Subquery(RelatedModel.objects.filter(fk=OuterRef('pk')).order_by().values('fk').annotate(count=Count('pk')).values('count')[:1]), 0, output_field=IntegerField()))`.
