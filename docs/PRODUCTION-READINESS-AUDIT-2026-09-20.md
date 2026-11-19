# Malaika Nest: production readiness audit and Gemini handoff
Date: 2026-09-20 (Africa/Nairobi)
Workspace: C:/Users/user/Desktop/malaikanest
Scope: analysis only; no application, deployment, customer or configuration changes made.

## Verdict

The shop is running and several improvements are deployed, but it is **not ready for unrestricted public checkout**. Resolve the payment/order-access blockers below before promoting it as an automated online store. A healthy homepage does not prove payments, inventory finalization, receipts or recovery work.

This is a targeted audit, not a complete penetration test or exhaustive test run. Findings distinguish source-confirmed defects from operational checks still needed. Do not rewrite the backend or buy a larger VM as the first response.

## What is actually complete

- Live deployment is the lean Django monolith with PostgreSQL and Cloudflare Tunnel. Docker showed only web, db and cloudflared. Web and DB were healthy; web had been running about eight hours.
- Disk is now 30 GB, with 8.2 GB used and about 20 GB free. Memory snapshot: 964 MB total, 315 MB available, 205 MB swap used. This is a snapshot, not a load test or proof of CPU-credit exhaustion.
- Live migrations products.0008_product_size_guide, products.0009_category_image_url_product_image_url_and_more, and core.0006_sitesettings_logo_url are applied.
- Origin GET checks returned HTTP 200 for /, /products/, /manage-store/login/, /api/health/. /products/ contains “Shop by size”.
- Seven normalized SHA-256 comparisons exactly matched local files to running-container files: storefront/views_checkout.py, storefront/views.py, storefront/sizing.py, orders/services.py, payments/paypal.py, accounts/authentication.py, templates/storefront/base.html. Findings in these files apply to the deployed version, not merely a draft.
- Current source has publication guards (active AND published), stock-aware size filtering, the all-inactive-variants fix, editable product measurement text, full category paths in classic admin, image URL support, and a React/TypeScript management dashboard.
- Admin product editor includes categories, photos, variants and settings work. Fourteen local productDraft.test.mjs tests passed today, covering preservation of owner fields, explicit publishing, reserved inventory validation, uploads and token refresh. These tests do not prove the complete admin UI or backend works.
- Live catalog: 76 products, 1 published+active, 75 drafts, 0 products with size_guide text; 113 categories. There are 2 orders and 0 completed Payment records. Do not infer that these are real customers or that no payment occurred externally.
- Live flags read directly from environment: MPESA_MOCK_MODE=false, MPESA_STRICT_SIGNATURE=false, MPESA_CALLBACK_SIGNATURE_RISK_ACCEPTED=true, PAYPAL_MODE=live.
- DEBUG=false, secure session/CSRF cookies and SSL redirect are enabled. Cache backend is process-local LocMemCache.
- Two pending outbox events exist.
- Commit history contains b45ff3e4 (static TS dashboard) and b48b3e84 (size-first theme), followed by extensive uncommitted/untracked work. Preserve it.

External web-fetch access failed for the public site. Origin checks bypass Cloudflare; public browser rendering, mobile usability, authenticated editing, and complete purchase flow were not verified in this audit. One SSH connection timed out; a later retry succeeded. Do not diagnose a VM capacity problem from that alone.

## P0 — fix before public payment checkout

### G01. PayPal return discloses an order's secret without authorization
Evidence: backend/apps/storefront/views_checkout.py:289-320, PayPalReturnView.
The view finds an order using a supplied receipt, does not invoke authorize_order_access, and redirects with the real order.checkout_token after the capture attempt, including when an exception is caught. This affects orders with a PayPal Payment record. It can defeat the intended order-detail access check. The variable checkout_token is read but never verified. The same query key token is used for the shop secret and PayPal order ID.

Gemini action: require validated session/owner or cryptographically bound return state before any capture or secret-bearing response; use distinct provider/state parameters; persist the expected PayPal order ID for the local payment. Never reveal a checkout token on failed/unauthorized requests. Prefer a session-based redirect.
Acceptance: an anonymous request with another order receipt, missing/incorrect state, and a failing mocked capture gets no secret, no order details and no capture call. A valid return succeeds. Test only in an isolated database; do not probe this against live customer orders.

### G02. PayPal capture is not bound to the local order and has a broken success transaction
Evidence: backend/apps/payments/paypal.py:188-260 and backend/apps/core/outbox.py:14.
capture_order accepts a client-supplied provider ID and marks the supplied local payment/order paid based on COMPLETED without visible checks tying provider reference/custom_id/invoice_id, amount and currency to that local order. create_order records provider ID in an audit payload, but the return handler does not enforce the binding.
Additionally, publish_event is called with event_type and payload only, whereas its signature requires aggregate_type and aggregate_id. This raises TypeError inside the local success transaction after an external capture may have succeeded: customer funds can be captured while local payment state rolls back. No real capture was attempted during this audit.

Gemini action: temporarily disable PayPal checkout until fixed; repair the outbox call, provider binding, amount/currency checks, capture idempotency and reconciliation after interrupted requests. Use the persisted expected conversion amount, not a later exchange-rate recalculation. Check capture result before displaying success.
Acceptance: successful capture commits exactly once; replay creates no duplicate side effects; wrong provider order, amount, currency or beneficiary is rejected; external success/local failure can be safely reconciled.

## P1 — required operational and security work

### G03. Background processing is missing from the observed deployment
Evidence: docker-compose.lean.yml defines only db/web/cloudflared; live docker ps confirmed those three. No shop jobs appeared in systemctl list-timers or the admin user's filtered crontab. Live OutboxEvent has 2 pending entries. backend/apps/core/tasks.py process_outbox dispatches order.paid and order.cancelled; orders/tasks.py contains inventory/receipt/cleanup work.

Risk: events may remain pending, preventing inventory finalization and payment receipts; abandoned reservations may not be released. Order creation emails are sent synchronously via orders/signals.py, so do not claim all email is broken. PaymentService.enqueue_task has a synchronous fallback, but it does not itself schedule the outbox relay.
Gemini action: inspect root cron/system services and event ages/types first, without exposing payloads. If absent, implement an inexpensive scheduled management command for the monolith, or a deliberately budgeted worker/scheduler arrangement. Ensure cancellation handlers also work without an unavailable broker. Add retries, monitoring and concurrency/idempotency protection.
Acceptance: isolated paid/cancelled events process once, inventory changes once, failed events retry, stale reservations expire; deployment has an observable scheduler. Do not blindly replay live pending events before understanding them.

### G04. M-Pesa authenticity/reconciliation is not demonstrated
Evidence: live strict signature=false with risk acceptance=true; callback handler in payments/views.py permits unsigned callbacks in this mode. This is an explicit risk exception, not proof of secure production payments. Zero locally completed payments were observed.
Gemini action: review process_callback, request correlation, amount/phone/receipt validation, replay behavior and provider-supported authenticity controls. Confirm which protections Safaricom actually supports before enabling a header requirement that rejects legitimate callbacks. Add provider-side reconciliation where appropriate; never mark paid based on a browser/customer claim.
Acceptance: forged/mismatched/replayed callbacks cannot create a paid order; sandbox/provider-approved flow passes; an owner-authorized low-value live transaction, delivery of receipt, and ledger reconciliation are recorded separately. Never charge the owner automatically.

### G05. Admin cookie JWT path lacks explicit CSRF and access-token revocation checks
Evidence: accounts/authentication.py CookieJWTAuthentication reads access_token from a cookie but has no CSRF enforcement and does not compare the token_version claim against the user. It inherits JWTAuthentication, not the later rotation mixin. backend/adminapp/src/api.ts writes the access cookie using document.cookie with SameSite=Lax but no Secure or HttpOnly, and sends cookie-authenticated mutations without a CSRF header. LocMemCache is per process; it is not a shared blacklist.
Risk: protection depends too heavily on browser same-site behavior; password/logout-everywhere claims exceed what the shown access authenticator enforces. Session authentication middleware alone does not prove DRF cookie-JWT CSRF protection.
Gemini action: choose one coherent mechanism: secure HttpOnly session/cookie auth with explicit CSRF, or memory-held bearer access with a secured refresh endpoint. Enforce token version at access authentication, audit logout/refresh, avoid claiming cross-worker revocation with LocMemCache.
Acceptance: staff mutation without valid CSRF (for cookie auth) fails, authenticated authorized mutation succeeds, nonstaff fails, revoked access fails across workers.

### G06. Checkout does not revalidate publication/variant availability flags
Evidence: orders/services.py process_checkout iterates cart items and locks inventory, but does not visibly recheck product is_active/status or variant.is_active before reservation. views_cart.py correctly validates at add-to-cart time; an owner can unpublish/deactivate afterward.
Gemini action: revalidate catalog eligibility and variant/product relationship atomically at checkout; handle a previously simple product converted to variants. Keep existing authoritative price recalculation and reservation locking.
Acceptance: add item, then unpublish/deactivate variant, then checkout must fail with no order or reservation; insufficient/concurrent stock still fails safely.

### G07. Category URL image import permits unrestricted server fetches (local source finding)
Evidence: products/admin_serializers.py CategoryAdminSerializer._download_image around lines 72-102 calls requests.get(image_url, timeout=10). The create/update paths invoke it. No visible private-address/metadata-host restriction, redirect validation, streamed byte cap or decoded-image validation in this path.
Gemini action: prefer direct validated uploads or an approved image-host allowlist; if server fetch is required, block private/loopback/link-local/metadata destinations, revalidate redirects and DNS targets, limit bytes and verify content. Review Banner/product importer separately; some product paths store URLs without fetching.
Acceptance: private/metadata destinations and redirected equivalents are rejected using mocked networking; oversized/nonimage bodies are rejected. Do not send an actual metadata request. This serializer's live hash was not confirmed because a follow-up SSH attempt timed out.

### G08. Repeatable deployment and backup recovery are not established
Evidence: .github/workflows/deploy.yml still expects a Git checkout and backend/frontend Compose services; live is the lean web/db/cloudflared topology. AGENTS.md describes the old Next.js runtime. deployment/lean/upgrade-sizing.sh targets an older archive and ends after tests, without migration or web rollout. The September 15 handoff also predates newer migrations/admin work; do not blindly execute it.
Backups found are mostly ad-hoc local VM files; latest observed DB backup under /home/admin/malaikanest-backups was September 17. No off-host copy/restore drill or scheduled application backup was demonstrated. Checking that directory does not prove no other backups exist.

Gemini action: document the actual source/runtime paths and dashboard URLs; adopt one versioned deployment manifest with backend and built admin assets, tests, backups, explicit migration, health gate and usable rollback commands. Preserve current edits before establishing a clean revision. Schedule protected off-host backups and perform an isolated restore. Do not run the old workflow with --remove-orphans.
Acceptance: a clean checkout builds the same release; backup restores in isolation; rollback restores a known image using explicit Compose override/tag and preserves customer data. A stored image ID alone is not a rollback implementation.

## P2 — usability, catalog and maintenance gaps

### G09. Public category links are still ambiguous
Evidence: storefront/views.py ProductListView uses Category.objects.filter(slug=cat_param).first(); storefront/urls.py uses a single slug. Category slug uniqueness is per parent, and six Dresses branches are legitimate distinct categories. The admin path-label improvement does not repair public URL resolution.
Fix: resolve full ancestry or stable unique IDs with appropriate redirects; test two same-slug leaves under different parents. Preserve UUIDs and product assignments. Age links also need tests: home uses ranges such as 1-2y/2-4y, while available sizes use individual years; the current exact/substring filter does not implement interval matching.

### G10. Catalog is not yet business-ready
Live evidence: only 1 published+active product, 75 drafts, zero size guides. The original 76 photos were imported one-per-draft; some may be alternate photos of the same product and prices were provisional.
Fix: owner-reviewed names, prices, physical stock, sizes, variants, measurements, descriptions and categories; consolidate alternate photos only after review. Gemini must not invent stock/material/fit claims or auto-publish the drafts. Verify current product photos and mobile presentation before promotion.

### G11. Runtime CSS and media persistence need verification
Evidence: live base template still uses cdn.tailwindcss.com, making styling depend on a runtime third-party script. Compile and serve pinned local CSS, then review compatible CSP.
Compose mounts media at /app/media, but Django MEDIA_ROOT is BASE_DIR/media and the Docker WORKDIR is /code. If a file uses local storage, it may not survive replacement and Django static() media serving does not work with DEBUG=false. Cloudinary may cover product photos, so do not assume image loss is occurring. Verify default storage, invoices/exports and every upload type.
Acceptance: uploads and generated files survive container replacement; public image URLs work; new build works without runtime Tailwind dependency.

### G12. Owner-configurable shipping settings may not control actual totals
Evidence: admin API exposes SiteSettings.free_shipping_threshold, while storefront views use a hard-coded 10000 and OrderService uses a Django setting with a 10000 default. Changing the admin setting may leave checkout and marketing unchanged.
Fix: choose one authoritative source and apply it to displayed promises and server-calculated totals. Validate payment_method and delivery_region against supported options before creating/reserving an order.
Acceptance: changing threshold updates listing promises, cart, checkout and final order consistently; tampered region/payment values fail before writes.

### G13. Tracking verification needs stronger access design
Evidence: views_checkout.py authorize_order_access/OrderLookupView accept receipt or numeric order ID plus known email/phone to establish a session holding the order secret. Plain Django views show no local rate-limit decorator and distinguish missing orders from mismatched contacts.
Fix: prefer signed expiring links or a delivered verification code; add throttling and uniform failure responses. Verify templates disclose no order details before authorization. Audit query-string tokens in logs, analytics and outbound links.
Acceptance: enumeration and repeated guesses are throttled; only a validated owner can see PII/receipts.

## Execution order for Gemini

1. Re-read current source and reproduce G01/G02 in an isolated DB with mocked provider calls; disable PayPal entry points until safe. No real captures or messages.
2. Address G03–G06 and test complete stock/payment state transitions; resolve G07.
3. Establish deployment/backup process G08 using the actual monolith. Obtain fresh hashes; deployed files may change after this audit.
4. Resolve G09/G11/G12/G13 and validate the management dashboard. Actual routes in config/urls.py are /manage/dashboard/ and /manage-store/dashboard/; /admin/ is not the new dashboard.
5. Owner completes G10. Use an isolated staging/test catalog for automated purchase tests.
6. Run relevant suites: apps.products.tests_admin_categories, apps.products.tests_publication, apps.products.tests_slug_lookup, apps.storefront.tests_sizing, apps.storefront.tests, apps.storefront.tests_cart, apps.storefront.tests_checkout, and payment/order/auth tests. Run node --test productDraft.test.mjs in backend/adminapp and its TypeScript build.
7. Account for SSL redirect and testserver ALLOWED_HOSTS in isolated test settings; do not weaken production settings for tests. Test DB must be distinct from production. Verify migration consistency including 0009/core0006 and any new migrations.
8. Perform public mobile/desktop, authenticated admin, checkout/cancellation, email/invoice and backup restore verification. A controlled live payment needs explicit owner approval.

Report each G-number as FIXED with test evidence, NOT REPRODUCED with evidence, or BLOCKED with reason. Provide release revision/file manifest, backup/restore evidence, applied migrations and public verification. Distinguish code fixes, deployed fixes and owner catalog tasks. Do not claim full production readiness from passing unit tests alone.

## Audit constraints and historical corrections

No backend test suite was run against the live server in this audit; only the 14 local admin tests were executed. No orders, payments, sessions, products, settings, images or deployment files were intentionally modified.
Earlier “ready” claims and the initial handoff were too optimistic: they lacked passing final backend tests and contained incomplete rollback/deployment advice. Treat those as historical notes, not release certification.
The earlier usage-limit block is no longer preventing all SSH work: live reads succeeded today. Preserve existing owner work and secrets. Do not force drafts back to zero if the owner has intentionally updated them since the original import.

