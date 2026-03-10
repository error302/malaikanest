const FALLBACK_API_URL = 'https://malaikanest.duckdns.org'

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (typeof window !== 'undefined') return window.location.origin
  return FALLBACK_API_URL
}

export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/images/placeholder.png'

  // Already a full URL (Cloudinary or external)
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }

  const apiUrl = getApiUrl()

  // Local media path - prepend API URL
  if (imageUrl.startsWith('/media/') || imageUrl.startsWith('/uploads/')) {
    return `${apiUrl}${imageUrl}`
  }

  // Handle relative paths
  if (imageUrl.startsWith('media/') || imageUrl.startsWith('uploads/')) {
    return `${apiUrl}/${imageUrl}`
  }

  // Default: treat as relative path
  return `${apiUrl}/media/${imageUrl}`
}

export function getBannerUrl(imageUrl: string | null | undefined): string {
  return getImageUrl(imageUrl)
}

export function getProductImageUrl(imageUrl: string | null | undefined): string {
  return getImageUrl(imageUrl)
}

export function shouldUseUnoptimizedImage(src?: string | null): boolean {
  if (!src) return false
  // Use unoptimized for external URLs (Cloudinary, CDN)
  return src.startsWith('http') || src.includes('cloudinary')
}
