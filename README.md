# Malaika Nest — E-Commerce Platform

A full-featured e-commerce platform for baby and children's clothing in Kenya, built with Next.js and Django.

**Live site**: [malaikanest.com](https://malaikanest.com)
**Admin**: [admin.malaikanest.com](https://admin.malaikanest.com)

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS 3.4 + CSS custom properties (brand system)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State**: React Context + hooks (cart, wishlist, auth, i18n)
- **HTTP Client**: Axios with interceptors
- **Analytics**: Cloudflare Analytics (RUM)

### Backend (API)
- **Framework**: Django 5.1 + Django REST Framework 3.15
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL 15 (via Docker)
- **Cache**: Redis 6
- **Task Queue**: Celery + django-celery-beat
- **Media Storage**: Cloudinary
- **AI Integration**: Ollama (product descriptions, chatbot, embeddings)
- **PDF Generation**: ReportLab

### Infrastructure & Deployment
- **Frontend Hosting**: Cloudflare Pages (Next.js standalone)
- **Backend Hosting**: Cloudflare Workers (containerized Docker)
- **CDN/DNS**: Cloudflare
- **Object Storage**: Cloudflare R2
- **Database**: Cloudflare D1 (SQLite) — Workers builds
- **Email**: Gmail SMTP

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

### AI Features (Ollama)
- Auto-generate SEO-friendly product descriptions
- Auto-generate meta titles, descriptions, keywords
- AI-suggested product tags
- AI shopping assistant chatbot
- Intelligent product bundle suggestions
- Vector embeddings for semantic similarity

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
├── docker-compose.yml    # Development orchestration
├── docker-compose.prod.yml  # Production (Cloudflare Workers)
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.10+, Node.js 18+, Docker, Docker Compose

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
OLLAMA_BASE_URL=http://localhost:11434
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

### Production (Cloudflare Workers)

```bash
# Build and deploy backend Docker image to Cloudflare Workers
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Deploy frontend to Cloudflare Pages
# Push to GitHub main branch — Cloudflare Pages auto-deploys
git push origin main
```

### Cloudflare Cache Rule (Required)
Create a Cache Rule in the Cloudflare dashboard to cache static assets:
- **Static cache**: `.next/static/*`, `/images/*`, `.woff2`
- **API cache**: `/api/v1/products/` with 5min TTL

### Admin Access
- URL: `/admin/`
- Credentials: `malaikanest7@gmail.com` / `Dosho10701$`

## License

MIT