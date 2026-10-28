## 2024-05-18 - Dynamic ARIA Labels in Lists
**Learning:** For lists containing identical action buttons (e.g., 'Remove' items in a cart), concatenating strings (e.g., `t('key') + ' -'`) creates poor screen reader experiences.
**Action:** Always provide complete, context-specific descriptions using the translation engine's interpolation feature (e.g., `t('key', { name: item.name })`) to ensure screen readers announce exactly which item is being targeted.
