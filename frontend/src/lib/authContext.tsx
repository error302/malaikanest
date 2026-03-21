"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/authToken'

type User = {
  id: number
  email: string
  name: string
  role?: string
  is_staff?: boolean
}

type RegisterData = {
  email: string
  password: string
  first_name: string
  last_name: string
  phone_number?: string
  full_name?: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (email: string, password: string, captchaToken?: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_KEY = 'malaika_session_key'

const getSessionKey = (): string | null => {
  if (typeof window === 'undefined') return null
  let key = localStorage.getItem(SESSION_KEY)
  if (!key) {
    key = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem(SESSION_KEY, key)
  }
  return key
}

const withTimeout = (promise: Promise<any>, ms: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ])
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await withTimeout(api.get('/api/v1/accounts/profile/'), 5000)
      if (res.data) {
        const fullName = [res.data.first_name, res.data.last_name].filter(Boolean).join(' ').trim()
        const userData = {
          id: res.data.id,
          email: res.data.email,
          name: fullName || res.data.email,
          role: res.data.role,
          is_staff: res.data.is_staff,
        }
        setUser(userData)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true)
      try {
        const refreshRes = await withTimeout(api.post('/api/v1/accounts/token/refresh/'), 5000)
        const newAccess = (refreshRes.data as any)?.access
        if (newAccess) setAccessToken(newAccess)
        await checkAuth()
      } catch {
        clearAccessToken()
        setUser(null)
        setIsLoading(false)
      }
    }

    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 8000)

    bootstrap()

    return () => clearTimeout(timer)
  }, [checkAuth])

  const login = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const payload: Record<string, string> = { email, password }
    if (captchaToken) payload.captcha_token = captchaToken

    // Store session key before login to merge guest cart
    const sessionKey = getSessionKey()

    // Backend sets refresh cookie and returns access token in body.
    const res = await api.post('/api/v1/accounts/token/', payload)
    const access = (res.data as any)?.access
    if (access) setAccessToken(access)

    // Merge guest cart into user cart
    if (sessionKey) {
      try {
        await api.post('/api/v1/orders/cart/merge/', { session_key: sessionKey })
      } catch {
        // Ignore merge errors
      }
    }

    // Check auth again to ensure user session is fully instantiated.
    await checkAuth()
  }, [checkAuth])

  const logout = useCallback(async () => {
    try {
      // Tells backend to blacklist the token and clear the httponly cookies.
      await api.post('/api/v1/accounts/logout/')
    } catch {
      // Proceed with local logout regardless of network failure.
    } finally {
      clearAccessToken()
      setUser(null)
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    await api.post('/api/v1/accounts/register/', data)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: !!(user && (user.role === 'admin' || user.is_staff)),
      isLoading,
      login,
      logout,
      register,
      checkAuth,
    }),
    [checkAuth, isLoading, login, logout, register, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!getAccessToken()
}
