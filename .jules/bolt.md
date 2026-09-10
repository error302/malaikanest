
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-09-10 - Patch correctly using sed or inline python scripts
**Learning:** When writing an inline python script to patch a file in the bash session, I must make sure that the `target` string is extremely specific to the class or function being patched, to avoid accidentally applying changes to identical code lines elsewhere in the file (e.g. `queryset = super().get_queryset()`).
**Action:** Always include surrounding class/method definitions in replacement scripts for safety.
