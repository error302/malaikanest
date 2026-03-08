"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import api from '@/lib/api'

type User = {
  id: number
  email: string
  name: string
  role?: string
}

type AuthContextType = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
  checkAuth: () => Promise<void>
}

type RegisterData = {
  email: string
  password: string
  name: string
  phone?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

const USER_KEY = 'malaika_user_v1'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      // Try to get user profile - will fail if not authenticated
      const res = await api.get('/api/accounts/profile/')
      if (res.data) {
        const userData = {
          id: res.data.id,
          email: res.data.email,
          name: res.data.name || res.data.email,
          role: res.data.role,
        }
        setUser(userData)
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
      }
    } catch (error) {
      // Not authenticated - clear any stored user data
      setUser(null)
      localStorage.removeItem(USER_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check for stored user on mount
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

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/accounts/token/', { email, password })
    
    // Store tokens
    if (res.data.access) {
      localStorage.setItem('malaika_token', res.data.access)
    }
    if (res.data.refresh) {
      localStorage.setItem('malaika_refresh', res.data.refresh)
    }
    
    // Get user profile
    await checkAuth()
  }

  const logout = async () => {
    try {
      await api.post('/api/accounts/logout/')
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('malaika_token')
      localStorage.removeItem('malaika_refresh')
      localStorage.removeItem(USER_KEY)
      setUser(null)
    }
  }

  const register = async (data: RegisterData) => {
    await api.post('/api/accounts/register/', data)
    // After registration, user needs to login
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
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

// Helper to check if user is logged in (synchronous, for use in components)
export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('malaika_token') || !!localStorage.getItem('malaika_user_v1')
}
