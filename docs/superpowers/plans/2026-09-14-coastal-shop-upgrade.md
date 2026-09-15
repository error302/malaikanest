# Coastal Shop Upgrade Implementation Plan

> Execute inline with the executing-plans skill; preserve existing user changes.

**Goal:** Unify the storefront and Django admin and prepare genuine shop images as editable draft products.

**Architecture:** Keep the lean Django deployment. Use template inheritance and a small local stylesheet, without adding a runtime service. Import images through configured Django media storage.

**Tech Stack:** Django templates, CSS, PostgreSQL, existing image storage.

## Global constraints

- Approved coastal nursery direction: ivory #FCFAF5, deep sea-green #28594F, pale sea-green #E8F0EB, peach #F2D6C5, brown #30251F.
- Retain existing system typography, logo, shopping routes, payment processing, and all real product data.
- No fabricated stock, reviews, brands, sizes, fabric claims, or publish-ready prices.
- Source folder: C:/Users/user/Downloads/malaikanest. Originals are read-only inputs.
- Imported items: status=draft, is_active=False, stock=0, provisional prices explicitly labelled in description.
- Preserve unrelated modifications in backend/apps/products/models.py.

## Task 1 — Restore usable branded admin

- [ ] Render admin login and popup change forms in tests; assert a single main content region and usable popup forms. The old base suppresses popup content.
- [ ] Replace custom admin/base.html with an extension of Django's own base template; override branding/styles only.
- [ ] Add responsive theme through admin extra style include. Keep dark mode, keyboard focus, logout POST/CSRF, and navigation working.
- [ ] Add permission-aware product/order/banner shortcuts on index, product thumbnails and draft guidance.
- [ ] Re-run rendering tests and Django checks.

## Task 2 — Coastal storefront

- [ ] Retain active banner controls; implement light split hero with visible photography and clear shop/category links.
- [ ] Add small reusable theme include; improve text sizes, focus, mobile spacing and existing product cards without changing checkout logic.
- [ ] Replace category letter monograms with uploaded category photos when available; keep text fallback.
- [ ] Visually inspect mobile and desktop; verify links, no overflow and no obscured buttons.

## Task 3 — Safe shop-photo import

- [ ] Add command tests using a temporary valid JPEG and temporary storage: draft defaults, repeat import preserves merchant edits, malformed images rejected, path traversal rejected.
- [ ] Implement import_shop_photos folder --manifest file --apply, dry-run by default. Use SHA256-derived SKU so repeats cannot duplicate identical source files.
- [ ] Validate all source paths/images/prices before writing; default KES 1000 only as a provisional internal value, with observed prices/names for inspected photos in the manifest.
- [ ] Upload originals to a scoped remote staging directory; snapshot DB before import; run dry-run then apply and verify draft/stock counts and image availability.
- [ ] Ensure no invented products become publicly orderable; give owner review instructions.

## Delivery

- [ ] Stage only changed files, preserving remote configuration/secrets. Back up replaced files and collect static assets.
- [ ] Run focused tests in an isolated database, Django checks, and public HTTP checks.
- [ ] Record verified results and outstanding owner tasks; do not claim end-to-end payments were tested by a visual-only check.

## Execution record

Implemented and deployed 2026-09-14. Nine focused tests passed against an isolated PostgreSQL test database on the VM. Browser verification confirmed successful administrator login, themed dashboard, loaded product thumbnails and clickable product names. Desktop storefront checked at 1366px; mobile checked at 390px with no horizontal overflow. All 76 records have an image, inactive draft status and stock zero.

The final code review identified an editable-SKU retry issue; reproduced in the test database and corrected by matching the generated slug/image fingerprint as well. Disabled the obsolete flat-theme application after tracing its incompatible static assets. Existing product-model edits were preserved. Source is left uncommitted, not merged.

Category photography still depends on merchant-uploaded category images; text/heart fallbacks remain. Most draft names/prices require owner review. Public server-origin automated requests received Cloudflare 403; real-browser storefront and admin access worked. No Cloudflare protections were changed. Owner instructions: docs/SHOP-PHOTO-REVIEW.md.
