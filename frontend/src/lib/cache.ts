/**
 * Simple client-side caching utility
 * Provides in-memory and localStorage caching for API responses
 */

type CacheEntry<T> = {
  data: T
  timestamp: number
  expiresAt: number
}

class Cache {
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map()
  private defaultTTL: number // milliseconds

  constructor(defaultTTLMinutes: number = 15) {
    this.defaultTTL = defaultTTLMinutes * 60 * 1000
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key)
    if (memEntry && memEntry.expiresAt > Date.now()) {
      return memEntry.data as T
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored)
        if (entry.expiresAt > Date.now()) {
          // Restore to memory cache
          this.memoryCache.set(key, entry)
          return entry.data
        }
        // Expired - remove
        localStorage.removeItem(`cache_${key}`)
      }
    } catch (e) {
      console.warn('Cache read error:', e)
    }

    return null
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt
    }

    // Store in memory
    this.memoryCache.set(key, entry)

    // Store in localStorage (except for very large data)
    try {
      if (JSON.stringify(data).length < 500000) { // < 500KB
        localStorage.setItem(`cache_${key}`, JSON.stringify(entry))
      }
    } catch (e) {
      console.warn('Cache write error:', e)
    }
  }

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    this.memoryCache.delete(key)
    try {
      localStorage.removeItem(`cache_${key}`)
    } catch (e) {
      console.warn('Cache remove error:', e)
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.memoryCache.clear()
    try {
      const keys = Object.keys(localStorage)
      keys.forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key)
        }
      })
    } catch (e) {
      console.warn('Cache clear error:', e)
    }
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }
}

// Export singleton instance
export const cache = new Cache(15) // 15 minutes default

// Legacy export aliases for backward compatibility
export const getCachedData = <T>(key: string): T | null => cache.get<T>(key)
export const setCachedData = <T>(key: string, data: T, ttl?: number): void => cache.set<T>(key, data, ttl)

// Helper functions for common caching patterns
export const cacheApiResponse = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  // Check cache first
  const cached = cache.get<T>(key)
  if (cached) {
    return cached
  }

  // Fetch fresh data
  const data = await fetchFn()
  
  // Store in cache
  cache.set(key, data, ttl)
  
  return data
}

// Cache keys generator
export const cacheKeys = {
  categories: 'categories_list',
  products: (page: number, category?: string) => `products_page_${page}_${category || 'all'}`,
  product: (slug: string) => `product_${slug}`,
  user: 'user_profile',
}
