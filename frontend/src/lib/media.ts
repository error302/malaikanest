const FALLBACK_API_URL = 'https://api.malaikanest.com';

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

  let finalUrl = imageUrl;

  if (!imageUrl.startsWith('http')) {
    const apiUrl = getApiUrl();
    if (imageUrl.startsWith('/media/') || imageUrl.startsWith('/uploads/')) {
      finalUrl = `${apiUrl}${imageUrl}`;
    } else if (imageUrl.startsWith('media/') || imageUrl.startsWith('uploads/')) {
      finalUrl = `${apiUrl}/${imageUrl}`;
    } else {
      finalUrl = `${apiUrl}/media/${imageUrl}`;
    }
  }

  // Optimize Cloudinary URLs if detected
  if (finalUrl.includes('res.cloudinary.com')) {
    // If it doesn't already have transformations, inject auto format and quality
    if (!finalUrl.includes('/upload/')) return finalUrl;

    const parts = finalUrl.split('/upload/');
    // If it has transformations (e.g. /upload/c_fill,w_300/v123/...), we append our defaults
    if (parts[1].includes('/') && !parts[1].startsWith('v')) {
       // Keep existing transformations but add auto format/quality
       return `${parts[0]}/upload/f_auto,q_auto,${parts[1]}`;
    }
    // No transformations, just inject them
    return `${parts[0]}/upload/f_auto,q_auto/${parts[1]}`;
  }

  return finalUrl;
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
