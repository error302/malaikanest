import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { clearAccessToken, getAccessToken, setAccessToken } from './authToken';
import { getApiBaseUrl } from '@/lib/site-config';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  '/api/v1/accounts/token/',
  '/api/v1/accounts/token/refresh/',
  '/api/v1/accounts/register/',
  '/api/v1/accounts/admin/login/',
  '/api/accounts/token/',
  '/api/accounts/token/refresh/',
  '/api/accounts/register/',
  '/api/accounts/admin/login/',
  // NOTE: /accounts/profile/ is deliberately NOT listed — a 401 on profile
  // (e.g. the account page firing before the bootstrap refresh lands) must
  // go through the single-flight refresh + replay, otherwise users get
  // bounced to /login right after a successful login.
];

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((path) => url.includes(path));
};

// Only auto-retry requests that are safe to repeat. Retrying a POST after a
// timeout/5xx can double-submit orders or fire duplicate M-Pesa STK pushes,
// because the server may already have processed the first attempt.
const IDEMPOTENT_METHODS = new Set(['get', 'head', 'options']);

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

const api = axios.create({
  baseURL: getApiBaseUrl(),
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
    } else {
      prom.resolve();
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

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
      metadata?: { startTime: number };
    };

    const isIdempotent = IDEMPOTENT_METHODS.has((originalRequest?.method || 'get').toLowerCase());
    const shouldRetry = isIdempotent && !originalRequest?._retry && (
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

export const getPaymentStatusByCheckoutId = async (checkoutRequestId: string): Promise<{
  checkout_request_id: string;
  status: 'initiated' | 'completed' | 'failed' | string;
  mpesa_receipt_number?: string;
}> => {
  const response = await api.get(`/api/v1/payments/verify/${checkoutRequestId}/`);
  return response.data;
};
