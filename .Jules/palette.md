## 2024-05-15 - [Screen Reader Accessibility for Dynamic Badges]
**Learning:** Dynamically updated states or badges (like cart counts) on interactive elements must be explicitly included in the parent element's `aria-label` attribute so they are correctly announced by screen readers.
**Action:** When adding or modifying a badge on a button/link, ensure the `aria-label` reflects the badge state if it conveys important information.

## 2024-11-20 - [Accessibility] Dynamic Cart Badge Visibility to Screen Readers
**Learning:** Screen readers might skip absolutely positioned badge counters on interactive elements like navigation buttons (e.g. cart badge with item count).
**Action:** Always include dynamically updated state or counters within the parent interactive element's `aria-label` to ensure this critical contextual information is announced.

## 2026-08-08 - [Keyboard Navigation] focus-visible ring on mobile bottom nav
**Learning:** Mobile users on tablets or with Bluetooth keyboards need a visible focus indicator on bottom-nav links, just like desktop users.
**Action:** Every `<Link>` in `MobileBottomNav` now ships `rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]` so keyboard focus is announced visually with the brand gold ring.

## 2024-11-20 - [Accessibility] Desktop Add to Cart Button Visibility to Screen Readers
**Learning:** If an interactive element is only visible on hover using `opacity-0` and `pointer-events-none`, it might still receive keyboard focus but remain invisible to the user.
**Action:** When an interactive element is only visible on hover, ensure its focus-visible styles explicitly make it visible (e.g., using `focus-visible:opacity-100 focus-visible:translate-y-0`) and restore pointer events (`focus-visible:pointer-events-auto`) so it can be clicked when focused.
