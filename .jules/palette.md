
## 2023-10-01 - Contextual ARIA labels for identical action buttons
**Learning:** List items containing identical action buttons (e.g., 'Remove' items in a cart) without contextual ARIA labels result in screen reader users hearing 'Remove' repeatedly without context.
**Action:** Always provide an expanded, descriptive accessible name specifying the target item (e.g., `aria-label="Remove ${item.name} from cart"`) for identical action buttons in lists.
