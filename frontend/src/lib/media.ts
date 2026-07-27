const FALLBACK_API_URL = 'https://api.malaikanest.com';

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  return FALLBACK_API_URL;
}

/**
 * Resolve a product/banner/category image URL from the Django backend.
 *
 * Rules:
 *  - Cloudinary URLs: inject f_auto,q_auto ONCE (idempotent) and return.
 *    Cloudinary's CDN is already global – do NOT re-route through Next.js
 *    image optimizer (use unoptimized={true} on the <Image> component).
 *  - /media/ or relative paths: prefix with backend API origin.
 *  - Everything else: return as-is.
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/placeholder.svg';

  // ── 1. Already an absolute URL ───────────────────────────────────────────
  if (imageUrl.startsWith('http')) {
    if (imageUrl.includes('res.cloudinary.com')) {
      return optimizeCloudinaryUrl(imageUrl);
    }
    return imageUrl;
  }

  // ── 2. Relative path → prefix with backend origin ────────────────────────
  const apiUrl = getApiUrl();
  let finalUrl: string;
  if (imageUrl.startsWith('/media/') || imageUrl.startsWith('/uploads/')) {
    finalUrl = `${apiUrl}${imageUrl}`;
  } else if (imageUrl.startsWith('media/') || imageUrl.startsWith('uploads/')) {
    finalUrl = `${apiUrl}/${imageUrl}`;
  } else {
    finalUrl = `${apiUrl}/media/${imageUrl}`;
  }

  if (finalUrl.includes('res.cloudinary.com')) {
    return optimizeCloudinaryUrl(finalUrl);
  }
  return finalUrl;
}

/**
 * Insert f_auto,q_auto into a Cloudinary URL exactly once.
 * Safe to call multiple times — idempotent.
 */
function optimizeCloudinaryUrl(url: string): string {
  if (!url.includes('/upload/')) return url;
  const [before, after] = url.split('/upload/');
  // Already has transformation prefix — return as-is
  if (/^[a-z_,]+\//.test(after)) return url;
  return `${before}/upload/f_auto,q_auto/${after}`;
}

export function getBannerUrl(imageUrl: string | null | undefined): string {
  return getImageUrl(imageUrl);
}

export function getProductImageUrl(imageUrl: string | null | undefined): string {
  return getImageUrl(imageUrl);
}

/**
 * Returns true when the <Image> component should bypass Next.js optimizer.
 * Cloudinary URLs are already globally distributed — no double-optimization needed.
 */
export function shouldUseUnoptimizedImage(src?: string | null): boolean {
  if (!src) return false;
  const lower = src.toLowerCase();
  if (lower.startsWith('data:') || lower.startsWith('blob:')) return true;
  if (lower.startsWith('http://localhost') || lower.startsWith('http://127.0.0.1')) return true;
  if (lower.includes('res.cloudinary.com')) return true;
  return false;
}
