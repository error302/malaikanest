## 2024-05-16 - Add interpolation to cart action translation keys
**Learning:** Using raw string concatenation with translated keys (e.g. `t('cart.remove') + ' -'`) creates confusing screen reader announcements for lists.
**Action:** Always create new complete translation keys with interpolation variables (e.g., `cart.removeItem: 'Remove {name} from cart'`) to provide specific ARIA labels per item.
