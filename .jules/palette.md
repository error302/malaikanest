## 2025-10-25 - Prevent Accessibility Regression when translating strings
**Learning:** When modifying existing i18n translation keys in `frontend/src/lib/i18n.tsx` to add interpolation (e.g., adding `{name}`), create a new distinct key instead (e.g., `cart.removeItem` instead of modifying `cart.remove`) to avoid causing missing interpolation regressions in other UI components that use the original key.
**Action:** Add new translation strings instead of replacing existing ones when they need interpolation logic.
