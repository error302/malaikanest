## 2024-11-01 - [ARIA Label for Cart Drawer]
**Learning:** Hardcoded text on a "Remove" button in a cart list lacks context for screen reader users, who will just hear "Remove".
**Action:** Always add an `aria-label` specifying *what* is being removed (e.g. `aria-label={\`Remove \${item.name}\`}`).
