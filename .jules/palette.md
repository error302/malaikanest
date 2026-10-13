## 2024-05-24 - Context-Specific ARIA Labels for Cart Actions
**Learning:** Cart actions like "Remove", "Increase Quantity", or "Decrease Quantity" that appear in lists can be confusing for screen reader users if they all have the same accessible name.
**Action:** Use translation interpolation (e.g. `t('cart.remove', { name: item.name })`) to provide unique context for each button in repetitive lists.
