## 2024-05-14 - Meaningful ARIA Labels in Lists
**Learning:** Raw string concatenation with translated keys (e.g., `t('key') + ' -'`) creates confusing ARIA labels for repetitive actions in lists (like a cart).
**Action:** Instead, provide complete, context-specific descriptions using the translation engine's interpolation feature (e.g., `t('key', { variable: value })`) for each distinct action.
