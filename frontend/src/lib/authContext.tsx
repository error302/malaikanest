'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '@/lib/api';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/authToken';

type User = {
  id: number | string;
  email: string;
  name: string;
  role?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
};

type RegisterData = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  full_name?: string;
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const REFRESH_MARKER_COOKIE = 'mn_refresh_present';

const withTimeout = (promise: Promise<any>, ms: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
  ]);
};

const hasRefreshMarker = (): boolean => {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((cookie) => cookie === `${REFRESH_MARKER_COOKIE}=1`);
};

const clearRefreshMarker = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `${REFRESH_MARKER_COOKIE}=; Max-Age=0; path=/; SameSite=Strict`;
};

const unwrapApiData = <T,>(payload: any): T => (payload?.data ?? payload) as T;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await withTimeout(
        api.get('/api/v1/accounts/profile/', {
          headers: { 'X-No-Auth-Redirect': 'true' },
        }),
        5000
      );
      const profile = unwrapApiData<any>(res.data);
      if (profile) {
        const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim();
        const userData = {
          id: profile.id,
          email: profile.email,
          name: fullName || profile.email,
          role: profile.role,
          is_staff: Boolean(profile.is_staff || profile.is_superuser),
          is_superuser: Boolean(profile.is_superuser),
        };
        setUser(userData);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true);

      if (!hasRefreshMarker()) {
        clearAccessToken();
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const refreshRes = await withTimeout(api.post('/api/v1/accounts/token/refresh/'), 3000);
        const newAccess = (refreshRes.data as any)?.access;
        if (newAccess) {
          setAccessToken(newAccess);
          await checkAuth();
        } else {
          clearRefreshMarker();
          setIsLoading(false);
        }
      } catch {
        clearAccessToken();
        clearRefreshMarker();
        setUser(null);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    bootstrap();

    return () => clearTimeout(timer);
  }, [checkAuth]);

  const login = useCallback(
    async (email: string, password: string, captchaToken?: string) => {
      const payload: Record<string, string> = { email, password };
      if (captchaToken) payload.captcha_token = captchaToken;

      const res = await api.post('/api/v1/accounts/token/', payload);
      const access = (res.data as any)?.access || (res.data as any)?.data?.access;
      if (access) setAccessToken(access);

      try {
        await api.post('/api/v1/orders/cart/merge/', {});
      } catch {
        // Ignore merge errors
      }

      await checkAuth();
    },
    [checkAuth]
  );

  const adminLogin = useCallback(
    async (email: string, password: string) => {
      const payload: Record<string, string> = { email, password };
      const res = await api.post('/api/v1/accounts/admin/login/', payload);
      const access = (res.data as any)?.access || (res.data as any)?.data?.access;
      if (access) setAccessToken(access);
      await checkAuth();
    },
    [checkAuth]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/api/v1/accounts/logout/');
    } catch {
      // Proceed with local logout regardless
    } finally {
      clearAccessToken();
      clearRefreshMarker();
      setUser(null);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    await api.post('/api/v1/accounts/register/', data);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isAdmin: !!(
        user &&
        (String(user.role || '').toUpperCase().trim() === 'ADMIN' || user.is_staff || user.is_superuser)
      ),
      isLoading,
      login,
      adminLogin,
      logout,
      register,
      checkAuth,
    }),
    [adminLogin, checkAuth, isLoading, login, logout, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function isLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return !!getAccessToken();
}
