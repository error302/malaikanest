## 2026-08-07 - XSS in Announcement Bar
**Vulnerability:** Cross-Site Scripting (XSS) vulnerability via `dangerouslySetInnerHTML` in the `AnnouncementBar` component.
**Learning:** `dangerouslySetInnerHTML` was used directly with dynamic messages array from props, meaning any malicious script injected into the message configuration would be executed on the client-side.
**Prevention:** Sanitize user-provided HTML with `isomorphic-dompurify` (which is SSR safe for Next.js) before rendering it using `dangerouslySetInnerHTML`.
