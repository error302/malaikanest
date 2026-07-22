'use client';

import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';

interface OrderDetails {
  id: string;
  receipt_number: string;
  status: string;
  created_at: string;
  total_amount: number;
  items?: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  shipping_address?: {
    address_line_1?: string;
    city?: string;
    county?: string;
    postal_code?: string;
  };
}

const statusMessages: Record<string, string> = {
  pending: 'Awaiting payment confirmation',
  paid: 'Payment confirmed! We\'ll ship within 24h',
  completed: 'Payment confirmed! We\'ll ship within 24h',
  processing: 'Processing — we\'ll ship within 24h',
  shipped: 'Shipped! Track your delivery below',
  delivered: 'Delivered!',
  cancelled: 'Payment failed. Please contact support.',
  payment_failed: 'Payment failed. Please contact support.',
};

export default function OrderStatus({ receiptNumber }: { receiptNumber?: string }) {
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!receiptNumber) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/orders/${receiptNumber}/`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [receiptNumber]);

  const statusMessage = order?.status
    ? statusMessages[order.status] || statusMessages.processing
    : 'Processing — we\'ll ship within 24h';

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
              {new Date(order.created_at).toLocaleDateString('en-KE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          {order.items && order.items.length > 0 && (
            <div className="flex justify-between mb-1">
              <span style={{ color: 'var(--brand-text-muted)' }}>Items:</span>
              <span style={{ color: 'var(--brand-text)' }}>
                {order.items.reduce((acc, item) => acc + item.quantity, 0)} item(s)
              </span>
            </div>
          )}
          <div className="flex justify-between mb-1">
            <span style={{ color: 'var(--brand-text-muted)' }}>Total:</span>
            <span className="font-semibold" style={{ color: 'var(--brand-gold)' }}>
              KES {order.total_amount.toLocaleString('en-KE')}
            </span>
          </div>
          {order.shipping_address && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--brand-text-muted)' }}>Ship to:</span>
              <span style={{ color: 'var(--brand-text)' }}>
                {[order.shipping_address.city, order.shipping_address.county].filter(Boolean).join(', ') || 'Standard shipping'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}