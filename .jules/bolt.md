
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-08-24 - Optimize N+1 queries in Django serializers using annotation
**Learning:** In Django viewsets that list items with a related object count (like `Order` count per `User`), using `Order.objects.filter(user=obj).count()` in a `SerializerMethodField` triggers a separate query for each item in the list, causing an N+1 scaling issue.
**Action:** Optimize by annotating the count directly in the viewset's `get_queryset` via `Count('order', distinct=True)`, and defensively retrieve it in the serializer using `getattr(obj, 'annotated_order_count')` or `hasattr` to safely fallback. Be careful with reverse relationship names when annotating (use lowercase model name, not `_set`).
