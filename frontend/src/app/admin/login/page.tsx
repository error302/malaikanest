'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';

export default function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(email, password);
      showToast('Welcome, admin', 'success');
      router.push('/admin');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Invalid credentials or missing admin privileges', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--brand-brown-dark)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--brand-gold)' }}>
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-white mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>
            Admin Access
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Sign in to the Malaika Nest admin panel
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'rgba(255,255,255,0.6)' }}>Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@malaikanest.com" className="w-full rounded-xl pl-11 pr-4 py-3 text-sm text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'rgba(255,255,255,0.6)' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl pl-11 pr-4 py-3 text-sm text-white" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }} />
              </div>
            </div>
          </div>
          <button type="submit" disabled={loading} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            {loading ? 'Signing in…' : <>Sign In to Admin <ArrowRight size={16} /></>}
          </button>
        </form>

        <p className="text-xs text-center mt-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Authorized personnel only. All actions are logged.
        </p>
      </div>
    </div>
  );
}
