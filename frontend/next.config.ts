import type { NextConfig } from "next";
import path from "path";

// Redirect every `lucide-react` import to the Phosphor-backed compat shim so the
// whole site uses the richer icon set without editing each import site.
const iconShimTs = path.resolve(__dirname, "src/lib/icons.tsx");

// CSP uses a per-request nonce. `middleware.ts` replaces `${NONCE} ` with the
// actual base64 nonce value for every request, then sets the CSP header on the
// response. The literal `${NONCE}` here is a placeholder that middleware fills in.
// Until middleware runs, this default CSP (with 'unsafe-inline' fallback for
// style-src) is what gets applied by Next's headers() — middleware overrides.
const NONCE_PLACEHOLDER = "${NONCE}";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'nonce-${NONCE_PLACEHOLDER}' 'strict-dynamic' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://static.cloudflareinsights.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https: http://localhost http://127.0.0.1;
  font-src 'self' data: https://fonts.gstatic.com;
  frame-src 'self' https://www.google.com https://www.youtube.com;
  connect-src 'self' https://malaikanest.com https://api.malaikanest.com https://www.malaikanest.com https://res.cloudinary.com https://www.google-analytics.com https://region1.google-analytics.com https://cloudflareinsights.com https://static.cloudflareinsights.com;
  media-src 'self' https:;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  worker-src 'self';
  manifest-src 'self';
`.replace(/\n/g, "").trim();

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // X-XSS-Protection intentionally omitted: deprecated and harmful on modern browsers.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=()' },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

const cacheHeaders = [
  {
    source: '/_next/static/:path*',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=31536500, immutable' },
    ],
  },
  {
    source: '/(favicon.ico|favicon-16x16.png|favicon-32x32.png|favicon-48x48.png|apple-touch-icon.png|android-chrome-192x192.png|android-chrome-512x512.png|mstile-150x150.png|site.webmanifest|manifest.webmanifest|logo-og.png|logo-social.png|logo.svg|icon-192.png|icon-512.png)',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
    ],
  },
  {
    source: '/.well-known/:path*',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
    ],
  },
  {
    source: '/images/:path*',
    headers: [
      { key: 'Cache-Control', value: 'public, max-age=2592000, immutable' },
    ],
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: false },
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ["lucide-react", "@phosphor-icons/react", "framer-motion", "recharts"],
  },
  turbopack: {
    root: __dirname,
    resolveAlias: {
      "lucide-react": "./src/lib/icons.tsx",
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "lucide-react": iconShimTs,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      ...cacheHeaders,
    ];
  },
  async redirects() {
    return [
      // Trailing slash normalization (SEO: avoid duplicate URLs)
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
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default nextConfig;
