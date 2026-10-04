## 2024-03-20 - Adding specific ARIA labels for "Remove" items
**Learning:** Found multiple instances where "Remove" buttons in the cart and wishlist lacked specific `aria-label`s, which can cause screen readers to read "Remove" without context of *what* is being removed. Interpolation is needed instead of appending with `+` to work better with the translation engine (as memory says).
**Action:** When working on lists containing identical action buttons, always use a specific `aria-label` detailing the target item using translation interpolation where appropriate.
