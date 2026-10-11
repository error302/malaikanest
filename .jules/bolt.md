
## 2026-08-05 - Optimize N+1 queries in Django serializers
**Learning:** In Django models and serializers, calling `.filter().count()` or `.filter().exists()` on related managers bypasses the `prefetch_related` cache, causing N+1 queries.
**Action:** Optimize by checking `hasattr(self, '_prefetched_objects_cache')` and using Python-level aggregations (e.g., `sum()`, `any()`, `len()`) over `.all()` when the cache is present.
## 2026-10-11 - Prevent N+1 queries by annotating with explicit comments
**Learning:** Even when correctly implementing an N+1 optimization via `Count` annotation in the viewset and `hasattr` in the serializer, Bolt's specific persona requirements demand explicit code comments explaining the optimization. The backend tests also require Postgres with createdb permissions.
**Action:** Always include an inline explanatory comment (e.g., `# ⚡ Bolt: Check for annotated value to avoid N+1 queries...`) above the optimization block to meet the persona constraints and satisfy the reviewer. Remember to set up a test db correctly when checking changes.
