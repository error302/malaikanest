'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<any>(null);
  const [lowStock, setLowStock] = useState<Array<{ product: string; available: number; quantity: number }>>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.allSettled([
      api.get('/api/v1/orders/admin/reports/', { params: { days } }),
      api.get('/api/v1/orders/admin/analytics/'),
    ]).then(([r, a]) => {
      if (cancelled) return;
      if (r.status === 'fulfilled') {
        setReport(r.value.data?.data ?? r.value.data);
      } else {
        setReport(null);
                setError(handleApiError(r.reason, 'Could not load reports.'));
      }
      if (a.status === 'fulfilled') {
        const data = a.value.data?.data ?? a.value.data;
        setLowStock(Array.isArray(data?.low_stock) ? data.low_stock : []);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [days]);

  const totalRevenue = report?.totalRevenue ?? 0;
  const avgOrderValue = report?.averageOrderValue ?? 0;
  const totalOrders = report?.totalOrders ?? 0;

  const PAID_LIKE_STATUSES = ['paid', 'processing', 'shipped', 'delivered'];
  const ordersByStatus: Array<{ status: string; count: number }> = Array.isArray(report?.ordersByStatus)
    ? report.ordersByStatus
    : [];
  const paidOrders = ordersByStatus
    .filter((s) => PAID_LIKE_STATUSES.includes(s.status))
    .reduce((sum, s) => sum + s.count, 0);

  const stats = [
    { label: `Total Revenue (${days}d)`, value: `KES ${totalRevenue.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, Icon: DollarSign, color: 'var(--brand-gold)' },
    { label: 'Avg. Order Value', value: `KES ${avgOrderValue.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, Icon: TrendingUp, color: 'var(--brand-green-light)' },
    { label: 'Paid Orders', value: paidOrders, Icon: ShoppingCart, color: '#3B82F6' },
    { label: 'Low Stock Items', value: lowStock.length, Icon: Package, color: 'var(--brand-terra)' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Reports &amp; Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            Snapshot of your store performance{report?.period ? ` · last ${report.period}` : ''}
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          aria-label="Report period"
          className="rounded-full px-4 py-2.5 text-sm border"
          style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}
        >
          {[7, 30, 90].map((d) => (
            <option key={d} value={d}>Last {d} days</option>
          ))}
        </select>
      </div>

      {!loading && error && (
        <div className="p-4 rounded-2xl border text-sm" style={{ background: 'rgba(196,112,74,0.06)', borderColor: 'rgba(196,112,74,0.2)', color: 'var(--brand-terra)' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: `${color}15` }}>
              <Icon size={18} style={{ color }} />
            </div>
            <div className="text-xl sm:text-2xl font-semibold" style={{ color: 'var(--brand-text)' }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Generating report…</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--brand-border)' }}>
              <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Low Stock Alert</h2>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--brand-border)' }}>
              {!loading && lowStock.length === 0 ? (
                <div className="p-5 text-sm" style={{ color: 'var(--brand-text-muted)' }}>All products are well-stocked.</div>
              ) : (
                lowStock.slice(0, 10).map((p, idx) => (
                  <div key={`${p.product}-${idx}`} className="p-4 flex items-center justify-between">
                    <span className="text-sm truncate" style={{ color: 'var(--brand-text)' }}>{p.product}</span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(196,112,74,0.12)', color: 'var(--brand-terra)' }}>
                      {p.available} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="p-5 border-b" style={{ borderColor: 'var(--brand-border)' }}>
              <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Order Status Breakdown</h2>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--brand-border)' }}>
              {['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => {
                const count = ordersByStatus.find((s) => s.status === status)?.count ?? 0;
                const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
                return (
                  <div key={status} className="p-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="capitalize" style={{ color: 'var(--brand-text)' }}>{status}</span>
                      <span style={{ color: 'var(--brand-text-muted)' }}>{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--brand-warm)' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--brand-gold)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
