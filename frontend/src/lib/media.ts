const FALLBACK_API_URL = 'https://malaikanest.duckdns.org'

function getApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL
  if (typeof window !== 'undefined') return window.location.origin
  return FALLBACK_API_URL
}

export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/placeholder.svg'

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
  // Prefer Next.js optimization for Cloudinary and well-known CDNs.
  // Use unoptimized only for localhost or non-http(s) sources.
  const lower = src.toLowerCase()
  if (lower.startsWith('data:') || lower.startsWith('blob:')) return true
  if (lower.startsWith('http://localhost') || lower.startsWith('http://127.0.0.1')) return true
  return false
}
