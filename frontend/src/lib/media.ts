const FALLBACK_API_URL = 'https://malaikanest.duckdns.org';

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  return FALLBACK_API_URL;
}

/**
 * Resolve a product/banner/category image URL from the Django backend.
 * Handles Cloudinary URLs (returned verbatim), local /media/ paths
 * (prefixed with the API origin), and bare relative paths.
 */
export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/placeholder.svg';

  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  const apiUrl = getApiUrl();

  if (imageUrl.startsWith('/media/') || imageUrl.startsWith('/uploads/')) {
    return `${apiUrl}${imageUrl}`;
  }

  if (imageUrl.startsWith('media/') || imageUrl.startsWith('uploads/')) {
    return `${apiUrl}/${imageUrl}`;
  }

  return `${apiUrl}/media/${imageUrl}`;
}

export function getBannerUrl(imageUrl: string | null | undefined): string {
  return getImageUrl(imageUrl);
}

export function getProductImageUrl(imageUrl: string | null | undefined): string {
  return getImageUrl(imageUrl);
}

export function shouldUseUnoptimizedImage(src?: string | null): boolean {
  if (!src) return false;
  const lower = src.toLowerCase();
  if (lower.startsWith('data:') || lower.startsWith('blob:')) return true;
  if (lower.startsWith('http://localhost') || lower.startsWith('http://127.0.0.1')) return true;
  return false;
}
