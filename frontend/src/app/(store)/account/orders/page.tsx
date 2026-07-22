'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import api from '@/lib/api';

interface Order {
  id: number;
  receipt_number: string;
  status: string;
  total: string;
  created_at: string;
  items?: Array<{ product: { name: string }; quantity: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--brand-gold)',
  paid: 'var(--brand-green-light)',
  processing: 'var(--brand-gold-contrast)',
  shipped: '#3B82F6',
  delivered: 'var(--brand-green-light)',
  cancelled: 'var(--brand-terra)',
  refunded: 'var(--brand-text-muted)',
};

export default function MyOrdersPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get('/api/v1/orders/')
      .then((res) => {
        const data = res.data;
        setOrders(data?.results ?? data?.data?.results ?? data ?? []);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (isLoading || loading) {
    return <div className="container-shell py-20 text-center" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="container-shell py-16 text-center">
        <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--brand-text-muted)' }} />
        <h1 className="font-serif text-2xl font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>No orders yet</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--brand-text-muted)' }}>When you place an order, it&apos;ll show up here.</p>
        <Link href="/categories" className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-shell py-6 sm:py-10 max-w-4xl">
      <h1 className="font-serif text-3xl font-semibold mb-6" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
        My Orders
      </h1>
      <div className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>#{order.receipt_number}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[order.status] || 'var(--brand-text-muted)'}20`, color: STATUS_COLORS[order.status] || 'var(--brand-text-muted)' }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                  {new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>
                  KES {parseFloat(order.total).toLocaleString('en-KE')}
                </p>
                <ChevronRight size={16} className="ml-auto mt-1" style={{ color: 'var(--brand-text-muted)' }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
