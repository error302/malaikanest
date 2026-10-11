## 2023-10-24 - Screen Reader Accessibility in Lists with Identical Actions
**Learning:** For lists containing identical action buttons (e.g., "Remove" items in a cart), using simple string concatenation for `aria-label`s (like `t('cart.remove') + ' -'`) can lead to confusing or unhelpful screen reader output.
**Action:** Utilize the translation engine's interpolation feature (e.g., `t('cart.removeItem', { name: item.name })`) to provide complete, context-specific descriptions rather than raw string concatenation.
