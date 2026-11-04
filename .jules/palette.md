
## 2024-11-20 - [Keyboard Navigation] Focus rings on floating action buttons
**Learning:** Floating action buttons (like WhatsApp or Scroll-to-top) are often missed when tabbing through a page because they are visually detached from the document flow, making a clear focus indicator crucial for keyboard users to know where they are.
**Action:** Always add explicit `focus-visible` ring classes (e.g., `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-gold)]`) to floating interactive elements.
