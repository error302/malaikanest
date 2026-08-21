
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-08-21 - Optimize AdminUserViewSet count
**Learning:** When adding annotations like Count('order') to viewset querysets to fix N+1 queries, ensure it's not applied in parent viewsets unintentionally. The annotation must use the lowercase model name (e.g., 'order') instead of default related names ('order_set') due to internal reverse relations. Also check if the attribute exists in serializers instead of assuming it's available.
**Action:** Safely use hasattr in serializers and use precise model names for annotations.
