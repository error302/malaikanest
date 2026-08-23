/*
 * Malaika Nest — PWA-lite service worker.
 *
 * Strategy:
 *   - /_next/static/* and same-origin static assets  -> cache-first (immutable/versioned)
 *   - Page navigations                               -> network-first, fall back to cache,
 *                                                      then the precached /offline page
 *   - Auth/cart/checkout/account/admin/api navigations -> NETWORK ONLY (never cached)
 *   - Cross-origin requests (Cloudinary, analytics)  -> untouched
 */
const VERSION = "v2";
const STATIC_CACHE = `mn-static-${VERSION}`;
const PAGES_CACHE = `mn-pages-${VERSION}`;
const OFFLINE_URL = "/offline";

// Navigations to these paths must always hit the network — never serve or
// update a cached copy for anything sensitive, personal, or money-related.
const NETWORK_ONLY_NAVIGATION = new RegExp(
  "^/(api|admin|login|register|forgot-password|reset-password|account|checkout|cart|wishlist|track)(/|$)"
);

const STATIC_ASSET_EXTENSIONS = /\.(css|js|mjs|woff2?|ttf|otf|png|jpe?g|webp|avif|gif|svg|ico)$/i;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Sweep EVERYTHING on activation: HTML pages must never survive a
      // deploy (stale pages reference old _rsc payloads and chunks, which
      // renders broken/empty views), and static assets re-cache on demand
      // anyway (their HTTP headers are immutable, so the browser cache
      // absorbs the cost). This makes every deploy self-healing for
      // returning visitors, including stale installs from older versions.
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith("mn-")).map((name) => caches.delete(name))
      );
      const cache = await caches.open(STATIC_CACHE);
      await cache.add(OFFLINE_URL).catch(() => {});
      await self.clients.claim();
    })()
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === "basic") {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request, { ignoreSearch: false });
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Never touch cross-origin traffic (Cloudinary, GA, etc.).
  if (url.origin !== self.location.origin) return;

  // Immutable build assets + same-origin static files: cache-first.
  if (
    url.pathname.startsWith("/_next/static/") ||
    (!url.pathname.startsWith("/api/") &&
      !url.pathname.startsWith("/_next/image") &&
      STATIC_ASSET_EXTENSIONS.test(url.pathname))
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Page navigations: network-first with offline fallback; sensitive routes
  // are excluded above so they remain strictly network-only.
  if (request.mode === "navigate") {
    if (NETWORK_ONLY_NAVIGATION.test(url.pathname)) return;
    event.respondWith(networkFirstPage(request));
  }
});
