# Malaika Nest — Lean Django Monolith Walkthrough

## Overview

Malaika Nest has been successfully transitioned into a **production-ready, economically lean Django monolith** designed to run reliably on a single modest VPS or VM instance with:
1. Exactly **3 services** (`web`, `db`, `cloudflared`) in `docker-compose.lean.yml`.
2. **Zero runtime dependencies** on Redis, Celery workers, Celery Beat, Daphne, Next.js server, read replicas, or Prisma CMS.
3. Complete preservation of existing PostgreSQL commerce data, order models, payment gateways (M-Pesa STK, Till 3370347, PayPal), and Django Admin.
4. Fast, server-rendered storefront templates styled with Tailwind CSS, supporting guest cart operations, county delivery estimates, coupon discounts, M-Pesa STK initiation, and live order status polling.

---

## Changes by Phase

### Phase 1: Removal of Runtime Infrastructure Dependencies
- **Caching:** Replaced Redis caching in [prod.py](file:///C:/Users/user/Desktop/malaikanest/backend/config/settings/prod.py) with Django's `LocMemCache` (`default`, `banners`, `categories`, `products`).
- **WebSockets / Channels:** Replaced `RedisChannelLayer` with `InMemoryChannelLayer` in [base.py](file:///C:/Users/user/Desktop/malaikanest/backend/config/settings/base.py).
- **Static Assets:** Configured `whitenoise.middleware.WhiteNoiseMiddleware` to serve compiled CSS and assets directly from Gunicorn with gzip/brotli caching.
- **App Server:** Switched [Dockerfile](file:///C:/Users/user/Desktop/malaikanest/backend/Dockerfile) CMD to Gunicorn WSGI (`2 workers, 4 threads, 60s timeout`).
- **Database Routing:** Set `DATABASE_ROUTERS = []` in production to prevent read-replica overhead on single-database topology.

### Phase 2: Idempotent Management Commands
- **Payment Reconciliation:** Created [reconcile_pending_payments.py](file:///C:/Users/user/Desktop/malaikanest/backend/apps/payments/management/commands/reconcile_pending_payments.py) to query unconfirmed M-Pesa payments (filtering by `initiated_at`) and reconcile them idempotently.
- **Email Retries:** Created [retry_order_emails.py](file:///C:/Users/user/Desktop/malaikanest/backend/apps/orders/management/commands/retry_order_emails.py) checking `EmailLog(order_id=..., success=True)` to prevent duplicate order confirmation emails.
- **Signal Decoupling:** Updated [signals.py](file:///C:/Users/user/Desktop/malaikanest/backend/apps/orders/signals.py) to dispatch emails directly on `transaction.on_commit()` using `EmailService.send_order_confirmation(instance)`.

### Phase 3: Server-Rendered Catalogue & Navigation
- Created new Django app `apps.storefront` mounted at `/`.
- Views: [views.py](file:///C:/Users/user/Desktop/malaikanest/backend/apps/storefront/views.py) (`HomeView`, `ProductListView`, `ProductDetailView`).
- Context processor: [context_processors.py](file:///C:/Users/user/Desktop/malaikanest/backend/apps/storefront/context_processors.py) providing `nav_categories`, `cart_count`, `site_settings`, and WhatsApp direct support links across all templates.
- Templates:
  - [base.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/storefront/base.html) — Storefront shell, navigation bar, mobile search drawer, WhatsApp floating action button, footer with Kenyan payment badges.
  - [home.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/storefront/home.html) — Hero banner, category cards, featured products, Kenyan delivery guarantee banner.
  - [product_list.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/storefront/product_list.html) — Category filters, search query, responsive product cards.
  - [product_detail.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/storefront/product_detail.html) — Product gallery, variant selector (size/color), stock indicator, quantity stepper, WhatsApp inquiry CTA.
  - [404.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/404.html) & [500.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/500.html) — Branded error pages.

### Phase 4: Server-Rendered Guest Shopping Cart
- [views_cart.py](file:///C:/Users/user/Desktop/malaikanest/backend/apps/storefront/views_cart.py):
  - `get_or_create_cart(request)`: Handles anonymous session keys and seamlessly merges guest carts upon customer login.
  - `CartView`: Renders items, line prices, delivery fees, and discount totals.
  - `AddToCartView`: Atomically reserves stock and validates inventory for standalone products and variants.
  - `UpdateCartItemView`: Adjusts quantities or removes items when set to 0.
  - `RemoveCartItemView`: Removes items.
  - `ApplyCouponView` & `RemoveCouponView`: Validates coupons and calculates discounts.
  - `UpdateDeliveryRegionView`: Updates delivery region (Mombasa, Nairobi, Upcountry).
- [cart.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/storefront/cart.html): Free delivery progress meter (qualifies at KES 2,000+), items list, order summary sidebar, and checkout CTA.

### Phase 5: Server-Rendered Checkout & Payment Status
- [views_checkout.py](file:///C:/Users/user/Desktop/malaikanest/backend/apps/storefront/views_checkout.py):
  - `CheckoutView`: Collects shipping name, phone, guest email, address, and payment method (`mpesa`, `till`, `paypal`). Invokes `OrderService.process_checkout()` with atomic stock reservation.
  - Auto-triggers M-Pesa STK push. In case of API downtime or unconfigured credentials, falls back to displaying Buy Goods Till `3370347` instructions.
  - `OrderStatusView`: Displays live order status with security verification (requires unguessable `order.checkout_token` for guest access).
  - `OrderStatusPollView`: Lightweight JSON polling endpoint (`/orders/<receipt_number>/status/?token=<checkout_token>`) that updates the UI to "Paid" once callback confirms payment.
  - `PayPalReturnView`: Captures authorized PayPal payments upon redirect.
- Templates:
  - [checkout.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/storefront/checkout.html)
  - [order_status.html](file:///C:/Users/user/Desktop/malaikanest/backend/templates/storefront/order_status.html)

### Phase 6: Lean Deployment Topology
- [docker-compose.lean.yml](file:///C:/Users/user/Desktop/malaikanest/docker-compose.lean.yml): 3 services (`db`, `web`, `cloudflared`) with healthchecks and CPU/RAM limits.
- [cloudflared/config.yml](file:///C:/Users/user/Desktop/malaikanest/cloudflared/config.yml): Single ingress routing `malaikanest.com`, `www.malaikanest.com`, and `api.malaikanest.com` directly to `http://web:8000`.
- [backup-postgres.sh](file:///C:/Users/user/Desktop/malaikanest/deployment/lean/backup-postgres.sh): Automated pre-cutover PostgreSQL backup script with 14-day retention.
- [go-live-smoke.sh](file:///C:/Users/user/Desktop/malaikanest/deployment/lean/go-live-smoke.sh): Automated curl smoke test validating all critical endpoints and confirming zero background daemon leaks.

---

## Verification Results

### 1. Test Suite Coverage (100% Passing)
Ran all 71 tests across `apps.orders`, `apps.payments`, `apps.core`, `apps.products`, `apps.accounts`, and `apps.storefront`:
```
Ran 71 tests in 52.616s
OK
Preserving test database for alias 'default'...
```

### 2. Compose Configuration Validation
```
docker compose -f docker-compose.lean.yml config
# Exited with code 0; exactly 3 services defined: db, web, cloudflared.
```

### 3. Production Deployment Guards
```
python manage.py check --deploy --settings=config.settings.prod
# Exited with code 0; all security and environment checks passed.
```

---

## How to Run Locally

```bash
# 1. Ensure PostgreSQL is accessible (e.g. kenya_ecom database)
$env:DJANGO_SETTINGS_MODULE="config.settings"
$env:DJANGO_ENV="dev"
$env:DB_NAME="kenya_ecom"
$env:DB_USER="kenya"
$env:DB_PASSWORD="kenya_password"

# 2. Run Gunicorn or runserver
cd backend
python manage.py runserver 0.0.0.0:8000

# 3. Visit in browser:
# Homepage:   http://localhost:8000/
# Catalogue:  http://localhost:8000/products/
# Cart:       http://localhost:8000/cart/
# Staff:      http://localhost:8000/manage-store/
```
