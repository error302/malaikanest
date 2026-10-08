## 2026-08-05 - Contextual ARIA labels for lists containing identical actions
**Learning:** Having identical ARIA labels for repeating items (e.g., "Remove") causes screen reader issues because the context is lost.
**Action:** Always provide complete, context-specific descriptions using the translation engine's interpolation feature (e.g., `t('cart.removeItem', { name: item.name })`) rather than string concatenation or template literals.
