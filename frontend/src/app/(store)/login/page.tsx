'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, User } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back!', 'success');
      router.push('/account');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16">
      <div className="container-shell w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Welcome Back
          </h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
            Sign in to your Malaika Nest account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate_y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)' }} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
              <input type="checkbox" className="rounded" /> Remember me
            </label>
            <Link href="/forgot-password" className="text-xs underline inline-block min-h-[44px] py-1" style={{ color: 'var(--brand-gold)' }}>Forgot password?</Link>
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            {loading ? 'Signing in…' : <>Sign In <ArrowRight size={16} /></>}
          </button>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--brand-text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold underline inline-block min-h-[44px] py-1" style={{ color: 'var(--brand-gold)' }}>Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
