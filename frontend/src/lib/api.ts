import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

const AUTH_ENDPOINTS_WITHOUT_REFRESH = [
  '/api/accounts/token/',
  '/api/accounts/token/refresh/',
  '/api/accounts/register/',
  '/api/accounts/admin/login/',
]

const isAuthEndpoint = (url?: string) => {
  if (!url) return false
  return AUTH_ENDPOINTS_WITHOUT_REFRESH.some((path) => url.includes(path))
}

const api = axios.create({
  baseURL: API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    const shouldAttemptRefresh =
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint(originalRequest?.url)

    if (shouldAttemptRefresh) {
      originalRequest._retry = true

      try {
        await api.post('/api/accounts/token/refresh/')
        return api(originalRequest)
      } catch {
        // refresh failed; forward original 401
      }
    }

    return Promise.reject(error)
  }
)

export default api

export const handleApiError = (error: unknown, fallback = 'Request failed') => {
  const e = error as any
  return e?.response?.data?.detail || e?.response?.data?.message || fallback
}
