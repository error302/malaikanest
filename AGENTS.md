# AGENTS.md — Malaika Nest

> **Read this first.** It orients any AI agent (or human) to the repo in under 2 minutes.
> **Last updated:** 2026-08-05 · **Repo root:** `C:\Users\user\Desktop\malaikanest`

---

## 1. What it is

A full-stack **baby & children's clothing e-commerce platform for Kenya**.

| Thing | URL |
|---|---|
| Storefront | https://malaikanest.com |
| API | https://api.malaikanest.com |
| Django admin | https://malaikanest.com/manage-store/  *(NOT `/admin/` — that 404s by design)* |
| Next.js admin dashboard | https://malaikanest.com/admin |

Currency: **KES**. Payments: **M-Pesa STK** (primary), Pesapal, Card, Cash on Delivery.

## 2. Repo layout

```
malaikanest/
├── backend/          Django 5.1 REST API (Gunicorn) + Celery + Channels
│   ├── apps/{accounts,core,orders,payments,products}/
│   ├── config/       split settings: base/dev/prod + celery, urls, asgi
│   └── templates/    emails + admin base
├── frontend/         Next.js 16 (App Router) + React 19 + Tailwind v4 + shadcn/ui
│   ├── src/app/      route groups: (store) storefront, admin/ dashboard, api/ CMS routes
│   ├── src/components/{malaika,ui,admin}/
│   ├── src/lib/      contexts (cart/wishlist/auth), api client, fetchers
│   └── prisma/       SQLite CMS schema (branding, content, thrifted, blog, loyalty)
├── cloudflared/      tunnel config + credentials
├── deployment/       bare-metal GCP scripts (alt path)
├── docs/             ARCHITECTURE.md, plans, security, mpesa docs
├── docker-compose.yml        ← ACTIVE production topology
└── docker-compose.prod.yml   ← alt prod compose
```

## 3. Tech stack (actual versions — trust package.json, not README)

- **Frontend:** Next.js 16.1.1, React 19, TypeScript 5, Tailwind v4, shadcn/ui + Radix,
  Framer Motion 12, TanStack Query/Table, Zustand, React Hook Form + Zod, Axios, Prisma 6 (SQLite CMS).
  Build = `standalone`; prod start = `bun .next/standalone/server.js`.
- **Backend:** Django 5.1.15 + DRF 3.15 + simplejwt 5.5, PostgreSQL 15, Redis 7, Celery + beat,
  Channels (WebSockets), Cloudinary media, ReportLab PDF, Brevo SMTP.
- **Infra:** Docker Compose on a single host fronted by **Cloudflare Tunnels** (hot-standby),
  Cloudinary images, Cloudflare Analytics. *(README's "Cloudflare Workers/Pages" line is outdated.)*

## 4. Run / build / test

```bash
# Frontend (local dev)
cd frontend
npm install --legacy-peer-deps
npm run dev            # http://localhost:3000

# Type check (IMPORTANT — see gotcha #1)
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build          # next build + copy standalone assets

# Backend (local dev)
cd backend
pip install -r requirements.txt
cp .env.example .env   # edit secrets
python manage.py migrate
python manage.py runserver 0.0.0.0:8081
```

## 5. Critical conventions & gotchas

1. **`next.config.ts` now enforces TypeScript** (`ignoreBuildErrors: false` as of 2026-08-05).
   `next build` runs `tsc` and will fail on type errors. The project is tsc-clean — keep it that way.
   Run `npx tsc --noEmit` to check locally.
2. **Icon alias:** `lucide-react` is aliased to `./src/lib/icons.tsx` (a Phosphor-backed shim) in
   BOTH `next.config.ts` and `tsconfig.json`. Never "fix" by removing it. If a shadcn/ui component
   imports an icon with an `Icon` suffix (e.g. `ChevronDownIcon`), add the alias in `icons.tsx` —
   don't change the component.
3. **`NEXT_PUBLIC_*` vars are build-time inlined** — changing the API URL requires a rebuild.
4. **CSP is strict** — new external domains/scripts must be added to `connect-src`/`script-src` in
   `next.config.ts`.
5. **Products live in Django/Postgres**, fetched via REST. The Prisma SQLite DB is CMS-only
   (branding, content blocks, thrifted, blog, loyalty). Never use `db.product` — there is no such
   model. Use the Django API for product counts.
6. **Frontend CMS DB** is on a persistent volume (`frontend_cms_data:/app/data/cms.db`).
7. **JWT:** access token in memory, refresh token in httpOnly cookie. `User.token_version`
   invalidates all JWTs on password change / logout-everywhere.
8. **Email via Brevo** (`smtp-relay.brevo.com`). Every send logged to `EmailLog`.
9. Install frontend deps with `--legacy-peer-deps` (React 19 peer constraints).

## 6. Key file jump table

| To edit… | File |
|---|---|
| API client / cache / JWT refresh | `frontend/src/lib/api.ts` |
| Storefront shell (navbar/footer/cart counts) | `frontend/src/components/malaika/store-shell.tsx` |
| Home page | `frontend/src/app/(store)/page.tsx` |
| Product detail | `frontend/src/app/(store)/products/[slug]/page.tsx` |
| Cart (client / server) | `frontend/src/lib/cartContext.tsx` · `backend/apps/orders/views.py` |
| M-Pesa initiate / callback | `backend/apps/payments/views.py` + `services.py` |
| Django settings | `backend/config/settings/{base,dev,prod}.py` |
| Next.js config / CSP | `frontend/next.config.ts` |
| Icon shim | `frontend/src/lib/icons.tsx` |
| Prisma CMS schema | `frontend/prisma/schema.prisma` |

## 7. Deeper docs

- `docs/ARCHITECTURE.md` — full codebase map (backend, frontend, data flow, ADRs)
- `docs/BUG-FIXES-2026-08-05.md` — latest bug-fix pass (TS errors → 0)
- `docs/superpowers/plans/2026-07-30-auth-pages-accessibility-fixes.md` — auth a11y (DONE)
- Obsidian vault: `C:\Users\user\Documents\Obsidian Vault\Malaika Nest.md` (linked MOC)

## 8. Admin access (rotate if exposed)

Django admin: `https://malaikanest.com/manage-store/` · Next.js dashboard: `https://malaikanest.com/admin`

**No credentials are stored in the repo.** Create/rotate the admin with the env-backed commands
(`fix_admin` / `create_superuser`) — they refuse to run without `ADMIN_PASSWORD`. The old password
was committed to git history, so **rotate it** (`ADMIN_PASSWORD=… python manage.py fix_admin`).

## 9. Quality gates (all green as of 2026-08-05)

```bash
cd frontend
npx tsc --noEmit     # → 0 errors (strict mode, no @ts-ignore)
npm run lint         # → 0 problems
npm run build        # → succeeds (type checking enforced, 63 pages)
```

- **TypeScript:** strict mode, zero errors, zero `@ts-ignore`/`@ts-expect-error`.
- **ESLint:** zero problems. `react-hooks/set-state-in-effect` disabled globally (justified in
  `eslint.config.mjs` — fires on legitimate SSR hydration/data-fetch/library patterns).
- **Build:** `next build` passes with `ignoreBuildErrors: false`. 63 routes generated.
- **No TODOs/FIXMEs/HACKs** in source. Only 5 `console.error` calls, all in error boundaries.
- **Error boundaries:** app-level (`error.tsx`), root (`global-error.tsx`), product-level
  (`products/[slug]/error.tsx`). 404 page (`not-found.tsx`). Loading skeleton on product pages.
