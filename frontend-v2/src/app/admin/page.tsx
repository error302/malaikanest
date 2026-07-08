'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShoppingCart, Package, Users, DollarSign, TrendingUp, ArrowRight,
  Clock, CheckCircle, Truck, AlertCircle,
} from 'lucide-react';
import api from '@/lib/api';

interface Stats {
  revenue: number;
  orders: number;
  products: number;
  customers: number;
  pendingOrders: number;
  lowStock: number;
}

interface RecentOrder {
  id: number;
  receipt_number: string;
  status: string;
  total: string;
  customer_email?: string;
  created_at: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ revenue: 0, orders: 0, products: 0, customers: 0, pendingOrders: 0, lowStock: 0 });
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/v1/orders/', { params: { limit: 5 } }),
      api.get('/api/v1/products/products/', { params: { limit: 1 } }),
    ]).then(([ordersRes, productsRes]) => {
      let revenue = 0;
      let orderCount = 0;
      let recentOrders: RecentOrder[] = [];
      if (ordersRes.status === 'fulfilled') {
        const data = ordersRes.value.data;
        const results = data?.results ?? data?.data?.results ?? [];
        orderCount = data?.count ?? results.length;
        recentOrders = results.slice(0, 5);
        revenue = results.reduce((sum: number, o: any) => sum + parseFloat(o.total ?? '0'), 0);
      }
      let productCount = 0;
      if (productsRes.status === 'fulfilled') {
        const data = productsRes.value.data;
        productCount = data?.count ?? 0;
      }
      setStats({
        revenue,
        orders: orderCount,
        products: productCount,
        customers: 0,
        pendingOrders: recentOrders.filter((o) => o.status === 'pending' || o.status === 'paid').length,
        lowStock: 0,
      });
      setRecent(recentOrders);
      setLoading(false);
    });
  }, []);

  const statCards = [
    { label: 'Revenue (recent)', value: `KES ${stats.revenue.toLocaleString('en-KE')}`, Icon: DollarSign, color: 'var(--brand-gold)' },
    { label: 'Orders', value: stats.orders, Icon: ShoppingCart, color: 'var(--brand-green-light)' },
    { label: 'Products', value: stats.products, Icon: Package, color: 'var(--brand-terra)' },
    { label: 'Pending', value: stats.pendingOrders, Icon: Clock, color: '#3B82F6' },
  ];

  const STATUS_ICON: Record<string, any> = {
    pending: Clock, paid: CheckCircle, processing: Package, shipped: Truck, delivered: CheckCircle, cancelled: AlertCircle,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          Welcome back. Here&apos;s what&apos;s happening in your store.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map(({ label, value, Icon, color }) => (
          <div key={label} className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon size={18} style={{ color }} />
              </div>
              <TrendingUp size={14} style={{ color: 'var(--brand-green-light)' }} />
            </div>
            <div className="text-2xl font-semibold" style={{ color: 'var(--brand-text)' }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--brand-border)' }}>
          <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>Recent Orders</h2>
          <Link href="/admin/orders" className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--brand-gold)' }}>
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading orders…</div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>No orders yet.</div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--brand-border)' }}>
            {recent.map((order) => {
              const StatusIcon = STATUS_ICON[order.status] || Clock;
              return (
                <div key={order.id} className="p-4 flex items-center gap-3 hover:bg-[var(--brand-bg-alt)] transition-colors">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--brand-warm)' }}>
                    <StatusIcon size={16} style={{ color: 'var(--brand-gold)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: 'var(--brand-text)' }}>#{order.receipt_number}</div>
                    <div className="text-xs truncate" style={{ color: 'var(--brand-text-muted)' }}>
                      {order.customer_email || 'Guest'} · {new Date(order.created_at).toLocaleDateString('en-KE')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>
                      KES {parseFloat(order.total).toLocaleString('en-KE')}
                    </div>
                    <div className="text-xs capitalize" style={{ color: 'var(--brand-text-muted)' }}>{order.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { href: '/admin/products/new', label: 'Add Product', desc: 'Create a new product listing', Icon: Package },
          { href: '/admin/orders', label: 'Process Orders', desc: 'Update order statuses', Icon: ShoppingCart },
          { href: '/admin/banners', label: 'Manage Banners', desc: 'Update homepage slides', Icon: TrendingUp },
        ].map(({ href, label, desc, Icon }) => (
          <Link key={href} href={href} className="p-5 rounded-2xl border transition-all hover:shadow-warm-md" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <Icon size={20} className="mb-3" style={{ color: 'var(--brand-gold)' }} />
            <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{label}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>{desc}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
