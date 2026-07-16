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
