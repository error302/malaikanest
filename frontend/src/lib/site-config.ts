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
 */
export function getApiBaseUrl(): string {
  if (process.env.INTERNAL_API_URL) return process.env.INTERNAL_API_URL;
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (url.includes('localhost') || url.includes('127.0.0.1')) return url;
  }
  if (process.env.NODE_ENV === 'development') return 'http://localhost:8000';
  return 'https://api.malaikanest.com';
}
