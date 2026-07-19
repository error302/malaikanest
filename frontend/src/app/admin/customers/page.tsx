'use client';

import { useEffect, useState } from 'react';
import { Search, Mail, Phone } from 'lucide-react';
import api from '@/lib/api';

interface Customer {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  date_joined?: string;
  is_email_verified?: boolean;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/v1/products/admin/users/', { params: { search, limit: 50 } });
        if (cancelled) return;
        const data = res.data;
        setCustomers(data?.results ?? data?.data?.results ?? []);
      } catch {
        if (!cancelled) setCustomers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Customers
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          {customers.length} registered customer{customers.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers…" className="input-warm w-full" style={{ background: '#FFFFFF' }} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading ? (
          <div className="col-span-full p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : customers.length === 0 ? (
          <div className="col-span-full p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>No customers found.</div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-gold-soft)' }}>
                  <span className="font-serif font-semibold text-sm" style={{ color: 'var(--brand-brown-dark)' }}>
                    {(c.first_name?.[0] || c.email[0] || '?').toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--brand-text)' }}>
                    {[c.first_name, c.last_name].filter(Boolean).join(' ') || 'Customer'}
                  </div>
                  {c.is_email_verified && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(45,90,66,0.12)', color: 'var(--brand-green-light)' }}>Verified</span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 text-xs" style={{ color: 'var(--brand-text-secondary)' }}>
                <div className="flex items-center gap-2"><Mail size={12} /> <span className="truncate">{c.email}</span></div>
                {c.phone_number && <div className="flex items-center gap-2"><Phone size={12} /> {c.phone_number}</div>}
              </div>
              {c.date_joined && (
                <div className="text-[11px] mt-3 pt-3" style={{ color: 'var(--brand-text-muted)', borderTop: '1px solid var(--brand-border)' }}>
                  Joined {new Date(c.date_joined).toLocaleDateString('en-KE')}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
