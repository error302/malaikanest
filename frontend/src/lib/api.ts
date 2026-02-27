import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || ''

// If no API URL is configured, use demo mode
const IS_DEMO_MODE = !API_URL || API_URL === ''

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  // Timeout for demo mode
  timeout: IS_DEMO_MODE ? 100 : 30000,
})

// Handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // In demo mode, silently fail for data calls
    if (IS_DEMO_MODE) {
      console.log('Demo mode: API not available')
      return Promise.reject(new Error('Demo mode - API not configured'))
    }
    
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        await api.post('/api/accounts/token/refresh/')
        return api(originalRequest)
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export { IS_DEMO_MODE }
export default api
