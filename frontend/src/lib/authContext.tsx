"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'

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
  phone?: string
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

const USER_KEY = 'malaika_user_v1'
const TOKEN_KEY = 'malaika_token'
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const res = await api.get('/api/accounts/profile/')
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
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
      }
    } catch {
      setUser(null)
      localStorage.removeItem(USER_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(USER_KEY)

    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(USER_KEY)
      }
    }

    setIsLoading(false)
    // Only check auth if we have a stored user session hint
    // This prevents infinite refresh loops for non-logged-in users
    if (stored) {
      checkAuth()
    }
  }, [checkAuth])

  const login = useCallback(async (email: string, password: string, captchaToken?: string) => {
    const payload: Record<string, string> = { email, password }
    if (captchaToken) payload.captcha_token = captchaToken

    // Store session key before login to merge guest cart
    const sessionKey = getSessionKey()

    // Backend sets httponly secure cookies automatically.
    await api.post('/api/accounts/token/', payload)

    // Merge guest cart into user cart
    if (sessionKey) {
      try {
        await api.post('/api/orders/cart/merge/', { session_key: sessionKey })
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
      await api.post('/api/accounts/logout/')
    } catch {
      // Proceed with local logout regardless of network failure.
    } finally {
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(TOKEN_KEY)
      setUser(null)
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    await api.post('/api/accounts/register/', data)
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
  return !!localStorage.getItem(USER_KEY)
}
