
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-10-22 - Optimize VariantInventory aggregations safely
**Learning:** Checking for `variants` in `_prefetched_objects_cache` is not enough to avoid N+1 queries if the nested relationship `variant.inventory` is evaluated without being cached. Accessing `variant.inventory` when uncached triggers a query.
**Action:** Always check the `_state.fields_cache` on the individual objects for nested `select_related`/`prefetch_related` fields (e.g. `hasattr(variant._state, 'fields_cache') and 'inventory' in variant._state.fields_cache`) before safely evaluating the property in Python, and provide a fallback to prevent accidentally triggering queries in a loop.
