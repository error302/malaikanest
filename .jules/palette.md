## 2024-05-24 - Contextual ARIA labels for list items
**Learning:** Concatenating translated string keys with symbols (e.g. `t('cart.remove') + ' -'`) creates terrible screen reader experiences and breaks in some languages. List action buttons (like remove or increase quantity) must use contextually specific labels (e.g., "Remove [item name]").
**Action:** Use the `t()` function's interpolation feature `t('key', { name: item.name })` for list action ARIA labels to ensure proper localization and screen reader context.
