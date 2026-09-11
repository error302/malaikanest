# Lean Django Monolith for Malaika Nest

## Goal

Operate Malaika Nest as a reliable small Kenyan ecommerce business on one modest server, while preserving the ability to accept real orders, receive payments, manage stock, and fulfil deliveries. The first production target is one Django application, one PostgreSQL database, and one Cloudflare Tunnel process.

## Product scope

The launch scope is deliberately narrow:

- Public catalogue, category and product-detail pages.
- Server-side cart and checkout.
- Live M-Pesa STK and PayPal payment flows, with safe callback handling.
- Delivery-zone selection, order creation, stock deduction, customer order confirmation, and a contact/WhatsApp path.
- Django administration for products, orders, categories, customers, delivery zones and operational content.

Customer accounts, loyalty, blog, testimonials, advanced CMS features, WebSockets, recommendations, replicas and always-on background workers are not launch dependencies. They remain data/features to migrate only after the core order flow is stable.

## Architecture

```text
Customer
  -> Cloudflare DNS/CDN/WAF
  -> one Cloudflare Tunnel connector
  -> Django + Gunicorn
       -> Django templates + static files
       -> payment callbacks
       -> Django admin
       -> PostgreSQL
  -> Cloudinary for product media
```

The application is a conventional Django monolith. Django renders storefront pages and owns the checkout session, order state and administrative interface. PostgreSQL remains the sole transactional database. Cloudinary remains the image/media CDN. Cloudflare Tunnel continues to provide inbound access without exposing host ports publicly.

Production runs three processes only:

1. `web`: Django under Gunicorn, serving application and static assets.
2. `db`: PostgreSQL with a persistent volume.
3. `cloudflared`: one connector routing `malaikanest.com` and `api.malaikanest.com` to `web`.

There is no Next.js production server, Redis, Celery worker, Celery Beat, backend replica, second tunnel connector, Nginx, Prisma CMS database, or Docker service whose only role is redundancy before there is demand to justify it.

## Data ownership and migration

The existing Django/PostgreSQL commerce database is the source of truth for products, orders, payments, stock, customers and delivery zones. Its records are retained. The existing SQLite/Prisma CMS data is not a dependency for the launch path; only storefront content that is genuinely required for launch is copied into Django models or templates.

Migration happens in stages. The old Next.js storefront remains available until the matching Django page passes parity checks. A cutover changes the Cloudflare Tunnel hostname routes only after catalogue, cart and checkout checks pass. No production database is deleted or rewritten as part of the frontend retirement.

## Payments and scheduled work

M-Pesa and PayPal remain server-side integrations. Callback endpoints are idempotent, validate the provider response/signature where supported, record an audit event, and advance an order only after verified payment state.

Celery is removed from the launch architecture. The only scheduled work is implemented as idempotent Django management commands and invoked by host cron/systemd timers:

- M-Pesa reconciliation every 15 minutes.
- Delivery/order reminder and email retry jobs at explicit intervals.
- Daily PostgreSQL backup and retention check.

Email delivery is not allowed to make checkout fail. An order is committed first; email failure is recorded and retried by the scheduled command.

## Operational and security model

- Deploy with a small Compose file or systemd units using a production-only `.env` that is never committed.
- Require `DJANGO_ENV=prod`, `DEBUG=False`, real payment credentials, and live payment modes before the web process can start.
- Rotate the previously exposed Django admin password and all related application secrets before cutover.
- Keep Postgres data on a persistent volume and create a daily encrypted backup, retaining a tested restore path.
- Bind Postgres to the internal network only. Cloudflare Tunnel is the only internet-facing ingress.
- Start with a 2 GB RAM VPS or the OCI A1 allocation if it becomes available. The 1 GB E2 micro is explicitly out of scope because PostgreSQL plus Django and image/build overhead are not reliable there.

## Error handling

- Storefront failures return a clear temporary-unavailable page while preserving cart session data.
- Payment callback errors are logged with provider reference and return the provider-appropriate acknowledgement without duplicating orders.
- Failed payment status remains `PENDING`; reconciliation is the recovery mechanism.
- Database migration or required-environment failure blocks deploy before traffic is cut over.
- Cloudflare Tunnel health and `/api/health/` are deployment gates.

## Verification strategy

Each migration task uses test-first development. Required coverage includes:

- Catalogue and product availability rendered from Django models.
- Anonymous cart add/update/remove and checkout total calculation.
- Order creation is atomic with stock validation.
- M-Pesa/PayPal callback idempotency and invalid-callback rejection.
- Payment-confirmed orders cannot be marked paid twice.
- Scheduled reconciliation is safe to run repeatedly.
- Production configuration refuses development, mock, placeholder and missing payment settings.

Before cutover, run the Django test suite, production asset build, an authenticated admin smoke test, a test-payment flow appropriate to each provider, a database backup-and-restore drill, and public Cloudflare endpoint checks.

## Delivery sequence

1. Establish the two-service core (`web` and `db`) plus one tunnel with strict production settings and backups.
2. Build Django-rendered catalogue and product pages alongside the existing storefront.
3. Move cart, checkout, payment callbacks and order confirmation to the monolith with tests.
4. Cut Cloudflare traffic to Django only after the production smoke test passes.
5. Retire unused containers and the Next.js/Prisma runtime only after successful launch and a measured observation period.

## Non-goals

- Rebuilding the visual brand from scratch.
- Adding new growth features before real orders arrive.
- Paying for redundant application replicas at launch.
- Migrating to a new database vendor.
- Destroying existing commerce data or the preserved Malaika Nest boot volume.
