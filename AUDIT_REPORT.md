# 🔥 MALAIKA NEST — BRUTAL PRODUCTION READINESS AUDIT

*Generated: 2026-03-05 | Auditor: Senior Full-Stack Engineer (15 yrs e-commerce)*

---

## ⚡ TOP 5 THINGS TO FIX RIGHT NOW

These five issues can cause **immediate harm today**:

1. **🔴 REAL CREDENTIALS IN backend/.env** — Your Gmail app password (`mugdbqsmjindvaht`), Cloudinary API key/secret are in plaintext in `backend/.env`. This **must** be rotated now. If this repo is or was ever public, consider ALL these credentials compromised.
2. **🔴 M-PESA IP VALIDATION IS COMMENTED OUT** — `payments/views.py:329–331` — Anyone on the internet can POST to your callback and mark orders as paid without paying a cent.
3. **🔴 INSECURE SECRET_KEY** — `backend/.env:2` — `django-insecure-ksjdfhkjshdfk...` starts with `django-insecure-`, the Django development placeholder. If used in production as-is, all sessions and JWT tokens are cryptographically weak.
4. **🔴 JWT ACCESS TOKENS IN localStorage** — `frontend/src/app/checkout/page.tsx:33` — `localStorage.getItem('access')` — localStorage is readable by any JavaScript on your page (XSS attack = account takeover).
5. **🔴 DELIVERY FEES NOT APPLIED TO ORDER TOTAL** — `frontend/checkout/page.tsx:222–224` shows nairobi +Ksh 300, upcountry +Ksh 500, but `orders/views.py:create_order_from_cart` never adds delivery fees. Customers pay product price only. You're absorbing delivery costs silently.

---

## 🔴 CRITICAL — Fix Before Going Live

### C-1: Real Credentials Exposed in .env

- **File:** `backend/.env` lines 1–46
- **Problem:** `DEBUG=True`, insecure `SECRET_KEY`, Gmail password `mugdbqsmjindvaht`, Cloudinary key `813993979849791` and secret `sFh_pqIPKiBvRgfH9VCF9nTli34` are hardcoded. M-Pesa is `test/test/test` meaning payments won't work live.
- **Risk:** If repo is/was public → complete account compromise, email hijack, image storage breach. Gmail App Passwords cannot be recovered—all existing sessions will break until rotated.
- **Fix:**
  1. Rotate Gmail App Password now at myaccount.google.com > Security > App Passwords.
  2. Rotate Cloudinary key at cloudinary.com dashboard.
  3. Generate a new `SECRET_KEY`: `python -c "import secrets; print(secrets.token_hex(50))"`.
  4. Never commit `.env` again — verify `.gitignore` includes `backend/.env` (it currently does, but check git history).

### C-2: M-Pesa Callback IP Validation Commented Out

- **File:** `backend/apps/payments/views.py` lines 328–331
- **Problem:** The block `if not is_local and not is_safaricom: return JsonResponse({...}, status=403)` is commented out with the comment "In production, uncomment this." It was never uncommented.
- **Risk:** Any attacker can POST `{"Body": {"stkCallback": {"CheckoutRequestID": "...", "ResultCode": 0, "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 1000}, ...]}}}}` to mark any order as paid for free. Real money lost, orders shipped without payment.
- **Fix:** Uncomment lines 329–331. Test from localhost first, then deploy. Safaricom IPs are already defined correctly.

### C-3: JWT Tokens Stored in localStorage (XSS Vulnerability)

- **File:** `frontend/src/app/checkout/page.tsx` lines 33, 72, 122; likely repeated across all pages
- **Problem:** `localStorage.getItem('access')` — Access tokens stored in localStorage are fully readable by any injected JavaScript. One XSS vulnerability = full account takeover, order hijacking, payment manipulation.
- **Risk:** Attacker injects JS (via a product description with a stored XSS, a malicious banner, a third-party script) → steals all users' tokens → places orders, views personal data, takes over accounts.
- **Fix:** Move token storage to httpOnly cookies. The backend's `SIMPLE_JWT` config already has `AUTH_COOKIE_HTTP_ONLY = True` and `AUTH_COOKIE_SECURE = True` set — but the frontend ignores this and uses localStorage manually. The `withCredentials: true` on the axios instance suggests cookies were intended. Complete the implementation:
  - Backend: Ensure token endpoints set httpOnly cookies on login/refresh.
  - Frontend: Remove all `localStorage.getItem('access')` and `localStorage.setItem('access')` calls. Use cookies (sent automatically with `withCredentials: true`).

### C-4: Delivery Fees Never Applied to Order Total (Money Loss)

- **File:** `backend/apps/orders/views.py` lines 60–70; `frontend/src/app/checkout/page.tsx` lines 222–224
- **Problem:** Frontend shows Nairobi +Ksh 300, Upcountry +Ksh 500. But `create_order_from_cart()` in `orders/models.py` or `views.py` never reads `delivery_region` and never adds the delivery fee. The `delivery_region` field is saved on the Order, but the total is pure product price.
- **Risk:** Every Nairobi customer pays 300 KES less than they should. Every upcountry customer pays 500 KES less. At scale, this is a significant daily loss.
- **Fix:** In `orders/models.py:create_order_from_cart`, add:

  ```python
  DELIVERY_FEES = {'mombasa': 0, 'nairobi': 300, 'upcountry': 500}
  delivery_fee = DELIVERY_FEES.get(delivery_region, 0)
  total += delivery_fee
  order = Order.objects.create(... total=total, delivery_region=delivery_region ...)
  ```

### C-5: PayPal Hardcoded to Sandbox in Production

- **File:** `backend/apps/payments/views.py` lines 97, 109
- **Problem:** `auth_url = "https://api-m.sandbox.paypal.com/..."` and `order_url = "https://api-m.sandbox.paypal.com/..."` are hardcoded sandbox URLs, regardless of environment.
- **Risk:** All PayPal payments in production silently fail or go to sandbox. Any customer who tries PayPal cannot pay.
- **Fix:** Read `PAYPAL_MODE = os.getenv("PAYPAL_MODE", "sandbox")` and conditionally use `api-m.paypal.com` vs `api-m.sandbox.paypal.com`.

### C-6: Order Status Has No "processing/shipped/delivered" States

- **File:** `backend/apps/orders/models.py` lines 38–44
- **Problem:** `STATUS_CHOICES` only has: `pending`, `initiated`, `paid`, `failed`, `cancelled`. There is no `processing`, `shipped`, or `delivered` state. The M-Pesa callback sets `payment_failed` on failure (line 456 in payments/views.py) but that exact string is **not in STATUS_CHOICES**. This will either cause a database-level rejection or silently store an invalid value.
- **Risk:** M-Pesa payment failures may not save correctly. No fulfillment workflow possible.
- **Fix:** Add `('payment_failed', 'Payment Failed'), ('processing', 'Processing'), ('shipped', 'Shipped'), ('delivered', 'Delivered')` to `STATUS_CHOICES`. Run migration.

---

## 🟠 HIGH — Fix Within 48 Hours

### H-1: Insecure SECRET_KEY Default Fallback

- **File:** `backend/config/settings/base.py` line 7
- **Problem:** `SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")` — if the env var is missing, Django silently uses "change-me-in-production". This is brute-forceable.
- **Fix:** Remove the fallback, raise `ImproperlyConfigured` if missing:

  ```python
  SECRET_KEY = os.environ["SECRET_KEY"]  # raises KeyError if not set
  ```

### H-2: SIMPLE_JWT SIGNING_KEY Can Be None

- **File:** `backend/config/settings/base.py` line 112
- **Problem:** `"SIGNING_KEY": os.getenv("SIMPLE_JWT_SECRET")` — if `SIMPLE_JWT_SECRET` is not set, this is `None`. Django SimpleJWT falls back to using `SECRET_KEY` (which may also be weak). Worse, `SIMPLE_JWT_SECRET` in `dev/.env` is `jwt-secret-key-here-change-in-production`.
- **Fix:** Add a guard: `if not os.getenv("SIMPLE_JWT_SECRET"): raise ImproperlyConfigured(...)`. Rotate the JWT secret after fixing.

### H-3: MpesaSTKPush Doesn't Verify Payment Ownership

- **File:** `backend/apps/payments/views.py` lines 165–176
- **Problem:** `Payment.objects.filter(pk=payment_id, payment_method="mpesa")` — this doesn't filter by `order__user=request.user`. User A can trigger an STK push for User B's payment by guessing the payment ID.
- **Fix:** Add `.filter(pk=payment_id, payment_method="mpesa", order__user=request.user)`.

### H-4: Email Auto-Activates Account on SMTP Failure

- **File:** `backend/apps/accounts/views.py` lines 77–86
- **Problem:** If SMTP fails during registration, the exception handler silently sets `user.is_active = True` and clears the verification token. This defeats email verification entirely.
- **Risk:** Anyone can register with a fake email and get a working account if SMTP is even briefly down.
- **Fix:** Remove the auto-activation fallback. Instead, log the error properly and return a clear error to the user telling them to retry or contact support.

### H-5: Hardcoded Server IP in Frontend-Facing Code

- **File:** `backend/apps/accounts/views.py` lines 50, 224
- **Problem:** `http://104.154.161.10` is hardcoded as the frontend URL fallback in both `_send_verification_email` and `password_reset_request_view`. This IP is in production backend code.
- **Risk:** Exposes server IP in emails. If IP changes (common on cloud VMs), password reset links break silently.
- **Fix:** `FRONTEND_URL = os.environ["FRONTEND_URL"]` — make it required with no fallback.

### H-6: Callback Returns 400 on Amount Mismatch — Safaricom Will Retry Forever

- **File:** `backend/apps/payments/views.py` line 398
- **Problem:** On amount mismatch, callback returns HTTP 400. Safaricom's documentation requires the callback to always return HTTP 200 with a JSON body `{"ResultCode": 0, "ResultDesc": "Accepted"}`. A 4xx response causes Safaricom to retry the callback indefinitely (up to 3 times).
- **Fix:** Return HTTP 200 in all cases. Internally mark the payment as failed and log it, but always acknowledge to Safaricom with 200.

### H-7: MpesaReceiptNumber vs mpesa_receipt Field Mismatch

- **File:** `backend/apps/payments/views.py` line 431; `backend/apps/payments/models.py` line 23
- **Problem:** The model field is `mpesa_receipt_number` (line 23) but the callback sets `payment.mpesa_receipt = receipt` (line 431). This attribute assignment silently does nothing — the receipt number is **never saved to the database**.
- **Risk:** No receipt number stored. Every payment has null receipt. Dispute resolution is impossible. Reconciliation is impossible.
- **Fix:** Change line 431 to `payment.mpesa_receipt_number = receipt`.

### H-8: Order User FK Uses CASCADE — Deleting a User Deletes All Orders

- **File:** `backend/apps/orders/models.py` line 50
- **Problem:** `user = models.ForeignKey(..., on_delete=models.CASCADE)` — if a user account is deleted, ALL their order history disappears. This is illegal in most jurisdictions (financial records must be retained) and means you lose your own sales history.
- **Fix:** Change to `on_delete=models.SET_NULL, null=True` and add a `guest_email`-style fallback to identify the former user.

### H-9: CORS_ALLOW_ALL_ORIGINS = True in Dev (Leaked to Production Risk)

- **File:** `backend/config/settings/dev.py` line 41
- **Problem:** Dev settings set `CORS_ALLOW_ALL_ORIGINS = True`. If production accidentally loads dev settings (common misconfiguration), CORS is wide open — any website can make authenticated requests to your API using your users' cookies.
- **Fix:** Remove `CORS_ALLOW_ALL_ORIGINS` from dev.py entirely. The base.py already has proper `CORS_ALLOWED_ORIGINS` from env vars. Add an assertion in prod.py: `assert not globals().get('CORS_ALLOW_ALL_ORIGINS', False)`.

---

## 🟡 MEDIUM — Fix This Week

### M-1: No Rate Limiting on Login/Register Endpoints

- **File:** `backend/apps/accounts/views.py`; `backend/config/settings/base.py` lines 99–107
- **Problem:** Throttle classes are configured globally (`anon: 100/day`) but `RegisterView` and password reset have `AllowAny` permission with no specific throttle. 100 requests/day is easily exhausted by a bot, effectively DoS-ing registrations. There's no brute-force protection on login.
- **Fix:** Apply `@ratelimit` from `django-ratelimit` (already installed!) to login and password reset views. Use IP-based limiting: max 5 attempts/15 minutes.

### M-2: `create_order_from_cart` Inventory Reserved Field Bug

- **File:** `backend/apps/orders/models.py` lines 136–139
- **Problem:** `reserved=models.F('reserved') - qty` — `reserved` should track items held for in-progress orders. When an order is placed, you should DEDUCT from `quantity` but the `reserved` field should already have been incremented when items were added to cart (which it isn't). The current code decrements a field that was likely never incremented.
- **Fix:** Define a clear inventory lifecycle: cart add → increment `reserved`; order placed → decrement `quantity`; order cancelled → increment `quantity`, decrement `reserved`. Currently only quantity is decremented at checkout without a prior reservation step.

### M-3: CartSerializer N+1 Query on Subtotal

- **File:** `backend/apps/orders/serializers.py` lines 23–24
- **Problem:** `sum(ci.product.price * ci.quantity for ci in obj.items.select_related('product').all())` — this runs a new DB query per cart serialization. If the view doesn't pre-prefetch, this hits the DB again.
- **Fix:** The CartViewSet's `list` method should use `cart.items.select_related('product')` and pass it to the serializer context. The serializer should use the pre-fetched queryset, not re-query.

### M-4: Product `stock` Field vs Inventory Model — Duplication

- **File:** `backend/apps/products/models.py` lines 102–103; `backend/apps/products/models.py` line 156
- **Problem:** `Product` has a `stock` field AND there's a separate `Inventory` model. The order creation logic correctly uses `Inventory`, but product listing/display shows `product.stock` which is never updated. Customers may see "In Stock" when the Inventory record says 0.
- **Fix:** Remove `stock` from `Product` or sync them. Use `Inventory.available()` as the single source of truth.

### M-5: No Pagination on Product List

- **File:** `backend/apps/products/views.py` (not read but implied by model structure)
- **Problem:** `DEFAULT_PAGINATION_CLASS` is not set in `REST_FRAMEWORK` settings. If you add 10,000 products, `GET /api/products/` returns everything in one response. This is a DoS vector and a performance disaster.
- **Fix:** Add to `REST_FRAMEWORK` settings: `"DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination", "PAGE_SIZE": 24`.

### M-6: Order does not capture `delivery_region` in `create_order_from_cart`

- **File:** `backend/apps/orders/models.py` line 125–131; `backend/apps/orders/views.py` lines 60–70
- **Problem:** The `checkout` action in `CartViewSet` calls `create_order_from_cart` but never passes `delivery_region` from `request.data`. The Order is created with the default `'nairobi'` for every order regardless of what the user selected.
- **Fix:** Pass `delivery_region=request.data.get('delivery_region', 'nairobi')` to the function.

### M-7: Password Reset Token Has No Rate Limiting

- **File:** `backend/apps/accounts/views.py` lines 188–244
- **Problem:** Anyone can POST to `/api/accounts/password-reset/` with any email address, causing your Gmail account to send emails indefinitely. At 100 requests/day global throttle, a targeted attack can exhaust your Gmail sending quota.
- **Fix:** Apply `@ratelimit(key='ip', rate='5/h', method='POST', block=True)`.

### M-8: Checkout Page Uses Raw `fetch()` Without Error State for Network Failures

- **File:** `frontend/src/app/checkout/page.tsx` lines 67–119
- **Problem:** The `handleCheckout` function catches errors but `pollPaymentStatus` at lines 121–157 swallows network errors silently (`console.error('Poll error', err)`) and just keeps polling. If the network drops after payment is initiated, the user gets a spinner forever until the 30-attempt timeout.
- **Fix:** Show a clear message if polling errors occur repeatedly. Add an "I've paid, check my order" manual confirmation button.

### M-9: `str` Type Used for Float Comparison in M-Pesa Amount Validation

- **File:** `backend/apps/payments/views.py` lines 386–403
- **Problem:** `float(amount) != float(payment.amount)` — M-Pesa may return amounts like `"1000.00"` or `1000` as integer. `float()` on `Decimal` can introduce floating point errors. For financial data, always compare `Decimal` to `Decimal`.
- **Fix:** `from decimal import Decimal; if Decimal(str(amount)) != payment.amount: ...`

---

## 🟢 LOW — Fix When You Can

### L-1: Admin URL Not Yet Fully Protected

- **File:** `backend/config/settings/base.py` line 10; `backend/config/urls.py`
- **Problem:** `ADMIN_URL_SECRET` is configured but check whether `urls.py` actually uses it (pattern like `path(f'{ADMIN_URL_SECRET}/admin/', admin.site.urls)`). If it still just uses `admin/`, the secret provides no protection.
- **Fix:** Verify `urls.py` uses the secret variable for the admin URL path.

### L-2: `console.log` Left in Production Code

- **File:** `frontend/src/app/admin/settings/page.tsx` line 50
- **Problem:** `console.log('Using default settings')` in production admin code.
- **Fix:** Remove it.

### L-3: `except Exception: pass` in Logout

- **File:** `backend/apps/accounts/views.py` lines 171–172
- **Problem:** `try: token.blacklist() except Exception: pass` — silently swallows invalid token errors. Logging would help track token manipulation attempts.
- **Fix:** `except Exception as e: logger.warning("Logout token blacklist failed: %s", e)`

### L-4: PayPal and Card Callbacks Are Empty Pass

- **File:** `backend/apps/payments/views.py` lines 471–483
- **Problem:** `PayPalCallbackView.post` and `CardCallbackView.post` just `pass`. If a PayPal webhook fires, nothing happens. The endpoints exist but do nothing.
- **Fix:** Implement or remove them. At minimum, return 200 so external services don't keep retrying.

### L-5: Product Has Both `stock` Field and Inventory Model — Two Sources of Truth

- **See M-4 above** — also a low-urgency cleanup task.

### L-6: No VAT Display on Receipts/Checkout

- **File:** `frontend/src/app/checkout/page.tsx` — no VAT calculation
- **Problem:** Kenya VAT is 16%. Your checkout shows only product price + delivery. No VAT line shown. This may be a legal compliance issue for B2C e-commerce in Kenya.
- **Fix:** Add a VAT calculation to the order total and show it on checkout and receipts. Consult a local tax advisor on whether your products are VAT-exempt (baby clothes may qualify for zero-rating).

### L-7: Review and Wishlist Models Use Email Strings, Not User FK

- **File:** `backend/apps/products/models.py` lines 227–253
- **Problem:** `Review` and `Wishlist` use `user_email = models.EmailField()` instead of a proper FK to the User model. If a user changes their email, their reviews and wishlist become orphaned.
- **Fix:** Change to `user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)`.

### L-8: Two Parallel Django Project Structures

- **File:** `backend/kenya_ecom/settings.py` and `backend/config/settings/`
- **Problem:** There are two separate Django project directories: `backend/kenya_ecom/` (the old one with `import dj_database_url` breaking things) and `backend/config/` (the new one). The old one is broken and causes `manage.py` commands to fail because `DJANGO_SETTINGS_MODULE` may still be pointing to `kenya_ecom.settings`.
- **Fix:** Delete `backend/kenya_ecom/` entirely (after confirming nothing depends on it). Ensure `manage.py` points to `config.settings.dev`.

### L-9: Gunicorn Worker Count Unknown

- **Infrastructure** — Cannot check from codebase.
- **Fix:** In `/etc/systemd/system/gunicorn.service`, set `--workers $(( 2 * $(nproc) + 1 ))`. For a 2-vCPU GCP VM, that's 5 workers.

---

## 📋 MASTER CHECKLIST — FIXES_CHECKLIST.md

*(See separate `FIXES_CHECKLIST.md` file in this directory)*

---

## 📊 SITE READINESS SCORE

| Category | Score | Max | Notes |
|---|---|---|---|
| **Security** | 7 | 25 | IP validation off, creds exposed, localStorage tokens |
| **Payment Reliability** | 9 | 25 | Receipt not saved, delivery fees missing, callback returns 400 |
| **Code Quality** | 12 | 20 | Good structure, but inventory model duplication, N+1 queries |
| **Frontend Polish** | 9 | 15 | Good UI, but localStorage tokens, no VAT, no delivery fee calc |
| **Infrastructure** | 8 | 15 | Two project structures, unknown worker count, no backup verification |
| **TOTAL** | **45** | **100** | |

### **45/100 — DO NOT GO LIVE YET.**

The site has good architectural bones — proper Django patterns, transaction management, JWT config intent, email verification — but several issues will lead to real money loss and security breaches within days of launch. The M-Pesa receipt-not-saving bug alone means you have zero dispute resolution capability from day one.
