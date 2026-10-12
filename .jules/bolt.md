
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-12 - Prevent N+1 queries in Django serializers safely with Subqueries
**Learning:** When trying to resolve an N+1 query in a list view serializer (e.g., calling `.count()` on a related object for each item), annotating the ViewSet's queryset with a standard `Count()` aggregate can break the DRF paginator's `.count()` functionality by causing a slow, full table scan with `GROUP BY`. Additionally, guessing default related names for `Count()` (like `order` instead of `order_set`) can cause a `FieldError`.
**Action:** Always resolve related count N+1s by annotating the queryset with a `Subquery` using `OuterRef`. Example: `Subquery(RelatedModel.objects.filter(parent=OuterRef('pk')).values('parent').annotate(count=Count('pk')).values('count')[:1], output_field=IntegerField())`. Then, check for this annotation in the serializer using `hasattr`. This is safe for pagination and avoids related name issues.
