'use client';

import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import api from '@/lib/api';

interface OrderDetails {
  receipt_number: string;
  status: string;
  created_at: string;
  total: string;
  delivery_region?: string;
  items?: Array<{
    id: number;
    product?: { name?: string };
    quantity: number;
    price: string;
  }>;
}

const statusMessages: Record<string, string> = {
  pending: 'Awaiting payment confirmation',
  initiated: 'Awaiting payment confirmation',
  paid: 'Payment confirmed! We\'ll ship within 24h',
  completed: 'Payment confirmed! We\'ll ship within 24h',
  processing: 'Processing — we\'ll ship within 24h',
  shipped: 'Shipped! Track your delivery below',
  delivered: 'Delivered!',
  cancelled: 'Payment failed. Please contact support.',
  payment_failed: 'Payment failed. Please contact support.',
};

export default function OrderStatus({
  receiptNumber,
  checkoutToken,
}: {
  receiptNumber?: string;
  checkoutToken?: string;
}) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The success page is reached by guests and logged-in users alike. Public
    // order lookup goes through the AllowAny GuestOrderTrackView with the
    // per-order checkout_token (unguessable) rather than the auth-only
    // /orders/{id}/ endpoint, which never worked on this page for guests.
    if (!receiptNumber && !checkoutToken) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const res = await api.post(
          '/api/v1/orders/track/',
          { receipt_number: receiptNumber, checkout_token: checkoutToken },
          { headers: { 'X-No-Auth-Redirect': 'true' } }
        );
        const data = res.data?.data ?? res.data;
        if (!cancelled && (data?.id || data?.receipt_number)) {
          setOrder(data);
        }
      } catch {
        // Order status is a nice-to-have; the success page still shows the
        // confirmation + order number if we can't fetch live details.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchOrder();
    return () => {
      cancelled = true;
    };
  }, [receiptNumber, checkoutToken]);

  const statusMessage = order?.status
    ? statusMessages[order.status] || statusMessages.processing
    : 'Processing — we\'ll ship within 24h';

  const totalAmount = order?.total
    ? Math.max(0, Number(order.total) || 0)
    : null;

  return (
    <div className="p-4 rounded-xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
      <Package size={18} className="mb-2" style={{ color: 'var(--brand-gold)' }} />
      <div className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>Order Status</div>
      <div className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
        {loading ? 'Loading...' : statusMessage}
      </div>
      {order && (
        <div className="mt-3 pt-3 border-t text-xs" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="flex justify-between mb-1">
            <span style={{ color: 'var(--brand-text-muted)' }}>Date:</span>
            <span style={{ color: 'var(--brand-text)' }}>
              {order.created_at
                ? new Date(order.created_at).toLocaleDateString('en-KE', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </span>
          </div>
          {order.items && order.items.length > 0 && (
            <div className="flex justify-between mb-1">
              <span style={{ color: 'var(--brand-text-muted)' }}>Items:</span>
              <span style={{ color: 'var(--brand-text)' }}>
                {order.items.reduce((acc, item) => acc + (item.quantity || 0), 0)} item(s)
              </span>
            </div>
          )}
          {totalAmount !== null && (
            <div className="flex justify-between mb-1">
              <span style={{ color: 'var(--brand-text-muted)' }}>Total:</span>
              <span className="font-semibold" style={{ color: 'var(--brand-gold)' }}>
                KES {totalAmount.toLocaleString('en-KE')}
              </span>
            </div>
          )}
          {order.delivery_region && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--brand-text-muted)' }}>Delivery:</span>
              <span style={{ color: 'var(--brand-text)' }}>
                {order.delivery_region.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}