import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Cache configuration - durations in milliseconds
const CACHE_DURATION = {
  PRODUCTS: 5 * 60 * 1000,
  CATEGORIES: 10 * 60 * 1000,
  BANNERS: 5 * 60 * 1000,
  DEFAULT: 2 * 60 * 1000,
}

// In-memory response cache
const responseCache = new Map<string, { data: any; timestamp: number }>()

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  '/api/accounts/token/',
  '/api/accounts/token/refresh/',
  '/api/accounts/register/',
  '/api/accounts/admin/login/',
]

const CACHEABLE_ENDPOINTS = [
  '/api/products/products/',
  '/api/products/categories/',
  '/api/products/banners/',
]

const isAuthEndpoint = (url?: string) => {
  if (!url) return false
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((path) => url.includes(path))
}

const isCacheableEndpoint = (url?: string) => {
  if (!url) return false
  return CACHEABLE_ENDPOINTS.some((path) => url.includes(path))
}

const getCacheDuration = (url: string): number => {
  if (url.includes('/products/products')) return CACHE_DURATION.PRODUCTS
  if (url.includes('/categories')) return CACHE_DURATION.CATEGORIES
  if (url.includes('/banners')) return CACHE_DURATION.BANNERS
  return CACHE_DURATION.DEFAULT
}

const getCacheKey = (method: string, url: string, params?: any, data?: any): string => {
  return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`
}

const hasClientSessionHint = (): boolean => {
  if (typeof window === 'undefined') return false
  return !!(localStorage.getItem('malaika_user_v1') || localStorage.getItem('malaika_token'))
}

// Exponential backoff retry
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> => {
  try {
    return await fn()
  } catch (error: any) {
    if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
      throw error
    }
    if (retries > 0) {
      await sleep(delay)
      return retryWithBackoff(fn, retries - 1, delay * 2)
    }
    throw error
  }
}

const api = axios.create({
  baseURL: API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor
api.interceptors.request.use((config) => {
  (config as any).metadata = { startTime: Date.now() }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }

  // Add JWT token from localStorage if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('malaika_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

// Response interceptor with caching and retry
api.interceptors.response.use(
  (response) => {
    const payload = response.data;
    const isStandardEnvelope =
      payload &&
      typeof payload === 'object' &&
      'success' in payload &&
      'data' in payload &&
      'error' in payload;

    if (isStandardEnvelope) {
      const inner = payload.data;

      // Paginated response: preserve {count, next, previous, results} shape
      // so components can read res.data.results / res.data.count
      const isPaginated =
        inner &&
        typeof inner === 'object' &&
        !Array.isArray(inner) &&
        'results' in inner &&
        'count' in inner;

      if (isPaginated) {
        response.data = inner; // {count, next, previous, results}
      } else if (Array.isArray(inner)) {
        response.data = inner; // bare array
      } else if (inner !== null && typeof inner === 'object') {
        // merge envelope-level fields: success, message, error remain accessible
        response.data = {
          success: payload.success,
          message: payload.message,
          error: payload.error,
          ...inner,
        };
      } else {
        // null or primitive
        response.data = inner ?? null;
      }
    }

    const cacheKey = getCacheKey(response.config.method || 'GET', response.config.url || '', response.config.params, response.config.data)

    if (response.config.method === 'GET' && isCacheableEndpoint(response.config.url)) {
      responseCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      })
    }

    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; metadata?: { startTime: number } }

    if (originalRequest?.metadata?.startTime) {
      const duration = Date.now() - originalRequest.metadata.startTime
      // console.log intentionally removed for production security
    }

    const shouldRetry = !originalRequest?._retry && (
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      (error.response?.status !== undefined && error.response.status >= 500) ||
      error.response?.status === 429
    )

    if (shouldRetry && originalRequest) {
      originalRequest._retry = true
      return retryWithBackoff(() => api(originalRequest))
    }

    const shouldAttemptRefresh = error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint(originalRequest?.url) &&
      hasClientSessionHint()

    if (shouldAttemptRefresh) {
      originalRequest._retry = true
      try {
        await api.post('/api/accounts/token/refresh/')
        return api(originalRequest)
      } catch {
        // refresh failed
      }
    }

    return Promise.reject(error)
  }
)

// Enhanced GET with caching support
export const apiGet = async <T>(
  url: string,
  options?: {
    params?: Record<string, any>
    useCache?: boolean
    cacheDuration?: number
  }
): Promise<T> => {
  const { params, useCache = true, cacheDuration } = options || {}

  if (useCache) {
    const cacheKey = getCacheKey('GET', url, params)
    const cached = responseCache.get(cacheKey)
    if (cached) {
      const duration = cacheDuration || getCacheDuration(url)
      if (Date.now() - cached.timestamp < duration) {
        return cached.data as T
      }
    }
  }

  const response = await api.get<T>(url, { params })

  if (useCache && isCacheableEndpoint(url)) {
    const cacheKey = getCacheKey('GET', url, params)
    responseCache.set(cacheKey, { data: response.data, timestamp: Date.now() })
  }

  return response.data
}

// Clear cache utilities
export const clearCache = (urlPattern?: string) => {
  if (urlPattern) {
    for (const key of responseCache.keys()) {
      if (key.includes(urlPattern)) responseCache.delete(key)
    }
  } else {
    responseCache.clear()
  }
}

export default api

// Enhanced error handler
export const handleApiError = (error: unknown, fallback = 'An error occurred. Please try again.') => {
  const e = error as any

  if (e.code === 'ECONNABORTED') return 'Request timed out. Please check your connection.'
  if (e.code === 'ERR_NETWORK') return 'Network error. Please check your internet connection.'
  if (e.response?.status === 401) return 'Session expired. Please log in again.'
  if (e.response?.status === 403) return 'You do not have permission.'
  if (e.response?.status === 404) return 'Resource not found.'
  if (e.response?.status === 429) return 'Too many requests. Please wait and try again.'
  if (e.response?.status >= 500) return 'Server error. We are working on it.'

  const detail = e?.response?.data?.detail
  const message = e?.response?.data?.message
  if (detail) return Array.isArray(detail) ? detail[0] : detail
  if (message) return message

  return fallback
}

export const isValidResponse = (data: any): boolean => {
  return data !== null && data !== undefined && (typeof data === 'object' ? Object.keys(data).length > 0 : true)
}


