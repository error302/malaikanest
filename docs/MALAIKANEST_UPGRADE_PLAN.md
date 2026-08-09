# Malaika Nest — Comprehensive Upgrade & Handoff Plan

> **Document type:** Engineering handoff plan, file-by-file, with full code snippets.
> **Author:** metardu (Z.ai)
> **Date:** 2026-08-10
> **Status:** Branch consolidation **DONE** (5 merges + 1 cleanup pushed to `main`). All 14 feature branches deleted. Repo now has a single `main` branch. Remaining work: redesign execution per this document.
> **Audience:** The next agent (human or AI) who picks up execution. Read this top-to-bottom before touching code.
> **Repo state at handoff:** `1814c8a` on `main` (https://github.com/error302/malaikanest)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Branch Consolidation Report (DONE)](#2-branch-consolidation-report-done)
3. [Current-State Audit](#3-current-state-audit)
4. [Design System Foundation — "Editorial Premium"](#4-design-system-foundation--editorial-premium)
5. [Storefront Redesign — File-by-File](#5-storefront-redesign--file-by-file)
6. [Admin Dashboard Redesign — File-by-File](#6-admin-dashboard-redesign--file-by-file)
7. [Backend Hardening — File-by-File](#7-backend-hardening--file-by-file)
8. [Infra / DevOps — File-by-File](#8-infra--devops--file-by-file)
9. [Mobile PWA — File-by-File](#9-mobile-pwa--file-by-file)
10. [Accessibility Audit & Remediation Plan](#10-accessibility-audit--remediation-plan)
11. [Performance Budget & Optimization Plan](#11-performance-budget--optimization-plan)
12. [Implementation Phases (8-Week Roadmap)](#12-implementation-phases-8-week-roadmap)
13. [Acceptance Criteria & QA Gates](#13-acceptance-criteria--qa-gates)
14. [Handoff Notes for the Next Agent](#14-handoff-notes-for-the-next-agent)

---

## 1. Executive Summary

### 1.1 What this is

Malaika Nest is a production-grade baby & children's clothing e-commerce platform serving the Kenyan market. It is a full-stack monorepo with a Django 5.1 + DRF + PostgreSQL backend and a Next.js 16 + React 19 + Tailwind v4 frontend, deployed via Docker Compose behind Cloudflare Tunnels. The codebase is mature — 444 commits, 63 Next.js routes, ~1500 LOC of Django models, JWT auth, M-Pesa STK payments, Celery + Channels, Cloudinary media, the works.

But maturity has produced sprawl: 15 branches with overlapping bot-generated fixes (Bolt, Sentinel, Palette, Jules), inconsistent design tokens, an admin dashboard that's functionally complete but visually dated, mobile UX gaps that show up on real Kenyan devices (Tecno, Infinix, Samsung A-series), and a backend with known N+1 hotspots that have only been half-fixed.

This document is the single source of truth for the next phase of work: **consolidate the codebase to one branch (DONE), then execute an end-to-end upgrade — storefront, admin, backend, infra, PWA — to a flawless, launch-ready state.**

### 1.2 What "done" looks like

When this plan is fully executed, Malaika Nest will be:

- **One branch.** `main` only. No `feature/`, `fix/`, `bolt-`, `sentinel-`, `palette-`, `jules-` branches. All work merges into `main` via PR.
- **Editorial-premium aesthetic.** High-contrast monochrome foundation (ink #1A1410, paper #FDF8F3) with a single warm accent (terracotta #B85C38). Cormorant Garamond display + DM Sans body. Pinterest-grade composition: masonry grids, hover lifts, generous whitespace, editorial photography layout.
- **Flawless on mobile.** Tested on iPhone SE (375×667), iPhone 14 Pro (393×852), Tecno Spark 10 (360×800), Samsung Galaxy A14 (360×740), iPad mini (768×1024). Bottom nav, sheet-style filters, swipeable carousels, 44px touch targets, safe-area insets respected.
- **Flawless on desktop.** 1280px → 4K. Hover states, keyboard nav, focus rings, command palette (Cmd+K) in admin.
- **WCAG 2.1 AA accessible.** Skip links, semantic landmarks, ARIA correctness, keyboard navigation, visible focus, reduced-motion support, color contrast ≥ 4.5:1 for body text.
- **Core Web Vitals green.** LCP < 2.0s, INP < 200ms, CLS < 0.05 on 3G-fast profile (Kenya-typical).
- **PWA-installable.** Manifest, service worker, offline catalog pages, push notifications for order status.
- **Admin dashboard rebuilt.** Sidebar with collapsible groups, data tables with TanStack Table, command palette, bulk actions, real-time order updates via Channels, inline product editing, drag-and-drop category tree.
- **Backend hardened.** Rate limits per endpoint class, request validation via Pydantic-equivalent (DRF serializers + system checks), idempotency keys on all POSTs, OpenAPI schema generation, structured logging, Sentry-ready.
- **Infra observable.** Prometheus metrics at `/metrics`, Grafana dashboards, alerting on 5xx rate and p95 latency, automated nightly DB backups to Backblaze B2, staging environment on a separate subdomain.

### 1.3 The non-negotiables

These are the rules every agent executing this plan must follow. They exist because the codebase has been burned by violating them before.

1. **`next.config.ts` enforces TypeScript.** `ignoreBuildErrors: false`. `next build` runs `tsc`. The project is tsc-clean — keep it that way. Run `npx tsc --noEmit` before every commit.
2. **Never remove the `lucide-react` → Phosphor shim** in `next.config.ts` and `tsconfig.json`. shadcn/ui components import `ChevronDownIcon` etc.; the shim aliases them. If a new shadcn component fails to find an icon, add it to `frontend/src/lib/icons.tsx`.
3. **`NEXT_PUBLIC_*` vars are build-time inlined.** Changing the API URL requires a rebuild. Plan deployments around this.
4. **CSP is strict.** New external domains must be added to `connect-src`/`script-src` in `next.config.ts`. The current CSP is in §3.4.
5. **Products live in Django/Postgres**, fetched via REST. The Prisma SQLite DB is CMS-only (branding, content blocks, thrifted, blog, loyalty). Never use `db.product` — there is no such model.
6. **JWT:** access token in memory, refresh token in httpOnly cookie. `User.token_version` invalidates all JWTs on password change.
7. **Install frontend deps with `--legacy-peer-deps`** (React 19 peer constraints).
8. **Don't commit secrets.** The old admin password was committed to git history once. Rotate via `ADMIN_PASSWORD=… python manage.py fix_admin`. Never again.
9. **Run `npm run lint` and `npx tsc --noEmit` before pushing.** CI will fail otherwise.
10. **Don't reintroduce the `jules-6163811651957087808` regression.** That branch downgraded `sharp` from `^0.35.3` to `^0.34.3` (security advisory) and removed `isomorphic-dompurify` (which `sentinel-fix-xss` now depends on). It was discarded for these reasons. See §2.

---

## 2. Branch Consolidation Report (DONE)

### 2.1 What was executed on 2026-08-10

The repo had **15 branches** besides `main`. I categorized them and executed the following:

| # | Branch | Status | Action Taken | Reason |
|---|--------|--------|--------------|--------|
| 1 | `sentinel-security-fixes-16522659870041132542` | UNMERGED, 1 commit | ✅ Merged | Critical SSRF + IP spoofing fix |
| 2 | `sentinel-fix-xss-12294546028479093244` | UNMERGED, 1 commit | ✅ Merged | Blog SSR XSS fix via DOMPurify |
| 3 | `bolt-fix-n1-queries-8747630179587556467` | UNMERGED, 1 commit | ✅ Merged | N+1 elimination in product serializers |
| 4 | `palette-mobile-nav-a11y-11252257466944893946` | UNMERGED, 1 commit | ✅ Merged | focus-visible ring + cart aria-label |
| 5 | `ux/a11y-cart-badge-1113435950562343751` | UNMERGED, 1 commit | ✅ Merged (conflict resolved) | Cart badge pluralization + variable extraction |
| 6 | `fix/bolt-nplus1-queries-18127387578508889891` | UNMERGED, 1 commit | ❌ Skipped, deleted | Subset of #3 — same files, same logic, less complete. Would have just conflicted. |
| 7 | `jules-6163811651957087808-a6016945` | UNMERGED, 1 commit, behind 21 | ❌ Skipped, deleted | Regressed `sharp` security bump (commit `9a049f6`), removed `isomorphic-dompurify` (needed by sentinel-fix-xss), removed category images, low-value refactor. Cherry-picked only the unused-imports fix. |
| 8–15 | 8 already-merged branches | ahead=0 | 🗑️ Deleted | Already in main; branch refs were stale. |

### 2.2 Conflicts encountered and resolution

**Conflict 1:** `.jules/sentinel.md` (add/add) — both sentinel branches created the file with different entries. Resolution: concatenated both entries in chronological order. Final file has 3 entries (SSRF, IP spoofing, XSS).

**Conflict 2:** `.Jules/palette.md` (add/add) — both palette branches created the file with different entries. Resolution: concatenated entries, added a third entry documenting the focus-visible ring merge.

**Conflict 3:** `frontend/src/components/malaika/mobile-bottom-nav.tsx` (content) — both branches modified the `aria-label` of the cart link. Resolution: kept the `ariaLabel` variable approach from `ux/a11y-cart-badge` (cleaner, handles pluralization) AND kept the `focus-visible:ring-2` class from `palette-mobile-nav-a11y` (already auto-merged in the `className` attribute). Best of both.

### 2.3 Commits added to `main`

```
1814c8a chore: remove unused imports (Banner, Category) from fix_db_image_paths.py
33459db merge: ux/a11y-cart-badge (cart badge pluralization + variable extraction)
9af3a25 merge: palette-mobile-nav-a11y (focus-visible + cart aria-label)
0be5480a merge: bolt-fix-n1-queries (product serializer prefetch cache)
7edab4c merge: sentinel-fix-xss (Blog SSR DOMPurify)
19168e8 merge: sentinel-security-fixes (SSRF + IP spoofing)
```

### 2.4 Verification

- `git branch -r` shows only `origin/HEAD -> origin/main` and `origin/main`.
- All 14 non-main branches deleted on remote.
- `main` pushed successfully to `github.com/error302/malaikanest`.
- PAT (`github_pat_11APVSPAI0…`) used for the push — **rotate this PAT now** per user instruction.

### 2.5 Branch policy going forward

- **No long-lived feature branches.** All work targets `main` via PR.
- **PRs must be reviewed** by at least one human before merge, even for AI-generated code (Bolt/Sentinel/Palette branches slipped in without review and caused the sprawl this plan cleans up).
- **Squash-merge PRs** with a Conventional Commit message (`feat:`, `fix:`, `chore:`, `refactor:`, `perf:`, `docs:`, `style:`, `test:`, `ci:`).
- **Branch naming for short-lived work:** `feat/<scope>-<short-desc>` (e.g. `feat/admin-command-palette`). Delete the branch after merge.

---

## 3. Current-State Audit

### 3.1 What's working well

The codebase is genuinely production-grade in several respects:

- **TypeScript strict mode, zero errors, zero `@ts-ignore`.** The bug-fix pass on 2026-08-05 (see `docs/BUG-FIXES-2026-08-05.md`) cleaned up all type errors. `next build` runs `tsc` and passes.
- **ESLint clean.** Only one rule disabled globally (`react-hooks/set-state-in-effect`) with a justified reason in `eslint.config.mjs`.
- **Strict CSP** in `next.config.ts` with HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
- **JWT architecture** is sound: access token in memory, refresh token in httpOnly cookie, `User.token_version` for global invalidation.
- **M-Pesa STK integration** is real and working — sandbox or live via `MPESA_ENV`. Real-time polling via Channels.
- **Idempotency layer** in `backend/apps/core/idempotency.py` — POSTs can be safely retried.
- **Circuit breaker** in `backend/apps/core/circuit_breaker.py` — protects downstream services.
- **Outbox pattern** in `backend/apps/core/outbox.py` — reliable event delivery.
- **Image validation** in `backend/apps/products/models.py::validate_image_file` — checks actual file content with PIL, not just extension.
- **Cart merge** (guest → user) eliminates N+1 (commit `88a65cd`).
- **Product serializers** now use prefetch cache (commit `0be5480a` from this merge pass).
- **Cloudflare Tunnel hot-standby** — production stays up even if primary tunnel drops.
- **Redis AOF + RDB** — zero data loss on container restart.

### 3.2 What's broken or missing

#### 3.2.1 Repo hygiene

- **24 stray scripts in repo root** (`deploy-fix.sh`, `deploy.ps1`, `deploy.sh`, `deploy_fix2.js`, `deploy_frontend.js`, `deploy_now.js`, `fix-gunicorn.sh`, `fix_db_image_paths.py`, `load-test.js`, `patch_and_deploy.js`, `patch_frontend_container.js`, `patch_vm_host_media.js`, `patch_vm_nav.js`, `purge_secrets.sh`, `quick-deploy.sh`, `run_db_fix.js`, `seed_cloudinary_products.py`, `seed_live_products.py`, `sync_build_to_vm.js`, `test_login.sh`, `test_reg.py`, `test_reg.sh`, `test_s22_live.js`, `update_remote_backend.js`). These are operational one-offs that should live in `scripts/ops/` with documentation, or be deleted if no longer relevant.
- **Stray binary files** in repo root: `banner_1.jpg` (372KB), `malaikanest-home.png` (2.3MB), `malaikanest-home-mobile.png`, `malaikanest-mobile-home.png`, `malaikanest-mobile-issue.png`, `malaikanest-search-mobile.png`. These bloat the repo and should be moved to `docs/screenshots/` or removed (they're not referenced by the app).
- **Stray SQL files** in repo root: `orders_timestamp_fix.sql`, `payment_order12.sql`, `payment_order12_status.sql`, `payments_all_columns.sql`, `payments_columns.sql`, `payments_schema_fix.sql`, `mpesa_success_callback.json`, `malaikanest_pdf_text.txt`. These are debugging artifacts — move to `docs/scratch/` or delete.
- **Stray directories:** `.freebuff/` (2.4MB desktop.db — should be gitignored, it is, but the file is in the repo), `.playwright-mcp/` (test snapshots), `.localappdata/ms-playwright/`, `.npm-cache/`, `.git.bak-20260317-062850/`, `malaika nest/` (note the space — looks accidental).
- **Two docker-compose files:** `docker-compose.yml` (active) and `docker-compose.prod.yml` (alt). The prod one is stale and should be removed or merged.
- **Two Caddyfiles:** root `malaikanest-nginx.conf` and `frontend/Caddyfile`. Pick one.
- **`backend/_direct_post.py`, `_test_json.py`, `_test_post.py`** — debug scripts in backend root.

#### 3.2.2 Frontend design system

- **Tailwind config is mostly empty** (`frontend/tailwind.config.ts` is 60 lines, just shadcn defaults). All the real design tokens live as CSS custom properties in `globals.css`. This works but means Tailwind's `theme.extend` is wasted — every brand color has to be referenced as `style={{ color: 'var(--brand-gold)' }}` instead of `text-brand-gold`. Verbose, error-prone.
- **Inconsistent styling approach.** Some components use Tailwind utilities (`className="flex items-center gap-3"`), some use inline styles (`style={{ color: 'var(--brand-brown)' }}`), some use both. The product card has 12 inline `style` props. This is hard to maintain and impossible to theme.
- **No dark mode.** `darkMode: "class"` is set in Tailwind config, but no dark tokens are defined in `globals.css`. The `next-themes` package is installed but unused.
- **Typography scale is implicit.** Cormorant Garamond is loaded via `next/font` but only used where explicitly set via `fontFamily: 'var(--font-cormorant)'`. No `font-serif`/`font-sans` utility classes wired up consistently.
- **No motion system.** Framer Motion 12 is installed but barely used. The hero carousel uses CSS transitions. Hover effects are CSS-only. No page transitions, no layout animations, no shared element transitions.

#### 3.2.3 Frontend UX gaps

- **Navbar is 886 lines in one file.** `frontend/src/components/malaika/navbar.tsx` does desktop nav, mobile drawer, search overlay, account dropdown, shop dropdown, age dropdown — all in one component. Unmaintainable.
- **Mobile search is hidden behind a tap.** The search icon opens an overlay. On Pinterest, search is always visible in the mobile nav bar. Reduces friction.
- **No filter sidebar on PLP.** `frontend/src/app/(store)/categories/categories-client.tsx` has filters in a Sheet that opens on tap. On desktop, filters should be a persistent left sidebar (Pinterest-style).
- **No masonry grid.** Product grids use CSS grid with fixed columns. Pinterest's signature feature is masonry — variable-height cards that pack tightly. This is the #1 Pinterest-inspired pattern missing.
- **Product card has no quick-add.** Hover reveals a wishlist heart, but "Add to cart" requires navigating to PDP. Pinterest-style quick-add on hover (desktop) or long-press (mobile) reduces friction.
- **Hero is a basic carousel.** No parallax, no Ken Burns effect, no split-screen layout. Editorial-premium hero should be a single full-bleed image with overlaid typography, not a carousel.
- **No "shop the look" on PDP.** Editorial-premium PDPs show the product in a lifestyle shot with shoppable hotspots.
- **Cart drawer is missing.** Cart is a full page (`/cart`). Adding to cart should open a slide-over drawer showing the item, suggested add-ons, and a "checkout" CTA. Standard e-commerce pattern.
- **Checkout is one page.** No multi-step flow (information → shipping → payment → review). Single-page is fine for simple carts but errors are harder to surface.
- **Account page is basic.** No order timeline, no saved addresses UI, no loyalty program visualization, no wishlist management.

#### 3.2.4 Admin dashboard gaps

- **Admin layout is a static sidebar** (`frontend/src/app/admin/layout.tsx`). No collapse, no favorites, no command palette, no quick search.
- **Dashboard page shows 4 stat cards + recent orders + 3 quick actions.** That's it. No charts, no revenue trend, no top products, no low-stock alerts, no pending tasks.
- **Products page is a flat list.** No TanStack Table features (sorting, filtering, column visibility, pagination). No bulk actions. No inline edit.
- **Product editor** (`frontend/src/app/admin/products/[id]/page.tsx`) is functional but the variant editor and gallery uploader are separate components with no drag-and-drop.
- **Orders page is a list.** No kanban view (drag-and-drop status changes), no order detail drawer, no fulfillment workflow.
- **No real-time updates.** New orders don't appear without a page refresh. Channels is set up on the backend but unused in admin.
- **No reports beyond a single page.** No revenue by category, no customer cohorts, no inventory turnover, no M-Pesa success rate.
- **Settings page is a flat form.** No tabs, no search, no separate pages for different settings groups.

#### 3.2.5 Backend gaps

- **No OpenAPI schema generation.** DRF has `drf-spectacular` available but it's not installed. Frontend has to read Django code to know API shapes.
- **No structured logging.** `logging.getLogger(__name__)` calls exist but no JSON formatter, no request ID in logs, no correlation with frontend.
- **No rate limiting on admin endpoints.** `throttle_scope = "cart"` is set on cart endpoints but not on admin endpoints. Brute-force attacks on admin login are possible.
- **No 2FA on admin accounts.** Username + password only.
- **No soft delete on orders/payments.** Hard deletes only. Audit trail is fragile.
- **No webhook signature verification logging.** M-Pesa callbacks are verified but not logged for debugging.
- **No database connection pooling.** Each request opens a new DB connection. `pgbouncer` is not in the docker-compose.
- **No query count middleware.** N+1 bugs slip through because nothing counts queries per request in dev.
- **Celery beat schedule is in code** (`backend/config/celery.py`). Should be in DB via `django-celery-beat` for runtime changes.

#### 3.2.6 Infra gaps

- **No staging environment.** Production is the only deployed environment. Changes go straight to live.
- **No CI/CD pipeline.** No GitHub Actions workflow. Builds and deploys are manual via `deploy.sh` and `patch_*.js` scripts.
- **No monitoring.** No Prometheus, no Grafana, no alerts. If the site goes down, the only signal is customer complaints.
- **No log aggregation.** Logs are in `backend/logs/` and Docker `docker logs`. No Loki, no ELK.
- **No automated backups.** Postgres data is on a persistent volume but no scheduled `pg_dump` to off-site storage.
- **No health check alerting.** `/api/health/` exists but nothing pings it.
- **Cloudflare Analytics is on** but not wired to any alerting.

#### 3.2.7 PWA gaps

- **No service worker.** Next.js 16 has built-in SW support but it's not enabled.
- **No web manifest.** Wait — `manifest: "/site.webmanifest"` is referenced in `layout.tsx` metadata, but the file isn't in `frontend/public/`. Let me verify in §3.3.
- **No offline page.** If the network drops, users get a browser error.
- **No push notifications.** Order status updates are email-only.
- **No install prompt.** No "Add to Home Screen" banner.

### 3.3 Critical files to verify before starting

The next agent should read these files completely before any work. They define the conventions.

| File | Why read it |
|---|---|
| `AGENTS.md` | Project orientation, gotchas, conventions |
| `docs/ARCHITECTURE.md` | Full codebase map (42KB, comprehensive) |
| `docs/BUG-FIXES-2026-08-05.md` | Latest bug-fix pass — what was broken, what was fixed |
| `frontend/next.config.ts` | CSP, headers, image config, icon shim |
| `frontend/src/app/globals.css` | Brand design tokens, custom utilities |
| `frontend/src/lib/api.ts` | API client, JWT refresh, cache, retry |
| `frontend/src/lib/cartContext.tsx` | Cart state management |
| `frontend/src/components/malaika/store-shell.tsx` | Storefront shell (navbar, footer, cart count) |
| `backend/config/settings/base.py` | Django base settings |
| `backend/config/urls.py` | URL routing |
| `backend/apps/products/serializers.py` | Product serialization (post-N+1-fix) |
| `backend/apps/orders/views.py` | Cart and order endpoints |
| `backend/apps/payments/services.py` | M-Pesa STK push logic |
| `docker-compose.yml` | Active production topology |

### 3.4 Current CSP (for reference, must be updated in §5.1)

```text
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline'
  https://www.googletagmanager.com
  https://www.google-analytics.com
  https://connect.facebook.net
  https://static.cloudflareinsights.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https: http:;
font-src 'self' data: https://fonts.gstatic.com;
frame-src 'self' https://www.google.com https://www.youtube.com;
connect-src 'self'
  https://malaikanest.com
  https://api.malaikanest.com
  https://www.malaikanest.com
  https://res.cloudinary.com
  https://www.google-analytics.com
  https://region1.google-analytics.com
  https://cloudflareinsights.com
  https://static.cloudflareinsights.com;
media-src 'self' https:;
object-src 'none';
base-uri 'self';
form-action 'self';
```

**Issues to fix in §5.1:**
- `'unsafe-eval'` and `'unsafe-inline'` in `script-src` — should be eliminated by using nonces or hashes. Next.js 16 supports nonce-based CSP.
- `http:` in `img-src` — should be `https:` only. The `http:` was for local dev; dev should use `localhost` explicitly.
- No `worker-src` — needed for service worker in §9.

---

## 4. Design System Foundation — "Editorial Premium"

### 4.1 Aesthetic direction

Per user instruction: **"Editorial premium — High-contrast monochrome with single accent, Kinfolk/Magnolia-style editorial photography layout."**

This means:
- **Foundation is monochrome.** Ink black on warm paper white, with warm-gray neutrals between. No more 6-color palette.
- **Single accent color.** Terracotta (`#B85C38`) — used sparingly for CTAs, active states, and key data. Everything else is monochrome.
- **Editorial typography.** Cormorant Garamond for display (headlines, product names, section titles). DM Sans for body. Generous line-height. Tight letter-spacing on display, normal on body.
- **Pinterest-grade composition.** Masonry grids. Full-bleed hero images. Generous whitespace (60-80px between sections on desktop). Hover lifts on cards. Soft shadows.
- **Editorial photography layout.** Product images in portrait 3:4. Lifestyle shots full-bleed. Magazine-style "shop the look" on PDP.
- **No decoration without purpose.** No gradients (except hero image overlays). No patterns. No icons in body copy. Icons only in nav, buttons, and data dense UI.

### 4.2 Color tokens (replace in `frontend/src/app/globals.css`)

The full replacement for the `:root` block in `globals.css`. This is the single source of truth for color.

```css
/* ── Editorial Premium Foundation ────────────────────────────────────── */
:root {
  --radius: 0.5rem; /* tighter than current 0.75rem — more editorial */

  /* Monochrome foundation */
  --ink: #1A1410;          /* primary text — warm black, not pure */
  --ink-soft: #3D2B1F;     /* secondary text */
  --ink-muted: #6B5544;    /* tertiary text, captions */
  --ink-faint: #A89888;    /* placeholder, disabled */

  --paper: #FDF8F3;        /* page background — warm white */
  --paper-alt: #F5EFE6;    /* alt section background */
  --paper-card: #FFFFFF;   /* card background */

  --line: #E8E0D5;          /* borders, dividers */
  --line-strong: #D8CFC0;  /* hover borders */

  /* Single accent — terracotta */
  --accent: #B85C38;        /* CTAs, active states, key data */
  --accent-dark: #8B4528;   /* hover */
  --accent-soft: #E8D5C8;   /* tints, badges */

  /* Semantic (monochrome + accent) */
  --success: #4A7C59;       /* kept green — only for success states */
  --warning: #C4704A;       /* terracotta variant */
  --danger: #9B2C2C;        /* deep red — errors only */
  --info: #5C4033;          /* brown — info, links to non-CTA */

  /* shadcn semantic tokens mapped to monochrome */
  --background: var(--paper);
  --foreground: var(--ink);
  --card: var(--paper-card);
  --card-foreground: var(--ink);
  --popover: var(--paper-card);
  --popover-foreground: var(--ink);
  --primary: var(--ink);            /* primary buttons = ink */
  --primary-foreground: var(--paper); /* ink button = paper text */
  --secondary: var(--paper-alt);
  --secondary-foreground: var(--ink);
  --muted: var(--paper-alt);
  --muted-foreground: var(--ink-muted);
  --accent-foreground: var(--paper); /* accent button = paper text */
  --destructive: var(--danger);
  --destructive-foreground: var(--paper);
  --border: var(--line);
  --input: var(--line);
  --ring: var(--accent);            /* focus ring = accent */
  --radius: 0.5rem;

  /* Chart palette — monochrome + accent, for admin charts */
  --chart-1: var(--ink);
  --chart-2: var(--ink-soft);
  --chart-3: var(--ink-muted);
  --chart-4: var(--accent);
  --chart-5: var(--accent-soft);

  /* Sidebar (admin) */
  --sidebar: var(--ink);
  --sidebar-foreground: var(--paper);
  --sidebar-primary: var(--accent);
  --sidebar-primary-foreground: var(--paper);
  --sidebar-accent: var(--ink-soft);
  --sidebar-accent-foreground: var(--paper);
  --sidebar-border: rgba(255,255,255,0.08);
  --sidebar-ring: var(--accent);

  /* Typography */
  --font-serif: var(--font-cormorant);
  --font-sans: var(--font-dm-sans);

  /* Shadows — soft, warm, editorial */
  --shadow-sm: 0 1px 2px rgba(26, 20, 16, 0.04);
  --shadow-md: 0 2px 8px rgba(26, 20, 16, 0.06), 0 1px 2px rgba(26, 20, 16, 0.04);
  --shadow-lg: 0 8px 24px rgba(26, 20, 16, 0.08), 0 2px 8px rgba(26, 20, 16, 0.04);
  --shadow-xl: 0 16px 48px rgba(26, 20, 16, 0.10), 0 8px 24px rgba(26, 20, 16, 0.06);
}

/* Dark mode — warm dark, not zinc */
.dark {
  --ink: #F5EFE6;
  --ink-soft: #E8E0D5;
  --ink-muted: #A89888;
  --ink-faint: #6B5544;

  --paper: #1A1410;
  --paper-alt: #2A2018;
  --paper-card: #221A14;

  --line: #3D2B1F;
  --line-strong: #4A3528;

  --accent: #D4835E;
  --accent-dark: #E8A88A;
  --accent-soft: #5C3A28;

  --background: var(--paper);
  --foreground: var(--ink);
  --card: var(--paper-card);
  --card-foreground: var(--ink);
  --popover: var(--paper-card);
  --popover-foreground: var(--ink);
  --primary: var(--paper);
  --primary-foreground: var(--ink);
  --secondary: var(--paper-alt);
  --secondary-foreground: var(--ink);
  --muted: var(--paper-alt);
  --muted-foreground: var(--ink-muted);
  --accent-foreground: var(--ink);
  --border: var(--line);
  --input: var(--line);
  --ring: var(--accent);
}
```

### 4.3 Typography scale

Replace the implicit typography with a defined scale. Add to `globals.css`:

```css
@layer base {
  /* Display — Cormorant Garamond, for hero headlines */
  .display-1 { font-family: var(--font-serif); font-size: clamp(2.5rem, 6vw, 4.5rem); line-height: 1.05; letter-spacing: -0.02em; font-weight: 500; }
  .display-2 { font-family: var(--font-serif); font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1.1; letter-spacing: -0.015em; font-weight: 500; }
  .display-3 { font-family: var(--font-serif); font-size: clamp(1.75rem, 4vw, 2.5rem); line-height: 1.15; letter-spacing: -0.01em; font-weight: 500; }

  /* Headings — DM Sans, for section titles */
  .h1 { font-family: var(--font-sans); font-size: clamp(1.5rem, 3vw, 2rem); line-height: 1.2; letter-spacing: -0.02em; font-weight: 600; }
  .h2 { font-family: var(--font-sans); font-size: clamp(1.25rem, 2.5vw, 1.5rem); line-height: 1.25; letter-spacing: -0.015em; font-weight: 600; }
  .h3 { font-family: var(--font-sans); font-size: 1.125rem; line-height: 1.3; letter-spacing: -0.01em; font-weight: 600; }

  /* Body */
  .body-lg { font-family: var(--font-sans); font-size: 1.125rem; line-height: 1.6; font-weight: 400; }
  .body { font-family: var(--font-sans); font-size: 1rem; line-height: 1.6; font-weight: 400; }
  .body-sm { font-family: var(--font-sans); font-size: 0.875rem; line-height: 1.55; font-weight: 400; }
  .body-xs { font-family: var(--font-sans); font-size: 0.75rem; line-height: 1.5; font-weight: 500; letter-spacing: 0.02em; }

  /* Eyebrow / overline — for section labels */
  .eyebrow { font-family: var(--font-sans); font-size: 0.6875rem; line-height: 1; letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; color: var(--accent); }

  /* Price — DM Sans, tabular numbers */
  .price { font-family: var(--font-sans); font-size: 1rem; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
  .price-lg { font-family: var(--font-sans); font-size: 1.25rem; font-weight: 600; font-variant-numeric: tabular-nums; letter-spacing: -0.015em; }
  .price-xl { font-family: var(--font-serif); font-size: 1.75rem; font-weight: 500; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
}
```

### 4.4 Spacing scale

Editorial layouts use generous whitespace. Define a consistent scale:

```css
@layer base {
  :root {
    /* Section spacing — generous, editorial */
    --space-section-y: clamp(4rem, 8vw, 7rem); /* 64-112px between sections */
    --space-section-y-sm: clamp(2.5rem, 5vw, 4rem); /* 40-64px for tight sections */

    /* Container */
    --container-max: 1440px; /* wider than current 1380px — more editorial */
    --container-narrow: 860px; /* for articles, product descriptions */
    --container-padding: clamp(1rem, 4vw, 2.5rem); /* 16-40px responsive */
  }

  .container-shell {
    @apply mx-auto w-full;
    max-width: var(--container-max);
    padding-left: var(--container-padding);
    padding-right: var(--container-padding);
  }

  .container-narrow {
    @apply mx-auto w-full;
    max-width: var(--container-narrow);
    padding-left: var(--container-padding);
    padding-right: var(--container-padding);
  }

  .container-bleed {
    @apply mx-auto w-full;
    max-width: 1600px;
    padding-left: var(--container-padding);
    padding-right: var(--container-padding);
  }
}
```

### 4.5 Component primitives

Replace the current `.btn-gold`, `.btn-outline-warm`, `.card-soft`, `.card-white`, `.input-warm` with a cleaner set:

```css
@layer components {
  /* Buttons — primary is ink, accent is terracotta, ghost is transparent */
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)];
    @apply disabled:opacity-50 disabled:pointer-events-none;
    font-family: var(--font-sans);
    font-size: 0.875rem;
    letter-spacing: 0.01em;
    padding: 0.75rem 1.5rem;
    min-height: 44px; /* touch target */
  }

  .btn-primary {
    background: var(--ink);
    color: var(--paper);
  }
  .btn-primary:hover {
    background: var(--ink-soft);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  .btn-primary:active { transform: translateY(0); }

  .btn-accent {
    background: var(--accent);
    color: var(--paper);
  }
  .btn-accent:hover {
    background: var(--accent-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .btn-outline {
    background: transparent;
    color: var(--ink);
    border: 1px solid var(--line-strong);
  }
  .btn-outline:hover {
    background: var(--paper-alt);
    border-color: var(--ink);
  }

  .btn-ghost {
    background: transparent;
    color: var(--ink);
  }
  .btn-ghost:hover {
    background: var(--paper-alt);
  }

  .btn-sm { padding: 0.5rem 1rem; min-height: 36px; font-size: 0.8125rem; }
  .btn-lg { padding: 1rem 2rem; min-height: 52px; font-size: 1rem; }

  /* Cards — minimal, let photography shine */
  .card-editorial {
    @apply rounded-lg border bg-[var(--paper-card)] transition-all duration-300;
    border-color: var(--line);
  }
  .card-editorial:hover {
    border-color: var(--line-strong);
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  /* Inputs — underline style, more editorial than rounded boxes */
  .input-editorial {
    @apply w-full bg-transparent border-0 border-b transition-colors;
    border-color: var(--line);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 1rem;
    padding: 0.75rem 0;
    outline: none;
  }
  .input-editorial:focus {
    border-color: var(--ink);
  }
  .input-editorial::placeholder {
    color: var(--ink-faint);
  }

  /* Eyebrow with rule — for section headers */
  .eyebrow-rule {
    @apply inline-flex items-center gap-3 eyebrow;
  }
  .eyebrow-rule::before {
    content: '';
    @apply block w-8 h-px;
    background: var(--accent);
  }

  /* Masonry grid */
  .masonry {
    column-gap: var(--container-padding);
    column-count: 2;
  }
  @media (min-width: 768px) { .masonry { column-count: 3; } }
  @media (min-width: 1024px) { .masonry { column-count: 4; } }
  @media (min-width: 1536px) { .masonry { column-count: 5; } }
  .masonry > * {
    break-inside: avoid;
    margin-bottom: var(--container-padding);
  }

  /* Aspect ratios */
  .aspect-portrait { aspect-ratio: 3 / 4; }
  .aspect-editorial { aspect-ratio: 4 / 5; }
  .aspect-square { aspect-ratio: 1 / 1; }
  .aspect-wide { aspect-ratio: 16 / 9; }
  .aspect-cinema { aspect-ratio: 21 / 9; }
}
```

### 4.6 Tailwind config upgrade

Replace `frontend/tailwind.config.ts` to expose brand tokens as Tailwind utilities:

```ts
import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Editorial monochrome
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          muted: 'var(--ink-muted)',
          faint: 'var(--ink-faint)',
        },
        paper: {
          DEFAULT: 'var(--paper)',
          alt: 'var(--paper-alt)',
          card: 'var(--paper-card)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          dark: 'var(--accent-dark)',
          soft: 'var(--accent-soft)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        // shadcn semantic
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: { DEFAULT: 'var(--card)', foreground: 'var(--card-foreground)' },
        popover: { DEFAULT: 'var(--popover)', foreground: 'var(--popover-foreground)' },
        primary: { DEFAULT: 'var(--primary)', foreground: 'var(--primary-foreground)' },
        secondary: { DEFAULT: 'var(--secondary)', foreground: 'var(--secondary-foreground)' },
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        accent2: { DEFAULT: 'var(--accent)', foreground: 'var(--accent-foreground)' },
        destructive: { DEFAULT: 'var(--destructive)', foreground: 'var(--destructive-foreground)' },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: { 1: 'var(--chart-1)', 2: 'var(--chart-2)', 3: 'var(--chart-3)', 4: 'var(--chart-4)', 5: 'var(--chart-5)' },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      maxWidth: {
        shell: '1440px',
        narrow: '860px',
        bleed: '1600px',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
```

### 4.7 Motion system

Add a `motion.ts` export for shared Framer Motion variants:

```ts
// frontend/src/lib/motion.ts
import { Variants } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export const slideOver: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', damping: 30, stiffness: 300 } },
  exit: { x: '100%', transition: { duration: 0.3, ease: 'easeInOut' } },
};

// Respect prefers-reduced-motion
export const motionProps = (variants: Variants) => ({
  variants,
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, margin: '-50px' },
});
```

### 4.8 Iconography

The codebase uses Phosphor (via the `lucide-react` shim in `src/lib/icons.tsx`). For editorial-premium, prefer:
- **Phosphor Regular** (1.5 stroke) for body UI — softer than Lucide's 2.0.
- **Phosphor Bold** (2.5 stroke) for active/selected states.
- **No icons in body copy.** Icons only in nav, buttons, form fields, and admin data tables.
- **Custom SVG marks** for the brand logo, value props, and loyalty program — never stock icons for these.

Verify `frontend/src/lib/icons.tsx` exports all icons used by shadcn/ui components. If any are missing (e.g. `ChevronDownIcon`), add them.

---

## 5. Storefront Redesign — File-by-File

This section covers every storefront file that needs to change. Each entry includes: **file path**, **what changes**, **why**, and **full code** where the change is non-trivial.

### 5.1 `frontend/next.config.ts` — CSP, headers, PWA config

**Changes:**
1. Tighten CSP: remove `'unsafe-eval'` and `'unsafe-inline'` from `script-src`, use nonce-based CSP via Next.js middleware. Add `worker-src 'self'` for service worker.
2. Remove `http:` from `img-src` (use `https:` + `localhost` for dev).
3. Add PWA-related config (manifest link, theme color).
4. Add `experimental: { optimizePackageImports: ['lucide-react', '@phosphor-icons/react', 'framer-motion'] }` to reduce bundle size.
5. Add `modularizeImports` for icon libraries to tree-shake unused icons.

**Full file:**

```ts
import type { NextConfig } from "next";
import path from "path";

const iconShimTs = path.resolve(__dirname, "src/lib/icons.tsx");

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'nonce-{nonce}' 'strict-dynamic'
    https://www.googletagmanager.com
    https://www.google-analytics.com
    https://connect.facebook.net
    https://static.cloudflareinsights.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https: http://localhost http://127.0.0.1;
  font-src 'self' data: https://fonts.gstatic.com;
  frame-src 'self' https://www.google.com https://www.youtube.com;
  connect-src 'self'
    https://malaikanest.com
    https://api.malaikanest.com
    https://www.malaikanest.com
    https://res.cloudinary.com
    https://www.google-analytics.com
    https://region1.google-analytics.com
    https://cloudflareinsights.com
    https://static.cloudflareinsights.com;
  media-src 'self' https:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  worker-src 'self';
  manifest-src 'self';
`.replace(/\n/g, '').trim();

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=()' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const cacheHeaders = [
  { source: '/_next/static/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
  { source: '/(favicon.ico|favicon-16x16.png|favicon-32x32.png|favicon-48x48.png|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|mstile-150x150.png|site.webmanifest|logo-og.png|logo-social.png|logo.svg)', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
  { source: '/.well-known/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }] },
  { source: '/images/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=2592000, immutable' }] },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['lucide-react', '@phosphor-icons/react', 'framer-motion', 'recharts'],
  },
  turbopack: {
    root: __dirname,
    resolveAlias: { "lucide-react": "./src/lib/icons.tsx" },
  },
  webpack: (config) => {
    config.resolve.alias = { ...(config.resolve.alias || {}), "lucide-react": iconShimTs };
    return config;
  },
  async headers() {
    return [
      { source: '/', headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }] },
      { source: '/(.*)', headers: securityHeaders },
      ...cacheHeaders,
    ];
  },
  async redirects() {
    return [
      { source: '/home', destination: '/', permanent: true },
      { source: '/shop', destination: '/categories', permanent: true },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2592000,
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920, 2560],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'malaikanest.com' },
      { protocol: 'https', hostname: 'www.malaikanest.com' },
      { protocol: 'https', hostname: 'api.malaikanest.com' },
    ],
  },
};

export default nextConfig;
```

> **Note on nonce-based CSP:** Next.js 16 supports nonce generation in middleware. Create `frontend/src/middleware.ts` that generates a nonce per request and attaches it to `Content-Security-Policy` header. Replace `{nonce}` in the CSP string above with the actual nonce. See §5.2 for middleware implementation.

### 5.2 `frontend/src/middleware.ts` — NEW FILE, nonce-based CSP

```ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID()).replace(/=/g, '');
  const csp = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'
      https://www.googletagmanager.com
      https://www.google-analytics.com
      https://connect.facebook.net
      https://static.cloudflareinsights.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https: http://localhost http://127.0.0.1;
    font-src 'self' data: https://fonts.gstatic.com;
    frame-src 'self' https://www.google.com https://www.youtube.com;
    connect-src 'self'
      https://malaikanest.com
      https://api.malaikanest.com
      https://www.malaikanest.com
      https://res.cloudinary.com
      https://www.google-analytics.com
      https://region1.google-analytics.com
      https://cloudflareinsights.com
      https://static.cloudflareinsights.com;
    media-src 'self' https:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    worker-src 'self';
    manifest-src 'self';
  `.replace(/\n/g, '').trim();

  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-nonce', nonce);
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), browsing-topics=()');

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
```

### 5.3 `frontend/src/app/globals.css` — Full design system

Replace the entire file with the design system defined in §4.2, §4.3, §4.4, §4.5. The new file structure:

1. Tailwind imports (`@import "tailwindcss"; @import "tw-animate-css";`)
2. `@custom-variant dark`
3. `@theme inline` block (Tailwind v4 theme mapping)
4. `:root` block (Editorial Premium tokens from §4.2)
5. `.dark` block (dark mode tokens from §4.2)
6. `@layer base` (reset, focus-visible, reduced-motion, typography from §4.3, spacing from §4.4)
7. `@layer components` (buttons, cards, inputs, masonry from §4.5)
8. `@layer utilities` (no-scrollbar, safe-area, text-gradient)
9. Keyframes (fadeInUp, shimmer, float, pulse-soft)

The current `globals.css` is 367 lines. The new one will be ~500 lines but more organized. Don't skip any section.

### 5.4 `frontend/src/app/layout.tsx` — Root layout

**Changes:**
1. Add `themeColor` to viewport (already there, verify it matches new `--paper` token).
2. Add `manifest` link.
3. Add `apple-mobile-web-app-capable` meta.
4. Wire up `next-themes` ThemeProvider in Providers.
5. Add structured data (Organization schema).

**Full file (relevant parts only, rest stays):**

```tsx
import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/malaika/providers";
import { getSiteSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site-config";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// ... generateMetadata stays the same ...

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDF8F3" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1410" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await getBranding();
  const storeName = branding?.store_name || "Malaika Nest";

  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: storeName,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.svg`,
    image: `${SITE_URL}/logo-og.png`,
    telephone: branding?.phone || undefined,
    address: branding?.address ? {
      '@type': 'PostalAddress',
      streetAddress: branding.address,
      addressLocality: 'Mombasa',
      addressCountry: 'KE',
    } : undefined,
    sameAs: [
      branding?.social_instagram,
      branding?.social_facebook,
      branding?.social_tiktok,
    ].filter(Boolean),
  };

  return (
    <html lang="en-KE" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={storeName} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </head>
      <body className={`${cormorant.variable} ${dmSans.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

### 5.5 `frontend/src/components/malaika/providers.tsx` — Add ThemeProvider

```tsx
'use client';

import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CartProvider } from '@/lib/cartContext';
import { WishlistProvider } from '@/lib/wishlistContext';
import { AuthProvider } from '@/lib/authContext';
import { CategoriesProvider } from '@/lib/categoriesContext';
import { I18nProvider } from '@/lib/i18n';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CategoriesProvider>
            <CartProvider>
              <WishlistProvider>
                <I18nProvider>
                  <TooltipProvider delayDuration={200}>
                    {children}
                    <Toaster position="bottom-right" richColors closeButton />
                  </TooltipProvider>
                </I18nProvider>
              </WishlistProvider>
            </CartProvider>
          </CategoriesProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

### 5.6 `frontend/src/components/malaika/navbar.tsx` — Split into 5 files

The current 886-line navbar is unmaintainable. Split into:

```
frontend/src/components/malaika/navbar/
├── index.tsx              # <Navbar /> — orchestrator, ~80 lines
├── desktop-nav.tsx        # Desktop top nav with dropdowns, ~150 lines
├── mobile-drawer.tsx      # Slide-in mobile menu, ~200 lines
├── search-overlay.tsx     # Full-screen search, ~120 lines
├── account-menu.tsx       # Avatar dropdown, ~80 lines
└── shop-mega-menu.tsx     # Shop dropdown mega-menu, ~150 lines
```

**`navbar/index.tsx`:**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Heart, User, ShoppingCart } from 'lucide-react';
import { Logo } from '../logo';
import { useAuth } from '@/lib/authContext';
import { useCart } from '@/lib/cartContext';
import { useWishlist } from '@/lib/wishlistContext';
import type { Branding } from '@/lib/settings';
import { DesktopNav } from './desktop-nav';
import { MobileDrawer } from './mobile-drawer';
import { SearchOverlay } from './search-overlay';
import { AccountMenu } from './account-menu';

export function Navbar({ branding }: { branding?: Branding }) {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { count: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setSearchOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen || searchOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen, searchOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-sm backdrop-blur-md' : 'border-b border-line'}`}
        style={{ background: scrolled ? 'rgba(253, 248, 243, 0.92)' : 'var(--paper)' }}
        role="banner"
      >
        <nav className="container-shell flex items-center h-16 lg:h-20 gap-3" aria-label="Main navigation">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-11 h-11 -ml-2 flex items-center justify-center rounded-full hover:bg-paper-alt transition-colors"
            aria-label="Open menu"
          >
            <Menu size={22} strokeWidth={1.75} className="text-ink" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 mr-auto lg:mr-8" aria-label="Malaika Nest home">
            <Logo logoUrl={branding?.logo_url} storeName={branding?.store_name} tagline={branding?.tagline} />
          </Link>

          {/* Desktop nav */}
          <DesktopNav />

          {/* Right actions */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-paper-alt transition-colors"
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <Search size={20} strokeWidth={1.75} className="text-ink" />
            </button>

            <Link
              href="/wishlist"
              className="hidden sm:flex w-11 h-11 items-center justify-center rounded-full hover:bg-paper-alt transition-colors relative"
              aria-label={`Wishlist, ${wishlistCount} items`}
            >
              <Heart size={20} strokeWidth={1.75} className="text-ink" />
              {wishlistCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-accent text-paper text-[10px] font-semibold flex items-center justify-center px-1">
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-paper-alt transition-colors relative"
              aria-label={`Cart, ${cartCount} items`}
            >
              <ShoppingCart size={20} strokeWidth={1.75} className="text-ink" />
              {cartCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] rounded-full bg-accent text-paper text-[10px] font-semibold flex items-center justify-center px-1">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            <AccountMenu user={user} isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
          </div>
        </nav>
      </header>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} branding={branding} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
```

**`navbar/desktop-nav.tsx`:**

```tsx
'use client';

import Link from 'next/link';
import { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { ShopMegaMenu } from './shop-mega-menu';
import { useCategories } from '@/lib/categoriesContext';

const NAV_LINKS = [
  { name: 'Shop', href: '/categories', hasDropdown: true },
  { name: 'Thrifted', href: '/thrifted' },
  { name: 'Best Sellers', href: '/best-sellers' },
  { name: 'Blog', href: '/blog' },
  { name: 'About', href: '/about' },
  { name: 'Contact', href: '/find-us' },
];

export function DesktopNav() {
  const [shopOpen, setShopOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { categories } = useCategories();

  const openShop = () => {
    if (timer.current) clearTimeout(timer.current);
    setShopOpen(true);
  };
  const closeShop = () => {
    timer.current = setTimeout(() => setShopOpen(false), 150);
  };

  return (
    <div className="hidden lg:flex items-center gap-1">
      {NAV_LINKS.map((link) =>
        link.hasDropdown ? (
          <div key={link.name} onMouseEnter={openShop} onMouseLeave={closeShop} className="relative">
            <button
              className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-ink hover:text-accent transition-colors"
              aria-expanded={shopOpen}
              aria-haspopup="true"
            >
              {link.name}
              <ChevronDown size={14} strokeWidth={2} className={`transition-transform ${shopOpen ? 'rotate-180' : ''}`} />
            </button>
            {shopOpen && <ShopMegaMenu categories={categories} onClose={closeShop} />}
          </div>
        ) : (
          <Link
            key={link.name}
            href={link.href}
            className="px-3 py-2 text-sm font-medium text-ink hover:text-accent transition-colors"
          >
            {link.name}
          </Link>
        )
      )}
    </div>
  );
}
```

**`navbar/shop-mega-menu.tsx`** — Pinterest-style mega menu with category cards:

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Baby, Gift, Sparkles, Shirt, Home, Truck } from 'lucide-react';
import { getCategoryImage } from '@/lib/category-images';

interface MegaMenuProps {
  categories: any[];
  onClose: () => void;
}

const SHOP_BY_AGE = [
  { label: 'Newborn', href: '/categories?age=newborn', desc: '0-3 months' },
  { label: 'Baby', href: '/categories?age=baby', desc: '3-12 months' },
  { label: 'Toddler', href: '/categories?age=toddler', desc: '1-3 years' },
  { label: 'Kids', href: '/categories?age=kids', desc: '4-12 years' },
];

const QUICK_LINKS = [
  { label: 'New Arrivals', href: '/categories?sort=newest', Icon: Sparkles },
  { label: 'Best Sellers', href: '/best-sellers', Icon: Gift },
  { label: 'Mtumba / Thrifted', href: '/thrifted', Icon: Shirt },
  { label: 'Gift Sets', href: '/categories?category=gifts', Icon: Gift },
];

export function ShopMegaMenu({ categories, onClose }: MegaMenuProps) {
  const displayCategories = (categories || []).slice(0, 6);

  return (
    <div
      className="absolute top-full left-0 -mt-2 pt-2"
      onMouseEnter={() => {}}
      onMouseLeave={onClose}
    >
      <div className="w-[860px] bg-paper-card border border-line rounded-xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-3 gap-0">
          {/* Categories column - spans 2 */}
          <div className="col-span-2 p-6 border-r border-line">
            <p className="eyebrow mb-4">Categories</p>
            <div className="grid grid-cols-3 gap-3">
              {displayCategories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/categories?category=${cat.slug}`}
                  onClick={onClose}
                  className="group block"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-paper-alt mb-2 relative">
                    {getCategoryImage(cat) && (
                      <Image
                        src={getCategoryImage(cat)}
                        alt={cat.name}
                        fill
                        sizes="200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </div>
                  <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Shop by age column */}
          <div className="p-6 bg-paper-alt">
            <p className="eyebrow mb-4">Shop by Age</p>
            <ul className="space-y-3 mb-6">
              {SHOP_BY_AGE.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group block py-1"
                  >
                    <p className="text-sm font-medium text-ink group-hover:text-accent transition-colors">{item.label}</p>
                    <p className="text-xs text-ink-muted">{item.desc}</p>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="eyebrow mb-3">Quick Links</p>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ label, href, Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-2 text-sm text-ink hover:text-accent transition-colors py-1"
                  >
                    <Icon size={14} strokeWidth={1.75} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**`navbar/mobile-drawer.tsx`**, **`navbar/search-overlay.tsx`**, **`navbar/account-menu.tsx`** — follow the same pattern. Mobile drawer uses Framer Motion `slideOver` variant from §4.7. Search overlay uses `scaleIn`. Account menu uses Radix DropdownMenu.

### 5.7 `frontend/src/components/malaika/hero.tsx` — Editorial hero

Replace the carousel with a single full-bleed editorial hero. Carousel becomes optional (admin-configurable). The default is one strong image.

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import type { Banner } from '@/lib/products';
import { getBannerUrl } from '@/lib/media';
import { fadeUp, motionProps } from '@/lib/motion';

interface HeroProps {
  banners?: Banner[];
}

export function Hero({ banners = [] }: HeroProps) {
  // Use first banner, or fallback to editorial default
  const banner = banners[0];
  const bgImage = banner ? getBannerUrl(banner.image_url || banner.image) : null;
  const headline = banner?.title?.trim() || 'Malaika Nest';
  const sub = banner?.subtitle?.trim() || 'Handcrafted organic baby clothing, made with love in Kenya.';
  const cta = banner?.button_text?.trim() || 'Shop the Collection';
  const ctaHref = banner?.button_link?.trim() || '/categories';

  return (
    <section className="relative w-full h-[88vh] min-h-[600px] max-h-[900px] overflow-hidden bg-ink">
      {bgImage && (
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
        />
      )}
      {/* Gradient scrim for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/40" />

      <div className="relative h-full container-shell flex flex-col justify-end pb-16 lg:pb-24">
        <motion.div {...motionProps(fadeUp)} className="max-w-2xl">
          <p className="eyebrow text-paper/80 mb-4" style={{ color: 'rgba(253, 248, 243, 0.7)' }}>
            Mombasa, Kenya
          </p>
          <h1 className="display-1 text-paper mb-6">
            {headline}
          </h1>
          <p className="body-lg text-paper/85 mb-8 max-w-lg">
            {sub}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={ctaHref} className="btn btn-accent btn-lg">
              {cta}
              <ArrowRight size={18} strokeWidth={1.75} />
            </Link>
            <Link
              href="/about"
              className="btn btn-outline btn-lg"
              style={{ color: 'var(--paper)', borderColor: 'rgba(253, 248, 243, 0.4)' }}
            >
              Our Story
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:block"
      >
        <div className="w-px h-12 bg-paper/40 relative overflow-hidden">
          <motion.div
            animate={{ y: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-paper"
          />
        </div>
      </motion.div>
    </section>
  );
}
```

### 5.8 `frontend/src/components/malaika/product-card.tsx` — Editorial card with quick-add

**Changes:**
1. Portrait 3:4 aspect ratio (already there).
2. Hover lifts card (already there, refine).
3. Quick-add button on hover (desktop) — slides up from bottom of image.
4. Wishlist heart always visible on mobile (not just hover).
5. Price uses `font-variant-numeric: tabular-nums`.
6. Badge style refined — small, top-left, monochrome.

```tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/cartContext';
import { showToast } from '@/lib/toast';
import { useWishlist } from '@/lib/wishlistContext';
import { shouldUseUnoptimizedImage } from '@/lib/media';
import { formatKES } from '@/lib/format';

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  badge?: string;
  inStock?: boolean;
  hasVariants?: boolean;
  variantCount?: number;
}

export const ProductCard = React.memo(function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add: addToCart } = useCart();
  const { contains, toggle: toggleWishlist } = useWishlist();
  const wished = contains(product.id);
  const [hovered, setHovered] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);

  const inStock = product.inStock !== false;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const hasVariants = (product.variantCount ?? 0) > 1;

  const handleAdd = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (!inStock) return;
    if (hasVariants) {
      window.location.href = `/products/${product.slug}`;
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      qty: 1,
    });
    showToast('Added to cart', 'success');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      id: String(product.id),
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      categoryName: product.category,
      availableStock: inStock ? 1 : 0,
      hasVariants: Boolean(product.hasVariants),
    });
  };

  return (
    <article
      className="group relative flex flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setHovered(false);
      }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative block w-full overflow-hidden aspect-portrait bg-paper-alt"
        aria-label={`View ${product.name}`}
      >
        {product.image && !imageErrored ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            priority={index < 4}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onError={() => setImageErrored(true)}
            unoptimized={shouldUseUnoptimizedImage(product.image)}
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="font-serif text-5xl text-ink-faint" style={{ fontFamily: 'var(--font-cormorant)' }}>
              {product.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Badge — top-left, monochrome */}
        {product.badge && (
          <span className="absolute top-3 left-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] bg-paper-card text-ink">
            {product.badge}
          </span>
        )}

        {/* Discount badge — top-right */}
        {discount > 0 && (
          <span className="absolute top-3 right-3 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] bg-accent text-paper">
            -{discount}%
          </span>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper-card/60 backdrop-blur-[2px]">
            <span className="eyebrow text-ink">Sold Out</span>
          </div>
        )}

        {/* Quick-add — slides up on hover (desktop) */}
        <AnimatePresence>
          {hovered && inStock && (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-ink/80 to-transparent"
            >
              <button
                type="button"
                onClick={handleAdd}
                className="w-full btn btn-sm justify-center"
                style={{ background: 'var(--paper)', color: 'var(--ink)' }}
                aria-label={hasVariants ? `View ${product.name} options` : `Add ${product.name} to cart`}
              >
                {hasVariants ? (
                  <>View Options</>
                ) : (
                  <>
                    <Plus size={14} strokeWidth={2} />
                    Quick Add
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      {/* Wishlist — always visible on mobile, hover on desktop */}
      <button
        type="button"
        onClick={handleWishlist}
        aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
        aria-pressed={wished}
        className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 lg:opacity-0 lg:group-hover:opacity-100 ${wished ? 'opacity-100' : ''}`}
        style={{
          background: wished ? 'var(--accent)' : 'rgba(253, 248, 243, 0.9)',
          color: wished ? 'var(--paper)' : 'var(--ink)',
          backdropFilter: 'blur(4px)',
        }}
      >
        <Heart size={16} strokeWidth={1.75} fill={wished ? 'currentColor' : 'none'} />
      </button>

      {/* Product info */}
      <div className="pt-3 pb-1 flex flex-col gap-1">
        {product.category && (
          <p className="text-[11px] uppercase tracking-[0.14em] text-ink-muted font-medium">
            {product.category}
          </p>
        )}
        <h3 className="text-sm font-medium text-ink leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:text-accent transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="price text-ink">{formatKES(product.price)}</span>
          {product.originalPrice && (
            <span className="price text-ink-faint line-through text-sm">{formatKES(product.originalPrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
});
```

### 5.9 `frontend/src/components/malaika/product-section.tsx` — Masonry option

Add support for masonry layout. The section takes a `layout` prop: `'grid'` (default) or `'masonry'`.

```tsx
'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard, Product } from './product-card';
import { motion } from 'framer-motion';
import { stagger, fadeUp, motionProps } from '@/lib/motion';

interface ProductSectionProps {
  id: string;
  label: string;
  title: string;
  viewAllHref: string;
  viewAllLabel: string;
  products: Product[];
  columns?: 2 | 3 | 4 | 5;
  background?: 'paper' | 'paper-alt' | 'paper-card';
  layout?: 'grid' | 'masonry' | 'carousel';
}

const bgClass = {
  paper: 'bg-paper',
  'paper-alt': 'bg-paper-alt',
  'paper-card': 'bg-paper-card',
};

export function ProductSection({
  id,
  label,
  title,
  viewAllHref,
  viewAllLabel,
  products,
  columns = 4,
  background = 'paper',
  layout = 'grid',
}: ProductSectionProps) {
  if (products.length === 0) return null;

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5',
  }[columns];

  return (
    <section id={id} className={`py-16 lg:py-24 ${bgClass[background]}`}>
      <div className="container-shell">
        <motion.div
          {...motionProps(stagger)}
          className="flex items-end justify-between mb-8 lg:mb-12"
        >
          <motion.div {...motionProps(fadeUp)}>
            <p className="eyebrow-rule mb-3">{label}</p>
            <h2 className="display-3 text-ink">{title}</h2>
          </motion.div>
          <motion.div {...motionProps(fadeUp)}>
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-accent transition-colors group"
            >
              {viewAllLabel}
              <ArrowRight size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </motion.div>

        {layout === 'masonry' ? (
          <motion.div {...motionProps(stagger)} className="masonry">
            {products.map((product, i) => (
              <motion.div key={product.id} {...motionProps(fadeUp)}>
                <ProductCard product={product} index={i} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div {...motionProps(stagger)} className={`grid ${gridCols} gap-x-4 gap-y-8 lg:gap-x-6 lg:gap-y-12`}>
            {products.map((product, i) => (
              <motion.div key={product.id} {...motionProps(fadeUp)}>
                <ProductCard product={product} index={i} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
```

### 5.10 `frontend/src/app/(store)/page.tsx` — Home page restructure

**Changes:**
1. Use new hero (single image, not carousel).
2. Add a "shop by age" section that's visual, not just text links.
3. Featured products with masonry layout.
4. Editorial "story" section between product grids — full-bleed image + text.
5. Best sellers with carousel layout (for variety).
6. Thrifted section with editorial layout.
7. Testimonials with quote cards.
8. Newsletter as inline section, not modal.

```tsx
import { Hero } from '@/components/malaika/hero';
import { ShopByAge } from '@/components/malaika/shop-by-age';
import { CategoryQuickLinks } from '@/components/malaika/category-quick-links';
import { ProductSection } from '@/components/malaika/product-section';
import { ValueProps } from '@/components/malaika/value-props';
import { Testimonials } from '@/components/malaika/testimonials';
import { Newsletter } from '@/components/malaika/newsletter';
import { ThriftedSection } from '@/components/malaika/thrifted-section';
import { CartRecoveryBanner } from '@/components/malaika/cart-recovery-banner';
import { RecentlyViewedSection } from '@/components/malaika/recently-viewed-section';
import { EditorialStory } from '@/components/malaika/editorial-story';
import {
  getFeaturedProducts,
  getBestSellers,
  getNewArrivals,
  getActiveBanners,
} from '@/lib/products';
import { getSiteSettings, getValueProps, getTestimonials } from '@/lib/settings';
import { getFeaturedThrifted } from '@/lib/thrifted';
import { Metadata } from 'next';

export const revalidate = 60;
export const dynamic = 'force-static';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = settings.branding?.store_name || 'Malaika Nest';
  return {
    title: 'Baby Shop in Mombasa | Organic Baby Clothing & Gifts',
    description: `Looking for a baby shop in Mombasa? ${storeName} offers premium organic baby clothing, accessories & maternity wear. Free local delivery & M-Pesa accepted. Trusted by 5,000+ Kenyan families.`,
    alternates: { canonical: 'https://malaikanest.com/' },
    openGraph: {
      title: `${storeName} — Mombasa's Premium Baby Shop`,
      description: `Premium organic baby clothing, accessories & maternity wear. Free local delivery in Mombasa & M-Pesa accepted.`,
    },
  };
}

export default async function HomePage() {
  const [featured, bestSellers, newArrivals, banners, settings, valueProps, testimonials, thrifted] = await Promise.all([
    getFeaturedProducts(),
    getBestSellers(),
    getNewArrivals(),
    getActiveBanners(),
    getSiteSettings(),
    getValueProps(),
    getTestimonials(),
    getFeaturedThrifted(4),
  ]);

  const { content } = settings;

  return (
    <>
      <CartRecoveryBanner />
      <main id="main" className="flex-1">
        {/* Hero — full-bleed editorial */}
        <Hero banners={banners} />

        {/* Recently viewed — compact strip */}
        <RecentlyViewedSection />

        {/* Shop by age — visual cards */}
        <ShopByAge content={content} />

        {/* Categories — Pinterest-style grid */}
        <CategoryQuickLinks content={content} />

        {/* Featured — masonry */}
        <ProductSection
          id="featured"
          label={content.featured?.label || 'Hand-picked'}
          title={content.featured?.title || 'Featured Products'}
          viewAllHref="/categories"
          viewAllLabel={content.featured?.view_all || 'View All'}
          products={featured}
          columns={4}
          background="paper"
          layout="masonry"
        />

        {/* Value props — trust badges */}
        <ValueProps props={valueProps} />

        {/* Editorial story — full-bleed image + text */}
        <EditorialStory
          image="https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1920&q=80"
          eyebrow="Our Craft"
          title="Made with love, in Mombasa"
          body="Every piece in our collection is hand-checked for quality. We source organic cotton from Kenyan farmers, dye with low-impact dyes, and finish each garment by hand."
          cta={{ label: 'Read our story', href: '/about' }}
        />

        {/* Best sellers — carousel */}
        <ProductSection
          id="best-sellers"
          label={content.best_sellers?.label || 'Most loved'}
          title={content.best_sellers?.title || 'Best Sellers'}
          viewAllHref="/best-sellers"
          viewAllLabel={content.best_sellers?.view_all || 'See More'}
          products={bestSellers}
          columns={4}
          background="paper-alt"
          layout="grid"
        />

        {/* Thrifted — editorial */}
        <ThriftedSection products={thrifted} />

        {/* Testimonials — quote cards */}
        <Testimonials content={content} testimonials={testimonials} />

        {/* New arrivals — masonry */}
        <ProductSection
          id="new-arrivals"
          label={content.new_arrivals?.label || 'Just landed'}
          title={content.new_arrivals?.title || 'New Arrivals'}
          viewAllHref="/categories"
          viewAllLabel={content.new_arrivals?.view_all || 'Shop New'}
          products={newArrivals}
          columns={4}
          background="paper"
          layout="masonry"
        />

        {/* Newsletter — inline */}
        <Newsletter content={content} />
      </main>
    </>
  );
}
```

### 5.11 `frontend/src/components/malaika/editorial-story.tsx` — NEW FILE

Full-bleed editorial story block — used between product sections to break up the page.

```tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { fadeUp, motionProps } from '@/lib/motion';

interface EditorialStoryProps {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  cta?: { label: string; href: string };
  reverse?: boolean;
}

export function EditorialStory({ image, eyebrow, title, body, cta, reverse }: EditorialStoryProps) {
  return (
    <section className="py-16 lg:py-24 bg-ink text-paper">
      <div className="container-bleed">
        <div className={`grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${reverse ? 'lg:[direction:rtl]' : ''}`}>
          <motion.div {...motionProps(fadeUp)} className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden [direction:ltr]">
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
          <motion.div {...motionProps(fadeUp)} className="[direction:ltr]">
            <p className="eyebrow text-paper/60 mb-4">{eyebrow}</p>
            <h2 className="display-2 mb-6">{title}</h2>
            <p className="body-lg text-paper/80 mb-8 max-w-md">{body}</p>
            {cta && (
              <Link
                href={cta.href}
                className="inline-flex items-center gap-2 text-sm font-medium border-b border-paper/40 pb-1 hover:border-paper transition-colors group"
              >
                {cta.label}
                <ArrowRight size={16} strokeWidth={1.75} className="transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
```

### 5.12 `frontend/src/components/malaika/cart-drawer.tsx` — NEW FILE

Slide-over cart drawer for "add to cart" feedback. Replaces the "toast only" pattern.

```tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingBag, ArrowRight, Plus, Minus } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { formatKES } from '@/lib/format';
import { slideOver } from '@/lib/motion';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, updateQty, removeItem, subtotal } = useCart();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50"
          />
          <motion.aside
            variants={slideOver}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-paper-card z-50 flex flex-col"
            role="dialog"
            aria-label="Shopping cart"
            aria-modal="true"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-line">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} strokeWidth={1.75} className="text-ink" />
                <h2 className="h3 text-ink">Your Cart</h2>
                <span className="text-sm text-ink-muted">({items.length})</span>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-paper-alt transition-colors"
                aria-label="Close cart"
              >
                <X size={18} strokeWidth={1.75} className="text-ink" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag size={48} strokeWidth={1} className="mx-auto text-ink-faint mb-4" />
                  <p className="text-ink-muted mb-6">Your cart is empty</p>
                  <Link href="/categories" onClick={onClose} className="btn btn-primary">
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <ul className="space-y-4">
                  {items.map((item) => (
                    <li key={`${item.id}-${item.variantId ?? ''}`} className="flex gap-4">
                      <div className="relative w-20 h-24 flex-shrink-0 bg-paper-alt rounded overflow-hidden">
                        {item.image && (
                          <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={onClose}
                          className="text-sm font-medium text-ink hover:text-accent transition-colors line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <p className="text-xs text-ink-muted mt-0.5">{item.variantName}</p>
                        )}
                        <p className="price text-ink mt-1">{formatKES(item.price)}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-line rounded-full">
                            <button
                              onClick={() => updateQty(item.id, item.variantId, Math.max(1, item.qty - 1))}
                              className="w-7 h-7 flex items-center justify-center hover:bg-paper-alt rounded-l-full transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} strokeWidth={2} className="text-ink" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-ink">{item.qty}</span>
                            <button
                              onClick={() => updateQty(item.id, item.variantId, item.qty + 1)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-paper-alt rounded-r-full transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} strokeWidth={2} className="text-ink" />
                            </button>
                          </div>
                          <button
                            onClick={() => removeItem(item.id, item.variantId)}
                            className="text-xs text-ink-muted hover:text-danger transition-colors ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-line p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-muted">Subtotal</span>
                  <span className="price-lg text-ink">{formatKES(subtotal)}</span>
                </div>
                <p className="text-xs text-ink-muted">
                  Shipping and taxes calculated at checkout.
                </p>
                <Link
                  href="/checkout"
                  onClick={onClose}
                  className="btn btn-primary w-full justify-center"
                >
                  Checkout
                  <ArrowRight size={16} strokeWidth={1.75} />
                </Link>
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="btn btn-ghost w-full justify-center text-sm"
                >
                  View full cart
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
```

### 5.13 Remaining storefront files (summary of changes)

For brevity, the remaining storefront files are listed with their changes. The next agent should implement each one following the same pattern as §5.6-5.12.

| File | Changes |
|---|---|
| `frontend/src/components/malaika/footer.tsx` | Split into sub-components (already done in `d3b515b`). Refactor to use new design tokens. Add newsletter signup inline. Add payment method icons (M-Pesa, Visa, Mastercard). |
| `frontend/src/components/malaika/mobile-bottom-nav.tsx` | Already merged with a11y fixes. Verify focus-visible ring is visible. Add haptic feedback via `navigator.vibrate(10)` on tap (where supported). |
| `frontend/src/components/malaika/announcement-bar.tsx` | Verify XSS fix is in place (merged). Add dismiss button that persists in localStorage. |
| `frontend/src/components/malaika/shop-by-age.tsx` | Replace text links with visual cards — image + age range + count of products. |
| `frontend/src/components/malaika/category-quick-links.tsx` | Pinterest-style grid: 2 large + 4 small (editorial composition). Hover lifts. |
| `frontend/src/components/malaika/value-props.tsx` | Minimal icon + title + subtitle. No backgrounds, no borders. Pure typography. |
| `frontend/src/components/malaika/testimonials.tsx` | Quote cards in a 3-column grid. Large quotation mark. Star rating. |
| `frontend/src/components/malaika/newsletter.tsx` | Inline section, not modal. Single email input with underline style. Success state replaces form. |
| `frontend/src/components/malaika/thrifted-section.tsx` | Editorial layout: 1 large + 3 small. "Mtumba" badge on each card. |
| `frontend/src/components/malaika/thrifted-card.tsx` | Same as ProductCard but with "Mtumba" badge and condition grade. |
| `frontend/src/components/malaika/recently-viewed-section.tsx` | Horizontal scroll on mobile, grid on desktop. Only show if 3+ items. |
| `frontend/src/components/malaika/related-products.tsx` | Carousel on mobile, masonry on desktop. |
| `frontend/src/components/malaika/review-section.tsx` | Add rating distribution chart. Add photo reviews. Sort by: recent / helpful / highest / lowest. |
| `frontend/src/components/malaika/whatsapp-button.tsx` | Verify it's only visible on mobile (desktop uses contact form). Add aria-label with context. |
| `frontend/src/components/malaika/scroll-to-top.tsx` | Verify it appears after 600px scroll. Add progress ring showing scroll progress. |
| `frontend/src/components/malaika/cookie-consent.tsx` | Replace with minimal banner (bottom-left, dismissable). No modal. |
| `frontend/src/components/malaika/cart-recovery-banner.tsx` | Verify it only shows for returning users with cart items. Add "Dismiss" button. |
| `frontend/src/app/(store)/layout.tsx` | Add cart drawer mount point. Add skip-to-content link. |
| `frontend/src/app/(store)/categories/page.tsx` + `categories-client.tsx` | Add filter sidebar (desktop) / sheet (mobile). Add masonry layout option. Add sort dropdown. Add active filter chips. |
| `frontend/src/app/(store)/products/[slug]/page.tsx` + `product-detail-client.tsx` | Add "shop the look" section. Add sticky add-to-cart on mobile. Add size guide modal. Add delivery estimate. |
| `frontend/src/app/(store)/cart/page.tsx` | Add empty state. Add "you might also like" section. Add coupon input inline. |
| `frontend/src/app/(store)/checkout/page.tsx` | Multi-step: Information → Shipping → Payment → Review. Progress indicator. M-Pesa STK UI: show phone input → "Check your phone for M-Pesa prompt" → polling indicator. |
| `frontend/src/app/(store)/checkout/success/page.tsx` | Order confirmation. Show order summary. Add "track order" link. Add "share to social" buttons. |
| `frontend/src/app/(store)/account/page.tsx` | Dashboard: recent orders, saved addresses, loyalty points, wishlist count. |
| `frontend/src/app/(store)/account/orders/page.tsx` + `[id]/page.tsx` | Order list with status badges. Order detail with timeline. Reorder button. |
| `frontend/src/app/(store)/account/loyalty/page.tsx` | Points balance. Tier progress. How to earn. Rewards available. |
| `frontend/src/app/(store)/wishlist/page.tsx` | Pinterest-style grid. Move to cart button. Remove button. |
| `frontend/src/app/(store)/login/page.tsx` + `register/` + `forgot-password/` + `reset-password/` | Already a11y-fixed (see `docs/superpowers/plans/2026-07-30-auth-pages-accessibility-fixes.md`). Verify new design tokens. Add social login buttons (Google). |
| `frontend/src/app/(store)/blog/page.tsx` + `[slug]/page.tsx` | Editorial layout: large hero image, serif body, drop cap. Verify DOMPurify fix is in place (merged). |
| `frontend/src/app/(store)/thrifted/page.tsx` + `[slug]/` | Same as categories but with thrifted filter. |
| `frontend/src/app/(store)/best-sellers/page.tsx` | Single masonry grid. |
| `frontend/src/app/(store)/search/page.tsx` | Reuse categories-client with search query. |
| `frontend/src/app/(store)/track/page.tsx` | Order tracking by receipt number. Show timeline. |
| `frontend/src/app/(store)/about/page.tsx` | Editorial: hero image, story, team, values. |
| `frontend/src/app/(store)/contact/page.tsx` | Form + map (Google Maps embed). |
| `frontend/src/app/(store)/faq/page.tsx` | Accordion. Searchable. |
| `frontend/src/app/(store)/find-us/page.tsx` | Map + address + hours + directions button. |
| `frontend/src/app/(store)/shipping/page.tsx` | Delivery zones table. Rates. Times. |
| `frontend/src/app/(store)/returns/page.tsx` | Return policy. Steps. Form to start a return. |
| `frontend/src/app/(store)/privacy-policy/page.tsx` + `terms-of-service/` | Legal text. Table of contents sidebar. |
| `frontend/src/app/not-found.tsx` | Editorial 404: large "404" in serif, helpful links. |
| `frontend/src/app/error.tsx` + `global-error.tsx` | Friendly error: "Something went wrong" + retry button. |

---

## 6. Admin Dashboard Redesign — File-by-File

The admin dashboard is functionally complete but visually dated and missing modern patterns. The redesign keeps all existing functionality, adds command palette, real-time updates, and a cleaner aesthetic.

### 6.1 `frontend/src/app/admin/layout.tsx` — New sidebar + command palette

**Changes:**
1. Collapsible sidebar (icon-only on collapse, full on expand). State persists in localStorage.
2. Grouped nav: Commerce (products, orders, customers, loyalty), Content (blog, banners, testimonials, branding, content), Reports (reports, invoices, abandoned carts), System (settings).
3. Command palette trigger (Cmd+K) in top bar.
4. Real-time order count badge in nav.
5. User menu with logout.
6. Mobile: sheet-based sidebar.

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FolderTree, Image, FileText,
  BarChart3, Settings, LogOut, Menu, X, Sparkles, Award, MessageSquareQuote,
  PanelLeftClose, PanelLeft, Search, Bell,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Logo } from '@/components/malaika/logo';
import { CommandPalette } from '@/components/admin/command-palette';
import { RealtimeOrderBadge } from '@/components/admin/realtime-order-badge';
import type { Branding } from '@/lib/settings';

const NAV_GROUPS = [
  {
    label: 'Commerce',
    items: [
      { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard, exact: true },
      { href: '/admin/products', label: 'Products', Icon: Package },
      { href: '/admin/thrifted', label: 'Mtumba', Icon: Sparkles },
      { href: '/admin/orders', label: 'Orders', Icon: ShoppingCart, badge: 'pending-orders' },
      { href: '/admin/abandoned-carts', label: 'Abandoned Carts', Icon: ShoppingCart },
      { href: '/admin/customers', label: 'Customers', Icon: Users },
      { href: '/admin/loyalty', label: 'Loyalty', Icon: Award },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/categories', label: 'Categories', Icon: FolderTree },
      { href: '/admin/banners', label: 'Banners', Icon: Image },
    ],
  },
  {
    label: 'Content',
    items: [
      { href: '/admin/blog', label: 'Blog', Icon: FileText },
      { href: '/admin/testimonials', label: 'Testimonials', Icon: MessageSquareQuote },
      { href: '/admin/branding', label: 'Branding', Icon: Sparkles },
      { href: '/admin/content', label: 'Content', Icon: FileText },
    ],
  },
  {
    label: 'Insights',
    items: [
      { href: '/admin/reports', label: 'Reports', Icon: BarChart3 },
      { href: '/admin/invoices', label: 'Invoices', Icon: FileText },
      { href: '/admin/settings', label: 'Settings', Icon: Settings },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [branding, setBranding] = useState<Partial<Branding>>({});

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/admin/login');
      else if (!isAdmin) router.push('/');
    }
  }, [user, isAdmin, isLoading, router]);

  useEffect(() => {
    fetch('/api/admin/branding')
      .then((r) => r.json())
      .then((data) => setBranding(data.settings || {}))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('admin-sidebar-collapsed');
    if (stored === 'true') setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  if (pathname === '/admin/login') return <>{children}</>;

  if (isLoading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper text-ink-muted">
        Loading admin…
      </div>
    );
  }

  const toggleCollapse = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem('admin-sidebar-collapsed', String(next));
  };

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-paper flex">
      {/* Sidebar — desktop */}
      <aside
        className={`hidden lg:flex flex-col ${sidebarCollapsed ? 'w-16' : 'w-64'} flex-shrink-0 transition-all duration-200 bg-sidebar text-sidebar-foreground`}
      >
        <div className={`p-4 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2.5'}`}>
          <Logo logoUrl={branding.logo_url} storeName={branding.store_name} tagline={branding.tagline} className="[&_img]:h-8 [&_img]:w-8" />
          {!sidebarCollapsed && (
            <div>
              <div className="font-serif text-sm font-semibold text-paper">Malaika Nest</div>
              <div className="text-[10px] uppercase tracking-wider text-paper/50">Admin Panel</div>
            </div>
          )}
        </div>

        <nav className="flex-1 px-2 py-2 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              {!sidebarCollapsed && (
                <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.14em] text-paper/40 font-semibold">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map(({ href, label, Icon, exact, badge }) => {
                  const active = exact ? pathname === href : pathname.startsWith(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${active ? 'font-semibold bg-sidebar-accent text-sidebar-accent-foreground' : 'text-paper/70 hover:bg-sidebar-accent/50 hover:text-paper'}`}
                        title={sidebarCollapsed ? label : undefined}
                      >
                        <Icon size={16} strokeWidth={1.75} className="flex-shrink-0" />
                        {!sidebarCollapsed && <span className="flex-1">{label}</span>}
                        {!sidebarCollapsed && badge === 'pending-orders' && <RealtimeOrderBadge />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-paper/70 hover:bg-sidebar-accent/50 hover:text-paper transition-colors"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
            {!sidebarCollapsed && 'Collapse'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-paper/70 hover:bg-sidebar-accent/50 hover:text-paper transition-colors"
          >
            <LogOut size={16} />
            {!sidebarCollapsed && 'Sign out'}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-sidebar text-sidebar-foreground flex flex-col">
            {/* Same content as desktop sidebar, expanded */}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-line bg-paper-card flex items-center px-4 lg:px-6 gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-paper-alt"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-ink" />
          </button>

          <button
            onClick={() => setPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-line text-sm text-ink-muted hover:border-line-strong hover:text-ink transition-colors flex-1 max-w-md"
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="text-[10px] px-1.5 py-0.5 border border-line rounded">⌘K</kbd>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-paper-alt relative" aria-label="Notifications">
              <Bell size={18} className="text-ink" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-accent" />
            </button>
            <div className="w-8 h-8 rounded-full bg-ink text-paper flex items-center justify-center text-sm font-semibold">
              {(user?.name || user?.email || '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
```

### 6.2 `frontend/src/components/admin/command-palette.tsx` — NEW FILE

```tsx
'use client';

import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, FolderTree, Image, FileText,
  BarChart3, Settings, Sparkles, Award, MessageSquareQuote, Plus, ArrowRight,
} from 'lucide-react';

const COMMANDS = [
  { id: 'dashboard', label: 'Go to Dashboard', href: '/admin', Icon: LayoutDashboard, group: 'Navigation' },
  { id: 'products', label: 'Go to Products', href: '/admin/products', Icon: Package, group: 'Navigation' },
  { id: 'orders', label: 'Go to Orders', href: '/admin/orders', Icon: ShoppingCart, group: 'Navigation' },
  { id: 'customers', label: 'Go to Customers', href: '/admin/customers', Icon: Users, group: 'Navigation' },
  { id: 'categories', label: 'Go to Categories', href: '/admin/categories', Icon: FolderTree, group: 'Navigation' },
  { id: 'banners', label: 'Go to Banners', href: '/admin/banners', Icon: Image, group: 'Navigation' },
  { id: 'blog', label: 'Go to Blog', href: '/admin/blog', Icon: FileText, group: 'Navigation' },
  { id: 'reports', label: 'Go to Reports', href: '/admin/reports', Icon: BarChart3, group: 'Navigation' },
  { id: 'settings', label: 'Go to Settings', href: '/admin/settings', Icon: Settings, group: 'Navigation' },
  { id: 'loyalty', label: 'Go to Loyalty', href: '/admin/loyalty', Icon: Award, group: 'Navigation' },
  { id: 'testimonials', label: 'Go to Testimonials', href: '/admin/testimonials', Icon: MessageSquareQuote, group: 'Navigation' },
  { id: 'thrifted', label: 'Go to Mtumba', href: '/admin/thrifted', Icon: Sparkles, group: 'Navigation' },
  { id: 'new-product', label: 'Add new product', href: '/admin/products/new', Icon: Plus, group: 'Actions' },
  { id: 'new-blog', label: 'Write new blog post', href: '/admin/blog/new', Icon: Plus, group: 'Actions' },
  { id: 'new-banner', label: 'Add new banner', href: '/admin/banners', Icon: Plus, group: 'Actions' },
];

export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    if (open) document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const runCommand = (href: string) => {
    router.push(href);
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 px-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <Command
        className="relative w-full max-w-xl bg-paper-card border border-line rounded-xl shadow-xl overflow-hidden"
        label="Command Palette"
      >
        <div className="flex items-center gap-3 px-4 border-b border-line">
          <LayoutDashboard size={16} className="text-ink-muted" />
          <Command.Input
            autoFocus
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent py-4 text-sm text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 border border-line rounded text-ink-muted">ESC</kbd>
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-ink-muted">No results found.</Command.Empty>

          {['Actions', 'Navigation'].map((group) => (
            <Command.Group key={group} heading={group} className="text-ink-muted">
              {COMMANDS.filter((c) => c.group === group).map(({ id, label, href, Icon }) => (
                <Command.Item
                  key={id}
                  value={label}
                  onSelect={() => runCommand(href)}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-ink cursor-pointer data-[selected=true]:bg-paper-alt"
                >
                  <Icon size={14} strokeWidth={1.75} className="text-ink-muted" />
                  <span className="flex-1">{label}</span>
                  <ArrowRight size={12} className="text-ink-faint" />
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </div>
  );
}
```

### 6.3 `frontend/src/components/admin/realtime-order-badge.tsx` — NEW FILE

Uses Channels WebSocket to show real-time pending order count.

```tsx
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

export function RealtimeOrderBadge() {
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  useEffect(() => {
    // Initial fetch
    api.get('/api/v1/orders/', { params: { status: 'pending', limit: 1 } })
      .then((res) => {
        const count = res.data?.count ?? res.data?.data?.count ?? 0;
        setPendingCount(count);
      })
      .catch(() => setPendingCount(0));

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const wsUrl = `${protocol}://${window.location.host}/ws/orders/`;
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'order.created' || data.type === 'order.status_changed') {
            // Refetch count
            api.get('/api/v1/orders/', { params: { status: 'pending', limit: 1 } })
              .then((res) => setPendingCount(res.data?.count ?? 0))
              .catch(() => {});
          }
        } catch {}
      };
      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 5000);
      };
    };
    connect();

    return () => {
      ws?.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  if (pendingCount === null || pendingCount === 0) return null;

  return (
    <span
      className="min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-paper text-[10px] font-semibold flex items-center justify-center"
      aria-label={`${pendingCount} pending orders`}
    >
      {pendingCount > 9 ? '9+' : pendingCount}
    </span>
  );
}
```

### 6.4 `frontend/src/app/admin/page.tsx` — Dashboard with charts

Add real charts (revenue trend, top products, order status distribution), low-stock alerts, and pending tasks.

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, Package, Users, TrendingUp, ArrowRight, Clock, CheckCircle,
  Truck, AlertCircle, AlertTriangle, DollarSign,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '@/lib/api';

interface DashboardData {
  stats: {
    revenue_today: number;
    revenue_30d: number;
    orders_today: number;
    orders_30d: number;
    products: number;
    customers: number;
    pending_orders: number;
    low_stock: number;
  };
  revenue_trend: { date: string; revenue: number }[];
  top_products: { name: string; sold: number; revenue: number }[];
  order_status_distribution: { status: string; count: number }[];
  recent_orders: any[];
  low_stock_products: { id: number; name: string; stock: number }[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--warning)',
  paid: 'var(--info)',
  processing: 'var(--chart-3)',
  shipped: 'var(--chart-2)',
  delivered: 'var(--success)',
  cancelled: 'var(--danger)',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/v1/orders/admin/analytics/'),
      api.get('/api/v1/orders/', { params: { limit: 5 } }),
      api.get('/api/v1/products/products/', { params: { limit: 1 } }),
      api.get('/api/v1/products/admin/products/', { params: { low_stock: true, limit: 5 } }),
    ]).then(([analyticsRes, ordersRes, productsRes, lowStockRes]) => {
      // Aggregate data
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value.data : {};
      const ordersData = ordersRes.status === 'fulfilled' ? ordersRes.value.data : {};
      const productsData = productsRes.status === 'fulfilled' ? productsRes.value.data : {};
      const lowStockData = lowStockRes.status === 'fulfilled' ? lowStockRes.value.data : {};

      const recentOrders = ordersData?.results ?? ordersData?.data?.results ?? [];
      const lowStockProducts = lowStockData?.results ?? lowStockData?.data?.results ?? [];

      setData({
        stats: {
          revenue_today: analytics.revenue_today ?? 0,
          revenue_30d: analytics.revenue_30d ?? 0,
          orders_today: analytics.orders_today ?? 0,
          orders_30d: analytics.orders_30d ?? 0,
          products: productsData?.count ?? 0,
          customers: analytics.customers ?? 0,
          pending_orders: analytics.pending_orders ?? 0,
          low_stock: lowStockProducts.length,
        },
        revenue_trend: analytics.revenue_trend ?? [],
        top_products: analytics.top_products ?? [],
        order_status_distribution: analytics.order_status_distribution ?? [],
        recent_orders: recentOrders,
        low_stock_products: lowStockProducts,
      });
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-ink-muted">Loading dashboard…</div>;
  }

  if (!data) return null;

  const statCards = [
    { label: 'Revenue (30d)', value: `KES ${data.stats.revenue_30d.toLocaleString('en-KE')}`, Icon: DollarSign, trend: '+12%' },
    { label: 'Orders (30d)', value: data.stats.orders_30d, Icon: ShoppingCart, trend: '+8%' },
    { label: 'Products', value: data.stats.products, Icon: Package, trend: '' },
    { label: 'Pending Orders', value: data.stats.pending_orders, Icon: Clock, trend: data.stats.pending_orders > 0 ? 'Action needed' : '' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="display-3 text-ink">Dashboard</h1>
        <p className="body-sm text-ink-muted mt-1">Welcome back. Here's what's happening in your store.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, Icon, trend }) => (
          <div key={label} className="card-editorial p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg bg-paper-alt flex items-center justify-center">
                <Icon size={18} className="text-ink" />
              </div>
              {trend && <span className="text-xs text-ink-muted">{trend}</span>}
            </div>
            <div className="text-2xl font-semibold text-ink">{value}</div>
            <div className="text-xs text-ink-muted mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart + Order status pie */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-editorial p-6">
          <h2 className="h3 text-ink mb-4">Revenue (last 30 days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data.revenue_trend}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
              <XAxis dataKey="date" stroke="var(--ink-muted)" fontSize={11} />
              <YAxis stroke="var(--ink-muted)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: 'var(--paper-card)',
                  border: '1px solid var(--line)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} fill="url(#revenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-editorial p-6">
          <h2 className="h3 text-ink mb-4">Order Status</h2>
          {data.order_status_distribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.order_status_distribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={50}
                >
                  {data.order_status_distribution.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || 'var(--ink-muted)'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[280px] flex items-center justify-center text-sm text-ink-muted">No orders yet</div>
          )}
        </div>
      </div>

      {/* Top products + Low stock */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card-editorial p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3 text-ink">Top Products</h2>
            <Link href="/admin/reports" className="text-xs text-accent hover:underline">View report</Link>
          </div>
          {data.top_products.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.top_products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis type="number" stroke="var(--ink-muted)" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="var(--ink-muted)" fontSize={11} width={100} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--paper-card)',
                    border: '1px solid var(--line)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="sold" fill="var(--ink)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-ink-muted">No sales data yet</div>
          )}
        </div>

        <div className="card-editorial p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="h3 text-ink">Low Stock Alert</h2>
            <Link href="/admin/products?filter=low_stock" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          {data.low_stock_products.length > 0 ? (
            <ul className="space-y-2">
              {data.low_stock_products.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2 border-b border-line last:border-0">
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={16} className="text-warning" />
                    <Link href={`/admin/products/${p.id}`} className="text-sm text-ink hover:text-accent">
                      {p.name}
                    </Link>
                  </div>
                  <span className="text-xs font-semibold text-danger">{p.stock} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-sm text-ink-muted">All products well-stocked</div>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card-editorial">
        <div className="p-5 flex items-center justify-between border-b border-line">
          <h2 className="h3 text-ink">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-accent hover:underline inline-flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="divide-y divide-line">
          {data.recent_orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-muted">No orders yet.</div>
          ) : (
            data.recent_orders.map((order) => {
              const StatusIcon = { pending: Clock, paid: CheckCircle, processing: Package, shipped: Truck, delivered: CheckCircle, cancelled: AlertCircle }[order.status] || Clock;
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="p-4 flex items-center gap-3 hover:bg-paper-alt transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-paper-alt flex items-center justify-center flex-shrink-0">
                    <StatusIcon size={16} className="text-ink" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">#{order.receipt_number}</div>
                    <div className="text-xs text-ink-muted truncate">
                      {order.customer_email || 'Guest'} · {new Date(order.created_at).toLocaleDateString('en-KE')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-ink">
                      KES {parseFloat(order.total).toLocaleString('en-KE')}
                    </div>
                    <div className="text-xs text-ink-muted capitalize">{order.status}</div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
```

### 6.5 `frontend/src/app/admin/products/page.tsx` — TanStack Table with bulk actions

```tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, useReactTable,
} from '@tanstack/react-table';
import { Plus, Search, ArrowUpDown, MoreHorizontal, Trash2, Edit, Eye } from 'lucide-react';
import api from '@/lib/api';
import { formatKES } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  stock: number;
  category_name: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    api.get('/api/v1/products/admin/products/', { params: { limit: 100 } })
      .then((res) => {
        const results = res.data?.results ?? res.data?.data?.results ?? [];
        setData(results);
      })
      .finally(() => setLoading(false));
  }, []);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      { id: 'select', header: ({ table }) => (<Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)} aria-label="Select all" />), cell: ({ row }) => (<Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />), enableSorting: false, enableColumnFilter: false, size: 40 },
      { accessorKey: 'name', header: ({ column }) => <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="flex items-center gap-1 hover:text-ink">Name <ArrowUpDown size={12} /></button>, cell: ({ row }) => <span className="font-medium text-ink">{row.original.name}</span> },
      { accessorKey: 'category_name', header: 'Category', cell: ({ row }) => <span className="text-ink-muted">{row.original.category_name || '—'}</span> },
      { accessorKey: 'price', header: 'Price', cell: ({ row }) => <span className="font-medium text-ink">{formatKES(parseFloat(row.original.price))}</span> },
      { accessorKey: 'stock', header: 'Stock', cell: ({ row }) => { const s = row.original.stock; return <span className={s < 5 ? 'text-danger font-semibold' : 'text-ink-muted'}>{s}</span>; } },
      { accessorKey: 'is_active', header: 'Status', cell: ({ row }) => <span className={`px-2 py-1 text-[10px] uppercase tracking-wide rounded ${row.original.is_active ? 'bg-success/15 text-success' : 'bg-paper-alt text-ink-muted'}`}>{row.original.is_active ? 'Active' : 'Draft'}</span> },
      { id: 'actions', header: 'Actions', cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild><button className="w-8 h-8 flex items-center justify-center rounded hover:bg-paper-alt"><MoreHorizontal size={14} /></button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => router.push(`/admin/products/${row.original.id}`)}><Edit size={12} className="mr-2" /> Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => window.open(`/products/${row.original.slug}`, '_blank')}><Eye size={12} className="mr-2" /> View</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onClick={() => handleDelete(row.original.id)}><Trash2 size={12} className="mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ), enableSorting: false, enableColumnFilter: false },
    ],
    [router]
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, rowSelection },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/api/v1/products/admin/products/${id}/`);
      setData((d) => d.filter((p) => p.id !== id));
    } catch (e) {
      alert('Failed to delete product');
    }
  };

  const handleBulkDelete = async () => {
    const selected = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (!confirm(`Delete ${selected.length} products?`)) return;
    try {
      await Promise.all(selected.map((id) => api.delete(`/api/v1/products/admin/products/${id}/`)));
      setData((d) => d.filter((p) => !selected.includes(p.id)));
      setRowSelection({});
    } catch (e) {
      alert('Some deletes failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="display-3 text-ink">Products</h1>
          <p className="body-sm text-ink-muted mt-1">{data.length} products</p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="card-editorial">
        <div className="p-4 border-b border-line flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
            <Input
              placeholder="Search products…"
              value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
              onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
              className="pl-9"
            />
          </div>
          {Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 size={14} className="mr-2" /> Delete {Object.keys(rowSelection).length} selected
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-paper-alt">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 text-left font-medium text-ink-muted" style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr><td colSpan={columns.length} className="p-8 text-center text-ink-muted">Loading…</td></tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr><td colSpan={columns.length} className="p-8 text-center text-ink-muted">No products found.</td></tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-paper-alt/50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-line flex items-center justify-between text-sm">
          <div className="text-ink-muted">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
            <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
```

### 6.6 Remaining admin files (summary)

For brevity, the remaining admin files. Each one follows the same pattern: TanStack Table for lists, React Hook Form + Zod for forms, Recharts for charts, real-time updates via Channels where relevant.

| File | Changes |
|---|---|
| `frontend/src/app/admin/orders/page.tsx` | TanStack Table with status filter tabs (All / Pending / Paid / Processing / Shipped / Delivered / Cancelled). Click row → opens order detail in drawer (not separate page). Bulk status update. CSV export button. |
| `frontend/src/app/admin/customers/page.tsx` | TanStack Table. Columns: name, email, phone, orders count, total spent, last order date. Click row → customer detail page. |
| `frontend/src/app/admin/categories/page.tsx` | Drag-and-drop category tree (using `@dnd-kit`). Inline rename. Add child category. |
| `frontend/src/app/admin/banners/page.tsx` | Card grid of banners. Drag to reorder. Schedule (start/end date). Mobile + desktop image upload. |
| `frontend/src/app/admin/blog/page.tsx` | TanStack Table of posts. Status: draft / published / scheduled. Inline preview. |
| `frontend/src/app/admin/blog/[id]/page.tsx` + `new/page.tsx` | Markdown editor with live preview. Featured image upload. SEO metadata fields. |
| `frontend/src/app/admin/branding/page.tsx` | Logo upload, favicon upload, store name, tagline, social links, announcement bar config. Live preview. |
| `frontend/src/app/admin/content/page.tsx` | Editable homepage content blocks. Section selector. |
| `frontend/src/app/admin/testimonials/page.tsx` | Card grid. Add/edit/delete. Star rating. Photo upload. |
| `frontend/src/app/admin/invoices/page.tsx` | TanStack Table. Download PDF. Resend email. Regenerate. |
| `frontend/src/app/admin/reports/page.tsx` | Date range picker. Revenue chart. Top products. Top categories. Customer cohorts. M-Pesa success rate. Export PDF. |
| `frontend/src/app/admin/settings/page.tsx` | Tabs: General, Payments, Shipping, Email, Security, Integrations. Each tab is a form. |
| `frontend/src/app/admin/loyalty/page.tsx` | Points rules editor. Tier config. Member list. |
| `frontend/src/app/admin/abandoned-carts/page.tsx` | List of carts abandoned > 1 hour. Send reminder button. Conversion tracking. |
| `frontend/src/app/admin/thrifted/page.tsx` + `[id]/` + `new/` | Same as products but for thrifted items (stock = 1, condition grade). |
| `frontend/src/components/admin/ProductGalleryUploader.tsx` | Add drag-and-drop reordering. Bulk upload. Cloudinary transformation presets. |
| `frontend/src/components/admin/VariantEditor.tsx` | Matrix editor: sizes × colors. Bulk set inventory. CSV import. |

---

## 7. Backend Hardening — File-by-File

### 7.1 `backend/requirements.txt` — Add dependencies

```
# Existing deps stay
# ADD:
drf-spectacular==0.27.2          # OpenAPI schema generation
django-structlog==5.3.0          # Structured logging
django-filter==24.3              # Already there, ensure used
django-storages==1.14.4          # For Backblaze B2 backups
boto3==1.34.162                   # AWS SDK for B2
sentry-sdk==2.13.0               # Error tracking
django-debug-toolbar==4.4.0      # Dev only — query analysis
django-extensions==3.2.4         # shell_plus, runserver_plus
django-cors-headers==4.6.0       # Already there
psycopg2-binary==2.9.10          # Already there
whitenoise==6.9.0                # Already there
```

### 7.2 `backend/config/settings/base.py` — Add INSTALLED_APPS, MIDDLEWARE, SPECTACULAR

```python
# Add to INSTALLED_APPS:
INSTALLED_APPS = [
    # ... existing ...
    'drf_spectacular',
    'django_structlog',
    'django_extensions',
    # ... rest ...
]

# Add to MIDDLEWARE (after SecurityMiddleware):
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django_structlog.middlewares.RequestMiddleware',  # NEW — request ID + structured logs
    'whitenoise.middleware.WhiteNoiseMiddleware',
    # ... rest ...
]

# DRF config — add DEFAULT_SCHEMA_CLASS:
REST_FRAMEWORK = {
    # ... existing ...
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# Spectacular config:
SPECTACULAR_SETTINGS = {
    'TITLE': 'Malaika Nest API',
    'DESCRIPTION': 'E-commerce platform for baby and children\'s clothing in Kenya.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'CONTACT': {'name': 'Malaika Nest', 'email': 'hello@malaikanest.com'},
    'LICENSE': {'name': 'Proprietary'},
}

# Structured logging:
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': 'django_structlog.middlewares.request_formatter',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Sentry (only if SENTRY_DSN is set):
if os.environ.get('SENTRY_DSN'):
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    sentry_sdk.init(
        dsn=os.environ['SENTRY_DSN'],
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=False,
    )
```

### 7.3 `backend/config/urls.py` — Add schema + metrics endpoints

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.core.healthcheck import health_check, readiness_check
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

admin.site.site_header = 'Malaika Nest E-Commerce Admin'
admin.site.site_title = 'Malaika Nest Shop Admin'

admin_prefix = (getattr(settings, "ADMIN_URL_PREFIX", None) or "manage-store").strip("/")

urlpatterns = [
    # API
    path('api/v1/accounts/', include('apps.accounts.urls')),
    path('api/v1/products/', include('apps.products.urls')),
    path('api/v1/orders/', include('apps.orders.urls')),
    path('api/v1/payments/', include('apps.payments.urls')),
    path('api/v1/core/', include('apps.core.urls')),

    # OpenAPI schema
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Health + metrics
    path('api/health/', health_check, name='health_check'),
    path('api/ready/', readiness_check, name='readiness_check'),
    path('metrics/', include('apps.core.metrics_urls')),  # Prometheus

    # Admin
    path(f'{admin_prefix}/', admin.site.urls),
]

if settings.DEBUG:
    urlpatterns += [
        path('__debug__/', include('debug_toolbar.urls')),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 7.4 `backend/apps/core/metrics.py` + `metrics_urls.py` — Prometheus metrics

**`metrics.py`** (extend existing):

```python
# Add to existing metrics.py:
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from django.http import HttpResponse

# Metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration',
    ['method', 'endpoint'],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0)
)

active_cart_count = Gauge('active_cart_count', 'Number of active carts')
pending_orders_count = Gauge('pending_orders_count', 'Number of pending orders')
mpesa_stk_success_rate = Gauge('mpesa_stk_success_rate', 'M-Pesa STK success rate (0-1)')

def metrics_view(request):
    return HttpResponse(generate_latest(), content_type=CONTENT_TYPE_LATEST)
```

**`metrics_urls.py`** (NEW):

```python
from django.urls import path
from .metrics import metrics_view

urlpatterns = [
    path('', metrics_view, name='prometheus-metrics'),
]
```

### 7.5 `backend/apps/core/middleware.py` — Add QueryCountMiddleware

```python
# Add to existing middleware.py:
from django.db import connection
from django.conf import settings
import logging

logger = logging.getLogger('apps.core.queries')

class QueryCountMiddleware:
    """Log queries per request in DEBUG mode. Warn on N+1 patterns."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not settings.DEBUG:
            return self.get_response(request)

        response = self.get_response(request)

        queries = len(connection.queries)
        if queries > 50:
            logger.warning(
                f'High query count: {queries} queries for {request.method} {request.path}'
            )
        elif queries > 20:
            logger.info(f'Query count: {queries} for {request.method} {request.path}')

        return response
```

Add `'apps.core.middleware.QueryCountMiddleware'` to `MIDDLEWARE` in `dev.py` (dev only).

### 7.6 `backend/apps/accounts/views.py` — Add 2FA support

Add WebAuthn or TOTP-based 2FA for admin accounts. Use `django-otp`:

```
# Add to requirements.txt:
django-otp==1.5.0
qrcode==7.4.2
```

Add `'django_otp'` and `'django_otp.plugins.otp_totp'` to `INSTALLED_APPS`. Add `django_otp.middleware.OTPMiddleware` to `MIDDLEWARE`. Require 2FA for staff/admin users via a decorator on admin endpoints.

### 7.7 `backend/apps/orders/views.py` — Add soft delete

```python
# Add to Order model:
class Order(BaseModel):
    # ... existing fields ...
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['deleted_at']),
            models.Index(fields=['status', '-created_at']),
        ]

    def soft_delete(self):
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.save()

# Update all querysets to exclude soft-deleted:
class OrderManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)

class Order(BaseModel):
    # ... existing ...
    objects = OrderManager()
    all_objects = models.Manager()  # includes soft-deleted

# Add to OrderViewSet:
@action(detail=True, methods=['post'])
def destroy(self, request, *args, **kwargs):
    """Soft delete — preserves audit trail."""
    order = self.get_object()
    order.soft_delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
```

Add migration: `python manage.py makemigrations orders --name add_soft_delete`.

### 7.8 `backend/apps/products/views.py` — Add admin bulk endpoints

```python
# Add to AdminProductViewSet:
@action(detail=False, methods=['post'])
def bulk_update_status(self, request):
    """Bulk update product status. Body: {ids: [1,2,3], is_active: true}"""
    ids = request.data.get('ids', [])
    is_active = request.data.get('is_active')
    if not ids or is_active is None:
        return Response({'error': 'ids and is_active required'}, status=400)
    Product.objects.filter(id__in=ids).update(is_active=is_active)
    return Response({'updated': len(ids)})

@action(detail=False, methods=['post'])
def bulk_delete(self, request):
    """Bulk delete products."""
    ids = request.data.get('ids', [])
    if not ids:
        return Response({'error': 'ids required'}, status=400)
    # Soft delete if implemented, else hard delete
    Product.objects.filter(id__in=ids).delete()
    return Response({'deleted': len(ids)})

@action(detail=False, methods=['get'])
def export(self, request):
    """CSV export of all products."""
    from django.http import HttpResponse
    import csv
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="products.csv"'
    writer = csv.writer(response)
    writer.writerow(['ID', 'Name', 'Slug', 'Price', 'Stock', 'Category', 'Status'])
    for p in Product.objects.select_related('category').all():
        writer.writerow([p.id, p.name, p.slug, p.price, p.stock, p.category.name if p.category else '', 'Active' if p.is_active else 'Draft'])
    return response
```

### 7.9 `backend/apps/payments/views.py` — Add webhook signature logging

```python
# Add to M-Pesa callback view:
def mpesa_callback(self, request):
    # Verify signature (existing code)
    # ...

    # NEW: Log the full callback for debugging
    import json
    logger.info(
        'M-Pesa callback received',
        extra={
            'callback_data': json.dumps(request.data)[:2000],  # truncate
            'ip': get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        }
    )

    # Process (existing code)
    # ...
```

### 7.10 Rate limiting config

```python
# Add to base.py:
REST_FRAMEWORK = {
    # ... existing ...
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.ScopedRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '120/min',
        'cart': '30/min',
        'checkout': '5/min',
        'auth': '10/min',
        'admin': '300/min',  # higher limit for admin
        'password_reset': '3/hour',
    },
}

# Apply to views:
# In CartViewSet: throttle_scope = 'cart' (already there)
# In checkout view: throttle_scope = 'checkout'
# In LoginView: throttle_scope = 'auth'
# In AdminProductViewSet: throttle_scope = 'admin'
```

### 7.11 Database connection pooling

Add `pgbouncer` to `docker-compose.yml`:

```yaml
# Add service:
  pgbouncer:
    image: edoburu/pgbouncer:1.22.0
    restart: unless-stopped
    environment:
      DB_HOST: db
      DB_USER: ${POSTGRES_USER:-kenya}
      DB_PASSWORD: ${POSTGRES_PASSWORD:-kenya_password}
      DB_NAME: ${POSTGRES_DB:-kenya_ecom}
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
      DEFAULT_POOL_SIZE: 20
      RESERVE_POOL_SIZE: 5
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "127.0.0.1:6432:5432"
```

Update backend env: `DB_HOST: pgbouncer`, `DB_PORT: 5432`.

---

## 8. Infra / DevOps — File-by-File

### 8.1 `.github/workflows/ci.yml` — NEW FILE

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: npm install --legacy-peer-deps
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm run build

  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: pip
          cache-dependency-path: backend/requirements.txt
      - run: pip install -r requirements.txt
      - run: python manage.py check
      - run: python manage.py test

  docker-build:
    runs-on: ubuntu-latest
    needs: [frontend, backend]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - name: Build frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: false
          tags: malaikanest-frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Build backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: false
          tags: malaikanest-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 8.2 `.github/workflows/deploy.yml` — NEW FILE

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/malaikanest
            git pull origin main
            docker compose build
            docker compose up -d
            docker compose exec backend python manage.py migrate
            docker compose exec frontend npm run build
```

### 8.3 `docker-compose.yml` — Add staging, monitoring, backups

Add the following services to the existing `docker-compose.yml`:

```yaml
  # Staging (separate ports, same host)
  # staging-frontend:
  #   build: ./frontend
  #   ...

  # Prometheus — metrics
  prometheus:
    image: prom/prometheus:v2.54.1
    restart: unless-stopped
    volumes:
      - ./deployment/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "127.0.0.1:9090:9090"

  # Grafana — dashboards
  grafana:
    image: grafana/grafana:11.2.0
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./deployment/grafana-dashboards:/etc/grafana/provisioning/dashboards:ro
    ports:
      - "127.0.0.1:3001:3000"
    depends_on:
      - prometheus

  # Loki — log aggregation
  loki:
    image: grafana/loki:3.2.0
    restart: unless-stopped
    volumes:
      - loki_data:/loki
    ports:
      - "127.0.0.1:3100:3100"

  # Db backup — nightly to Backblaze B2
  db-backup:
    image: prodrigestivill/postgres-backup-local:16
    restart: unless-stopped
    environment:
      POSTGRES_HOST: db
      POSTGRES_DB: ${POSTGRES_DB:-kenya_ecom}
      POSTGRES_USER: ${POSTGRES_USER:-kenya}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-kenya_password}
      SCHEDULE: '@daily'
      BACKUP_KEEP_DAYS: 7
      BACKUP_KEEP_WEEKS: 4
      BACKUP_KEEP_MONTHS: 6
    volumes:
      - ./backups:/backups
    depends_on:
      db:
        condition: service_healthy

volumes:
  # existing: postgres_data, redis_data, frontend_cms_data
  prometheus_data:
  grafana_data:
  loki_data:
```

### 8.4 `deployment/prometheus.yml` — NEW FILE

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'malaikanest-backend'
    metrics_path: /metrics/
    static_configs:
      - targets: ['backend:8000']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

### 8.5 `deployment/grafana-dashboards/overview.json` — NEW FILE

A Grafana dashboard JSON with panels for:
- Request rate (req/s)
- Error rate (5xx %)
- p50, p95, p99 latency
- Active carts
- Pending orders
- M-Pesa success rate
- DB connections
- Redis memory
- Celery queue depth
- Container CPU/memory

(Generate via Grafana UI, export as JSON, commit to `deployment/grafana-dashboards/`.)

### 8.6 `deployment/alerting-rules.yml` — NEW FILE

```yaml
groups:
  - name: malaikanest
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: 'High 5xx error rate (>5% for 5m)'
          description: 'Error rate is {{ $value | humanizePercentage }} on {{ $labels.instance }}'

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: 'High p95 latency (>2s for 5m)'

      - alert: MpesaFailureSpike
        expr: 1 - mpesa_stk_success_rate > 0.2
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: 'M-Pesa STK failure rate > 20%'

      - alert: DbConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels:
          severity: warning

      - alert: DiskSpaceLow
        expr: node_filesystem_avail_bytes / node_filesystem_size_bytes < 0.1
        for: 10m
        labels:
          severity: critical

      - alert: ServiceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
```

Wire alerts to Slack or email via Alertmanager (separate container).

### 8.7 Staging environment

Create `docker-compose.staging.yml` that overrides:
- `frontend` env: `NEXT_PUBLIC_API_URL=https://staging.malaikanest.com`
- `backend` env: `DJANGO_ENV=staging`, `DEBUG=False`
- Different Postgres volume: `postgres_staging_data`
- Different ports: `127.0.0.1:3002:3000` (frontend), `127.0.0.1:8082:8000` (backend)
- Cloudflare Tunnel config for `staging.malaikanest.com`

### 8.8 Backup restore script

`scripts/ops/restore-backup.sh`:

```bash
#!/bin/bash
# Usage: ./restore-backup.sh <backup-file.sql.gz>
set -e

BACKUP_FILE=$1
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

echo "Restoring from $BACKUP_FILE..."
gunzip -c "$BACKUP_FILE" | docker compose exec -T db psql -U "${POSTGRES_USER:-kenya}" -d "${POSTGRES_DB:-kenya_ecom}"

echo "Restore complete. Verify with: docker compose exec backend python manage.py check"
```

### 8.9 Repo cleanup script

`scripts/ops/cleanup-repo.sh` — moves stray files to proper locations:

```bash
#!/bin/bash
# One-time cleanup of stray files in repo root.
# Run this ONCE, commit the result, then delete this script.
set -e

cd /home/z/my-project/repo/malaikanest

# Create directories
mkdir -p scripts/ops docs/screenshots docs/scratch

# Move stray scripts
mv deploy-fix.sh deploy.ps1 deploy.sh deploy_fix2.js deploy_frontend.js deploy_now.js \
   fix-gunicorn.sh load-test.js patch_and_deploy.js patch_frontend_container.js \
   patch_vm_host_media.js patch_vm_nav.js quick-deploy.sh run_db_fix.js \
   sync_build_to_vm.js test_login.sh test_reg.py test_reg.sh test_s22_live.js \
   update_remote_backend.js purge_secrets.sh \
   scripts/ops/ 2>/dev/null || true

# Move seed scripts to scripts/seed/
mkdir -p scripts/seed
mv seed_cloudinary_products.py seed_live_products.py scripts/seed/ 2>/dev/null || true

# Move fix scripts to scripts/fix/
mkdir -p scripts/fix
mv fix_db_image_paths.py fix-gunicorn.sh scripts/fix/ 2>/dev/null || true

# Move screenshots
mv malaikanest-home.png malaikanest-home-mobile.png malaikanest-mobile-home.png \
   malaikanest-mobile-issue.png malaikanest-search-mobile.png banner_1.jpg \
   docs/screenshots/ 2>/dev/null || true

# Move SQL scratch
mv orders_timestamp_fix.sql payment_order12.sql payment_order12_status.sql \
   payments_all_columns.sql payments_columns.sql payments_schema_fix.sql \
   mpesa_success_callback.json malaikanest_pdf_text.txt \
   docs/scratch/ 2>/dev/null || true

# Remove stray directories (they're gitignored but in working tree)
rm -rf .freebuff .playwright-mcp .localappdata .npm-cache .git.bak-20260317-062850 "malaika nest"

# Remove stale prod compose (use docker-compose.yml only)
rm -f docker-compose.prod.yml

# Remove stray backend debug scripts
rm -f backend/_direct_post.py backend/_test_json.py backend/_test_post.py \
       backend/nohup.out backend/migrate_output.txt backend/README_FINAL.md \
       backend/refactor_models.py backend/wipe_db.py

echo "Cleanup complete. Review with 'git status' and commit."
```

---

## 9. Mobile PWA — File-by-File

### 9.1 `frontend/public/manifest.webmanifest` — NEW FILE

```json
{
  "name": "Malaika Nest",
  "short_name": "Malaika",
  "description": "Premium baby & children's clothing, made with love in Kenya.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#FDF8F3",
  "theme_color": "#1A1410",
  "categories": ["shopping", "lifestyle"],
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "screenshots": [
    { "src": "/screenshot-mobile.png", "sizes": "390x844", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screenshot-desktop.png", "sizes": "1280x800", "type": "image/png", "form_factor": "wide" }
  ],
  "shortcuts": [
    { "name": "Search", "url": "/categories", "icons": [{ "src": "/icon-search.png", "sizes": "96x96" }] },
    { "name": "Cart", "url": "/cart", "icons": [{ "src": "/icon-cart.png", "sizes": "96x96" }] },
    { "name": "Orders", "url": "/account/orders", "icons": [{ "src": "/icon-orders.png", "sizes": "96x96" }] }
  ],
  "prefer_related_applications": false
}
```

Generate icon files (`icon-192.png`, `icon-512.png`, etc.) from the logo using `frontend/scripts/generate-pwa-icons.js`.

### 9.2 `frontend/src/app/sw.ts` — NEW FILE, service worker

```ts
/// <reference lib="webworker" />

const CACHE_NAME = 'malaika-v1';
const STATIC_CACHE = 'malaika-static-v1';
const OFFLINE_URL = '/offline';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/logo.svg',
  '/favicon.ico',
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API requests (except specific cacheable ones)
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/') && !url.pathname.includes('/products/products/')) {
    return;
  }

  // Network-first for navigation, cache-first for assets
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// Push notifications
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data ? event.data.json() : {};
  const { title, body, url: clickUrl } = data;

  event.waitUntil(
    self.registration.showNotification(title || 'Malaika Nest', {
      body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      data: { url: clickUrl || '/' },
      vibrate: [100, 50, 100],
    })
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const url = event.notification.data?.url || '/';
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) {
        return existing.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
```

### 9.3 `frontend/src/app/offline/page.tsx` — NEW FILE

```tsx
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata = {
  title: 'Offline',
};

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-paper p-6">
      <div className="text-center max-w-md">
        <WifiOff size={48} strokeWidth={1} className="mx-auto text-ink-muted mb-6" />
        <h1 className="display-3 text-ink mb-3">You're offline</h1>
        <p className="body text-ink-muted mb-8">
          We can't reach the internet right now. Check your connection and try again.
          In the meantime, you can browse products you've recently viewed.
        </p>
        <Link href="/" className="btn btn-primary">
          Try Again
        </Link>
      </div>
    </div>
  );
}
```

### 9.4 `frontend/src/components/malaika/pwa-install-prompt.tsx` — NEW FILE

```tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 30s on site, if not already installed
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setTimeout(() => setShow(true), 30000);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setShow(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-install-dismissed', '1');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:max-w-sm z-40"
        >
          <div className="card-editorial p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Download size={18} className="text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-ink">Install Malaika Nest</h3>
                <p className="text-xs text-ink-muted mt-1">
                  Add to your home screen for faster access and offline browsing.
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleInstall} className="btn btn-sm btn-primary">Install</button>
                  <button onClick={handleDismiss} className="btn btn-sm btn-ghost">Not now</button>
                </div>
              </div>
              <button onClick={handleDismiss} className="text-ink-muted hover:text-ink" aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 9.5 Push notifications

Backend: add a `PushSubscription` model in `backend/apps/accounts/models.py`, an endpoint to subscribe/unsubscribe, and a Celery task that sends push notifications on order status change.

Frontend: in `account/page.tsx`, add a "Enable notifications" button that calls `Notification.requestPermission()` and subscribes via the browser's Push API. Send the subscription to the backend.

When an order's status changes, the backend Celery task iterates the user's push subscriptions and sends notifications via the Web Push protocol (use `pywebpush` Python package).

---

## 10. Accessibility Audit & Remediation Plan

### 10.1 Audit scope

WCAG 2.1 AA compliance. Audit every page with:
- axe DevTools browser extension
- Lighthouse (Accessibility score target: ≥ 95)
- Manual keyboard-only navigation test
- Screen reader test (NVDA on Windows, VoiceOver on macOS/iOS, TalkBack on Android)

### 10.2 Known issues to fix

| Issue | Location | Fix |
|---|---|---|
| Carousel auto-play doesn't pause on focus | `hero.tsx` | Add `onFocus={() => setPaused(true)}` to carousel container |
| Mobile drawer doesn't trap focus | `navbar.tsx` | Use Radix Dialog or focus-trap-react |
| Form errors not announced | All forms | Add `aria-invalid` and `aria-describedby` pointing to error message |
| Skip link target not focusable | `store-shell.tsx` | Add `tabindex={-1}` to `<main id="main">` |
| Color contrast: gold on cream | Various | New design tokens fix this — verify `--ink` on `--paper` is 12:1 |
| Image alt text missing | Product images | All `next/image` must have meaningful `alt` (product name, not "product") |
| Heading hierarchy skipped | Some pages | Audit each page: one `h1`, then `h2`, then `h3`. No skips. |
| Button vs link semantics | Various | Buttons for actions (with `onClick`), links for navigation (`href`). No `<div onClick>`. |
| Live regions for dynamic content | Cart count, search results | Add `aria-live="polite"` to cart count badge |
| Loading states not announced | Product lists | Add `aria-busy="true"` to loading containers, `role="status"` to loaders |
| Modal dialog focus management | Cart drawer, search overlay | Trap focus inside, return focus to trigger on close |

### 10.3 Audit checklist (per page)

For each page, verify:

- [ ] Has a descriptive `<title>` and `<meta name="description">`
- [ ] Has a single `<h1>` matching the page purpose
- [ ] All form fields have associated `<label>` (or `aria-label`)
- [ ] All interactive elements are keyboard accessible (tab order, Enter/Space)
- [ ] All interactive elements have visible focus indicator
- [ ] All images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text and UI components
- [ ] Page works at 200% zoom without horizontal scroll
- [ ] Page works with keyboard only (no mouse)
- [ ] Page works with screen reader (NVDA or VoiceOver)
- [ ] Respects `prefers-reduced-motion`
- [ ] Respects `prefers-color-scheme: dark`
- [ ] Has a skip-to-content link (storefront pages)
- [ ] Touch targets ≥ 44×44px on mobile

### 10.4 Accessibility testing in CI

Add `@axe-core/playwright` to `frontend/tests/`:

```ts
// frontend/tests/a11y.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  '/',
  '/categories',
  '/products/[slug]',  // use a known slug
  '/cart',
  '/checkout',
  '/account',
  '/login',
  '/register',
  '/blog',
  '/about',
  '/contact',
  '/faq',
];

for (const page of PAGES) {
  test(`${page} should pass axe accessibility audit`, async ({ page: browserPage }) => {
    await browserPage.goto(page);
    const results = await new AxeBuilder({ page: browserPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
```

Run in CI: `npx playwright test tests/a11y.spec.ts`.

---

## 11. Performance Budget & Optimization Plan

### 11.1 Performance budget

| Metric | Target | Stretch |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.0s | < 1.5s |
| INP (Interaction to Next Paint) | < 200ms | < 100ms |
| CLS (Cumulative Layout Shift) | < 0.05 | < 0.02 |
| FCP (First Contentful Paint) | < 1.5s | < 1.0s |
| TTFB (Time to First Byte) | < 600ms | < 400ms |
| Total page weight (homepage) | < 500 KB | < 300 KB |
| JS bundle (initial) | < 200 KB | < 150 KB |
| Image weight (homepage) | < 300 KB | < 200 KB |

Test on: Moto G4 (Chrome), iPhone SE (Safari), Slow 3G profile, Lighthouse CI.

### 11.2 Optimization checklist

#### Images
- [ ] All product images use `next/image` with `sizes` attribute
- [ ] Hero image uses `priority` and is sized correctly (no CLS)
- [ ] All images served as AVIF or WebP (next/image handles this)
- [ ] Cloudinary transformations: `f_auto,q_auto,w_{width}` for responsive
- [ ] Lazy-load below-the-fold images (`loading="lazy"` is default in next/image)
- [ ] Use `blurDataURL` for product images (generate at build or upload time)

#### JavaScript
- [ ] Code-split routes (Next.js App Router does this automatically)
- [ ] Lazy-load heavy components: Testimonials, Newsletter, ThriftedSection (already done)
- [ ] Tree-shake icon libraries via `experimental.optimizePackageImports` (see §5.1)
- [ ] Replace `recharts` with `visx` or `chart.js` (smaller) in admin
- [ ] Remove unused shadcn/ui components (audit `src/components/ui/`)
- [ ] Replace `moment`/`date-fns` with `temporal-polyfill` if date handling is light

#### CSS
- [ ] Tailwind v4 already purges unused classes — verify `content` paths in config
- [ ] Inline critical CSS (Next.js does this automatically)
- [ ] Use `font-display: swap` (already set in `next/font`)

#### Fonts
- [ ] Cormorant Garamond: subset to latin (already done)
- [ ] DM Sans: subset to latin (already done)
- [ ] Preload font files: add `<link rel="preload" as="font">` for woff2

#### Network
- [ ] Enable HTTP/2 (Cloudflare does this)
- [ ] Enable Brotli compression (Cloudflare does this)
- [ ] Cache static assets for 1 year (already set in `next.config.ts`)
- [ ] Use `stale-while-revalidate` for HTML pages (already set for homepage)
- [ ] Prefetch likely-next pages (Next.js Link does this on hover/in-view)

#### Backend
- [ ] Add Redis cache for product list API (60s TTL, already done in `api.ts`)
- [ ] Add database indexes on hot paths (verify with `EXPLAIN ANALYZE`)
- [ ] Use `select_related` / `prefetch_related` on all list views (N+1 fix already merged)
- [ ] Add PaginatedResponse for all list endpoints (already done)
- [ ] Add ETag headers for product detail API (conditional requests)

#### Service Worker
- [ ] Cache static assets for offline use (see §9.2)
- [ ] Stale-while-revalidate for product images
- [ ] Network-first for HTML, cache-first for assets

### 11.3 Lighthouse CI

Add to `.github/workflows/ci.yml`:

```yaml
  lighthouse:
    runs-on: ubuntu-latest
    needs: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npm install --legacy-peer-deps
      - run: cd frontend && npm run build
      - run: cd frontend && npm run start &
      - uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/categories
            http://localhost:3000/products/example-slug
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

`lighthouse-budget.json`:

```json
{
  "resourceCounts": [
    { "resourceType": "script", "budget": 10 },
    { "resourceType": "stylesheet", "budget": 3 },
    { "resourceType": "image", "budget": 30 },
    { "resourceType": "font", "budget": 4 }
  ],
  "resourceSizes": [
    { "resourceType": "script", "budget": 200 },
    { "resourceType": "stylesheet", "budget": 50 },
    { "resourceType": "image", "budget": 300 },
    { "resourceType": "font", "budget": 100 }
  ]
}
```

---

## 12. Implementation Phases (8-Week Roadmap)

### Phase 0: Pre-flight (Days 1-2)
- [ ] Verify repo state: `git log --oneline | head` shows `1814c8a` on top
- [ ] Verify only `main` branch exists: `git branch -r`
- [ ] **Rotate the GitHub PAT** used in §2
- [ ] Run `cd frontend && npm install --legacy-peer-deps && npx tsc --noEmit && npm run lint && npm run build` — verify all green
- [ ] Run `cd backend && pip install -r requirements.txt && python manage.py check && python manage.py test` — verify all green
- [ ] Read `AGENTS.md` and `docs/ARCHITECTURE.md` completely
- [ ] Set up local dev environment (Docker Compose up)
- [ ] Create feature branch: `git checkout -b feat/editorial-premium-redesign`

### Phase 1: Design System Foundation (Week 1)
- [ ] Replace `frontend/src/app/globals.css` with new design tokens (§4.2-4.5)
- [ ] Replace `frontend/tailwind.config.ts` (§4.6)
- [ ] Add `frontend/src/lib/motion.ts` (§4.7)
- [ ] Update `frontend/src/app/layout.tsx` — manifest link, theme provider (§5.4, §5.5)
- [ ] Add `frontend/src/middleware.ts` — nonce-based CSP (§5.2)
- [ ] Update `frontend/next.config.ts` — tightened CSP, experimental flags (§5.1)
- [ ] Verify build: `npm run build` must pass
- [ ] Visual diff: every existing page should still render (tokens are backward-compatible via `--brand-*` aliases — keep aliases during transition, remove in Phase 8)
- [ ] Commit: `feat(design): implement editorial-premium design system`

### Phase 2: Storefront Core (Week 2)
- [ ] Split `navbar.tsx` into 5 files (§5.6)
- [ ] Add `shop-mega-menu.tsx`
- [ ] Replace `hero.tsx` with editorial hero (§5.7)
- [ ] Replace `product-card.tsx` with quick-add (§5.8)
- [ ] Update `product-section.tsx` with masonry option (§5.9)
- [ ] Add `editorial-story.tsx` (§5.11)
- [ ] Add `cart-drawer.tsx` (§5.12)
- [ ] Update `mobile-bottom-nav.tsx` (already merged, verify)
- [ ] Update `announcement-bar.tsx`, `footer.tsx`, `newsletter.tsx`, `value-props.tsx`, `testimonials.tsx`
- [ ] Commit: `feat(storefront): editorial-premium core components`

### Phase 3: Storefront Pages (Week 3)
- [ ] Update home page (§5.10)
- [ ] Update categories page + client (filter sidebar, masonry)
- [ ] Update product detail page (sticky add-to-cart, shop the look)
- [ ] Update cart page (empty state, suggestions)
- [ ] Update checkout page (multi-step)
- [ ] Update account pages (dashboard, orders, loyalty, wishlist)
- [ ] Update auth pages (login, register, forgot, reset) — verify a11y fixes still in place
- [ ] Update blog pages (verify DOMPurify fix in place)
- [ ] Update info pages (about, contact, faq, shipping, returns, privacy, terms, track, find-us)
- [ ] Update 404 and error pages
- [ ] Commit: `feat(storefront): all pages updated to editorial-premium`

### Phase 4: Admin Dashboard (Week 4)
- [ ] Update `admin/layout.tsx` — collapsible sidebar, command palette, real-time badge (§6.1)
- [ ] Add `command-palette.tsx` (§6.2)
- [ ] Add `realtime-order-badge.tsx` (§6.3)
- [ ] Update `admin/page.tsx` — dashboard with charts (§6.4)
- [ ] Update `admin/products/page.tsx` — TanStack Table (§6.5)
- [ ] Update remaining admin pages (§6.6)
- [ ] Update `ProductGalleryUploader.tsx` — drag-and-drop
- [ ] Update `VariantEditor.tsx` — matrix editor
- [ ] Commit: `feat(admin): rebuild dashboard with command palette and real-time updates`

### Phase 5: Backend Hardening (Week 5)
- [ ] Update `requirements.txt` (§7.1)
- [ ] Update `config/settings/base.py` (§7.2)
- [ ] Update `config/urls.py` — schema, metrics (§7.3)
- [ ] Add `metrics.py` + `metrics_urls.py` (§7.4)
- [ ] Add `QueryCountMiddleware` (§7.5)
- [ ] Add 2FA for admin (§7.6)
- [ ] Add soft delete on Order (§7.7)
- [ ] Add bulk endpoints on AdminProductViewSet (§7.8)
- [ ] Add webhook signature logging (§7.9)
- [ ] Add rate limiting config (§7.10)
- [ ] Add pgbouncer to docker-compose (§7.11)
- [ ] Run migrations: `python manage.py makemigrations && python manage.py migrate`
- [ ] Verify OpenAPI: visit `/api/schema/swagger/`
- [ ] Commit: `feat(backend): harden API with 2FA, soft delete, bulk ops, metrics`

### Phase 6: Infra & DevOps (Week 6)
- [ ] Add `.github/workflows/ci.yml` (§8.1)
- [ ] Add `.github/workflows/deploy.yml` (§8.2)
- [ ] Update `docker-compose.yml` — Prometheus, Grafana, Loki, backups (§8.3)
- [ ] Add `deployment/prometheus.yml` (§8.4)
- [ ] Add `deployment/grafana-dashboards/overview.json` (§8.5)
- [ ] Add `deployment/alerting-rules.yml` (§8.6)
- [ ] Add `docker-compose.staging.yml` (§8.7)
- [ ] Add `scripts/ops/restore-backup.sh` (§8.8)
- [ ] Run `scripts/ops/cleanup-repo.sh` (§8.9) — one-time cleanup
- [ ] Commit: `chore(infra): add CI/CD, monitoring, backups, staging env`

### Phase 7: PWA (Week 7)
- [ ] Add `frontend/public/manifest.webmanifest` (§9.1)
- [ ] Generate PWA icons
- [ ] Add `frontend/src/app/sw.ts` (§9.2)
- [ ] Add `frontend/src/app/offline/page.tsx` (§9.3)
- [ ] Add `pwa-install-prompt.tsx` (§9.4)
- [ ] Add push notification subscription model + endpoints + Celery task (§9.5)
- [ ] Update `next.config.ts` to register SW (or use `next-pwa` if compatible with v16)
- [ ] Test install on Android Chrome, iOS Safari
- [ ] Commit: `feat(pwa): installable app with offline support and push notifications`

### Phase 8: Accessibility & Performance (Week 8)
- [ ] Run axe audit on every page (§10.4)
- [ ] Fix all violations
- [ ] Run Lighthouse audit on every page
- [ ] Hit performance budgets (§11.1)
- [ ] Add Lighthouse CI to GitHub Actions (§11.3)
- [ ] Remove `--brand-*` aliases from `globals.css` (transition complete)
- [ ] Final visual QA on all target devices:
  - iPhone SE (375×667)
  - iPhone 14 Pro (393×852)
  - Tecno Spark 10 (360×800)
  - Samsung Galaxy A14 (360×740)
  - iPad mini (768×1024)
  - MacBook Air 13" (1280×800)
  - Desktop 4K (3840×2160)
- [ ] Final commit: `chore: a11y + perf audit complete`

### Post-launch
- [ ] Squash-merge feature branch to `main` via PR
- [ ] Delete feature branch
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production
- [ ] Monitor Grafana dashboards for 24h
- [ ] Rotate GitHub PAT, Django SECRET_KEY, JWT secret, and admin password

---

## 13. Acceptance Criteria & QA Gates

### 13.1 Definition of Done (per phase)

A phase is "done" when:
1. All checklist items in §12 for that phase are complete.
2. `cd frontend && npx tsc --noEmit && npm run lint && npm run build` all pass.
3. `cd backend && python manage.py check && python manage.py test` all pass.
4. No new `console.log`, `print()`, or `TODO`/`FIXME`/`HACK` comments added.
5. PR opened, reviewed, and squash-merged to `main`.
6. Feature branch deleted.

### 13.2 Final acceptance criteria (end of Phase 8)

**Storefront:**
- [ ] All 25+ pages render correctly on all 7 target devices
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 on homepage
- [ ] axe audit: 0 violations on all pages
- [ ] No console errors or warnings in browser DevTools
- [ ] All images optimized (AVIF/WebP, correct sizes)
- [ ] Cart drawer works: add to cart → drawer opens → checkout flows
- [ ] M-Pesa STK push works end-to-end in sandbox
- [ ] Search works with filters and sorting
- [ ] Wishlist works (add, remove, persists across sessions)
- [ ] Account pages work (orders, loyalty, addresses)
- [ ] Blog renders with sanitized HTML (DOMPurify verified)

**Admin:**
- [ ] All 16 admin pages render correctly
- [ ] Command palette (Cmd+K) works
- [ ] Real-time order badge updates via WebSocket
- [ ] Product CRUD works: create, edit, delete, bulk update, CSV export
- [ ] Order management works: list, filter, status update, invoice download
- [ ] Image upload works (Cloudinary integration)
- [ ] Reports page shows charts with real data
- [ ] Settings page saves correctly

**Backend:**
- [ ] `/api/schema/swagger/` renders interactive API docs
- [ ] `/metrics/` returns Prometheus metrics
- [ ] All endpoints have rate limiting
- [ ] 2FA enrollment works for admin user
- [ ] Soft delete works (deleted orders don't appear in lists but remain in DB)
- [ ] Structured logs include request ID
- [ ] Sentry captures errors (if SENTRY_DSN set)

**Infra:**
- [ ] CI passes on every PR
- [ ] Deploy workflow triggers on merge to `main`
- [ ] Grafana shows metrics at `http://server:3001`
- [ ] Alerts fire on high error rate / latency / disk space
- [ ] Nightly DB backup completes (check `./backups/` directory)
- [ ] Staging environment accessible at `https://staging.malaikanest.com`

**PWA:**
- [ ] Installable on Android Chrome (install prompt appears)
- [ ] Installable on iOS Safari (Add to Home Screen works)
- [ ] Offline page shows when network drops
- [ ] Push notifications received on order status change
- [ ] App icon correct on home screen

**Repo hygiene:**
- [ ] Only `main` branch exists
- [ ] No stray files in repo root (run `scripts/ops/cleanup-repo.sh`)
- [ ] No secrets in git history (run `git log --all -p | grep -i "password\|secret\|key" | head`)
- [ ] README.md updated with current state
- [ ] AGENTS.md updated with new conventions

---

## 14. Handoff Notes for the Next Agent

### 14.1 Read this first

1. Read this entire document top-to-bottom. It's long because it needs to be — every section has actionable detail.
2. Read `AGENTS.md` in the repo root.
3. Read `docs/ARCHITECTURE.md`.
4. Run the verification commands in §13.1 to confirm the starting state.
5. Rotate the GitHub PAT used in §2 before doing anything else.

### 14.2 How to use this plan

- **Phases are sequential.** Don't skip ahead. Phase 2 depends on Phase 1's design system.
- **Each phase ends with a commit.** Don't let work pile up uncommitted.
- **Each phase has a Definition of Done.** Don't move to the next phase until DoD is met.
- **Code snippets are starting points, not gospel.** If you find a better pattern during implementation, use it — but document the deviation in the PR description.
- **File paths are absolute from repo root.** `frontend/src/app/...` means `/home/z/my-project/repo/malaikanest/frontend/src/app/...` (or wherever the repo is cloned).

### 14.3 What to do if you get stuck

1. **Build fails on TypeScript:** Run `npx tsc --noEmit` to see errors. Fix them one by one. Don't use `@ts-ignore` — fix the type.
2. **Build fails on ESLint:** Run `npm run lint -- --fix` to auto-fix. Manual-fix the rest.
3. **Test fails:** Read the test failure. Don't skip the test. Fix the code or fix the test.
4. **Merge conflict:** Rebase on latest `main`. Resolve manually. Don't force-push to `main`.
5. **Docker compose fails:** Run `docker compose down -v` to wipe volumes and `docker compose up --build` to rebuild. (Note: this wipes the DB. Don't do in production.)
6. **M-Pesa sandbox not responding:** Check `MPESA_ENV=sandbox` and that the sandbox credentials are valid. Use the Daraja API sandbox dashboard.
7. **Cloudflare Tunnel down:** SSH to the server and `systemctl restart cloudflared`. Check `cloudflared/*.log`.

### 14.4 What NOT to do

1. **Don't create long-lived feature branches.** Use short-lived `feat/<scope>-<desc>` branches, merge via PR within a few days.
2. **Don't push to `main` directly.** Always via PR.
3. **Don't disable TypeScript checks.** `ignoreBuildErrors: false` stays.
4. **Don't remove the `lucide-react` icon shim.** It's there for a reason (§5.1 in `AGENTS.md`).
5. **Don't downgrade `sharp`, `next`, or `cryptography`.** These are pinned for security reasons.
6. **Don't commit secrets.** Use `.env.example` as a template. Real secrets go in `.env` (gitignored) or Docker secrets.
7. **Don't remove the CSP.** Tighten it, don't loosen it.
8. **Don't add `unsafe-inline` or `unsafe-eval` back to `script-src`.** Use nonces.
9. **Don't use `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`.**
10. **Don't reintroduce the 24 stray scripts in repo root.** They've been moved to `scripts/ops/` in Phase 6.

### 14.5 Communication

- **Commit messages:** Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `perf:`, `docs:`, `style:`, `test:`, `ci:`).
- **PR descriptions:** Include what changed, why, how to test, screenshots (for UI changes).
- **Code review:** At least one human review before merge, even for AI-generated code.
- **Issues:** Use GitHub Issues for bugs, features, and tasks. Link issues in PRs.

### 14.6 When you're done

When all 8 phases are complete and §13.2 acceptance criteria are met:

1. Open a final PR titled `feat: editorial-premium redesign — complete`.
2. In the PR description, link to this document and confirm all acceptance criteria are met.
3. Deploy to staging. Smoke test.
4. Deploy to production.
5. Monitor for 24h.
6. Rotate all secrets: GitHub PAT, Django SECRET_KEY, JWT secret, admin password, Cloudflare API token, M-Pesa credentials, Brevo API key.
7. Update `AGENTS.md` with the new state (last-updated date, new conventions).
8. Close this document. The next plan starts fresh.

---

**End of plan.**
