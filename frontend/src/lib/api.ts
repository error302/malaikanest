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

// Request interceptor for adding auth tokens
api.interceptors.request.use(
  (config) => {
    // Add any additional request modifications here
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ detail?: string; message?: string }>) => {
    // Check if API_URL is not configured
    if (!API_URL) {
      console.error('API URL not configured. Please set NEXT_PUBLIC_API_URL in environment variables.')
      return Promise.reject(new Error('API not configured. Please contact the administrator.'))
    }
    
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        // Try to refresh the token
        await api.post('/api/accounts/token/refresh/')
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed - redirect to login
        if (typeof window !== 'undefined') {
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
          }
        }
        return Promise.reject(refreshError)
      }
    }

    // Handle other error responses with user-friendly messages
    let errorMessage = 'An error occurred. Please try again.'
    
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.message) {
      // Don't expose internal error details
      if (error.message.includes('Network Error')) {
        errorMessage = 'Unable to connect to server. Please check your internet connection.'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      }
    }

    // Create a new error with the sanitized message
    const sanitizedError = new Error(errorMessage)
    sanitizedError.name = error.name
    
    return Promise.reject(sanitizedError)
  }
)

// Helper function to check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await api.get('/api/accounts/profile/')
    return response.status === 200
  } catch {
    return false
  }
}

// Helper function to get user profile
export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/accounts/profile/')
    return response.data
  } catch (error) {
    return null
  }
}

// Helper to handle API errors in components
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.detail || error.message || 'An error occurred'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred'
}

export default api
