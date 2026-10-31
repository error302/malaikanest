
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.

## 2026-11-21 - Optimize N+1 query in Product.available_stock / Product._variant_inventory_summary
**Learning:** `VariantInventory.objects.filter(variant__product=self).aggregate(...)` creates N+1 queries when accessed in a loop, even when variants and their inventory are prefetched using `prefetch_related("variants__inventory")`.
**Action:** When calculating aggregations on related objects (like inventory totals across variants), check for the presence of prefetched data (`hasattr(self, "_prefetched_objects_cache") and "variants" in self._prefetched_objects_cache`) and compute the aggregation in Python using the prefetched instances instead of executing a database `.aggregate()` call.
