'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft, Truck, MessageCircle, RefreshCw, MapPin, CreditCard, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import api from '@/lib/api';

interface OrderItem {
  id: string;
  product: {
    id: number;
    name: string;
    slug: string;
    images?: Array<{ url: string; alt?: string }>;
  };
  variant: {
    id: string;
    color: string;
    color_label: string;
    size: string;
    size_label: string;
    sku: string;
  } | null;
  price: string;
  quantity: number;
}

interface Order {
  id: number;
  receipt_number: string;
  status: string;
  subtotal: string;
  delivery_fee: string;
  discount_amount: string;
  total: string;
  created_at: string;
  items: OrderItem[];
  delivery_region: string;
  is_gift: boolean;
  gift_message?: string;
  mpesa_receipt_number?: string;
}

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
        if (err.response?.status === 404) {
          setError('Order not found');
        } else if (err.response?.status === 403) {
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
          {error === 'Order not found' ? 'This order may not exist or you don\'t have permission to view it.' : 'Something went wrong. Please try again.'}
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

      <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--brand-border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} style={{ color: 'var(--brand-text-muted)' }} />
          <span className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>
            Ordered on {formattedDate}
          </span>
        </div>

        {order.is_gift && order.gift_message && (
          <div className="mb-4 p-3 rounded-lg" style={{ background: 'var(--brand-bg)' }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--brand-text-muted)' }}>Gift Message</p>
            <p className="text-sm italic" style={{ color: 'var(--brand-text)' }}>{order.gift_message}</p>
          </div>
        )}

        <h2 className="font-medium mb-3" style={{ color: 'var(--brand-text)' }}>Items</h2>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: 'var(--brand-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={16} style={{ color: 'var(--brand-text-muted)' }} />
            <h2 className="font-medium" style={{ color: 'var(--brand-text)' }}>Delivery</h2>
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
            <h2 className="font-medium" style={{ color: 'var(--brand-text)' }}>Payment</h2>
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

      <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: 'var(--brand-border)' }}>
        <h2 className="font-medium mb-3" style={{ color: 'var(--brand-text)' }}>Order Total</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span style={{ color: 'var(--brand-text-muted)' }}>Subtotal</span>
            <span style={{ color: 'var(--brand-text)' }}>KES {parseFloat(order.subtotal).toLocaleString('en-KE')}</span>
          </div>
          {parseFloat(order.discount_amount) > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'var(--brand-text-muted)' }}>Discount</span>
              <span style={{ color: 'var(--brand-green-light)' }}>-KES {parseFloat(order.discount_amount).toLocaleString('en-KE')}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span style={{ color: 'var(--brand-text-muted)' }}>Delivery</span>
            <span style={{ color: 'var(--brand-text)' }}>KES {parseFloat(order.delivery_fee).toLocaleString('en-KE')}</span>
          </div>
          <div
            className="flex justify-between pt-2 border-t"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <span className="font-semibold" style={{ color: 'var(--brand-text)' }}>Total</span>
            <span className="font-semibold" style={{ color: 'var(--brand-text)' }}>
              KES {parseFloat(order.total).toLocaleString('en-KE')}
            </span>
          </div>
        </div>
      </div>

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
          onClick={handleReorder}
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
    </div>
  );
}