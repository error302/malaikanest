## 2024-06-25 - Avoid String Concatenation for Action Labels
**Learning:** Concatenating strings with translations (e.g. `t('cart.remove') + ' -'`) creates non-descriptive and potentially poorly localized labels for screen readers. Using variables and interpolation is much cleaner.
**Action:** Use translation variables (e.g. `{name}`) inside translation strings to interpolate values (e.g., `t('cart.decreaseQty', { name: item.name })`) for better context in action buttons.
