## 2026-10-16 - Avoid string concatenation for list item ARIA labels
**Learning:** For lists containing identical action buttons (e.g., 'Remove', '+', '-' in a cart), using string concatenation with translated keys (e.g., `t('key') + ' -'`) creates poor screen reader experiences.
**Action:** Ensure each button has a specific `aria-label` detailing the target item by utilizing the translation engine's interpolation feature (e.g., `t('cart.removeItem', { name: item.name })`) rather than raw string concatenation.
