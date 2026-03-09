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
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string, captchaToken?: string) => {
    const payload: Record<string, string> = { email, password }
    if (captchaToken) payload.captcha_token = captchaToken
    
    // Backend sets httponly secure cookies automatically
    await api.post('/api/accounts/token/', payload)
    
    // Check auth again to ensure user session is fully instantiated
    await checkAuth()
  }

  const logout = async () => {
    try {
      // Tells backend to blacklist the token and clear the httponly cookies
      await api.post('/api/accounts/logout/')
    } catch {
      // Proceed with local logout regardless of network failure
    } finally {
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
  }

  const register = async (data: RegisterData) => {
    await api.post('/api/accounts/register/', data)
  }

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
    [user, isLoading, checkAuth]
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
