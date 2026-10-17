
## 2024-10-24 - Cart Action Screen Reader Experience
**Learning:** Found an accessibility anti-pattern on the cart page where string concatenation with translated labels (e.g. `t('cart.remove') + ' -'`) resulted in confusing labels like "Remove -" for screen readers without any context as to which item was being removed or manipulated.
**Action:** Replace arbitrary string concatenations in `aria-label`s with dynamic string interpolation using the i18n translation engine (e.g. `t('cart.decreaseQty', { name: item.name })`) to provide highly contextual, full sentences for assistive technologies. Always add parallel Swahili translations for any newly added interpolated keys.
