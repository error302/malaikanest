import { NextRequest, NextResponse } from "next/server";

// Generate a per-request nonce and inject it into the Content-Security-Policy
// header. The CSP in next.config.ts uses 'nonce-${nonce}' with strict-dynamic so
// that only scripts marked with the nonce (and any scripts those scripts load)
// are allowed to execute. This eliminates the need for 'unsafe-inline' in
// script-src without breaking Next.js's own inline scripts.
//
// We also set X-Frame-Options, HSTS, etc. here so they cover all routes —
// including routes that match the matcher but not the headers() config.

const buildCsp = (nonce: string): string =>
  [
    "default-src 'self'",
    // Nonce-based CSP is incompatible with cached HTML (ISR/prerendered pages
    // bake one nonce while the header mints another per request — scripts get
    // blocked en masse). 'unsafe-inline' + an explicit host allowlist keeps
    // third-party script sources locked down while working across all caching
    // modes. Do not re-add 'strict-dynamic' or nonces without removing ISR.
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https: http://localhost http://127.0.0.1",
    "font-src 'self' data: https://fonts.gstatic.com",
    "frame-src 'self' https://www.google.com https://www.youtube.com",
    "connect-src 'self' https://malaikanest.com https://api.malaikanest.com https://www.malaikanest.com https://res.cloudinary.com https://www.google-analytics.com https://region1.google-analytics.com https://cloudflareinsights.com https://static.cloudflareinsights.com",
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
  ]
    .flat()
    .join("; ");

export function middleware(request: NextRequest) {
  // The nonce parameter is retained for future nonce-based hardening but is
  // not used by the current script-src directive (see buildCsp above).
  const nonce = btoa(crypto.randomUUID()).replace(/=/g, "");
  const csp = buildCsp(nonce);

  // Attach nonce to the request so downstream handlers (e.g. RSC) can read it
  // from headers and mark scripts with `<Script nonce={...} />`.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), browsing-topics=()"
  );

  return response;
}

// Match all routes EXCEPT static assets, API, and Next internals. These
// exclusions keep middleware fast (it doesn't run on every static asset hit).
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|icon.png|icon-192.png|icon-512.png|manifest.webmanifest).*)"],
};
