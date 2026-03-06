# FIXES_CHECKLIST.md

## 1. Critical Security (Fix Before Go-Live)

- [ ] Rotate all leaked credentials and remove plaintext secrets from `backend/.env` and historical backups.
  - File: `backend/.env`
  - Difficulty: MEDIUM
  - Independent: NO (depends on infra secret rollout and service restarts)
- [ ] Regenerate Django secret/JWT secrets and enforce secure prod env loading only.
  - Files: `backend/.env`, `backend/kenya_ecom/settings.py`, `backend/config/settings/base.py`
  - Difficulty: MEDIUM
  - Independent: NO (depends on auth token invalidation plan)
- [x] Replace default admin fallback path and enforce non-default `ADMIN_URL_SECRET`.
  - File: `backend/kenya_ecom/urls.py`
  - Difficulty: EASY
  - Independent: YES
- [x] Lock callback trust model in production: reject non-Safaricom callbacks regardless of env misconfig.
  - File: `backend/apps/payments/views.py`
  - Difficulty: MEDIUM
  - Independent: NO (depends on M-Pesa sandbox/live testing)
- [x] Fix callback unmatched-payment crash (`Payment.objects.create` without required order FK).
  - File: `backend/apps/payments/views.py`
  - Difficulty: MEDIUM
  - Independent: YES
- [x] Enforce strict phone validation for M-Pesa callback (hard-fail mismatch or explicit approved policy).
  - File: `backend/apps/payments/views.py`
  - Difficulty: MEDIUM
  - Independent: YES
- [x] Prevent catalog tampering: restrict product/category/brand writes to admins only.
  - File: `backend/apps/products/views.py`
  - Difficulty: EASY
  - Independent: YES
- [x] Remove exposed backend port from production compose or firewall it to reverse proxy only.
  - File: `docker-compose.prod.yml`
  - Difficulty: EASY
  - Independent: NO (depends on deployment topology)

## 2. Payments & Money Integrity

- [x] Stop truncating money values (`int(payment.amount)`); preserve exact Decimal amount formatting.
  - File: `backend/apps/payments/views.py`
  - Difficulty: EASY
  - Independent: YES
- [x] Add callback HTTPS enforcement (must be `https://` in live mode, not only non-localhost).
  - File: `backend/apps/payments/views.py`
  - Difficulty: EASY
  - Independent: YES
- [ ] Prevent premature paid status from STK query path unless reconciliation rules are satisfied.
  - File: `backend/apps/payments/tasks.py`
  - Difficulty: HARD
  - Independent: NO (depends on callback + reconciliation design)
- [ ] Add transaction timeout/expiry policy and enforce order transition rules.
  - Files: `backend/apps/payments/tasks.py`, `backend/apps/orders/models.py`, `backend/apps/orders/views.py`
  - Difficulty: HARD
  - Independent: NO (depends on business policy)
- [ ] Add immutable payment audit trail model for dispute handling.
  - Files: `backend/apps/payments/models.py`, `backend/apps/payments/views.py`
  - Difficulty: HARD
  - Independent: NO (requires migration + admin/reporting updates)

## 3. Auth, Session, and Rate Limiting

- [x] Fix cookie/JWT flow mismatch (tokens removed from body but auth class expects headers).
  - Files: `backend/apps/accounts/views.py`, `backend/apps/accounts/authentication.py`, `backend/kenya_ecom/settings.py`
  - Difficulty: HARD
  - Independent: NO (touches backend and frontend auth flow)
- [x] Implement functional refresh flow for cookie auth (refresh endpoint must read cookie or client must send token).
  - Files: `backend/apps/accounts/views.py`, `backend/apps/accounts/urls.py`, `frontend/src/lib/api.ts`
  - Difficulty: HARD
  - Independent: NO
- [x] Apply real throttling to registration/password reset/resend verification endpoints.
  - File: `backend/apps/accounts/views.py`
  - Difficulty: MEDIUM
  - Independent: YES
- [x] Align rate-limit sensitive endpoint paths with actual routes (`/token/` not `/login/`).
  - File: `backend/apps/core/middleware.py`
  - Difficulty: EASY
  - Independent: YES
- [x] Ensure logout invalidates cookies server-side, not only optional body refresh token.
  - Files: `backend/apps/accounts/views.py`, `frontend/src/app/admin/layout.tsx`
  - Difficulty: MEDIUM
  - Independent: NO

## 4. Runtime Breakages

- [ ] Resolve settings/package split: single source of truth for settings module and dependency set.
  - Files: `backend/manage.py`, `backend/kenya_ecom/settings.py`, `backend/config/settings/*`, `backend/requirements.txt`
  - Difficulty: HARD
  - Independent: NO
- [ ] Fix environment so `manage.py` runs (currently broken by missing/incorrect package set).
  - Files: `backend/requirements.txt`, virtualenv lock/install pipeline
  - Difficulty: MEDIUM
  - Independent: NO
- [x] Fix `Wishlist` code using nonexistent `user_email` fields.
  - Files: `backend/apps/products/views.py`, `backend/apps/products/serializers.py`, `backend/apps/products/models.py`
  - Difficulty: MEDIUM
  - Independent: YES
- [ ] Fix invalid prefetch (`images`) on `Product` queryset.
  - File: `backend/apps/products/admin_views.py`
  - Difficulty: EASY
  - Independent: YES
- [ ] Fix admin reports referencing nonexistent model fields (`order_number`, `price_at_purchase`).
  - File: `backend/apps/orders/admin_views.py`
  - Difficulty: MEDIUM
  - Independent: YES
- [x] Remove duplicate class definition in order serializers.
  - File: `backend/apps/orders/serializers.py`
  - Difficulty: EASY
  - Independent: YES

## 5. Frontend Reliability & Security

- [x] Move admin route protection to root `frontend/middleware.ts` with `/admin/:path*` matcher.
  - Files: `frontend/middleware.ts`, `frontend/src/middleware.ts`
  - Difficulty: EASY
  - Independent: YES
- [x] Remove impossible httpOnly cookie reads from client JS admin login checks.
  - File: `frontend/src/app/admin/login/page.tsx`
  - Difficulty: EASY
  - Independent: YES
- [ ] Fix API base URL strategy to avoid production calls to `localhost`/raw IP over HTTP.
  - Files: `frontend/.env.local`, `frontend/.env.production*`, `docker-compose.prod.yml`, `frontend/src/lib/api.ts`
  - Difficulty: MEDIUM
  - Independent: NO
- [ ] Ensure all frontend API calls use shared API client instead of brittle relative fetches.
  - Files: `frontend/src/app/checkout/page.tsx`, `frontend/src/app/account/orders/page.tsx`
  - Difficulty: MEDIUM
  - Independent: YES
- [x] Replace raw `<img>` with Next `Image` where applicable and fix decimal price rendering.
  - File: `frontend/src/app/account/orders/page.tsx`
  - Difficulty: EASY
  - Independent: YES

## 6. Deployment & Ops

- [ ] Enforce HTTPS redirect and remove contradictory/duplicate nginx configs.
  - Files: `deployment/nginx-production.conf`, `deployment/nginx.prod.conf`, `malaikanest-nginx.conf`
  - Difficulty: MEDIUM
  - Independent: NO
- [x] Remove invalid IP-based certificate workflow and correct setup script outputs.
  - File: `deployment/setup-vm.sh`
  - Difficulty: MEDIUM
  - Independent: NO
- [ ] Verify and pin process manager configuration for backend/frontend restart behavior.
  - Files: `backend/ecosystem.config.js`, `frontend/ecosystem.config.js`, `deployment/gunicorn.service`
  - Difficulty: MEDIUM
  - Independent: NO
- [ ] Keep backup job plus add restore drill automation and reporting.
  - Files: `deployment/backup.sh`, operational runbooks
  - Difficulty: HARD
  - Independent: NO
- [x] Harden firewall profile (remove public 8000 unless strictly required).
  - File: `deployment/ufw.sh`
  - Difficulty: EASY
  - Independent: YES
