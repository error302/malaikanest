## 2024-05-18 - String Interpolation for ARIA Labels in Lists
**Learning:** Found that generic ARIA labels like "Remove" or "Remove +" concatenated directly were used for cart item buttons, which is bad for screen reader accessibility in lists because they lack context of *what* is being removed.
**Action:** Always use string interpolation within the translation key (e.g. `t('cart.removeItem', { name: item.name })`) for list item actions to provide screen readers with specific context of what item the action applies to.
