# MalaikaNest Security and Go-Live Audit Report
Date: 2026-03-06
Domain: https://malaikanest.duckdns.org

## Executive Status
Go-live readiness: BLOCKED
Reason: Critical security and functional defects are still present on the live VM deployment.

## What Was Fixed in Local Code (This Run)
1. Hardened rate-limit middleware against Redis outages.
- File: backend/apps/core/middleware.py
- Change: `_get_remaining_requests()` now catches cache exceptions and fails safe.

2. Hardened auth lockout/telemetry cache access against Redis outages.
- File: backend/apps/accounts/security.py
- Change: all cache get/set/delete operations now fail safe instead of throwing 500s.

3. Made cache backend resilient for non-Redis environments.
- File: backend/kenya_ecom/settings.py
- Change: uses Redis only when `REDIS_URL` is explicitly set; otherwise falls back to local memory cache.

4. Added regression coverage for admin endpoint auth boundary.
- File: backend/apps/products/tests_permissions.py
- Change: added test to ensure anonymous users cannot access `/api/products/admin/products/`.

5. Frontend production build verification.
- Result: `npm run build` completed successfully (Next.js 15 build green).

## Live Vulnerabilities/Failures Found

### Critical
1. DEBUG mode is enabled on production backend.
- Evidence: live error page from `/api/products/admin/products/` exposes full Django traceback/settings and says `DEBUG = True`.
- Risk: sensitive config disclosure, attack surface mapping, exploit acceleration.
- Required fix: set `DEBUG=False`, ensure production `.env` loaded, restart backend service.

2. Admin products endpoint crashes (500) instead of enforcing auth boundary (401/403).
- Endpoint: `/api/products/admin/products/`
- Error observed: `Cannot find 'images' on Product object, 'images' is an invalid parameter to prefetch_related()`
- Risk: admin unusable for product management; indicates stale/broken code on VM.
- Required fix: deploy latest backend code and verify queryset in `AdminProductViewSet` does not prefetch non-existent relation.

### High
3. Server version disclosure in HTTP response.
- Evidence: `Server: nginx/1.22.1`
- Risk: version fingerprinting.
- Required fix: set `server_tokens off;` in nginx and reload.

4. Missing strict transport security evidence.
- API header sample did not show `Strict-Transport-Security`.
- Risk: downgrade/repeat-visit transport weakening.
- Required fix: add HSTS header at nginx (`max-age=31536000; includeSubDomains; preload`) and verify.

### Medium
5. Homepage route response instability.
- `https://malaikanest.duckdns.org` timed out during multiple checks while API routes responded.
- Risk: storefront availability risk at launch.
- Required fix: verify Next.js process health, nginx upstream for `/`, and PM2/systemd process status.

## Live Checks That Passed
1. API reachable: `/api/products/`, `/api/products/categories/`, `/api/products/banners/`, `/api/products/products/` returned JSON.
2. Catalog/banners appear to be API-driven, not frontend hardcoded placeholders.

## Remaining Risks
1. VM hardening steps (SSH allowlist/password disable/root disable/fail2ban/UFW + GCP rules) cannot be fully enforced from this local sandbox.
2. CAPTCHA/account-lockout/rate-limit behavior still needs end-to-end validation on live domain after backend restart with final config.
3. Full checkout + M-Pesa callback path not yet revalidated in live environment post-fix.
4. Local `python manage.py check` currently blocked by runtime package mismatch (Pillow import issue in this workstation interpreter), so canonical checks must run in VM venv.

## Mandatory Remediation Order Before Traffic
1. Deploy latest backend commit to VM and restart gunicorn/systemd.
2. Confirm production env loading (`DEBUG=False`, secure cookie flags, `REDIS_URL` policy, CAPTCHA secrets).
3. Fix nginx hardening (`server_tokens off`, HSTS, HTTPS redirect, TLS1.2/1.3).
4. Re-run smoke script + manual admin flow:
- admin login
- create/edit/delete product
- banner upload and homepage propagation
- customer register/login/cart/checkout
- M-Pesa callback endpoint
5. Block release unless all above pass.

## Final Recommendation
Do not open for real traffic until the two critical issues are resolved on VM: production debug exposure and `/api/products/admin/products/` 500 crash. After deployment sync, rerun full smoke and security verification and only then proceed to launch.
