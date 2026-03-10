const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://malaikanest.duckdns.org'

export function getImageUrl(imageUrl: string | null | undefined): string {
  if (!imageUrl) return '/images/placeholder.png'
  
  // Already a full URL (Cloudinary or external)
  if (imageUrl.startsWith('http')) {
    return imageUrl
  }
  
  // Local media path - prepend API URL
  if (imageUrl.startsWith('/media/') || imageUrl.startsWith('/uploads/')) {
    return `${API_URL}${imageUrl}`
  }
  
  // Handle relative paths
  if (imageUrl.startsWith('media/') || imageUrl.startsWith('uploads/')) {
    return `${API_URL}/${imageUrl}`
  }
  
  // Default: treat as relative path
  return `${API_URL}/media/${imageUrl}`
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
