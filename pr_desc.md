## What:
Replaced generic 'Remove', 'Remove +', and 'Remove -' ARIA labels in the cart with context-aware, translated labels ('Decrease quantity of {item}', 'Increase quantity of {item}', 'Remove {item} from cart').

## Why:
Screen reader users had a confusing experience navigating the cart page when multiple identical generic labels ('Remove') were read without identifying which item was being targeted.

## Accessibility:
Improves WCAG compliance by ensuring interactive elements provide clear, descriptive context for screen reader users via specific interpolation of the item name into the aria-label.
