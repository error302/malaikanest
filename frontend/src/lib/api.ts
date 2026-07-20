import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './authToken';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const CACHE_DURATION = {
  PRODUCTS: 5 * 60 * 1000,
  CATEGORIES: 10 * 60 * 1000,
  BANNERS: 5 * 60 * 1000,
  DEFAULT: 2 * 60 * 1000,
};

const responseCache = new Map<string, { data: any; timestamp: number }>();

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  '/api/v1/accounts/token/',
  '/api/v1/accounts/token/refresh/',
  '/api/v1/accounts/register/',
  '/api/v1/accounts/admin/login/',
  '/api/v1/accounts/profile/',
  '/api/accounts/token/',
  '/api/accounts/token/refresh/',
  '/api/accounts/register/',
  '/api/accounts/admin/login/',
  '/api/accounts/profile/',
];

const CACHEABLE_ENDPOINTS = [
  '/api/v1/products/products/',
  '/api/v1/products/categories/',
  '/api/v1/products/banners/',
  '/api/products/products/',
  '/api/products/categories/',
  '/api/products/banners/',
];

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((path) => url.includes(path));
};

const isCacheableEndpoint = (url?: string) => {
  if (!url) return false;
  return CACHEABLE_ENDPOINTS.some((path) => url.includes(path));
};

const getCacheDuration = (url: string): number => {
  if (url.includes('/products/products')) return CACHE_DURATION.PRODUCTS;
  if (url.includes('/categories')) return CACHE_DURATION.CATEGORIES;
  if (url.includes('/banners')) return CACHE_DURATION.BANNERS;
  return CACHE_DURATION.DEFAULT;
};

const getCacheKey = (method: string, url: string, params?: any, data?: any): string => {
  return `${method}:${url}:${JSON.stringify(params)}:${JSON.stringify(data)}`;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
      throw error;
    }
    if (retries > 0) {
      await sleep(delay);
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

const normalizeHost = (host: string) => host.replace(/^www\./i, '').toLowerCase();
const getEffectivePort = (url: URL) => {
  if (url.port) return url.port;
  if (url.protocol === 'https:') return '443';
  if (url.protocol === 'http:') return '80';
  return '';
};

const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const pageUrl = new URL(origin);

    if (!API_URL) {
      if (['localhost', '127.0.0.1'].includes(pageUrl.hostname)) {
        return `${pageUrl.protocol}//${pageUrl.hostname}:8000`;
      }
      return '';
    }

    try {
      const apiUrl = new URL(API_URL);
      const apiOrigin = apiUrl.origin;
      const apiHost = normalizeHost(apiUrl.hostname);
      const pageHost = normalizeHost(pageUrl.hostname);
      const apiPort = getEffectivePort(apiUrl);
      const pagePort = getEffectivePort(pageUrl);

      if (apiHost === pageHost && apiPort === pagePort && apiUrl.protocol === pageUrl.protocol) {
        return '';
      }

      if (apiOrigin !== origin) return API_URL;
    } catch {
      return '';
    }

    return '';
  }

  return API_URL || '';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: any) => void; reject: (error?: any) => void }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  (config as any).metadata = { startTime: Date.now() };

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

const isApiEnvelope = (payload: unknown): payload is Record<string, any> => {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  return (
    'data' in payload &&
    ('success' in payload || 'status' in payload || 'error' in payload || 'message' in payload)
  );
};

api.interceptors.response.use(
  (response) => {
    const payload = response.data;

    if (isApiEnvelope(payload)) {
      const inner = payload.data;

      const isCountPaginated =
        inner &&
        typeof inner === 'object' &&
        !Array.isArray(inner) &&
        'results' in inner &&
        'count' in inner;

      const isMetaPaginated =
        inner &&
        typeof inner === 'object' &&
        !Array.isArray(inner) &&
        'results' in inner &&
        'meta' in inner &&
        inner.meta &&
        typeof inner.meta === 'object';

      if (isCountPaginated) {
        response.data = inner;
      } else if (isMetaPaginated) {
        response.data = {
          ...inner,
          count: (inner.meta as any).count ?? 0,
          next: (inner.meta as any).next ?? null,
          previous: (inner.meta as any).previous ?? null,
        };
      } else if (Array.isArray(inner)) {
        response.data = inner;
      } else if (inner !== null && typeof inner === 'object') {
        response.data = {
          success: payload.success ?? payload.status === 'success',
          status: payload.status,
          message: payload.message,
          error: payload.error,
          ...inner,
        };
      } else {
        response.data = inner ?? null;
      }
    }

    const cacheKey = getCacheKey(
      response.config.method || 'GET',
      response.config.url || '',
      response.config.params,
      response.config.data
    );

    if (response.config.method === 'GET' && isCacheableEndpoint(response.config.url)) {
      responseCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
      if (responseCache.size > 100) {
        const oldestKey = responseCache.keys().next().value;
        if (oldestKey !== undefined) responseCache.delete(oldestKey);
      }
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      metadata?: { startTime: number };
    };

    const shouldRetry = !originalRequest?._retry && (
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      (error.response?.status !== undefined && error.response.status >= 500) ||
      error.response?.status === 429
    );

    if (shouldRetry && originalRequest) {
      originalRequest._retry = true;
      return retryWithBackoff(() => api(originalRequest));
    }

    if (error.response?.status === 401 && originalRequest?.headers?.['X-No-Auth-Redirect']) {
      return Promise.reject(error);
    }

    const shouldAttemptRefresh =
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint(originalRequest?.url);

    if (shouldAttemptRefresh && originalRequest) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshRes = await api.post('/api/v1/accounts/token/refresh/');
        const newAccess = (refreshRes.data as any)?.access;
        if (newAccess) setAccessToken(newAccess);
        processQueue(null);
        isRefreshing = false;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        isRefreshing = false;
        clearAccessToken();
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register') &&
          !window.location.pathname.includes('/forgot-password')
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const apiGet = async <T>(
  url: string,
  options?: {
    params?: Record<string, any>;
    useCache?: boolean;
    cacheDuration?: number;
  }
): Promise<T> => {
  const { params, useCache = true, cacheDuration } = options || {};

  if (useCache) {
    const cacheKey = getCacheKey('GET', url, params);
    const cached = responseCache.get(cacheKey);
    if (cached) {
      const duration = cacheDuration || getCacheDuration(url);
      if (Date.now() - cached.timestamp < duration) {
        return cached.data as T;
      }
    }
  }

  const response = await api.get<T>(url, { params });

  if (useCache && isCacheableEndpoint(url)) {
    const cacheKey = getCacheKey('GET', url, params);
    responseCache.set(cacheKey, { data: response.data, timestamp: Date.now() });
  }

  return response.data;
};

export const clearCache = (urlPattern?: string) => {
  if (urlPattern) {
    for (const key of responseCache.keys()) {
      if (key.includes(urlPattern)) responseCache.delete(key);
    }
  } else {
    responseCache.clear();
  }
};

export default api;

export const handleApiError = (error: unknown, fallback = 'An error occurred. Please try again.') => {
  const e = error as any;
  const responseData = e?.response?.data;

  const standardizedMessage = responseData?.error?.message;
  if (standardizedMessage) return standardizedMessage;

  const standardizedDetail = responseData?.error?.detail;
  if (standardizedDetail) {
    if (typeof standardizedDetail === 'string') return standardizedDetail;
    if (typeof standardizedDetail === 'object') {
      const nested = standardizedDetail.detail || standardizedDetail.message;
      if (nested) return Array.isArray(nested) ? nested[0] : String(nested);
      try {
        return JSON.stringify(standardizedDetail);
      } catch {
        return fallback;
      }
    }
  }

  const detail = responseData?.detail;
  const message = responseData?.message;
  if (detail) return Array.isArray(detail) ? detail[0] : detail;
  if (message) return message;

  if (e.code === 'ECONNABORTED') return 'Request timed out. Please check your connection.';
  if (e.code === 'ERR_NETWORK') return 'Network error. Please check your internet connection.';
  if (e.response?.status === 401) return 'Session expired. Please log in again.';
  if (e.response?.status === 403) return 'You do not have permission.';
  if (e.response?.status === 404) return 'Resource not found.';
  if (e.response?.status === 429) return 'Too many requests. Please wait and try again.';
  if (e.response?.status >= 500) return 'Server error. We are working on it.';

  return fallback;
};

export const extractApiError = handleApiError;

export const isValidResponse = (data: any): boolean => {
  return data !== null && data !== undefined && (typeof data === 'object' ? Object.keys(data).length > 0 : true);
};
