> ## ⚠️ Deployment reality check (verified 2026-09-17)
>
> **The `frontend/` Next.js app in this repository is not what serves
> https://malaikanest.com.** The live storefront is a server-rendered Django
> template app that loads Tailwind from `cdn.tailwindcss.com`, and its templates
> are **not committed here** — `backend/templates/` contains only `emails/` and
> `admin/`, and `config/urls.py` has no storefront routes, yet `/products/` and
> `/cart/` return 200 in production. Evidence: the live HTML contains no
> `__NEXT_DATA__` / `/_next/static` markers, and none of the live homepage copy
> appears anywhere in this repo.
>
> The **API is** this repo — `/api/schema/` matches `SPECTACULAR_SETTINGS`
> exactly and `/api/v1/orders/delivery-zones/` returns the seeded Kenyan zones.
>
> Two consequences: (1) changes to `frontend/` do not change the live shop;
> (2) the live storefront exists only on one VM's disk, so **find it and commit
> it** before that VM dies.

# Malaika Nest — E-Commerce Platform

A full-featured e-commerce platform for baby and children's clothing in Kenya, built with Next.js and Django.

**Live site**: [malaikanest.com](https://malaikanest.com)
**Admin**: [admin.malaikanest.com](https://admin.malaikanest.com)

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router, React 19, TypeScript)
- **Styling**: Tailwind CSS 4 + CSS custom properties (brand system)
- **UI**: shadcn/ui + Radix primitives
- **Animations**: Framer Motion
- **Icons**: `lucide-react` (aliased to a Phosphor-backed shim — see `src/lib/icons.tsx`)
- **State**: React Context + Zustand + TanStack Query (cart, wishlist, auth, i18n, catalog)
- **HTTP Client**: Axios with interceptors (cache, retry, JWT refresh)
- **Runtime**: Node 22 (`frontend/Dockerfile`), Next.js standalone output · **CMS**: Prisma 6 (**PostgreSQL**, `malaika_cms`)

### Backend (API)
- **Framework**: Django 5.2 + Django REST Framework 3.15
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL 15 (via Docker)
- **Cache**: Redis 7
- **Task Queue**: Celery + django-celery-beat + Channels (WebSockets)
- **Media Storage**: Cloudinary
- **PDF Generation**: ReportLab

### Infrastructure & Deployment
- **Hosting**: Docker Compose on a single VM (Frontend + Backend + Postgres + Redis + Celery)
- **Tunnel/CDN/DNS**: Cloudflare Tunnel + Cloudflare CDN + Analytics
- **Database**: PostgreSQL 15 — commerce in `$POSTGRES_DB`, frontend CMS in `malaika_cms` on the same server. SQLite is not used anywhere and is rejected at import time by `config/settings/guards.py`.
- **Cache/Queue**: Redis 7 (Celery broker + cache + Channels)
- **Media Storage**: Cloudinary
- **Email**: Brevo (smtp-relay.brevo.com)

## Core Features

### Products & Catalog
- Product variants: size (0-3M, 3-6M, etc.) + color with individual SKUs
- Hierarchical categories with parent/child relationships
- Brand management with logos
- Promotional banners with scheduling
- Inventory tracking with reserved quantities
- Multiple product images with primary image
- AI-generated descriptions, SEO metadata, and tags
- Semantic search via vector embeddings

### Shopping Experience
- Persistent cart (user + guest via session)
- Wishlist with localStorage + sync
- Product reviews and ratings
- Full-text search with filters (category, age group, gender, size, price)
- Similar products via AI embeddings
- Product bundles (AI-generated)
- Recently viewed products

### User Accounts
- Email + password registration with verification
- JWT access + refresh tokens
- Phone number as required field
- Password reset via email
- Saved addresses (multiple)
- Order history and reorder functionality
- Order tracking via `checkout_token`

### Checkout & Orders
- Guest checkout supported
- Order status machine: `pending → paid → processing → shipped → delivered`
- Payment methods: **M-Pesa STK** (with real-time polling), **Pesapal**, **Card**, **Cash on Delivery**
- Delivery zones: Mombasa (same-day, free pickup), Nairobi (1-2 days), Upcountry (2-3 days)
- Coupons: flat and percentage-based
- Gift orders with message support
- PDF invoice generation
- Order tracking page for guests

### Admin Dashboard
- Full product CRUD with bulk operations
- Full order management (status, tracking)
- Category and brand management
- Banner scheduling
- User management
- Coupon management
- Sales reports and analytics
- Bulk AI content generation

## Project Structure

```
malaikanest/
├── backend/
│   ├── apps/
│   │   ├── accounts/     # Auth, profiles, JWT tokens
│   │   ├── ai/           # Ollama integration, embeddings, chatbot
│   │   ├── core/        # Health checks, cache, utils
│   │   ├── orders/       # Cart, orders, coupons, delivery zones
│   │   ├── payments/     # M-Pesa, Pesapal, card payments
│   │   ├── products/     # Catalog, categories, brands, variants
│   │   └── users/        # User model extensions
│   ├── config/           # Django settings, ASGI, Celery
│   ├── scripts/         # Utility scripts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   │   └── (store)/  # Storefront pages
│   │   ├── components/  # Shared React components
│   │   └── lib/         # API client, contexts, utilities
│   ├── public/           # Static assets
│   └── package.json
├── docker-compose.lean.yml   # PRODUCTION on the 1 GB GCP e2-micro (web + db + cloudflared)
├── docker-compose.worker.yml # Optional overlay: Redis + one celery worker -B --pool=solo
├── docker-compose.yml        # Full 9-service stack. DO NOT run on the free-tier VM.
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.12+ (the image is `python:3.13-slim`; CI runs 3.13), Node.js 20+
  (Next 16 requires it; the image is `node:22-alpine`), Docker, Docker Compose

### Development (Docker)

```bash
# Start all services (frontend :3090, backend :8081, db, redis)
docker compose up

# Run migrations
docker compose exec backend python manage.py migrate

# Create admin user
docker compose exec backend python manage.py createsuperuser

# Frontend dev server (hot reload)
docker compose up frontend
```

### Backend (Local without Docker)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your settings
python manage.py migrate
python manage.py runserver 0.0.0.0:8081
```

### Frontend (Local)

```bash
cd frontend
npm install
cp .env.example .env.local  # Set NEXT_PUBLIC_API_URL=http://localhost:8081
npm run dev
```

## Development Setup

### Pre-commit Hook

A pre-commit hook is included that blocks commits containing bare `except Exception: pass/return` patterns (which silently swallow errors). Install it after cloning:

```bash
cp scripts/pre-commit-hook.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

The hook scans staged `.py` files in `backend/` and rejects commits with:
- `except Exception:` followed by `pass`
- `except Exception: pass` on the same line
- `except Exception:` followed by `return {}`, `return None`, `return ""`, `return False`

To bypass (e.g. for a genuine no-op like an optional import):
```bash
git commit --no-verify -m "..."
```

## API Reference

All endpoints are prefixed with `/api/v1/`.

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounts/register/` | User registration |
| POST | `/accounts/token/` | Login (returns JWT) |
| POST | `/accounts/token/refresh/` | Refresh access token |
| GET | `/accounts/profile/` | Get/update current user |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products/` | List products (filters: category, brand, age_group, gender, min_price, max_price, search, ordering) |
| GET | `/products/{slug}/` | Product detail |
| GET | `/categories/` | List categories |
| GET | `/banners/` | Active banners |

### Cart & Wishlist
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders/cart/` | Get current cart |
| POST | `/orders/cart/add/` | Add item to cart |
| POST | `/orders/cart/remove/` | Remove item from cart |
| GET | `/orders/wishlist/` | Get wishlist |
| POST | `/orders/wishlist/add/` | Add to wishlist |
| POST | `/orders/wishlist/remove/` | Remove from wishlist |

### Orders & Checkout
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders/create/` | Create order (with guest or authenticated user) |
| GET | `/orders/` | List user's orders |
| GET | `/orders/{id}/` | Order detail |
| POST | `/orders/coupon/apply/` | Validate and apply coupon |
| GET | `/orders/track/` | Track order (POST: receipt_number + email) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/mpesa/initiate/` | Initiate M-Pesa STK push |
| GET | `/payments/verify/{checkout_request_id}/` | Poll M-Pesa payment status |
| POST | `/payments/pesapal/initiate/` | Initiate Pesapal payment |
| GET | `/payments/{id}/status/` | Get payment status by ID |

## Environment Variables

### Backend (.env)
```
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=localhost,backend
DATABASE_URL=postgres://user:pass@localhost:5432/malaika_db
REDIS_URL=redis://localhost:6379/0
CLOUDINARY_URL=cloudinary://...
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_SHORTCODE=...
MPESA_PASSKEY=...
PESAPAL_CONSUMER_KEY=...
PESAPAL_CONSUMER_SECRET=...
PESAPAL_IPN_URL=...
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Deployment

> See `AGENTS.md`, `docs/ARCHITECTURE.md` and `docs/BUG-FIXES-2026-08-05.md` for onboarding.

### Production topology — read this first

There are two compose files and they are **not** interchangeable.

| File | Services | Use it on |
|---|---|---|
| `docker-compose.lean.yml` | `db`, `migrate`, `web`, `cloudflared` — memory-limited to ~640 MB total | **The GCP Always Free e2-micro (1 GB). This is production.** |
| `docker-compose.yml` | 9 services, **no memory limits** (`db`, `cms-db-init`, `redis`, `backend`, `backend_replica`, `celery_worker`, `celery_beat`, `frontend`, `cloudflared`, `cloudflared_standby`) | A VM with ≥4 GB RAM only. It **will OOM-kill a 1 GB box** and the kernel will pick postgres. |

```bash
# Production (1 GB VM)
docker compose -f docker-compose.lean.yml up -d --build
docker compose -f docker-compose.lean.yml logs -f web
docker compose -f docker-compose.lean.yml exec web python manage.py migrate

# Add scheduled jobs (M-Pesa reconciliation, stale-order cleanup) if you have
# the ~112 MB to spare. Otherwise use the cron fallback in
# scripts/ops/backup-and-cron.sh, which needs no broker at all.
docker compose -f docker-compose.lean.yml -f docker-compose.worker.yml up -d
```

The lean stack deliberately runs **no Redis and no Celery**. That is safe because
`apps/core/outbox.py` drains the transactional outbox inline in the web process
when no broker is reachable, so `order.paid` still deducts stock, generates the
invoice and emails the receipt. What you lose without a worker is anything
*scheduled* — see the table in `docker-compose.worker.yml`.

`.github/workflows/deploy.yml` is pinned to the lean file and refuses to fall
back to `docker-compose.yml`.

> Traffic: Cloudflare → one `cloudflared` connector → Django (ASGI/daphne, so
> WebSockets work on the same port). Running a second connector on the same
> tunnel token is not a hot standby — Cloudflare already load-balances multiple
> connections from one tunnel — it just costs ~40 MB.

### Cloudflare Cache Rule (Required)
Create a Cache Rule in the Cloudflare dashboard to cache static assets:
- **Static cache**: `.next/static/*`, `/images/*`, `.woff2`
- **API cache**: `/api/v1/products/` with 5min TTL

### Admin Access
- Django admin URL: `https://malaikanest.com/manage-store/`
- Next.js admin dashboard: `https://malaikanest.com/admin`
- **Credentials are NOT stored in the repo.** Create/rotate the admin via env-backed commands:
  - `ADMIN_PASSWORD=… python manage.py fix_admin --email hello@malaikanest.com`
  - `ADMIN_PASSWORD=… python manage.py create_superuser`

> ⚠️ **Security:** The previous admin password was committed to git history. **Rotate it now.**
> The management commands above deliberately refuse to run without `ADMIN_PASSWORD`/`--password`.

## License

MIT