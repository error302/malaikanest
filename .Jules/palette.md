## 2024-05-15 - [Screen Reader Accessibility for Dynamic Badges]
**Learning:** Dynamically updated states or badges (like cart counts) on interactive elements must be explicitly included in the parent element's `aria-label` attribute so they are correctly announced by screen readers.
**Action:** When adding or modifying a badge on a button/link, ensure the `aria-label` reflects the badge state if it conveys important information.
