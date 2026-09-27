## 2024-05-24 - Accessibility for Identical List Actions
**Learning:** When a list contains multiple identical action buttons (like '+' or '-' or 'Remove' in a cart), generic ARIA labels like "Increase quantity" or "Remove" are confusing for screen reader users because they don't specify which item the action applies to.
**Action:** Always interpolate the item's name into the ARIA label (e.g., `aria-label={t('cart.decreaseQty', { name: item.name })}`) to provide clear, item-specific context for screen readers.
