# Performance Baseline — Mobile

> **Measured:** 2026-08-23 · **URL:** https://malaikanest.com (production, pre-optimization)
> **Tool:** Lighthouse 12 (`npx lighthouse`), form factor mobile, default throttling =
> **Slow 4G** (150ms RTT, 1.6 Mbps down / 750 Kbps up, 4× CPU slowdown)
> **Raw reports:** `docs/perf/baseline-2026-08-23.report.{json,html}`

## Core Web Vitals & metrics

| Metric | Value | Target | Status |
|---|---|---|---|
| **Performance score** | **58** | ≥ 90 | 🔴 |
| **LCP** | **7 869 ms** | ≤ 2 500 ms | 🔴 |
| **CLS** | **0.001** | ≤ 0.1 | 🟢 excellent |
| **TBT** | 353 ms | ≤ 200 ms | 🟡 |
| FCP | 3 011 ms | ≤ 1 800 ms | 🔴 |
| Speed Index | 5 599 ms | ≤ 3 400 ms | 🔴 |
| TTFB | 424 ms | ≤ 800 ms | 🟢 |

## Top opportunities (from report)

| Audit | Est. savings |
|---|---|
| Unused JavaScript | ~600 ms |
| Server response time (home is `force-dynamic`) | ~324 ms |

CLS is already excellent (skeletons + letter-avatar fallbacks working). The story of this
baseline is **LCP**: on Slow 4G, the `force-dynamic` home page plus hero payload pushes first
meaningful paint past 7s.

## Changes shipped 2026-08-23 (awaiting deploy)

1. PWA-lite service worker (`public/sw.js`): cache-first immutable assets,
   network-first navigations with `/offline` fallback, auth/cart/checkout/admin/api
   strictly network-only.
2. Offline fallback page (`/offline`) + registration component (prod-only).
3. Speculation Rules via `Speculation-Rules` response header → document prefetch of
   `/products/*` and `/categories*` on pointerdown/hover ("conservative") so taps feel instant.

## Next lever (highest expected LCP win)

Home page `force-dynamic` → ISR (`revalidate: 60`). Not yet applied — needs a product-data
freshness decision from the owner. On this baseline it should cut TTFB-to-edge and most of
the LCP gap.

## How to re-measure after deploying

```bash
npx lighthouse https://malaikanest.com --only-categories=performance \
  --formFactor=mobile --screenEmulation.mobile --chrome-flags="--headless=new" \
  --output=json --output=html --output-path="docs/perf/post-sw-$(date +%F)"
```

Compare against the table above; aim: score ≥ 75 pre-ISR, ≥ 90 post-ISR.
