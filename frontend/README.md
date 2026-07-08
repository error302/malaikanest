# Malaika Nest — Premium Storefront

Next.js 16 + TypeScript + Tailwind CSS 4 storefront for Malaika Nest, rebuilt with a
premium, minimalist, mobile-first aesthetic. This replaces the legacy frontend.

## Highlights

- **Premium responsive design** — flawless on mobile (iPhone SE → 12 Pro Max) and desktop (1280px → 4K)
- **Real API integration** — wired to the Django backend at `/api/v1/*` with in-memory caching,
  JWT refresh, exponential backoff retry, and graceful fallback to sample data
- **Full storefront** — hero carousel (Cloudinary banners), shop-by-age, categories, product
  detail, cart, checkout (M-Pesa/card/cash), wishlist, auth, account, order history
- **Admin dashboard** — dashboard, products (CRUD), orders, customers, categories, banners,
  invoices, reports, settings
- **Accessibility** — WCAG 2.1 AA: skip link, semantic landmarks, ARIA roles, keyboard nav,
  focus-visible, 44px touch targets, reduced-motion support
- **SEO** — full metadata, OpenGraph, Twitter cards, JSON-LD Store schema, semantic HTML
- **Database schema** — see `prisma/schema.prisma` for the normalized, indexed Prisma schema
  and `DATABASE.md` for PostgreSQL tuning best practices

## Tech stack

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (New York) + Lucide icons
- Axios (API client) + Sonner (toasts) + Framer Motion (animations)
- Prisma ORM (schema documentation — the live DB is the Django PostgreSQL)
- Cormorant Garamond (serif headlines) + DM Sans (body) via `next/font`

## Getting started

```bash
cd frontend
bun install

# Configure environment
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_API_URL to your Django backend

bun run dev
```

Open http://localhost:3000

## Environment variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Django backend URL (public) | `https://malaikanest.duckdns.org` |
| `INTERNAL_API_URL` | Django backend URL (server-side, optional) | `http://10.0.0.5:8000` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for canonical/OG | `https://malaikanest.duckdns.org` |

## Project structure

```
src/
├── app/
│   ├── (store)/           # Customer-facing routes (shop, cart, checkout, account, auth, info pages)
│   ├── admin/             # Admin dashboard (products, orders, customers, banners, reports, settings)
│   ├── globals.css        # Brand design system (warm gold/brown/cream/terracotta palette)
│   ├── layout.tsx         # Root layout: fonts, metadata, JSON-LD, providers
│   └── page.tsx           # Homepage (hero, shop-by-age, featured, best-sellers, testimonials, newsletter)
├── components/
│   ├── malaika/           # Storefront components (navbar, hero, product-card, footer, etc.)
│   └── ui/                # shadcn/ui primitives
└── lib/
    ├── api.ts             # Axios client: caching, retry, JWT refresh
    ├── authContext.tsx    # Auth provider (JWT + refresh token bootstrap)
    ├── cartContext.tsx    # Cart provider (optimistic UI, debounced sync)
    ├── wishlistContext.tsx # Wishlist provider (localStorage)
    ├── products.ts        # Server-side data fetchers
    ├── media.ts           # Image URL resolver (Cloudinary + local media)
    └── catalog.ts         # Category tree utilities
```

## Brand identity

- **Palette**: warm organic — gold `#8B6914`, brown `#5C4033`, cream `#FDF8F3`, terracotta `#C4704A`
- **Typography**: Cormorant Garamond (headlines) + DM Sans (body)
- **Voice**: "Made with love in Kenya" — premium, warm, organic, classy
- **Market**: Kenya (KES pricing, M-Pesa Till 3370347, Mombasa-based)

## Deploy to production

1. Deploy `frontend/` to Vercel (or your hosting) — it's a standalone Next.js app
2. Set `NEXT_PUBLIC_API_URL` to your Django backend (e.g. `https://malaikanest.duckdns.org`)
3. Update nginx/CDN to route to the new frontend
4. Run `bun run build` to verify the production build before going live

## License

MIT — same as the parent Malaika Nest project.
