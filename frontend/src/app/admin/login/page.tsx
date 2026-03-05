'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if already logged in
    const token = document.cookie.includes('access_token')
    if (token) {
      router.push('/admin')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/api/accounts/token/', { email, password })
      router.push('/admin')
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Invalid credentials'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pastel-beige via-pastel-peach to-pastel-pink/30">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-pastel-beige">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-pastel-navy" style={{ fontFamily: "'Playfair Display', serif" }}>
            Malaika Nest
          </h1>
          <p className="text-gray-500 mt-2">Admin Dashboard Login</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pastel-mint/50 focus:border-pastel-mint transition-all bg-pastel-beige/20"
              placeholder="admin@example.com"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pastel-mint/50 focus:border-pastel-mint transition-all bg-pastel-beige/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pastel-pink to-pastel-mint text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-pastel-navy hover:text-pastel-pink text-sm transition-colors">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  )
}
