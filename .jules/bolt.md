## 2026-08-07 - Memoized ProductCard
**Learning:** React components rendered repeatedly in large lists, like ProductCard in a grid, are not memoized by default and can cause significant UI blocking or re-render churn during simple interactions in the parent.
**Action:** Identify highly-reused presentational list items and wrap them in React.memo(), keeping props minimal or primitives where possible to maximize cache hits.
