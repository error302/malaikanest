'use client';

import { MapPin, CreditCard } from 'lucide-react';
import type { Order } from './order-detail-types';

interface OrderDeliveryPaymentCardsProps {
  order: Order;
}

export function OrderDeliveryPaymentCards({ order }: OrderDeliveryPaymentCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={16} style={{ color: 'var(--brand-text-muted)' }} />
          <h2 className="font-medium" style={{ color: 'var(--brand-text)' }}>
            Delivery
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
          {order.delivery_region
            ? order.delivery_region.charAt(0).toUpperCase() + order.delivery_region.slice(1)
            : 'Standard delivery'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={16} style={{ color: 'var(--brand-text-muted)' }} />
          <h2 className="font-medium" style={{ color: 'var(--brand-text)' }}>
            Payment
          </h2>
        </div>
        {order.mpesa_receipt_number ? (
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
            M-Pesa • {order.mpesa_receipt_number}
          </p>
        ) : (
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
            Payment confirmed
          </p>
        )}
      </div>
    </div>
  );
}
