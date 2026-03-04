"use client"
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import api from '../../lib/api'
import { showToast } from '../../components/Toast'
import Logo from '../../components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/api/accounts/token/', { email, password })
      localStorage.setItem('access', res.data.access)
      localStorage.setItem('refresh', res.data.refresh)
      showToast('Login successful!', 'success')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1C1C2E] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-[#252538] rounded-2xl shadow-xl p-8 border border-[#3A3A55]">
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <Logo variant="large" linkWrapper={false} />
            </div>
            <h2 className="text-2xl font-bold text-white mt-6">Welcome Back</h2>
            <p className="text-[#A0A0B8] mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C2E] border border-[#3A3A55] text-white placeholder-[#A0A0B8] rounded-lg focus:outline-none focus:border-[#C8963E] focus:ring-1 focus:ring-[#C8963E]"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#1C1C2E] border border-[#3A3A55] text-white placeholder-[#A0A0B8] rounded-lg focus:outline-none focus:border-[#C8963E] focus:ring-1 focus:ring-[#C8963E]"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-[#3A3A55]" />
                <span className="text-[#A0A0B8]">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-[#C8963E] hover:text-[#E0A83F]">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#C8963E] hover:bg-[#E0A83F] text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#A0A0B8]">
              Don't have an account?{' '}
              <Link href="/register" className="text-[#C8963E] font-medium hover:text-[#E0A83F]">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

