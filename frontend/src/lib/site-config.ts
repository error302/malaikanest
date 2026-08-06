/**
 * Central site configuration.
 *
 * The canonical production domain is defined in ONE place. Everywhere else
 * (metadata, sitemap, robots, JSON-LD, social sharing) imports SITE_URL so we
 * never accidentally publish the wrong origin and split SEO signals.
 *
 * Override at build/run time with NEXT_PUBLIC_SITE_URL (set in docker-compose
 * and the production environment). Defaults to the live domain.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://malaikanest.com';

export const SITE_NAME = 'Malaika Nest';

export const SITE_DOMAIN = (() => {
  try {
    return new URL(SITE_URL).hostname;
  } catch {
    return 'malaikanest.com';
  }
})();

/**
 * Resolve the absolute API base URL for server-side fetches.
 * - Production: uses https://api.malaikanest.com
 * - Docker: uses internal bridge network via INTERNAL_API_URL
 * - Local: uses localhost
 *
 * Also works in the browser: never lets a deployed (non-localhost) page point
 * its client-side calls at a localhost API — that was a production bug where a
 * mis-configured NEXT_PUBLIC_API_URL caused every cart/category/product client
 * request to be blocked by CSP as http://localhost:8000.
 */
export function getApiBaseUrl(): string {
  // ---- Server-side fetches (SSR / ISR / route handlers) ----
  if (typeof window === 'undefined') {
    if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;
    if (process.env.NEXT_PUBLIC_API_URL) {
      const url = process.env.NEXT_PUBLIC_API_URL;
      if (url.includes('localhost') || url.includes('127.0.0.1')) return url;
    }
    if (process.env.NODE_ENV === 'development') return 'http://localhost:8000';
    return 'https://api.malaikanest.com';
  }

  // ---- Browser context ----
  const origin = window.location.origin;
  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return '';
  }
  const onLocalhost = ['localhost', '127.0.0.1'].includes(originUrl.hostname);

  // Local development against a local Django API on :8000.
  if (onLocalhost) return `${originUrl.protocol}//${originUrl.hostname}:8000`;

  const isLocalhostUrl = (u: string) => u.includes('localhost') || u.includes('127.0.0.1');

  // On a real domain, a localhost-configured URL is a misconfiguration — fall
  // back to the canonical production API.
  if (process.env.NEXT_PUBLIC_API_URL && isLocalhostUrl(process.env.NEXT_PUBLIC_API_URL)) {
    return 'https://api.malaikanest.com';
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
      const apiHost = apiUrl.hostname.replace(/^www\./i, '').toLowerCase();
      const pageHost = originUrl.hostname.replace(/^www\./i, '').toLowerCase();
      const apiPort = apiUrl.port || (apiUrl.protocol === 'https:' ? '443' : '80');
      const pagePort = originUrl.port || (originUrl.protocol === 'https:' ? '443' : '80');
      // Same-origin → use relative /api/v1/... (CDN/cache friendly).
      if (apiHost === pageHost && apiPort === pagePort && apiUrl.protocol === originUrl.protocol) {
        return '';
      }
      return process.env.NEXT_PUBLIC_API_URL;
    } catch {
      return 'https://api.malaikanest.com';
    }
  }

  // No NEXT_PUBLIC_API_URL configured → assume same-origin proxying.
  return '';
}
