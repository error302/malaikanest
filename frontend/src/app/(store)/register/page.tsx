'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, Phone, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { showToast } from '@/lib/toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      showToast('Passwords do not match', 'error');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
        phone_number: form.phone,
      });
      showToast('Account created! Please check your email to verify.', 'success');
      router.push('/login');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center py-10 sm:py-16">
      <div className="container-shell w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Create Account
          </h1>
          <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
            Join the Malaika Nest family
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-[42px] -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>First name</label>
              <input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)' }} />
            </div>
            <div className="relative">
              <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Last name</label>
              <input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="input-warm w-full !pl-4" style={{ background: 'var(--brand-bg-alt)' }} />
            </div>
          </div>
          <div className="mt-3 relative">
            <Mail size={16} className="absolute left-3.5 top-[42px] -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)' }} />
          </div>
          <div className="mt-3 relative">
            <Phone size={16} className="absolute left-3.5 top-[42px] -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Phone (+2547XXXXXXXX)</label>
            <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)' }} />
          </div>
          <div className="mt-3 relative">
            <Lock size={16} className="absolute left-3.5 top-[42px] -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Password</label>
            <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)' }} />
          </div>
          <div className="mt-3 relative">
            <Lock size={16} className="absolute left-3.5 top-[42px] -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
            <label className="text-xs uppercase tracking-wider font-semibold mb-2 block" style={{ color: 'var(--brand-text-muted)' }}>Confirm password</label>
            <input required type="password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className="input-warm w-full" style={{ background: 'var(--brand-bg-alt)' }} />
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
            {loading ? 'Creating…' : <>Create Account <ArrowRight size={16} /></>}
          </button>

          <p className="text-xs text-center mt-5" style={{ color: 'var(--brand-text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold underline" style={{ color: 'var(--brand-gold)' }}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
