# Malaika Nest: Lean Monolith Handoff

## Mission

Make Malaika Nest a production-ready Kenyan baby-and-children's clothing shop that is economical to run and operationally simple. Do **not** rebuild it from scratch. Preserve the existing Django/PostgreSQL commerce data and payment logic, then migrate the public storefront into Django so production needs only one application process, one database, and one Cloudflare Tunnel connector.

The business-critical launch path is:

1. Browse catalogue and products.
2. Add products to a guest cart.
3. Choose delivery region and enter checkout details.
4. Pay using live M-Pesa STK or PayPal.
5. Record an order safely, adjust stock once, and view it in Django admin.
6. Contact the business through WhatsApp/support when needed.

Customer accounts, loyalty, blog, recommendations, testimonials, WebSockets, multi-node redundancy and a visual CMS are not launch blockers.

## Why this change is necessary

The existing production Compose stack has grown to include Postgres, Redis, Django/Daphne, a backend replica, Celery worker, Celery Beat, a Next.js server, and two Cloudflare Tunnel containers. That is too much operational surface area for a newly launched small shop. The replacement target is:

```text
Customer
  -> Cloudflare DNS/CDN/WAF
  -> one cloudflared connector
  -> Django + Gunicorn
       -> Django-rendered shop + checkout + admin + callbacks
       -> PostgreSQL
  -> Cloudinary image hosting
```

The new always-on production services must be exactly:

- `web`: Django served by Gunicorn.
- `db`: PostgreSQL with a persistent volume.
- `cloudflared`: one connector to the `web` service.

There must be no Redis, Celery, Celery Beat, Channels, Daphne, Next.js server, backend replica, hot-standby tunnel, Nginx, or Prisma CMS runtime in the lean deployment.

## Current repository facts

- Repository: `C:\Users\user\Desktop\malaikanest`
- Backend: `backend/`, Django 5.2, PostgreSQL-backed commerce API.
- Existing frontend: `frontend/`, Next.js 16. It should remain temporarily during migration but not remain a production server after cutover.
- Current deployment file: `docker-compose.yml`.
- Current Cloudflare Tunnel configuration: `cloudflared/config.yml`.
- Django admin URL: `/manage-store/`.
- Storefront domain: `malaikanest.com`.
- API domain: `api.malaikanest.com`.
- Media: Cloudinary.

Important source files:

- `backend/apps/products/models.py` — products, categories, variants, inventory.
- `backend/apps/orders/models.py` — carts, orders, order items, delivery zones and order state transitions.
- `backend/apps/orders/services.py` — checkout and inventory logic.
- `backend/apps/orders/views.py` — current REST cart/checkout flow.
- `backend/apps/payments/models.py` — payment and payment audit records.
- `backend/apps/payments/views.py` and `services.py` — M-Pesa/PayPal callbacks and verification.
- `backend/apps/payments/tests.py` — existing callback/idempotency tests.
- `backend/apps/orders/tests.py` — existing order, inventory and cart tests.
- `backend/config/settings/prod.py` — production settings currently tied to Redis and replica assumptions.
- `backend/config/settings/guards.py` — production payment/secret guardrails; preserve and strengthen them.
- `backend/config/urls.py` — current API/admin routes; add Django storefront routes here.
- `backend/Dockerfile` — currently starts Daphne; change lean production to Gunicorn.

## Current OCI status

OCI authentication was verified successfully in the Johannesburg home region. The desired Always Free VM allocation is currently unavailable because Oracle reports `Out of host capacity` for the Ampere A1 shape in all three fault domains.

Free deployment target when capacity appears:

- Shape: `VM.Standard.A1.Flex`.
- Preferred allocation: 2 OCPUs and 12 GB RAM.
- Boot disk: 50 GB.
- OS image: Oracle Linux 9 ARM/aarch64.
- Network: existing public subnet already permits SSH, HTTP and HTTPS.

Do not use the `VM.Standard.E2.1.Micro` shape for this stack. Its 1 GB RAM and fractional CPU are not sufficient for Django plus PostgreSQL reliably.

The stopped paid/free-credit `malaikanest-e5` instance's 150 GB boot volume was deliberately preserved. The unrelated `metardu-e2` instance and its 100 GB boot volume were terminated with explicit user approval. Do not delete or modify the Malaika boot volume. Do not start the old E5 instance without explicitly warning the user it may incur paid compute charges.

Oracle's current Always Free allocation is 2 OCPUs, 12 GB RAM and 200 GB total block storage. With the preserved 150 GB volume, a new 50 GB free VM is the only remaining free storage configuration.

## Security requirements

- Never print, commit, upload, or copy private keys, API keys, passwords, payment credentials, OAuth tokens or Cloudflare tunnel credentials.
- Existing vault notes previously contained an exposed Django admin password. Treat it as compromised and rotate the admin password, Django `SECRET_KEY`, JWT secret, database password, SMTP credential, M-Pesa secrets and PayPal secret before going live.
- Production requires `DJANGO_ENV=prod`, `DEBUG=False`, live payment modes, real M-Pesa credentials and strict callback verification. The process must fail closed if those values are missing, mock, sandbox or placeholders.
- Keep PostgreSQL internal-only. The Cloudflare Tunnel is the only ingress.
- Backup the database before any production migration. Verify restoration to an isolated database before changing Cloudflare routes.

## Ordered implementation plan

### Phase 0: Establish a clean, testable baseline

1. Inspect `git status`; preserve unrelated user files and changes.
2. Read `AGENTS.md` and `docs/superpowers/specs/2026-09-12-lean-django-monolith-design.md`.
3. Run the existing backend test suites before changing code.
4. Create a new branch/worktree if the environment supports it; do not overwrite the user's current worktree.
5. Do not start full local Docker services while investigating a resource-constrained PC unless necessary.

### Phase 1: Remove unnecessary runtime dependencies

Goal: Django production starts without Redis, Channels, Celery, Daphne or a read replica.

1. Write a failing test that production cache settings use Django local-memory caching rather than Redis.
2. Write a failing test that the production runtime does not require Channels or a Channel layer.
3. Change `backend/config/settings/prod.py` to use `LocMemCache` for the launch stack. Product and category caches become local-process optimizations, not shared infrastructure.
4. Remove production-only Redis/Channels settings and replica routing. Do not remove development support unless it blocks imports.
5. Change `backend/Dockerfile` to start Gunicorn WSGI:

```text
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 2 --threads 4 --timeout 60
```

6. Remove Celery/Channels/Redis packages only after all imports and tests are migrated. Do not remove a dependency by blind search-and-replace.
7. Run focused settings tests and the whole backend suite.

### Phase 2: Replace Celery with idempotent management commands

Goal: no always-on worker process is needed.

1. Locate every `.delay()` and Celery task dependency in orders, payments, emails and signals.
2. Keep fast state-changing work in the request transaction or `transaction.on_commit()` only if it cannot fail checkout.
3. Create `reconcile_pending_payments` Django management command. It must only process initiated M-Pesa payments and be safe to run repeatedly.
4. Create `retry_order_emails` Django management command. It must persist whether an email has already been sent or failed, so reruns never duplicate confirmations.
5. Add failing tests for repeated command execution and duplicate M-Pesa callbacks. Existing tests in `backend/apps/payments/tests.py` are valuable starting points.
6. Configure host cron or systemd timers later: reconcile every 15 minutes, retry email at a clear interval, backup daily.

### Phase 3: Create Django-rendered storefront pages

Goal: the shop no longer needs a Next.js server.

1. Create a new `backend/apps/storefront/` app with its own `urls.py`, `views.py`, `tests.py` and templates under `backend/templates/storefront/`.
2. Implement `GET /` and `GET /products/` using existing active product/category models.
3. Implement `GET /products/<slug>/` with variants, price, availability, Cloudinary images and a 404 for inactive/missing products.
4. Recreate only a simple, responsive brand shell: navigation, category links, cart link, contact/WhatsApp link, product grid and product detail. Do not port the old visual CMS or blog as a launch requirement.
5. Write tests first for active-product visibility, slug lookup and missing-product 404 behavior.

### Phase 4: Move guest cart to Django session pages

Goal: anonymous customers can add, update and remove items without a React context or REST frontend.

1. Create a `get_session_cart(request)` helper based on `request.session.session_key` and the existing `Cart` model.
2. Implement `GET /cart/`, `POST /cart/items/`, quantity update and remove routes.
3. Reuse the current cart and inventory business rules; validate available inventory inside transactions.
4. Write tests first for guest cart creation, quantity update, stock rejection and cart persistence across redirects.

### Phase 5: Implement server-rendered checkout and payment status

Goal: real orders can be made without the Next.js checkout.

1. Build `GET/POST /checkout/` using the existing `OrderService` and payment services rather than duplicating price, discount, tax or stock logic.
2. Validate delivery zone, phone, name, email, address and payment method server-side.
3. For M-Pesa, create the order/payment atomically, then initiate STK after commit. Preserve the existing callback endpoint and its idempotency/amount/phone validation.
4. For PayPal, preserve current server-side capture/verification rather than trusting the browser.
5. Add `GET /orders/<receipt_number>/?token=<checkout_token>` for safe guest payment/order status. Never use sequential order IDs as guest authorization.
6. Poll a lightweight payment-status route; do not restore WebSockets.
7. Write tests first for atomic checkout, invalid stock, invalid guest token, callback replay, amount mismatch and phone mismatch.

### Phase 6: Build the lean deployment

Goal: make the new architecture deployable on one modest machine.

1. Create `docker-compose.lean.yml` with exactly `web`, `db`, and `cloudflared` services.
2. Use PostgreSQL 15 persistent storage. Do not expose database ports to the internet.
3. Configure `cloudflared/config.yml` to route all shop domains to `web:8000` only after storefront parity tests pass.
4. Add `deployment/lean/backup-postgres.sh` to run `pg_dump --format=custom`, check its exit status, retain the agreed backup count and document a restore command.
5. Add systemd timer or cron examples for payment reconciliation and email retry commands.
6. Add `deployment/lean/go-live-smoke.sh` to check required production environment variables, database migration state, health endpoint, root/catalogue/cart/checkout/admin response codes, and Cloudflare tunnel health.
7. Update GitHub deployment workflow only after the lean stack is verified locally; it must build the web image, run migrations, bring up the three services, and gate on `/api/health/`.

### Phase 7: Cut over carefully

1. Back up the existing production database and restore the backup into an isolated PostgreSQL database. Verify products/orders are present.
2. Deploy the lean stack to a staging host or locally in production mode.
3. Run all Django tests, then the smoke script.
4. Test provider flows with the correct provider-approved test/sandbox procedure before any live charge.
5. Rotate all previously exposed credentials.
6. Change Cloudflare Tunnel routes only after all checks pass.
7. Keep the old deployment stopped but intact during a measured rollback period. Do not delete it until real orders have completed safely.

## Required test gates

Do not claim success until all of these have evidence:

- Existing `apps.orders`, `apps.payments`, `apps.core` test suites pass.
- New storefront catalogue, cart and checkout tests pass.
- Duplicate callback is safe and does not double-mark an order paid or double-adjust stock.
- Production configuration refuses sandbox/mock/placeholder payment settings.
- `docker compose -f docker-compose.lean.yml config` passes.
- Database backup restore is tested.
- `/`, `/products/`, `/cart/`, `/checkout/`, `/manage-store/` and `/api/health/` respond correctly.
- Public Cloudflare endpoints work after route cutover.

## Definition of done

Malaika Nest is live on one small server with one Django web process, PostgreSQL and one Cloudflare Tunnel. A customer can browse products, create a guest cart, check out, pay through the chosen live payment method, receive an order reference, and the owner can see the order and payment audit trail in Django admin. The system has working backup, restore instructions, production guards and no dependency on the retired runtime services.

## Non-negotiable cautions

- Do not substitute a paid OCI shape without the user explicitly approving possible charges.
- Do not delete the remaining 150 GB Malaika boot volume.
- Do not switch live payment credentials/modes without the user confirming the credentials are ready.
- Do not cut traffic before the smoke tests and backup-restore drill pass.
- Do not commit `.env` files, OCI configuration, private keys or Cloudflare credentials.
