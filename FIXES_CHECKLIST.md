# MALAIKA NEST — FULL SECURITY & CODE QUALITY AUDIT
> Audited: 2026-03-05 | Auditor: Senior Full-Stack Security Review

---

## 🔴 CRITICAL — Fix Before Going Live (Site-Breaking or Money-Losing)

---

### CRIT-01: Celery Task Signature Mismatch — Payment Verification Completely Broken
- **File:** `backend/apps/payments/views.py:281` + `backend/apps/payments/tasks.py:17`
- **Problem:** `verify_mpesa_payment_async.delay(payment.id, checkout_request_id)` passes TWO positional args. The task is defined as `verify_mpesa_payment_async(self, payment_id)` — with `bind=True`, `self` is the task, leaving ONE slot for args. The `checkout_request_id` is an extra argument the task signature doesn't accept. This causes a `TypeError` on every Celery worker execution. The entire async payment verification fallback is silently broken.
- **Risk:** If Safaricom's callback ever fails or is delayed, there is NO fallback verification. Paid orders stay as `pending`. Customers pay and never receive confirmation.
- **Fix:** Change task signature to `def verify_mpesa_payment_async(self, payment_id, checkout_request_id=None):` OR remove the second arg from the `.delay()` call since the task already reads `checkout_request_id` from the Payment object.

---

### CRIT-02: Admin URL Not Actually Obscured — Bot Bait Left Open
- **File:** `backend/kenya_ecom/urls.py:10-20`
- **Problem:** `admin_secret = os.getenv("ADMIN_URL_SECRET", "admin")` is read but the URL is hardcoded as `path("admin/", admin.site.urls)`. The env var is **read but never used**. The Django admin is always accessible at `/admin/` regardless of what you put in `ADMIN_URL_SECRET`.
- **Risk:** Bots constantly scan for `/admin/`. Every brute-force, credential stuffing, and Django-specific exploit attempt hits this URL.
- **Fix:**
  ```python
  admin_secret = os.getenv("ADMIN_URL_SECRET", "admin-obscured")
  urlpatterns = [
      path(f"{admin_secret}/", admin.site.urls),
      ...
  ]
  ```

---

### CRIT-03: Workspace Root `settings.py` Has Hardcoded DB Password + Catastrophic Defaults
- **File:** `settings.py` (workspace root, lines 7-11, 65-74, 101, 107)
- **Problem:** This file contains:
  - `SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-malaika-nest-2024-key-for-production")` — insecure fallback key
  - `DEBUG = os.getenv("DEBUG", "True") == "True"` — defaults to DEBUG=True
  - `ALLOWED_HOSTS = ["*"]` — allows host header injection
  - `DATABASES["default"]["PASSWORD"] = "malaika_pass_2024"` — hardcoded DB password
  - `CORS_ALLOW_ALL_ORIGINS = True` — allows any website to make credentialed requests
  - `REST_FRAMEWORK DEFAULT_PERMISSION_CLASSES: AllowAny` — every API endpoint is public
  - If this file is ever accidentally used (wrong DJANGO_SETTINGS_MODULE), it exposes everything.
- **Risk:** Full database compromise, unauthenticated API access, CORS exploitation, data breach.
- **Fix:** Delete this file immediately. It is a time bomb sitting in the project root.

---

### CRIT-04: M-Pesa Callback Localhost Bypass — Fraudulent Payments Possible
- **File:** `backend/apps/payments/views.py:331`
- **Problem:** `is_local = client_ip in ["127.0.0.1", "localhost", "::1"]` — the callback always accepts requests from localhost, bypassing IP validation entirely. On a production server with Nginx, any local process (compromised dependency, SSRF via another endpoint, cronjob) can POST to `http://127.0.0.1:8000/api/payments/mpesa/callback/` and mark arbitrary orders as paid — for KES 0.
- **Risk:** An attacker who can trigger any SSRF or server-side request can forge payment callbacks and get orders delivered for free.
- **Fix:** Remove the `is_local` bypass entirely in production. Add a secret token in the callback URL instead (Safaricom supports custom callback URLs with query params): `MPESA_CALLBACK_URL=https://domain.com/api/payments/mpesa/callback/?secret=<RANDOM_TOKEN>`. Validate the token in the view.

---

### CRIT-05: Phone Number Mismatch Not Enforced — Any Phone Can Pay for Any Order
- **File:** `backend/apps/payments/views.py:442-443`
- **Problem:** When the phone number in the M-Pesa callback doesn't match the order's phone, the code logs a warning but explicitly comments: "Log but don't fail - sometimes phone shows differently." The payment proceeds regardless.
- **Risk:** Attacker creates an order linked to victim's account, someone else's M-Pesa payment accidentally matches by amount, and the mismatch is silently ignored. More critically, a legitimate payment to the wrong account can be fraudulently assigned.
- **Fix:** Either enforce strict phone matching or implement a phone number normalization function that handles `07xxx`, `+254xxx`, `254xxx` consistently, then enforce the match. Don't silently ignore mismatches on financial transactions.

---

### CRIT-06: `order.payment_status` Assigned But Field Doesn't Exist in Order Model
- **File:** `backend/apps/payments/views.py:451`
- **Problem:** `payment.order.payment_status = "completed"` — the `Order` model has no `payment_status` field (checked `orders/models.py`). Django silently sets this as a Python attribute but does NOT persist it to the database. The field assignment is a no-op.
- **Risk:** This is dead code giving a false sense of security. The `order.status = "paid"` on line 450 does work, but if any other code checks `payment_status` it will always be missing.
- **Fix:** Either add `payment_status` as a field to the Order model with a migration, or remove the line. Check every place in the codebase that references `order.payment_status`.

---

### CRIT-07: Guest Payment Access Control Hole — Any User Can Query Any Guest Payment
- **File:** `backend/apps/payments/views.py:172-176`
- **Problem:** 
  ```python
  Payment.objects.filter(
      Q(order__user=request.user) | Q(order__user__isnull=True),
      pk=payment_id,
      payment_method="mpesa",
  )
  ```
  The `Q(order__user__isnull=True)` condition means **any authenticated user** can access **any guest order's payment** by guessing the `payment_id`. Since IDs are sequential integers, this is trivially enumerable.
- **Risk:** Full payment data exposure (phone numbers, amounts, M-Pesa receipts) for all guest orders.
- **Fix:** Remove `Q(order__user__isnull=True)` from this filter. Guest checkouts should use a signed token or session key, not be accessible to random authenticated users.

---

### CRIT-08: `verify_mpesa_payment_async` Always Calls Live Safaricom API
- **File:** `backend/apps/payments/tasks.py:31`
- **Problem:** The task hardcodes `https://api.safaricom.co.ke/` (live API) regardless of `MPESA_ENV`. If staging/testing uses `MPESA_ENV=sandbox`, the fallback verification task calls the live API with sandbox credentials — always failing.
- **Risk:** Payment verification fallback never works in staging. Could ship to prod with broken fallback and never know.
- **Fix:** Read `MPESA_ENV` and switch URL same as `MpesaSTKPushView` does.

---

### CRIT-09: Race Condition in Guest Checkout Inventory Deduction
- **File:** `backend/apps/orders/views.py:130-132`
- **Problem:** 
  ```python
  inv.quantity -= qty
  inv.reserved = max(inv.reserved - qty, 0)
  inv.save()
  ```
  This uses Python-level arithmetic and save, creating a classic read-modify-write race condition. Two concurrent guest checkouts for the same product can both read `quantity=1`, both subtract, both save `quantity=0`, and both succeed — selling the same item twice.
  
  The authenticated checkout path correctly uses `create_order_from_cart()` which uses `F()` expressions atomically. The guest path has its own broken implementation.
- **Risk:** Overselling. Real money paid, no stock.
- **Fix:** Replace with `Inventory.objects.filter(pk=inv.pk).update(quantity=F('quantity') - qty, reserved=F('reserved') - qty)` same as the authenticated path, or refactor to reuse `create_order_from_cart`.

---

### CRIT-10: Checkout Page Calls Wrong Endpoint — Payment Flow Broken
- **File:** `frontend/src/app/checkout/page.tsx:88-96`
- **Problem:** The checkout page POSTs to `/api/payments/mpesa/` with `{ order_id, phone }`. But `MpesaSTKPushView` (the endpoint at that URL) expects `{ payment_id, phone }` — not `order_id`. The Payment object must be created first via `InitiatePaymentView`. The checkout flow skips this step, sending `order_id` where `payment_id` is expected. This means the STK push will fail because no Payment record exists yet.
- **Risk:** The entire checkout flow is broken — no M-Pesa payment can ever be initiated through the frontend checkout.
- **Fix:** The checkout must:
  1. POST `/api/payments/initiate/` with `{ order_id, payment_method: "mpesa", phone }` → gets `payment_id`
  2. POST `/api/payments/mpesa/stk/` with `{ payment_id, phone }` → triggers STK push
  
  OR consolidate both steps into a single endpoint that accepts `order_id` directly.

---

## 🟠 HIGH — Fix Within 48 Hours (Security or Data Integrity)

---

### HIGH-01: ACCESS_TOKEN_LIFETIME = 7 Days — Effectively No Token Revocation
- **File:** `backend/kenya_ecom/settings.py:223`
- **Problem:** `"ACCESS_TOKEN_LIFETIME": timedelta(days=7)` — Access tokens can't be revoked (JWT is stateless). A stolen or compromised access token is valid for 7 days with no way to invalidate it. Industry standard is 5-15 minutes.
- **Risk:** Compromised session or stolen token grants attacker full account access for 7 days. Any XSS or network interception = week-long takeover.
- **Fix:** Set `ACCESS_TOKEN_LIFETIME: timedelta(minutes=15)`. The httpOnly cookie setup with refresh token rotation already handles seamless renewals.

---

### HIGH-02: `resend_verification_view` Leaks User Email Existence
- **File:** `backend/apps/accounts/views.py:157-158`
- **Problem:** Returns `HTTP 404 {"detail": "User not found"}` when email doesn't exist. The `password_reset_request_view` correctly uses the pattern of always returning the same message regardless — but `resend_verification` exposes whether an email is registered.
- **Risk:** User enumeration. Attacker can probe any email address to discover registered users.
- **Fix:** Return `{"message": "If your email is registered and unverified, a new link has been sent."}` regardless of whether user exists.

---

### HIGH-03: Rate Limiting Has a Race Condition — Brute Force Window Exists
- **File:** `backend/apps/core/middleware.py:95-113`
- **Problem:** 
  ```python
  current = cache.get(cache_key, 0)
  if current >= limit: return False
  cache.set(cache_key, current + 1, period)  # NOT ATOMIC
  ```
  Two concurrent requests both read `current=9` (limit=10), both see `9 < 10`, both proceed, both set `current=10`. Under high concurrency, the limit can be exceeded by a factor equal to concurrent requests.
- **Risk:** Login brute force possible by sending rapid concurrent requests. 10/minute limit becomes 50+/minute under load.
- **Fix:** Use `cache.add(cache_key, 0, period)` to initialize, then `cache.incr(cache_key)` which is atomic in Redis. Or use `django-ratelimit` or DRF's throttling properly.

---

### HIGH-04: `Payment.order` OneToOneField — No Duplicate Payment Check Before Create
- **File:** `backend/apps/payments/views.py:73-79`
- **Problem:** `Payment.objects.create(order=order, ...)` — if `InitiatePaymentView.post` is called twice for the same order (double-click, network retry), the second call will hit the OneToOneField unique constraint and throw an unhandled `IntegrityError`, returning a 500.
- **Risk:** 500 errors on retry, poor UX, potential for confusing state.
- **Fix:** Use `Payment.objects.get_or_create(order=order, ...)` or check `hasattr(order, 'payment')` first. Return the existing payment if already initiated.

---

### HIGH-05: M-Pesa `verify_mpesa_payment_async` Task Uses Empty Timestamp for Password
- **File:** `backend/apps/payments/tasks.py:40-45`
- **Problem:** 
  ```python
  timestamp = ""  # timestamp required to build password
  password_str = f"{shortcode}{passkey}{''}"
  ```
  The M-Pesa STK query API requires a valid timestamp in `YYYYMMDDHHMMSS` format as part of the base64 password. Sending an empty timestamp means **every query request is malformed** and will be rejected by Safaricom's API.
- **Risk:** The entire payment verification fallback task fails every time it runs, always returning an error and retrying indefinitely. Max 5 retries, then permanently stuck.
- **Fix:** 
  ```python
  from datetime import datetime
  timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
  password = base64.b64encode(f"{shortcode}{passkey}{timestamp}".encode()).decode()
  ```

---

### HIGH-06: Django Admin URL Env Var Loaded But Never Applied
- (Also listed in CRITICAL-02 above — fixing this IS critical)

---

### HIGH-07: No `@csrf_exempt` or DRF CSRF bypass on M-Pesa Callback — Safaricom Callbacks Will Fail
- **File:** `backend/apps/payments/views.py:319`
- **Problem:** `MpesaCallbackView` is a DRF `APIView` with `AllowAny`. DRF enforces CSRF for session-based auth, but NOT for token auth. However, the custom `JWTAuthenticationWithRotation` and `AllowAny` combination needs to be verified. More crucially, the `CSRF_TRUSTED_ORIGINS` only includes CORS allowed origins. Safaricom's servers are not in `CORS_ALLOWED_ORIGINS`, so the CSRF middleware will reject POST callbacks from Safaricom in production.
- **Risk:** All live M-Pesa callbacks rejected with 403 Forbidden. No orders ever marked as paid.
- **Fix:** Add `@csrf_exempt` to the callback view, OR verify that DRF properly bypasses CSRF for `AllowAny` views (it does for non-session auth — but confirm via testing). Add a test hitting the callback URL from an external IP.

---

### HIGH-08: `MPESA_SHORTCODE` vs `MPESA_BUSINESS_SHORT_CODE` — Env Var Name Inconsistency
- **File:** `backend/apps/payments/tasks.py:38` vs `backend/apps/payments/views.py:192`
- **Problem:** `MpesaSTKPushView` reads `os.getenv("MPESA_BUSINESS_SHORT_CODE", "174379")` but `verify_mpesa_payment_async` reads `os.getenv("MPESA_SHORTCODE")`. If only one of these is set in `.env`, the other silently uses `None` or sandbox default.
- **Risk:** STK push works but verification task uses wrong shortcode, silently building a bad password, causing all verification queries to fail.
- **Fix:** Standardize to one env var name across the entire codebase. Use `MPESA_BUSINESS_SHORT_CODE` everywhere. Update `.env.example`.

---

## 🟡 MEDIUM — Fix This Week (Quality and Reliability)

---

### MED-01: `create_order_from_cart` Deducts Inventory Before Order Create — Stock Lost on Failure
- **File:** `backend/apps/orders/models.py:150-156`
- **Problem:** The inventory is deducted via F() expressions atomically, but if `OrderItem.objects.create()` fails for any reason after inventory deduction within the same transaction, the entire `atomic()` block rolls back. This is actually correct behavior with `transaction.atomic()`. However, `reserved` is decremented when creating an order rather than when fulfilling it — using `reserved` for "items being purchased" but decrementing it during order creation (not after payment) means cancelled/failed orders do not restore reserved stock correctly: the `cancel` view doesn't restore inventory at all.
- **Risk:** Cancelled orders permanently reduce available stock. Inventory becomes inaccurate over time.
- **Fix:** The `cancel` action in `OrderViewSet` must restore inventory: `Inventory.objects.filter(product=item.product).update(quantity=F('quantity') + item.quantity)`.

---

### MED-02: `OrderViewSet.cancel` Allows Cancelling `payment_failed` Orders But Leaves Payment Record
- **File:** `backend/apps/orders/views.py:245-251`
- **Problem:** An order with status `payment_failed` can be cancelled (it's not in the blocked list), but the associated Payment record remains with `status="failed"`. The user can then try to pay again — but `InitiatePaymentView` checks `order.status != "pending"` and rejects it. There's no flow to re-attempt payment after `payment_failed`.
- **Risk:** Customers who get a failed M-Pesa prompt (dismissed, timed out) are permanently locked out of that order. They must create a new order. Bad UX = lost sales.
- **Fix:** Add a `retry_payment` action that resets order to `pending` status and allows a new payment initiation, clearing the failed payment record.

---

### MED-03: Missing `LOGGING` Config in Production Settings
- **File:** `backend/kenya_ecom/settings.py` (entire file)
- **Problem:** No `LOGGING` configuration found anywhere in the production settings. Django defaults to printing to stdout. Payment events, security violations, and errors are going nowhere useful — they'll fill Gunicorn's stdout and be lost on rotation.
- **Risk:** No audit trail for payment disputes. No alerting on security events. Post-incident forensics impossible.
- **Fix:** Add proper logging config sending to file or CloudWatch:
  ```python
  LOGGING = {
      'version': 1,
      'handlers': {
          'file': {'class': 'logging.FileHandler', 'filename': '/var/log/malaika/app.log'},
      },
      'loggers': {
          'apps.payments': {'handlers': ['file'], 'level': 'INFO'},
          'security': {'handlers': ['file'], 'level': 'WARNING'},
      },
  }
  ```

---

### MED-04: `verify_email_view` — No Token Expiry Check
- **File:** `backend/apps/accounts/views.py:104-123`
- **Problem:** The verification token is stored but there is no expiry field or check. A token sent 6 months ago is as valid as one sent today. Password reset correctly uses `password_reset_expires` but email verification has no equivalent.
- **Risk:** Old unverified tokens never expire. If an email is leaked, someone can activate the account months later.
- **Fix:** Add `verification_token_expires = models.DateTimeField(null=True)` to User model. Set to `now() + 24h` on generation. Check in `verify_email_view`.

---

### MED-05: No Pagination on `OrderViewSet` Admin Endpoint
- **File:** `backend/apps/orders/views.py:204-217`
- **Problem:** Admin users see `Order.objects.all()` with no pagination limit. As orders accumulate, this returns every order in the database in a single response.
- **Risk:** DoS via memory exhaustion. A single admin page load with 100,000 orders could crash Gunicorn workers.
- **Fix:** Add `pagination_class = PageNumberPagination` to the ViewSet or globally to REST_FRAMEWORK settings with a `PAGE_SIZE`.

---

### MED-06: Cart Item Quantity Not Validated Against Stock When Adding to Cart
- **File:** `backend/apps/orders/views.py:31-45`
- **Problem:** `CartViewSet.add` does not check inventory when adding items. A user can add 1000 units of a product with 2 in stock. The stock check only happens at checkout.
- **Risk:** Users build carts with unavailable quantities, only to get errors at checkout. Confusing UX.
- **Fix:** In `CartViewSet.add`, check `Inventory.objects.get(product_id=product_id).available() >= qty` before adding.

---

### MED-07: `Review` Model Allows Multiple Reviews Per User Per Product
- **File:** `backend/apps/products/models.py:228-254`
- **Problem:** No `unique_together` constraint on `(product, user)` for the Review model. A user can post unlimited reviews for the same product.
- **Risk:** Review bombing, fake ratings, review manipulation.
- **Fix:** Add `unique_together = ('product', 'user')` to `Review.Meta`, plus a migration.

---

### MED-08: No Email Verification Rate Limiting on `resend_verification_view`
- **File:** `backend/apps/accounts/views.py:126-158`
- **Problem:** The resend verification endpoint has no rate limiting. Anyone who knows (or enumerates) an email can trigger unlimited verification emails to that address.
- **Risk:** Email bombing. Using your service to spam third parties.
- **Fix:** Add `AnonRateThrottle` with low rate (e.g., `3/hour`) to this endpoint.

---

### MED-09: Checkout Page Uses Relative URLs Without API Proxy Configured
- **File:** `frontend/src/app/checkout/page.tsx:34, 69, 88, 119`
- **Problem:** `fetch('/api/orders/cart/', ...)` uses relative paths. This only works if Next.js is proxying `/api/*` to the Django backend. There is no `next.config.js` proxy configuration visible. If the frontend is on port 3000 and backend on 8000 without proxy, all fetch calls fail silently with 404 (hitting Next.js instead of Django).
- **Risk:** Frontend entirely unable to communicate with backend if proxy isn't configured.
- **Fix:** Either configure `next.config.js` rewrites, or use `process.env.NEXT_PUBLIC_API_URL` + full URLs consistently. The `cartContext.tsx` correctly uses `${API_URL}/api/...` but `checkout/page.tsx` does not.

---

### MED-10: PayPal Currency Conversion Is Hardcoded and Wrong
- **File:** `backend/apps/payments/views.py:127`
- **Problem:** `"value": str(float(payment.amount) / 140)` — KES to USD conversion hardcoded at 140. The KES/USD rate fluctuates significantly.
- **Risk:** Customers overcharged or undercharged in USD. Financial regulatory issues.
- **Fix:** Use a live currency API or remove PayPal support until properly implemented. The PayPal callback (line 482-489) has `# TODO: Implement` — this entire feature is unfinished and creates a TODO hole in production.

---

## 🟢 LOW — Fix When You Can (Polish and Best Practices)

---

### LOW-01: No `__str__` on `Cart` Model
- **File:** `backend/apps/orders/models.py:16-28`
- No `__str__` method makes admin panel display `Cart object (1)` — useless for debugging.

---

### LOW-02: `Product.stock` Duplicates `Inventory.quantity` — Two Sources of Truth
- **File:** `backend/apps/products/models.py:103` + `models.py:157`
- Both `Product.stock` and `Inventory.quantity` track stock. Only `Inventory` is used for actual validation. `Product.stock` is never updated from `Inventory`. The `in_stock` property reads from `Product.stock`, not `Inventory`. This means the displayed stock level on product pages is wrong.
- **Fix:** Remove `Product.stock` and make `in_stock` read from `inventory.available()`.

---

### LOW-03: No VAT Calculation (16% in Kenya is Legally Required on Receipts)
- **File:** `backend/apps/orders/models.py:98-157`
- Order total has no VAT line. KRA requires 16% VAT displayed separately on e-commerce receipts for registered businesses.
- **Fix:** Add `vat_amount` DecimalField to Order, calculate at checkout, display on receipt.

---

### LOW-04: No Delivery Address Fields on Order
- **File:** `backend/apps/orders/models.py:37-78`
- The Order model has `delivery_region` (mombasa/nairobi/upcountry) but NO actual delivery address. Where does the courier deliver to?
- **Fix:** Add `delivery_address`, `delivery_city`, `delivery_phone` fields to Order.

---

### LOW-05: `console.error` Left in Production Frontend Code
- **Files:** `frontend/src/lib/cartContext.tsx:96, 109, 136, 172, 209, 243` + `frontend/src/app/checkout/page.tsx:44`
- Multiple `console.error()` calls. In production Next.js builds, these are visible in browser DevTools and expose implementation details.
- **Fix:** Replace with proper error handling / user-facing error states. Remove all console.* from production paths.

---

### LOW-06: `PayPalCallbackView` and `CardCallbackView` Are TODO Stubs
- **File:** `backend/apps/payments/views.py:482-498`
- Both callbacks are `# TODO` stubs that log whatever payload arrives and return 200. Anyone who knows the URL can POST anything and get a success response. No payment is ever recorded.
- **Risk (MEDIUM really):** These are live endpoints that appear to accept payments but do nothing. If wired to real PayPal/Stripe they will silently lose all payment data.
- **Fix:** Either implement properly or add `raise NotImplementedError` so they return 501. Do NOT leave TODO stubs returning 200 on live payment endpoints.

---

### LOW-07: Missing `SIMPLE_JWT_SECRET` in `.env.example` vs Implementation
- **File:** `malaika nest/.env.example:27` vs `backend/kenya_ecom/settings.py:222`
- `.env.example` documents `SIMPLE_JWT_SECRET` but settings reads `JWT_SIGNING_KEY`. The wrong env var name documented.

---

### LOW-08: No Error Boundary at App Level for Payment Flows
- **File:** `frontend/src/app/checkout/page.tsx`
- While `components/ErrorBoundary.tsx` exists, it's not used in the checkout page. An uncaught JavaScript error during payment leaves the user with a blank screen.

---

### LOW-09: `reconcile_payments_task` Uses `datetime.utcnow()` While DB Uses Nairobi TZ
- **File:** `backend/apps/payments/tasks.py:92`
- `datetime.datetime.utcnow()` is naive UTC but Django's `USE_TZ=True` with `TIME_ZONE=Africa/Nairobi` means DB timestamps are timezone-aware. Comparing naive UTC to timezone-aware EAT datetimes is incorrect and will query wrong records.
- **Fix:** Use `django.utils.timezone.now()` instead.

---

## 📋 MASTER CHECKLIST

### 🔴 CRITICAL (Fix Before Launch)

- [ ] **1.** Fix Celery task arg mismatch — `verify_mpesa_payment_async` called with 2 args, takes 1
  - File: `backend/apps/payments/views.py:281` + `backend/apps/payments/tasks.py:17`
  - Difficulty: EASY | Standalone: YES

- [ ] **2.** Actually use `ADMIN_URL_SECRET` env var to obscure admin URL
  - File: `backend/kenya_ecom/urls.py:20`
  - Difficulty: EASY | Standalone: YES

- [ ] **3.** Delete `settings.py` in workspace root (hardcoded secrets + catastrophic defaults)
  - File: `settings.py` (workspace root)
  - Difficulty: EASY | Standalone: YES

- [ ] **4.** Remove localhost bypass from M-Pesa callback IP validation
  - File: `backend/apps/payments/views.py:331`
  - Difficulty: EASY | Standalone: YES

- [ ] **5.** Enforce phone number match in M-Pesa callback (or add dead-letter queue)
  - File: `backend/apps/payments/views.py:442-443`
  - Difficulty: MEDIUM | Standalone: YES

- [ ] **6.** Add `payment_status` field to Order model OR remove the dead assignment
  - File: `backend/apps/payments/views.py:451` + `backend/apps/orders/models.py`
  - Difficulty: EASY | Standalone: NO — needs migration

- [ ] **7.** Fix guest payment access control — remove `Q(order__user__isnull=True)` from payment lookup
  - File: `backend/apps/payments/views.py:172-176`
  - Difficulty: EASY | Standalone: YES

- [ ] **8.** Fix `verify_mpesa_payment_async` to use `MPESA_ENV` to select correct Safaricom API URL
  - File: `backend/apps/payments/tasks.py:31`
  - Difficulty: EASY | Standalone: YES

- [ ] **9.** Fix guest checkout race condition — replace `inv.quantity -= qty; inv.save()` with F() expression
  - File: `backend/apps/orders/views.py:130-132`
  - Difficulty: EASY | Standalone: YES

- [ ] **10.** Fix checkout frontend to call `InitiatePaymentView` first, then `MpesaSTKPushView`
  - File: `frontend/src/app/checkout/page.tsx:88-96`
  - Difficulty: MEDIUM | Standalone: NO — needs backend endpoint consolidation

### 🟠 HIGH (Fix Within 48 Hours)

- [ ] **11.** Reduce `ACCESS_TOKEN_LIFETIME` from 7 days to 15 minutes
  - File: `backend/kenya_ecom/settings.py:223`
  - Difficulty: EASY | Standalone: YES

- [ ] **12.** Fix `resend_verification_view` to not leak whether email exists (return same message regardless)
  - File: `backend/apps/accounts/views.py:157-158`
  - Difficulty: EASY | Standalone: YES

- [ ] **13.** Make rate limiting atomic using `cache.incr()` not `cache.set(current+1, ...)`
  - File: `backend/apps/core/middleware.py:108-109`
  - Difficulty: MEDIUM | Standalone: YES

- [ ] **14.** Add duplicate payment check in `InitiatePaymentView` — use `get_or_create`
  - File: `backend/apps/payments/views.py:73`
  - Difficulty: EASY | Standalone: YES

- [ ] **15.** Fix `verify_mpesa_payment_async` empty timestamp in password generation
  - File: `backend/apps/payments/tasks.py:40-45`
  - Difficulty: EASY | Standalone: YES

- [ ] **16.** Verify/test that M-Pesa callback endpoint bypasses CSRF in production
  - File: `backend/apps/payments/views.py:319`
  - Difficulty: MEDIUM | Standalone: YES

- [ ] **17.** Standardize `MPESA_BUSINESS_SHORT_CODE` vs `MPESA_SHORTCODE` env var names
  - File: `backend/apps/payments/tasks.py:38` + `views.py:192`
  - Difficulty: EASY | Standalone: NO — needs .env update

### 🟡 MEDIUM (Fix This Week)

- [ ] **18.** Restore inventory on order cancellation
  - File: `backend/apps/orders/views.py:241-252`
  - Difficulty: MEDIUM | Standalone: NO — needs inventory logic

- [ ] **19.** Add `retry_payment` flow for `payment_failed` orders
  - File: `backend/apps/orders/views.py` (new action needed)
  - Difficulty: HARD | Standalone: NO — depends on payment flow

- [ ] **20.** Add `LOGGING` configuration to production settings
  - File: `backend/kenya_ecom/settings.py`
  - Difficulty: EASY | Standalone: YES

- [ ] **21.** Add token expiry to email verification flow
  - File: `backend/apps/accounts/views.py:104-123` + `accounts/models.py`
  - Difficulty: MEDIUM | Standalone: NO — needs migration

- [ ] **22.** Add pagination to `OrderViewSet`
  - File: `backend/apps/orders/views.py:204`
  - Difficulty: EASY | Standalone: YES

- [ ] **23.** Validate stock quantity when adding to cart
  - File: `backend/apps/orders/views.py:31-45`
  - Difficulty: EASY | Standalone: YES

- [ ] **24.** Add `unique_together = ('product', 'user')` to Review model
  - File: `backend/apps/products/models.py:228`
  - Difficulty: EASY | Standalone: NO — needs migration

- [ ] **25.** Add rate limiting to `resend_verification_view`
  - File: `backend/apps/accounts/views.py:126`
  - Difficulty: EASY | Standalone: YES

- [ ] **26.** Fix checkout frontend to use `NEXT_PUBLIC_API_URL` for all fetch calls consistently
  - File: `frontend/src/app/checkout/page.tsx`
  - Difficulty: EASY | Standalone: YES

- [ ] **27.** Fix PayPal USD/KES conversion (rate hardcoded at 140)
  - File: `backend/apps/payments/views.py:127`
  - Difficulty: MEDIUM | Standalone: YES

### 🟢 LOW (Fix When Possible)

- [ ] **28.** Add `__str__` to `Cart` model
  - File: `backend/apps/orders/models.py:16`
  - Difficulty: EASY | Standalone: YES

- [ ] **29.** Remove `Product.stock` duplicate, make `in_stock` read from `Inventory.available()`
  - File: `backend/apps/products/models.py:103, 142`
  - Difficulty: MEDIUM | Standalone: NO — needs migration + serializer update

- [ ] **30.** Add VAT (16%) calculation to orders and receipts
  - File: `backend/apps/orders/models.py`
  - Difficulty: HARD | Standalone: NO — needs model, checkout, and frontend changes

- [ ] **31.** Add delivery address fields to Order model
  - File: `backend/apps/orders/models.py`
  - Difficulty: MEDIUM | Standalone: NO — needs migration + frontend form

- [ ] **32.** Remove all `console.error()` calls from production frontend code
  - File: `frontend/src/lib/cartContext.tsx` + `frontend/src/app/checkout/page.tsx`
  - Difficulty: EASY | Standalone: YES

- [ ] **33.** Implement or disable PayPal/Card callback endpoints (currently TODO stubs returning 200)
  - File: `backend/apps/payments/views.py:482-498`
  - Difficulty: HARD | Standalone: YES

- [ ] **34.** Fix `SIMPLE_JWT_SECRET` vs `JWT_SIGNING_KEY` env var name in `.env.example`
  - File: `malaika nest/.env.example:27`
  - Difficulty: EASY | Standalone: YES

- [ ] **35.** Fix `reconcile_payments_task` to use `timezone.now()` instead of `datetime.utcnow()`
  - File: `backend/apps/payments/tasks.py:92`
  - Difficulty: EASY | Standalone: YES

---

## 📊 SITE READINESS SCORE: **41 / 100**

| Category | Score | Notes |
|---|---|---|
| **Security** | 11/25 | httpOnly cookies ✅, CORS locked ✅, but admin URL exposed ❌, localhost callback bypass ❌, 7-day access tokens ❌, guest payment access hole ❌ |
| **Payment Reliability** | 8/25 | IP validation exists ✅, idempotency check ✅, but checkout flow is broken ❌, task arg mismatch ❌, empty timestamp bug ❌, phone mismatch accepted ❌ |
| **Code Quality** | 10/20 | Good model design ✅, atomic inventory ✅ (authenticated path only), but dead `payment_status` field ❌, race condition in guest path ❌, TODO stubs on live endpoints ❌ |
| **Frontend Polish** | 7/15 | Error states exist ✅, loading states ✅, httpOnly cookie auth ✅, but relative URL inconsistency ❌, no error boundary at checkout ❌ |
| **Infrastructure** | 5/15 | Cannot assess directly from code (no access to VM), but admin URL unobscured confirms at least one infra concern |

---

## ⚡ TOP 5 THINGS TO FIX RIGHT NOW

**These can cause immediate money loss or security breach today:**

1. **CRIT-10: Fix the checkout frontend** — The M-Pesa payment flow as coded is completely broken. It calls the wrong endpoint with wrong parameters. **No customer can successfully pay right now.** Fix: consolidate `InitiatePayment` + `MpesaSTKPush` into one endpoint that accepts `order_id`.

2. **CRIT-01: Fix the Celery task arg mismatch** — The payment verification fallback (`verify_mpesa_payment_async`) crashes on every invocation due to wrong number of arguments. Combined with CRIT-10, this means if a payment does somehow succeed, the fallback verification also fails.

3. **CRIT-04: Remove the localhost callback bypass** — Any SSRF, server-side misconfiguration, or compromised local process can fire fabricated M-Pesa callbacks and mark orders as paid with zero actual payments.

4. **CRIT-03: Delete or fix `settings.py` in workspace root** — It contains a hardcoded DB password (`malaika_pass_2024`), defaults to `DEBUG=True`, `ALLOWED_HOSTS=["*"]`, and `CORS_ALLOW_ALL_ORIGINS=True`. If accidentally used, it's total compromise.

5. **CRIT-02: Fix the admin URL** (read the env var!) — The `ADMIN_URL_SECRET` is fetched but never used. The Django admin is sitting at `/admin/` being scanned by bots 24/7. Fix is literally 1 line of code.
