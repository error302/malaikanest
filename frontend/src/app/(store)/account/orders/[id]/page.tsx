'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import api from '@/lib/api';
import type { Order } from '@/components/malaika/account/order-detail-types';
import { OrderItemsList } from '@/components/malaika/account/OrderItemsList';
import { OrderDeliveryPaymentCards } from '@/components/malaika/account/OrderDeliveryPaymentCards';
import { OrderTotalSummary } from '@/components/malaika/account/OrderTotalSummary';
import { OrderActionsBar } from '@/components/malaika/account/OrderActionsBar';

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--brand-gold)',
  initiated: 'var(--brand-gold)',
  paid: 'var(--brand-green-light)',
  payment_failed: 'var(--brand-terra)',
  failed: 'var(--brand-terra)',
  cancelled: 'var(--brand-terra)',
  refunded: 'var(--brand-text-muted)',
  processing: 'var(--brand-gold-light)',
  shipped: '#3B82F6',
  delivered: 'var(--brand-green-light)',
};

const WHATSAPP_NUMBER = '+254700000000';

export default function OrderDetailPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    api
      .get(`/api/v1/orders/${orderId}/`)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        if (err.response?.status === 404 || err.response?.status === 403) {
          setError('Order not found');
        } else {
          setError('Failed to load order');
        }
      })
      .finally(() => setLoading(false));
  }, [user, orderId]);

  const handleReorder = async () => {
    if (!order || !order.items.length) return;
    setReordering(true);

    try {
      for (const item of order.items) {
        const payload: Record<string, unknown> = {
          product_id: item.product.id,
          quantity: item.quantity,
        };
        if (item.variant?.id) {
          payload.variant_id = parseInt(item.variant.id);
        }
        await api.post('/api/v1/orders/cart/add/', payload);
      }
      router.push('/checkout');
    } catch {
      setReordering(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="container-shell py-20 text-center" style={{ color: 'var(--brand-text-muted)' }}>
        Loading…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container-shell py-20 text-center">
        <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--brand-text-muted)' }} />
        <h1 className="font-serif text-2xl font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>
          {error || 'Order not found'}
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--brand-text-muted)' }}>
          {error === 'Order not found' ? "This order may not exist or you don't have permission to view it." : 'Something went wrong. Please try again.'}
        </p>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium"
          style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
        >
          <ArrowLeft size={16} />
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order.status] || 'var(--brand-text-muted)';
  const formattedDate = new Date(order.created_at).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const whatsappMessage = encodeURIComponent(`Hi, I have a question about my order #${order.receipt_number}`);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace('+', '')}?text=${whatsappMessage}`;

  return (
    <div className="container-shell py-6 sm:py-10 max-w-3xl">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/account/orders"
          className="p-2 rounded-full border transition-colors"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text-muted)' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1
            className="font-serif text-2xl sm:text-3xl font-semibold"
            style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}
          >
            Order #{order.receipt_number}
          </h1>
        </div>
        <span
          className="text-sm px-3 py-1 rounded-full font-medium"
          style={{
            background: `${statusColor}20`,
            color: statusColor,
          }}
        >
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      <OrderItemsList order={order} formattedDate={formattedDate} />

      <OrderDeliveryPaymentCards order={order} />

      <OrderTotalSummary order={order} />

      <OrderActionsBar
        order={order}
        reordering={reordering}
        whatsappUrl={whatsappUrl}
        onReorder={handleReorder}
      />
    </div>
  );
}
