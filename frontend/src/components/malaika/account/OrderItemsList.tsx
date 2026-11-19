'use client';

import { Package, Calendar } from 'lucide-react';
import type { Order } from './order-detail-types';

interface OrderItemsListProps {
  order: Order;
  formattedDate: string;
}

export function OrderItemsList({ order, formattedDate }: OrderItemsListProps) {
  return (
    <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--brand-border)' }}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={16} style={{ color: 'var(--brand-text-muted)' }} />
        <span className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
          Ordered on {formattedDate}
        </span>
      </div>

      {order.is_gift && order.gift_message && (
        <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--brand-bg)' }}>
          <p className="text-xs font-medium mb-1" style={{ color: 'var(--brand-text-muted)' }}>
            Gift Message
          </p>
          <p className="text-sm italic" style={{ color: 'var(--brand-text)' }}>
            {order.gift_message}
          </p>
        </div>
      )}

      <h2 className="font-medium mb-3" style={{ color: 'var(--brand-text)' }}>
        Items
      </h2>
      <div className="space-y-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex gap-3">
            {item.product.images?.[0] ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={item.product.images[0].url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ background: 'var(--brand-bg)' }}
              >
                <Package size={24} style={{ color: 'var(--brand-text-muted)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--brand-text)' }}>
                {item.product.name}
              </p>
              {item.variant && (
                <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
                  {item.variant.color_label || item.variant.color}
                  {item.variant.size_label ? ` / ${item.variant.size_label}` : ''}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                {item.quantity} x KES {parseFloat(item.price).toLocaleString('en-KE')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium" style={{ color: 'var(--brand-text)' }}>
                KES {(parseFloat(item.price) * item.quantity).toLocaleString('en-KE')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
