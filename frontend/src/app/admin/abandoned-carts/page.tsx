'use client';

import { useEffect, useState, useCallback } from 'react';
import { ShoppingCart, Clock, Mail, RefreshCw } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface CartItem {
  id: number;
  product: { id: number; name: string; price: string; image?: string };
  variant?: { color_label?: string; size_label?: string } | null;
  quantity: number;
  unit_price?: string;
}

interface Cart {
  id: number;
  user?: { email?: string; first_name?: string; last_name?: string } | null;
  session_key?: string;
  created_at: string;
  updated_at: string;
  items: CartItem[];
}

export default function AdminAbandonedCartsPage() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCarts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/orders/admin/carts/', { params: { abandoned: true, limit: 50 } });
      const data = res.data;
      setCarts(data?.results ?? data?.data?.results ?? []);
    } catch {
      setCarts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  const handleSendReminder = async (cart: Cart) => {
    try {
      await api.post('/api/v1/orders/admin/carts/remind/', { cart_id: cart.id });
      showToast('Reminder queued!', 'success');
    } catch (err: any) {
            const detail = handleApiError(err, 'Could not queue the reminder email');
      showToast(detail, 'error');
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${Math.floor(diff / (1000 * 60))}m ago`;
  };

  const calcTotal = (cart: Cart) => {
    return cart.items.reduce((sum, item) => {
      const price = parseFloat(item.unit_price || item.product.price || '0');
      return sum + price * item.quantity;
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Abandoned Carts
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            {carts.length} cart{carts.length === 1 ? '' : 's'} with items but no checkout
          </p>
        </div>
        <button type="button" onClick={fetchCarts} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="p-4 rounded-2xl border flex items-start gap-3" style={{ background: 'rgba(196,112,74,0.06)', borderColor: 'rgba(196,112,74,0.2)' }}>
        <Mail size={18} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-terra)' }} />
        <p className="text-xs" style={{ color: 'var(--brand-brown)' }}>
          <strong>Recovery tip:</strong> Customers who abandon carts convert at 10-15% when reminded within 1 hour. Click &quot;Send Reminder&quot; to email them. For automated recovery sequences, connect Mailchimp or Sendinblue.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
      ) : carts.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
          <ShoppingCart size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No abandoned carts right now. Great job!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {carts.map((cart) => {
            const total = calcTotal(cart);
            const customerName = cart.user ? [cart.user.first_name, cart.user.last_name].filter(Boolean).join(' ') || cart.user.email : 'Guest';
            return (
              <div key={cart.id} className="p-5 rounded-2xl border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>{customerName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ background: 'rgba(196,112,74,0.12)', color: 'var(--brand-terra)' }}>
                        <Clock size={10} /> {formatTimeAgo(cart.updated_at)}
                      </span>
                    </div>
                    <p className="text-xs mb-3" style={{ color: 'var(--brand-text-muted)' }}>{cart.items.length} item{cart.items.length === 1 ? '' : 's'} · Cart #{cart.id}</p>
                    <div className="space-y-1">
                      {cart.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs" style={{ color: 'var(--brand-text-secondary)' }}>
                          <span className="truncate flex-1">{item.product.name}</span>
                          <span>× {item.quantity}</span>
                          <span className="font-medium">KES {(parseFloat(item.unit_price || item.product.price || '0') * item.quantity).toLocaleString('en-KE')}</span>
                        </div>
                      ))}
                      {cart.items.length > 3 && <p className="text-[10px]" style={{ color: 'var(--brand-text-muted)' }}>+ {cart.items.length - 3} more</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-semibold" style={{ color: 'var(--brand-gold)' }}>KES {total.toLocaleString('en-KE')}</p>
                    <button type="button" onClick={() => handleSendReminder(cart)} className="mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium" style={{ background: 'var(--brand-gold)', color: '#FFFFFF' }}>
                      <Mail size={12} /> Send Reminder
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
