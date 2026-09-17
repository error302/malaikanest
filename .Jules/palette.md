## 2024-05-15 - [Screen Reader Accessibility for Dynamic Badges]
**Learning:** Dynamically updated states or badges (like cart counts) on interactive elements must be explicitly included in the parent element's `aria-label` attribute so they are correctly announced by screen readers.
**Action:** When adding or modifying a badge on a button/link, ensure the `aria-label` reflects the badge state if it conveys important information.

## 2024-11-20 - [Accessibility] Dynamic Cart Badge Visibility to Screen Readers
**Learning:** Screen readers might skip absolutely positioned badge counters on interactive elements like navigation buttons (e.g. cart badge with item count).
**Action:** Always include dynamically updated state or counters within the parent interactive element's `aria-label` to ensure this critical contextual information is announced.

## 2026-08-08 - [Keyboard Navigation] focus-visible ring on mobile bottom nav
**Learning:** Mobile users on tablets or with Bluetooth keyboards need a visible focus indicator on bottom-nav links, just like desktop users.
**Action:** Every `<Link>` in `MobileBottomNav` now ships `rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]` so keyboard focus is announced visually with the brand gold ring.

## 2026-08-08 - [Keyboard Navigation] Focus States for Hover-Only Interactive Elements
**Learning:** Interactive elements that are visually hidden until hover (e.g. wishlist buttons or specific add-to-cart overlays) remain invisible to keyboard users who tab to them unless explicitly handled. Standard focus styles are not sufficient if the element relies on parent hover state for opacity or transform changes.
**Action:** Always add `focus-visible:opacity-100` and reset any hover-based transforms (e.g., `focus-visible:scale-100` or `focus-visible:translate-y-0`) in addition to a standard focus ring when styling interactive elements that are usually hidden behind a hover interaction.
