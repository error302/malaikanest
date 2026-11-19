'use client';

import type { Order } from './order-detail-types';

interface OrderTotalSummaryProps {
  order: Order;
}

export function OrderTotalSummary({ order }: OrderTotalSummaryProps) {
  return (
    <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--brand-border)' }}>
      <h2 className="font-medium mb-3" style={{ color: 'var(--brand-text)' }}>
        Order Total
      </h2>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span style={{ color: 'var(--brand-text-muted)' }}>Subtotal</span>
          <span style={{ color: 'var(--brand-text)' }}>
            KES {parseFloat(order.subtotal).toLocaleString('en-KE')}
          </span>
        </div>
        {parseFloat(order.discount_amount) > 0 && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--brand-text-muted)' }}>Discount</span>
            <span style={{ color: 'var(--brand-green-light)' }}>
              -KES {parseFloat(order.discount_amount).toLocaleString('en-KE')}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: 'var(--brand-text-muted)' }}>Delivery</span>
          <span style={{ color: 'var(--brand-text)' }}>
            KES {parseFloat(order.delivery_fee).toLocaleString('en-KE')}
          </span>
        </div>
        <div
          className="flex justify-between pt-2 border-t"
          style={{ borderColor: 'var(--brand-border)' }}
        >
          <span className="font-semibold" style={{ color: 'var(--brand-text)' }}>
            Total
          </span>
          <span className="font-semibold" style={{ color: 'var(--brand-text)' }}>
            KES {parseFloat(order.total).toLocaleString('en-KE')}
          </span>
        </div>
      </div>
    </div>
  );
}
