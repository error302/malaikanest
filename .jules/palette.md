## 2024-10-20 - Contextual ARIA labels for "Remove" actions
**Learning:** Generic destructive buttons like "Remove" lack context for screen readers when there are multiple identical items (like in a cart). Using the project's i18n interpolation feature `t('cart.removeItem', { name: item.name })` provides specific context safely.
**Action:** Always interpolate item names into ARIA labels for destructive actions in lists to ensure screen reader users know exactly what they are removing.
