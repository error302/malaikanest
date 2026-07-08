'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Package, ShoppingCart, DollarSign } from 'lucide-react';
import api from '@/lib/api';

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/v1/orders/', { params: { limit: 100 } }),
      api.get('/api/v1/products/products/', { params: { limit: 100 } }),
    ]).then(([o, p]) => {
      if (o.status === 'fulfilled') {
        const data = o.value.data;
        setOrders(data?.results ?? data?.data?.results ?? []);
      }
      if (p.status === 'fulfilled') {
        const data = p.value.data;
        setProducts(data?.results ?? data?.data?.results ?? []);
      }
      setLoading(false);
    });
  }, []);

  const totalRevenue = orders.reduce((sum, o) => sum + parseFloat(o.total ?? '0'), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  const paidOrders = orders.filter((o) => o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped').length;
  const lowStockProducts = products.filter((p) => (p.stock ?? 0) <= (p.low_stock_threshold ?? 5));

  const stats = [
    { label: 'Total Revenue', value: `KES ${totalRevenue.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, Icon: DollarSign, color: 'var(--brand-gold)' },
    { label: 'Avg. Order Value', value: `KES ${avgOrderValue.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`, Icon: TrendingUp, color: 'var(--brand-green-light)' },
    { label: 'Paid Orders', value: paidOrders, Icon: ShoppingCart, color: '#3B82F6' },
    { label: 'Low Stock Items', value: lowStockProducts.length, Icon: Package, color: 'var(--brand-terra)' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Reports & Analytics
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          Snapshot of your store performance
        </p>
      </div>

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
              {lowStockProducts.length === 0 ? (
                <div className="p-5 text-sm" style={{ color: 'var(--brand-text-muted)' }}>All products are well-stocked.</div>
              ) : (
                lowStockProducts.slice(0, 10).map((p) => (
                  <div key={p.id} className="p-4 flex items-center justify-between">
                    <span className="text-sm truncate" style={{ color: 'var(--brand-text)' }}>{p.name}</span>
                    <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(196,112,74,0.12)', color: 'var(--brand-terra)' }}>
                      {p.stock ?? 0} left
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
                const count = orders.filter((o) => o.status === status).length;
                const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
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
