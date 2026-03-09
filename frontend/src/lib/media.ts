export function shouldUseUnoptimizedImage(src?: string | null) {
  if (!src) return false
  return src.startsWith('/media/') || src.includes('/media/')
}
