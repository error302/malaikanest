# Malaika Nest - E-Commerce Platform

A full-featured e-commerce platform for baby and children's clothing in Kenya.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (React 18)
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React hooks + Context
- **HTTP Client**: Axios
- **Analytics**: Vercel Analytics & Speed Insights
- **Language**: TypeScript

### Backend
- **Framework**: Django 5.1
- **API**: Django REST Framework 3.15
- **Authentication**: JWT (djangorestframework-simplejwt)
- **Database**: PostgreSQL 15
- **Cache**: Redis 6
- **Task Queue**: Celery with django-celery-beat
- **WebSockets**: Django Channels (for real-time features)
- **Media Storage**: Cloudinary
- **AI Integration**: Ollama (LLM for product descriptions, chatbots, embeddings)
- **Image Processing**: Pillow
- **PDF Generation**: ReportLab

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose
- **Web Server**: Gunicorn (Django), Nginx
- **Hosting**: Google Cloud Platform (GCP)
- **DNS**: DuckDNS
- **SSL**: Let's Encrypt (via Certbot)

## Core Features

### Products & Catalog
- **Product Management**: Full CRUD with variants (size, color)
- **Categories**: Hierarchical categories with parent/child relationships
- **Brands**: Brand management with logos
- **Banners**: Promotional banners with scheduling (start/end dates)
- **Inventory Tracking**: Real-time stock with reserved quantities
- **Product Variants**: Size and color variations with individual SKU
- **Image Gallery**: Multiple product images with primary image support
- **SEO**: Meta titles, descriptions, auto-generated content

### Shopping Experience
- **Shopping Cart**: Persistent cart (user + guest sessions)
- **Wishlist**: Save products for later
- **Product Reviews**: Rating and review system
- **Search**: Full-text search with filters
- **Product Filtering**: By category, age group, gender, size, price
- **Similar Products**: AI-powered semantic search using embeddings
- **Product Bundles**: AI-generated product bundles

### User Accounts
- **Authentication**: Email + password with JWT tokens
- **Registration**: Email verification required
- **Password Reset**: Token-based password recovery
- **Phone Authentication**: Phone number as required field
- **User Roles**: Admin and Customer roles
- **Address Book**: Multiple saved addresses

### Checkout & Orders
- **Guest Checkout**: Checkout without account
- **Order State Machine**: Valid status transitions (pending → paid → processing → shipped → delivered)
- **Multiple Payment Methods**:
  - M-Pesa (Kenya mobile money)
  - Credit/Debit Cards
  - Bank Transfer
  - Cash on Delivery
- **Delivery Zones**: Mombasa (same-day), Nairobi (1-2 days), Upcountry (2-3 days)
- **Coupons & Discounts**: Flat and percentage-based coupons
- **Order Tracking**: Tracking number and carrier info
- **Gift Orders**: Gift message support
- **Invoice Generation**: Auto-generated PDF invoices

### AI Features (Ollama)
- **Product Descriptions**: Auto-generate SEO-friendly descriptions
- **SEO Metadata**: Auto-generate meta titles, descriptions, keywords
- **Product Tags**: AI-suggested tags for filtering
- **Chatbot**: AI shopping assistant for product recommendations
- **Product Bundles**: Intelligent bundle suggestions
- **Semantic Search**: Vector embeddings for similarity matching
- **Product Embeddings**: Store and query product embeddings

### Admin Dashboard
- **Product Management**: Full product CRUD with bulk operations
- **Order Management**: Order status updates, tracking
- **Category Management**: Hierarchical category editor
- **Banner Management**: Promotional banner scheduling
- **User Management**: Customer and admin management
- **Analytics**: Sales and inventory reports
- **Bulk Operations**: Generate descriptions, optimize content

## Project Structure

```
malaika-nest/
├── backend/
│   ├── apps/
│   │   ├── accounts/       # User authentication & profiles
│   │   ├── ai/            # AI services (Ollama integration)
│   │   ├── products/      # Product catalog & inventory
│   │   ├── orders/       # Order processing & cart
│   │   ├── payments/     # Payment integrations (M-Pesa, etc.)
│   │   └── users/        # Additional user features
│   ├── config/           # Django settings
│   ├── scripts/          # Utility scripts
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── components/  # React components
│   │   └── lib/         # Utilities & API clients
│   ├── public/           # Static assets
│   └── package.json
├── deployment/           # Deployment configs & scripts
├── docker-compose.yml   # Docker orchestration
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 15
- Redis 6

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend
npm install

# Copy environment file
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

### Docker Setup

```bash
# Development
docker-compose up

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login (JWT)
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Blacklist refresh token
- `POST /api/auth/password-reset/` - Request password reset
- `POST /api/auth/password-reset/confirm/` - Confirm password reset

### Products
- `GET /api/products/` - List products (with filters)
- `POST /api/products/` - Create product (admin)
- `GET /api/products/{slug}/` - Product detail
- `PUT /api/products/{slug}/` - Update product (admin)
- `DELETE /api/products/{slug}/` - Delete product (admin)
- `GET /api/categories/` - List categories
- `GET /api/banners/` - Active banners

### Cart & Checkout
- `GET /api/cart/` - Get cart
- `POST /api/cart/add/` - Add to cart
- `POST /api/cart/remove/` - Remove from cart
- `POST /api/orders/create/` - Create order
- `GET /api/orders/` - List user orders
- `GET /api/orders/{id}/` - Order detail

### AI Services
- `POST /api/ai/chat/` - AI chatbot
- `POST /api/ai/generate-description/` - Generate product description
- `POST /api/ai/generate-seo/` - Generate SEO metadata
- `POST /api/ai/similar-products/` - Find similar products

### Payments
- `POST /api/payments/mpesa/initiate/` - Initiate M-Pesa payment
- `POST /api/payments/mpesa/callback/` - M-Pesa callback
- `POST /api/payments/verify/` - Verify payment status

## Deployment

### Production Requirements
- Domain name (configured with DuckDNS)
- SSL certificate (Let's Encrypt)
- GCP VM instance
- PostgreSQL database (Cloud SQL or managed)
- Redis (Cloud SQL Memorystore or managed)
- Cloudinary account for media storage

### Environment Variables

**Backend (.env)**
```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com
DB_NAME=malaika_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
REDIS_URL=redis://localhost:6379/0
CLOUDINARY_URL=cloudinary://...
OLLAMA_API_KEY=your-ollama-api-key
```

**Frontend (.env.production)**
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

## License

MIT License
