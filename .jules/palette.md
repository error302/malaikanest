## 2025-05-18 - Avoid String Concatenation in Translated ARIA Labels
**Learning:** For lists containing identical action buttons (like 'Remove' in a cart), concatenating translated keys (e.g., `t('key') + ' -'`) creates inaccessible screen reader experiences.
**Action:** Always create new context-specific translation keys using interpolation (e.g., `t('cart.removeItem', { name: item.name })`) to provide clear context without string concatenation.
