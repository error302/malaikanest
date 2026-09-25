## 2024-05-24 - Screen Reader Disambiguation for Cart Items
**Learning:** Identical list action buttons (e.g. "Remove" buttons on cart items) are read simply as "Remove" by screen readers, making it impossible to know which item is targeted. Adding `item.name` to the `aria-label` provides crucial context.
**Action:** When adding identical action buttons to a list (like in a cart or a table), always inject target item details into the `aria-label` (e.g., `Remove ${item.name} from cart`) for screen reader accessibility, and ensure it respects internationalization.
