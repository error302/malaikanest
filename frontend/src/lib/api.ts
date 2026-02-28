import axios, { AxiosError, AxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Validate API_URL is configured
if (!API_URL) {
  console.error('CRITICAL: NEXT_PUBLIC_API_URL is not configured! Please set it in your Vercel project settings.')
}

const api = axios.create({
  baseURL: API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Handle errors gracefully
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Check if API_URL is not configured
    if (!API_URL) {
      console.error('API URL not configured. Please set NEXT_PUBLIC_API_URL in environment variables.')
      return Promise.reject(new Error('API not configured. Please contact the administrator.'))
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

export default api
