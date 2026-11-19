# Live UI/UX Audit — Malaika Nest Storefront

**Date:** 2026-09-20
**Method:** Live browser testing (agent-browser) against production `https://malaikanest.com`, plus a local production build (`next build` + `next start -p 3111`) to verify fixes.
**Scope:** Frontend code only. Per decision, no catalog/CMS data was changed.

---

## Environment findings (prerequisites for future audits)

| Item | Finding |
|---|---|
| `localhost:3000` | Belongs to **METARDU** (Docker `metardu-app`), **not** Malaika Nest. Never assume this port. |
| Local Malaika frontend | Not running at audit time. Use `next start -p 3111` against a build. |
| Local Django backend `:8000` | Not running. Backend is reached at `https://api.malaikanest.com`. |
| CMS database (`malaika_cms`) | Does not exist locally → Prisma throws, `getSiteSettings`/`getTestimonials` silently fall back to hardcoded defaults. Build still succeeds. |
| API health | `{"database":"ok","redis":"degraded","cache":"ok"}` — **Redis is degraded**, worth investigating separately. |

---

## 🔴 P0 — Homepage silently deleted 6 of its sections

### Symptom
Live homepage rendered only **5 sections** (Hero, trust strip, Shop by Category, Shop by Age, Featured Essentials) then jumped to the footer. Missing entirely: Recently Viewed, Value Props, **Best Sellers**, **Thrifted/Mtumba**, Testimonials, **New Arrivals**, Newsletter.

### Root cause
`ProductSection` had an unconditional silent bail-out:
```tsx
if (products.length === 0) return null;
```
Live catalog contains **exactly 1 published product** (`floral pants`, KES 300) — verified via `GET /api/v1/products/products/?page_size=200` → `count: 1`. With empty fetches, Best Sellers and New Arrivals returned `null` and left no trace.

Same pattern in `ThriftedSection` (`if (products.length === 0) return null`) and `Testimonials`, which rendered its heading **and a "4.9 / 5 · 1,200+ reviews" claim above an empty grid**.

A `return null` on a storefront section is the wrong decision: the shopper sees a broken page with no explanation and no route forward.

### Fix applied
Added an optional `emptyMessage` prop to `ProductSection`, `ThriftedSection`, and `Testimonials`.

- Section now stays visible when `emptyMessage` is supplied, rendering branded empty-state copy inside a bordered card.
- `if (products.length === 0 && !emptyMessage) return null;` preserves the old behavior for callers that don't opt in (no regression for admin/preview usage).
- The mobile **"View All"** link now renders in **both** states, so an empty section still offers a route forward.
- `Testimonials` now hides the aggregate star rating unless `active.length > 0`, so the store never claims a rating with zero testimonials on screen.

### Verification
| Metric | Before | After |
|---|---|---|
| `<section>` count on `/` | 5 | **11** |
| Best Sellers present | ✗ (silent `null`) | ✓ heading + empty state + CTA |
| New Arrivals present | ✗ (silent `null`) | ✓ heading + empty state + CTA |
| Mtumba/Thrifted present | ✗ (silent `null`) | ✓ heading + empty state + CTA |
| Horizontal overflow @390px | none | none (`scrollW === clientW === 390`) |
| `npx tsc --noEmit` | pass | pass (exit 0) |
| `next build` | — | ✓ `Compiled successfully in 4.6s`, 65 routes |

Live browser confirmation (`next start -p 3111`) — final section order:

| # | Section | State |
|---|---|---|
| 0 | Hero | populated |
| 1 | Shop by Age (10 ages) | populated |
| 2 | Curated Categories | populated |
| 3 | Featured Products | empty state |
| 4 | Value Props | populated |
| 5 | **Best Sellers** | **empty state** (was missing) |
| 6 | **Pre-loved Treasures (Mtumba)** | **empty state** (was missing) |
| 7 | Testimonials | populated |
| 8 | **New Arrivals** | **empty state** (was missing) |
| 9 | Newsletter | populated |
| 10 | Footer wrapper | — |

> **Testing caveat:** five sections read `innerText === ""` while off-screen. This is `content-visibility: auto` working as designed, **not** a rendering bug. Scroll the section into view before asserting on its text.

---

## 🟠 P1 — `/categories` and `/products/` are the same page

Both resolve to an identical document:

| URL | `<h1>` | `body.innerText.length` |
|---|---|---|
| `https://malaikanest.com/categories` | `Find their next favourite` | 1612 |
| `https://malaikanest.com/products/` | `Find their next favourite` | 1612 |

The homepage's "View All →" and "All Products →" both target `/categories`.

**Impact:** no distinct browsing experience, and duplicate content for search engines.

**Status:** reported, not changed — fixing it requires choosing a canonical URL, which is a product decision.

---

## 🟠 P1 — Category taxonomy contains near-duplicates

Live tiles at audit time: `Baby Clothing`, `Baby Essentials`, `Clothing`, `Gifts`, `Nursery`, `Nursery & Gear`, `Toys & Gifts`, `Toys & Learning`, `Travel & Safety`.

- `Nursery` vs `Nursery & Gear` — same concept, twice
- `Gifts` vs `Toys & Gifts` — same concept, twice
- `Clothing` vs `Baby Clothing` — overlapping

A tighter set (`Baby Clothing`, `Baby Essentials`, `Nursery`, `Toys & Learning`, `Gifts & Bundles`, `Mtumba / Thrifted`) is present in the local build's CMS content. Which set ships depends on stored category rows.

**Status:** reported. Consolidating the taxonomy changes stored data — owner's call.

---

## 🟠 P1 — Fabricated social proof (recommend addressing before promotion)

The storefront ships hardcoded marketing claims as fallback data:

| Claim | Location |
|---|---|
| `"4.9 / 5 · 1,200+ reviews"` | `src/lib/i18n.tsx:142`, `src/lib/settings.ts:97` |
| `"Trusted by 5,000+ Kenyan families"` | `DEFAULT_VALUE_PROPS`, `settings.ts:116` |
| 3 named testimonials (Amina W., Grace M., Joy K.) | `DEFAULT_TESTIMONIALS`, `settings.ts:120-145` |

`getTestimonials()` returns `DEFAULT_TESTIMONIALS` when the DB query returns nothing **or throws** (`settings.ts:270-274`). Because `malaika_cms` does not resolve in some environments, these fictional reviews render with no DB rows behind them — confirmed live.

They also reference products that **do not exist** in the catalog (*Organic Newborn Set*, *Baby Shower Gift Bundle*, *Toddler Clothing Pack*) while the only live product is *floral pants*. A customer can spot that inconsistency.

Two related bugs in the same fallback path:

1. `DEFAULT_VALUE_PROPS` uses `titleKey` / `subtitleKey`, but `getValueProps()` maps over the results with `isActive: v.is_active` (snake_case) — which is `undefined` for these camelCase objects. So the fallback rows only render because `undefined !== false`; they are never explicitly active.
2. That same path serves `"Till 3370347"` while the hero trust strip serves `"Buy Goods 3370347"` — the M-Pesa till is presented two different ways on one page.

> ⚠️ If the **StrictMode double-invoke guard** was applied as previously drafted, it would make bug #1 fatal: `undefined` rows would be filtered out and the Value Props section would disappear entirely. Verify this guard against `DEFAULT_VALUE_PROPS` before enabling it.

**Recommendation:** replace with real, attributable reviews (or hide the section) before promotion; numeric review claims are advertising claims in most jurisdictions. Business/legal decision → **not** altered.

---

## ✅ Verified working — do not regress

- **Product detail page** is strong: breadcrumbs, size selector, quantity stepper, stock state, **"Order via WhatsApp"** next to Add to Cart, Product Details / What's Included / Fabric & Care, "Measurements & fit".
- **No horizontal overflow** at 360px or 390px.
- **Mobile bottom nav** (Shop / Categories / Account / Cart / WhatsApp) present and correctly sized.
- **Trust strip** (Fast Delivery, Lipa na M-Pesa, Skin-Friendly Fabrics, Direct Support) clear and well-placed.
- **Shop by Age** renders all 10 age bands locally with images from `public/images/ages/`.

---

## Notes for future testers

1. Prefer `scrollintoview` before reading text from below-fold sections; `content-visibility: auto` otherwise reports empty content that is genuinely rendered.
2. Never trust `localhost:3000` for this project.
3. A local `next build` succeeds despite `prisma:error` spam — expected without `malaika_cms`.
4. Brand palette: the live site uses the **blue coastal palette** from commit `b48b3e84`. The gold/brown tokens documented in `Overview.md` are stale — blue is current.
5. Backend health reports `redis: degraded` — worth investigating separately.



---

## 🔴 P0 (REVISED — root cause) — Production is running a build that does not contain the local `main` work

**Correction to an earlier draft of this report.** I initially described `/categories` and `/products/` as "the same page". That framing was wrong, and the real cause matters much more.

### What is actually true

| Route | `<h1>` | `<section>` count | Product grid | `innerText` length |
|---|---|---|---|---|
| `/products/` | "Find their next favourite" | 0 | ✅ renders, 1 card | 1612 |
| `/categories` | "Find their next favourite" | 0 | ✅ renders, 1 card | 1612 |

**Two corrections to my earlier draft, both my own errors:**

1. I first said these were "byte-identical pages". They are not — 42687 vs 42691 bytes, and `$a -eq $b` returned `False`.
2. I then said the grid "never renders" based on `<section>` count 0. **That was wrong.** `<section>` count is 0 only because the deployed build's listing page uses `<div class="grid ...">`, not `<section>` elements. The grid is present and contains the `floral pants` card. I re-checked four consecutive loads: `section`=0, `innerText`=1612, and the grid held 1 child each time — **stable, not intermittent**. My "intermittent render failure" claim was unsupported and is withdrawn.

Verified grid contents on every load:
```
grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4  →  1 child
  "PANTS / floral pants / Available sizes: 2Y / KES 300 / View →"
```
Page states "Showing 1 item", which is correct for a 1-product catalog.

So `/products/` and `/categories` are genuinely **two routes rendering the same listing page**. That is a real duplication, but it is a **cosmetic/SEO** issue — not a broken grid.

One genuine copy inconsistency: the listing heading reads "Find their **next** favourite", while the homepage hero button reads "Find **their** next favourite" — worth aligning.

### Actual root cause: a deploy-branch mismatch

`deploy.yml` builds and deploys on **every push to `main`**:

```yaml
on:
  push:
    branches: [main]
...
git pull --ff-only origin main
docker compose build --pull backend frontend
docker compose up -d --remove-orphans
```

But the work being audited is **not on `main`**:

| Ref | Commit | Date | Note |
|---|---|---|---|
| `HEAD` (checked out) | `b48b3e84` | 2026-09-16 | `feat/lean-django-monolith` — the newest work |
| `origin/main` | `a70ca479` | 2026-08-29 | **what production runs** |
| local `main` | `4646a49c` | — | divergent from `origin/main` |

`b48b3e84` and `origin/main` are on **different branches with unrelated histories** — `git cat-file -e origin/main:backend/templates` fails, `origin/main` contains `.freebuff`, `.jules`, `.gitconfig-sandbox` and `malaika nest/` which the lean branch does not, and it has no `shop-by-size` route. There is **no merge base**, so this is not a fast-forward.

`git log origin/main..HEAD` lists **11+ commits** that have never been deployed — including:

- `b48b3e84` Size-first storefront + coastal theme (**shop by size, size guides, blue palette**)
- `b45ff3e4` Admin static TS dashboard (orders, products, variant stock)
- `2f38e69b` iOS-style system typography, remove Google Fonts
- `84cb80b1`, `95274e17`, `8a07e676` Footer / M-Pesa badge / dedup work
- `50f38159` Mtumba storefront: condition filter pills, card/detail badges
- `c4f31c8c` Admin variant/colour editor, product gallery, category images

### Why this reframes every earlier finding

Production is running a **~3-week-old build**. So:

- The homepage rendering only 5 sections is **partly expected** — the local `main` homepage (Hero + Shop-by-Size + categories + Featured + Best Sellers + New Arrivals + Thrifted + Testimonials + Newsletter) is not what is deployed. Several "missing section" symptoms are the **old build**, not deleted sections.
- The "10 ages defined, 7 shown" discrepancy is explained by the deployed build predating `shop-by-age.tsx`.
- The `emptyMessage` fix I added is still valid and worthwhile (a silent `return null` is wrong regardless of build), but it **does not fix** the production page, because that code is not deployed.

**I cannot verify any of my frontend fixes against production.** The fixes are real in `b48b3e84`+ but unverifiable live until deployed.

### What I could and could not verify

| Claim | Verification |
|---|---|
| Production does not run `b48b3e84` | ✅ verified (`origin/main` = `a70ca479`, `shop-by-size` absent) |
| Local fixes build & typecheck clean | ✅ verified (`tsc --noEmit` exit 0, `next build` OK, 11 sections) |
| Local fixes work in production | ❌ **not possible** — undeployed |
| `/products/` and `/categories` both render the listing page | ✅ verified (4 consecutive loads) |
| Production grid renders intermittently | ❌ **withdrawn** — unsupported; grid rendered on all 4 loads |
| Two branches share history | ❌ they do not — no merge base |

### Recommendation (requires your decision)

This is a **release-engineering problem, not a UI problem**, and it supersedes the cosmetic findings:

1. Decide which branch is the source of truth (`feat/lean-django-monolith` vs `main`).
2. Reconcile the divergent histories deliberately — **do not** "pull `--ff-only`" or force-push `main` blindly; `deploy.yml` runs `build` + `up -d` on every `main` push, so an incorrect merge triggers a real production deploy.
3. Only then re-run this audit against a deployed build; several findings will disappear or change.

**Status:** reported, not changed. Rewriting branch topology or `main` in a live repo is destructive and is your call.

---

## 🟠 P1 — Category taxonomy contains near-duplicates

Live tiles: `Baby Clothing`, `Baby Essentials`, `Clothing`, `Gifts`, `Nursery`, `Nursery & Gear`, `Toys & Gifts`, `Toys & Learning`, `Travel & Safety`.

- `Nursery` vs `Nursery & Gear` — same concept, twice
- `Gifts` vs `Toys & Gifts` — same concept, twice
- `Clothing` vs `Baby Clothing` — overlapping

Shown in the UI as of this audit, though a newer set (`Baby Clothing, Baby Essentials, Nursery, Toys & Learning, Gifts & Bundles, Mtumba / Thrifted`) is present in the local build's category content. Which set ships depends on admin/CMS values.

**Status:** reported. Consolidating the taxonomy changes stored data — your call.

---

## 🟠 P1 — Shop by Age: 10 ages defined, 7 shown

`shop-by-age.tsx` declares 10 age bands. Live homepage showed 7. The local build rendered all 10 (`Newborn … 9–12 Years`). So the live 7 is driven by CMS content, not a code defect. All 10 age images exist in `public/images/ages/`.

**Status:** reported — appears to be stale CMS content rather than a code bug.

---

## 🟠 P1 — Fabricated social proof (recommend addressing)

The storefront ships **hardcoded marketing claims** as fallback data:

| Claim | Location |
|---|---|
| `"4.9 / 5 · 1,200+ reviews"` | `src/lib/i18n.tsx:142` (+ `settings.ts:97`) |
| `"Trusted by 5,000+ Kenyan families"` | `DEFAULT_VALUE_PROPS`, `settings.ts:116` |
| 3 named testimonials (Amina W., Grace M., Joy K.) | `DEFAULT_TESTIMONIALS`, `settings.ts:120-145` |

`getTestimonials()` returns `DEFAULT_TESTIMONIALS` whenever the DB query returns nothing **or throws** (`settings.ts:270-274`). Because `malaika_cms` does not resolve in some environments, these fictional reviews can render with no DB rows behind them.

The testimonials also reference products that **do not exist** in the catalog: *Organic Newborn Set*, *Baby Shower Gift Bundle*, *Toddler Clothing Pack* — while the only live product is *floral pants*. That is a concrete inconsistency a customer can spot.

**Recommendation:** replace with real, attributable reviews (or hide the section) before promotion. Numeric review claims are advertising claims in most jurisdictions. This is a business/legal decision, so I have **not** altered it.

---

## ✅ Verified working — do not regress

- **Product detail page** is strong: breadcrumbs, size selector, quantity stepper, stock state, **"Order via WhatsApp"** fallback next to Add to Cart, Product Details / What's Included / Fabric & Care, "Measurements & fit".
- **No horizontal overflow** at 360px or 390px.
- **Mobile bottom nav** (Shop / Categories / Account / Cart / WhatsApp) present and correctly sized.
- **Trust strip** (Fast Delivery, Lipa na M-Pesa, Skin-Friendly Fabrics, Direct Support) clear and well-placed.
- **Performance optimization working as intended:** `content-visibility: auto` on below-fold sections means off-screen `innerText` reads as empty in automation. This is expected — scroll the section into view before asserting on its text, or it will look like a rendering bug.

---

## Notes for future testers

1. Prefer `scrollintoview` before reading text from below-fold sections; `content-visibility: auto` will otherwise report empty content that is genuinely rendered.
2. Never trust `localhost:3000` for this project.
3. A local `next build` succeeds despite Prisma/CMS errors — those are expected without `malaika_cms`.
4. Brand palette: the live site uses the **blue coastal palette** from commit `b48b3e84`. The gold/brown tokens documented in `Overview.md` are stale — blue is current.
