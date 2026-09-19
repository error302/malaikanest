## 2024-05-15 - [Screen Reader Accessibility for Dynamic Badges]
**Learning:** Dynamically updated states or badges (like cart counts) on interactive elements must be explicitly included in the parent element's `aria-label` attribute so they are correctly announced by screen readers.
**Action:** When adding or modifying a badge on a button/link, ensure the `aria-label` reflects the badge state if it conveys important information.

## 2024-11-20 - [Accessibility] Dynamic Cart Badge Visibility to Screen Readers
**Learning:** Screen readers might skip absolutely positioned badge counters on interactive elements like navigation buttons (e.g. cart badge with item count).
**Action:** Always include dynamically updated state or counters within the parent interactive element's `aria-label` to ensure this critical contextual information is announced.

## 2026-08-08 - [Keyboard Navigation] focus-visible ring on mobile bottom nav
**Learning:** Mobile users on tablets or with Bluetooth keyboards need a visible focus indicator on bottom-nav links, just like desktop users.
**Action:** Every `<Link>` in `MobileBottomNav` now ships `rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]` so keyboard focus is announced visually with the brand gold ring.
## 2024-05-30 - Redundant ARIA Labels
**Learning:** When adding `aria-label`s to buttons that already have visible text, using the exact same text for the `aria-label` creates a redundant ARIA anti-pattern, causing screen readers to potentially read the text twice.
**Action:** When adding `aria-label`s to elements with visible text, ensure the label provides *additional* context (e.g., "Clear all items from wishlist" instead of just "Clear all") rather than simply duplicating the visible text.
