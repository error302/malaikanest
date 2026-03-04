"use client"
import React, { useState, useEffect } from 'react'
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
  const [apiConfigured, setApiConfigured] = useState(true)

  useEffect(() => {
    // Check if API is configured
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    // Check if API_URL is set AND not empty string
    if (!apiUrl || apiUrl === '' || apiUrl === 'http://localhost:8000') {
      setApiConfigured(false)
    }
  }, [])

  const handleDemoLogin = () => {
    // Demo login - simulate successful login
    setLoading(true)
    setTimeout(() => {
      // Store demo tokens
      localStorage.setItem('access', 'demo_token_' + Date.now())
      localStorage.setItem('refresh', 'demo_refresh_' + Date.now())
      localStorage.setItem('user', JSON.stringify({
        email: 'demo@example.com',
        first_name: 'Demo',
        last_name: 'User'
      }))
      showToast('Demo login successful!', 'success')
      setLoading(false)
      router.push('/dashboard')
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // If API is not configured, show error
    if (!apiConfigured) {
      setError('API is not configured. Please set NEXT_PUBLIC_API_URL environment variable.')
      setLoading(false)
      return
    }

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

          {/* Demo Mode Banner - only show when API is not properly configured */}
          {!apiConfigured && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-6 text-sm">
              <p className="font-medium mb-2">Demo Mode Available</p>
              <p>You can use demo login to explore the site, or sign in with your account.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-secondary" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-accent hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-cta hover:bg-cta-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Demo Login Button - Always available for testing */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Logging in...' : 'Demo Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-accent font-medium hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
