## 2024-10-18 - [Add interpolation for cart item ARIA labels]
**Learning:** Using raw string concatenation with translated text for ARIA labels (like `t('cart.remove') + ' -'`) creates screen-reader experiences that are confusing and incorrect across different languages, as sentence structure differs.
**Action:** Use the translation engine's interpolation feature `t('cart.decreaseItem', { name: item.name })` for interactive elements that target specific items to ensure clear, localized accessible names.
