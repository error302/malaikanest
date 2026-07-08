'use client';

import { useEffect, useState } from 'react';
import { Search, Eye } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

interface Order {
  id: number;
  receipt_number: string;
  status: string;
  total: string;
  customer_email?: string;
  guest_email?: string;
  created_at: string;
}

const STATUSES = ['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--brand-gold)',
  paid: 'var(--brand-green-light)',
  processing: 'var(--brand-gold-light)',
  shipped: '#3B82F6',
  delivered: 'var(--brand-green-light)',
  cancelled: 'var(--brand-terra)',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    const params: Record<string, string> = { limit: '50' };
    if (search) params.search = search;
    if (statusFilter !== 'all') params.status = statusFilter;
    const load = async () => {
      try {
        const res = await api.get('/api/v1/orders/', { params });
        if (cancelled) return;
        const data = res.data;
        setOrders(data?.results ?? data?.data?.results ?? []);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Orders
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          {orders.length} order{orders.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by receipt or email…" className="input-warm w-full" style={{ background: '#FFFFFF' }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full px-4 py-2.5 text-sm border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--brand-bg-alt)' }}>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Receipt</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell" style={{ color: 'var(--brand-text)' }}>Customer</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Date</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Status</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Total</th>
                  <th className="text-right p-4 font-semibold" style={{ color: 'var(--brand-text)' }}></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--brand-text)' }}>#{o.receipt_number}</td>
                    <td className="p-4 hidden sm:table-cell" style={{ color: 'var(--brand-text-secondary)' }}>{o.customer_email || o.guest_email || 'Guest'}</td>
                    <td className="p-4" style={{ color: 'var(--brand-text-secondary)' }}>{new Date(o.created_at).toLocaleDateString('en-KE')}</td>
                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: `${STATUS_COLORS[o.status] || 'var(--brand-text-muted)'}20`, color: STATUS_COLORS[o.status] || 'var(--brand-text-muted)' }}>
                        {o.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold" style={{ color: 'var(--brand-gold)' }}>KES {parseFloat(o.total).toLocaleString('en-KE')}</td>
                    <td className="p-4 text-right">
                      <Link href={`/admin/orders?id=${o.id}`} className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--brand-warm)]" aria-label="View order">
                        <Eye size={14} style={{ color: 'var(--brand-brown)' }} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
