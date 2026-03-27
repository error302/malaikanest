'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'

import { handleApiError } from '@/lib/api'
import { useAuth } from '@/lib/authContext'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isAdmin, isLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = searchParams.get('next') || searchParams.get('redirect') || '/'

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    router.replace(isAdmin ? '/admin' : redirectTo)
  }, [isAdmin, isAuthenticated, isLoading, redirectTo, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      router.push(isAdmin ? '/admin' : redirectTo)
      router.refresh()
    } catch (err: unknown) {
      setError(handleApiError(err, 'Invalid email or password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-[#1A3A2A] mb-1">
            Welcome back
          </h1>
          <p className="text-sm text-[#8A7060] font-light">
            Sign in to your Malaika Nest account
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-[#EDE3D8] p-8 shadow-sm space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#2C1810] mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border border-[#E0D5C8] text-sm
                         text-[#2C1810] placeholder:text-[#B0A090] bg-[#FAF4EC]
                         focus:outline-none focus:border-[#1A3A2A] transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#2C1810]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#C4704A] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#E0D5C8] text-sm
                           text-[#2C1810] placeholder:text-[#B0A090] bg-[#FAF4EC]
                           focus:outline-none focus:border-[#1A3A2A] transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7060] hover:text-[#2C1810] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isLoading}
            className="w-full bg-[#1A3A2A] hover:bg-[#254D38] text-[#E8C98A]
                       py-3 rounded-xl text-sm font-medium transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : isLoading ? 'Loading...' : 'Sign In'}
          </button>

          <p className="text-center text-xs text-[#8A7060]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#C4704A] hover:underline font-medium">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center"><p>Loading...</p></div>}>
      <LoginForm />
    </Suspense>
  )
}
