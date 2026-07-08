'use client';

import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { showToast } from '@/lib/toast';

interface OrderItem {
  id: number;
  product: { name: string };
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  receipt_number: string;
  status: string;
  total: string;
  created_at: string;
  delivery_region: string;
  tracking_number?: string;
  shipping_carrier?: string;
  items?: OrderItem[];
  customer_email?: string;
  guest_email?: string;
}

const STATUS_FLOW = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', Icon: Clock },
  { key: 'paid', label: 'Payment Confirmed', Icon: CheckCircle },
  { key: 'processing', label: 'Preparing', Icon: Package },
  { key: 'shipped', label: 'Shipped', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: CheckCircle },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--brand-gold)',
  paid: 'var(--brand-green-light)',
  processing: 'var(--brand-gold-light)',
  shipped: '#3B82F6',
  delivered: 'var(--brand-green-light)',
  cancelled: 'var(--brand-terra)',
  refunded: 'var(--brand-text-muted)',
};

export default function TrackOrderPage() {
  const [receipt, setReceipt] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receipt.trim()) return;
    setLoading(true);
    setSearched(true);
    setOrder(null);
    try {
      const res = await api.get(`/api/v1/orders/track/?receipt=${encodeURIComponent(receipt.trim())}`, {
        headers: { 'X-No-Auth-Redirect': 'true' },
      });
      const data = res.data?.data ?? res.data;
      if (data?.id || data?.receipt_number) {
        setOrder(data);
      } else {
        showToast('Order not found. Check your receipt number.', 'error');
      }
    } catch {
      showToast('Order not found. Check your receipt number.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? STATUS_FLOW.indexOf(order.status) : -1;

  return (
    <div className="container-shell py-6 sm:py-10 max-w-3xl">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(139,105,20,0.1)' }}>
          <Package size={28} style={{ color: 'var(--brand-gold)' }} />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold mb-2" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Track Your Order
        </h1>
        <p className="text-sm" style={{ color: 'var(--brand-text-secondary)' }}>
          Enter your order receipt number (e.g. MN-ABCD1234EFGH) to see its status.
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
          <input
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            placeholder="MN-XXXXXXXXXXXX"
            className="input-warm w-full"
            style={{ background: '#FFFFFF', textTransform: 'uppercase' }}
            aria-label="Receipt number"
          />
        </div>
        <button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
          {loading ? 'Searching…' : <>Track <ArrowRight size={14} /></>}
        </button>
      </form>

      {/* Results */}
      {searched && !loading && !order && (
        <div className="text-center py-8 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <XCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-terra)' }} />
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--brand-text)' }}>Order not found</p>
          <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
            Double-check your receipt number from your order confirmation email or SMS. Need help? <Link href="/contact" className="underline" style={{ color: 'var(--brand-gold)' }}>Contact us</Link>.
          </p>
        </div>
      )}

      {order && (
        <div className="space-y-5">
          {/* Order header */}
          <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--brand-text-muted)' }}>Order</p>
                <p className="font-serif text-xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>#{order.receipt_number}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--brand-text-muted)' }}>
                  Placed {new Date(order.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--brand-text-muted)' }}>Total</p>
                <p className="text-xl font-semibold" style={{ color: 'var(--brand-gold)' }}>KES {parseFloat(order.total).toLocaleString('en-KE')}</p>
                <span className="text-[10px] px-2 py-1 rounded-full capitalize mt-1 inline-block" style={{ background: `${STATUS_COLORS[order.status] || 'var(--brand-text-muted)'}20`, color: STATUS_COLORS[order.status] || 'var(--brand-text-muted)' }}>
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Status tracker */}
          {order.status !== 'cancelled' && order.status !== 'refunded' && (
            <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
              <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--brand-text)' }}>Order Progress</h2>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute top-5 left-5 right-5 h-0.5" style={{ background: 'var(--brand-border)' }}>
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: currentStepIndex >= 0 ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%',
                      background: 'var(--brand-gold)',
                    }}
                  />
                </div>
                {/* Steps */}
                <div className="relative flex justify-between">
                  {STATUS_STEPS.map((step, i) => {
                    const isDone = i <= currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2" style={{ width: '60px' }}>
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-all"
                          style={{
                            background: isDone ? 'var(--brand-gold)' : '#FFFFFF',
                            border: `2px solid ${isDone ? 'var(--brand-gold)' : 'var(--brand-border)'}`,
                            color: isDone ? '#FFFFFF' : 'var(--brand-text-muted)',
                            transform: isCurrent ? 'scale(1.15)' : 'scale(1)',
                          }}
                        >
                          <step.Icon size={16} />
                        </div>
                        <span className="text-[10px] text-center font-medium leading-tight" style={{ color: isDone ? 'var(--brand-text)' : 'var(--brand-text-muted)' }}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tracking info */}
          {order.tracking_number && (
            <div className="p-5 rounded-2xl border" style={{ background: 'rgba(59,130,246,0.05)', borderColor: 'rgba(59,130,246,0.2)' }}>
              <div className="flex items-start gap-3">
                <Truck size={20} className="flex-shrink-0 mt-0.5" style={{ color: '#3B82F6' }} />
                <div>
                  <p className="text-sm font-semibold mb-1" style={{ color: 'var(--brand-text)' }}>Shipped!</p>
                  <p className="text-xs" style={{ color: 'var(--brand-text-secondary)' }}>
                    Tracking number: <strong>{order.tracking_number}</strong>
                    {order.shipping_carrier && ` via ${order.shipping_carrier}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order items */}
          {order.items && order.items.length > 0 && (
            <div className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--brand-text)' }}>Items ({order.items.length})</h2>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs py-1.5" style={{ color: 'var(--brand-text-secondary)' }}>
                    <span className="flex-1 truncate">{item.product.name} × {item.quantity}</span>
                    <span className="font-medium ml-2">KES {(parseFloat(item.price) * item.quantity).toLocaleString('en-KE')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Need help */}
          <div className="text-center pt-2">
            <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
              Questions about your order?{' '}
              <Link href="/contact" className="underline font-medium" style={{ color: 'var(--brand-gold)' }}>Contact us</Link>
              {' or '}
              <a href="https://wa.me/254726771321" target="_blank" rel="noopener noreferrer" className="underline font-medium" style={{ color: 'var(--brand-gold)' }}>WhatsApp us</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
