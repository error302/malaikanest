## 2024-05-15 - [Screen Reader Accessibility for Dynamic Badges]
**Learning:** Dynamically updated states or badges (like cart counts) on interactive elements must be explicitly included in the parent element's `aria-label` attribute so they are correctly announced by screen readers.
**Action:** When adding or modifying a badge on a button/link, ensure the `aria-label` reflects the badge state if it conveys important information.

## 2024-11-20 - [Accessibility] Dynamic Cart Badge Visibility to Screen Readers
**Learning:** Screen readers might skip absolutely positioned badge counters on interactive elements like navigation buttons (e.g. cart badge with item count).
**Action:** Always include dynamically updated state or counters within the parent interactive element's `aria-label` to ensure this critical contextual information is announced.

## 2026-08-08 - [Keyboard Navigation] focus-visible ring on mobile bottom nav
**Learning:** Mobile users on tablets or with Bluetooth keyboards need a visible focus indicator on bottom-nav links, just like desktop users.
**Action:** Every `<Link>` in `MobileBottomNav` now ships `rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]` so keyboard focus is announced visually with the brand gold ring.
## 2024-11-20 - [Accessibility] Dynamic Button State A11y and Contextual labels
**Learning:** Generic aria-labels like "Remove -" on minus buttons are ambiguous for screen readers. Using `t('decrease', {name: item.name})` or conditionally changing to "Remove {name}" when quantity is 1 provides necessary context.
**Action:** When adding or modifying list item quantity controls (e.g. cart), always include the specific item name in the `aria-label` to ensure context is announced. Combine with `disabled:pointer-events-none` for loading states to prevent double-submissions.
