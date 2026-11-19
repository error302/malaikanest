'use client';

import Link from 'next/link';
import { Truck, RefreshCw, MessageCircle } from 'lucide-react';
import type { Order } from './order-detail-types';

interface OrderActionsBarProps {
  order: Order;
  reordering: boolean;
  whatsappUrl: string;
  onReorder: () => void;
}

export function OrderActionsBar({
  order,
  reordering,
  whatsappUrl,
  onReorder,
}: OrderActionsBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {order.status === 'shipped' && (
        <Link
          href={`/track?order=${order.receipt_number}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium border transition-colors"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-text)', background: '#FFFFFF' }}
        >
          <Truck size={16} />
          Track Delivery
        </Link>
      )}

      <button
        type="button"
        onClick={onReorder}
        disabled={reordering}
        className="flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-opacity disabled:opacity-50"
        style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}
      >
        <RefreshCw size={16} className={reordering ? 'animate-spin' : ''} />
        {reordering ? 'Adding to cart…' : 'Reorder'}
      </button>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium border transition-colors"
        style={{ borderColor: 'var(--brand-green-light)', color: 'var(--brand-green-light)', background: '#FFFFFF' }}
      >
        <MessageCircle size={16} />
        WhatsApp Us
      </a>
    </div>
  );
}
