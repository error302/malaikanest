'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Eye, Download, X, Loader2 } from 'lucide-react';
import api, { handleApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

interface OrderItem {
  id: number;
  product_name: string;
  price_at_purchase: string;
  quantity: number;
}

interface AdminOrder {
  id: number;
  order_number: string;
  user_email?: string;
  customer_name?: string;
  guest_email?: string;
  shipping_phone?: string;
  mpesa_receipt_number?: string;
  payment_status?: string;
  delivery_region?: string;
  status: string;
  total: string;
  items: OrderItem[];
  created_at: string;
}

const STATUSES = ['all', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--brand-gold)',
  initiated: '#3B82F6',
  paid: 'var(--brand-green-light)',
  payment_failed: 'var(--brand-terra)',
  processing: 'var(--brand-gold-light)',
  shipped: '#3B82F6',
  delivered: 'var(--brand-green-light)',
  cancelled: 'var(--brand-terra)',
  refunded: 'var(--brand-text-muted)',
  failed: 'var(--brand-terra)',
};

// Mirror of the backend order state machine (Order.STATUS_TRANSITIONS).
const NEXT_STATUSES: Record<string, string[]> = {
  pending: ['paid', 'cancelled'],
  initiated: ['paid', 'cancelled'],
  paid: ['processing', 'refunded', 'cancelled'],
  payment_failed: ['pending', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
  failed: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [total, setTotal] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<AdminOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params: Record<string, string> = { limit: '50' };
        if (statusFilter !== 'all') params.status = statusFilter;
        const res = await api.get('/api/v1/products/admin/orders/', { params });
        if (cancelled) return;
        const data = res.data;
        const envelope = data?.data ?? data;
        const results = Array.isArray(envelope) ? envelope : envelope?.results ?? [];
        setOrders(Array.isArray(results) ? results : []);
        setTotal(typeof envelope?.count === 'number' ? envelope.count : results.length);
        setHasMore(typeof envelope?.next === 'string' && !!envelope.next);
      } catch (err: any) {
        if (!cancelled) {
          setOrders([]);
                    setError(handleApiError(err, 'Could not load orders.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [statusFilter]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const params: Record<string, string> = { limit: '50', offset: String(orders.length) };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await api.get('/api/v1/products/admin/orders/', { params });
      const data = res.data;
      const envelope = data?.data ?? data;
      const results = Array.isArray(envelope) ? envelope : envelope?.results ?? [];
      setOrders((prev) => [...prev, ...(Array.isArray(results) ? results : [])]);
      if (typeof envelope?.count === 'number') setTotal(envelope.count);
      setHasMore(typeof envelope?.count === 'number' ? prevCount(envelope.count, orders.length + (Array.isArray(results) ? results.length : 0)) : false);
    } catch (err: any) {
              showToast(handleApiError(err, 'Could not load more orders'), 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  const prevCount = (count: number, loaded: number) => count > loaded;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [o.order_number, o.user_email, o.guest_email, o.customer_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [orders, search]);

  const updateStatus = async (order: AdminOrder, newStatus: string) => {
    setUpdatingId(order.id);
    try {
      const res = await api.patch(`/api/v1/products/admin/orders/${order.id}/update_status/`, {
        status: newStatus,
      });
      const updated: AdminOrder = res.data?.data ?? res.data;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, ...updated } : o)));
      setSelected((prev) => (prev && prev.id === order.id ? { ...prev, ...updated } : prev));
      showToast(`Order ${updated.order_number || order.order_number} marked ${newStatus}`, 'success');
    } catch (err: any) {
            showToast(handleApiError(err, 'Status update failed'), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/api/v1/orders/admin/orders/export/', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders-export.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Could not export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
            Orders
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
            {filtered.length}{total != null && total > filtered.length ? ` of ${total}` : ''} order{filtered.length === 1 ? '' : 's'}
          </p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm disabled:opacity-60"
          style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)', background: '#FFFFFF' }}
        >
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--brand-text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by receipt, email or name…" className="input-warm w-full" style={{ background: '#FFFFFF' }} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-full px-4 py-2.5 text-sm border" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)', color: 'var(--brand-brown)' }}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : error && filtered.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-terra)' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--brand-bg-alt)' }}>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Receipt</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell" style={{ color: 'var(--brand-text)' }}>Customer</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Date</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Status</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Total</th>
                  <th className="text-right p-4 font-semibold" style={{ color: 'var(--brand-text)' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--brand-text)' }}>#{o.order_number || o.id}</td>
                    <td className="p-4 hidden sm:table-cell" style={{ color: 'var(--brand-text-secondary)' }}>
                      {o.customer_name || o.user_email || o.guest_email || 'Guest'}
                    </td>
                    <td className="p-4" style={{ color: 'var(--brand-text-secondary)' }}>{new Date(o.created_at).toLocaleDateString('en-KE')}</td>
                    <td className="p-4">
                      {NEXT_STATUSES[o.status]?.length ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: `${STATUS_COLORS[o.status] || 'var(--brand-text-muted)'}20`, color: STATUS_COLORS[o.status] || 'var(--brand-text-muted)' }}>
                            {o.status}
                          </span>
                          <select
                            aria-label={`Update status for order ${o.order_number || o.id}`}
                            value=""
                            disabled={updatingId === o.id}
                            onChange={(e) => e.target.value && updateStatus(o, e.target.value)}
                            className="text-xs rounded-lg border px-1.5 py-1"
                            style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-brown)', background: '#FFF' }}
                          >
                            <option value="">Move to…</option>
                            {NEXT_STATUSES[o.status].map((s) => (
                              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: `${STATUS_COLORS[o.status] || 'var(--brand-text-muted)'}20`, color: STATUS_COLORS[o.status] || 'var(--brand-text-muted)' }}>
                          {o.status}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-semibold" style={{ color: 'var(--brand-gold)' }}>KES {parseFloat(o.total).toLocaleString('en-KE')}</td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(o)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--brand-warm)]"
                        aria-label={`View order ${o.order_number || o.id}`}
                      >
                        <Eye size={14} style={{ color: 'var(--brand-brown)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium disabled:opacity-60"
            style={{ borderColor: 'var(--brand-border)', background: '#FFFFFF', color: 'var(--brand-brown)' }}
          >
            {loadingMore ? <Loader2 size={14} className="animate-spin" /> : null}
            {loadingMore ? 'Loading…' : `Load more (${(total ?? 0) - filtered.length} remaining)`}
          </button>
        </div>
      )}

      {selected && (
        <OrderDrawer
          order={orders.find((x) => x.id === selected.id) || selected}
          updating={updatingId === selected.id}
          onClose={() => setSelected(null)}
          onUpdate={(s) => updateStatus(selected, s)}
        />
      )}
    </div>
  );
}

function OrderDrawer({
  order,
  updating,
  onClose,
  onUpdate,
}: {
  order: AdminOrder;
  updating: boolean;
  onClose: () => void;
  onUpdate: (status: string) => void;
}) {
  const itemsTotal = (order.items || []).reduce(
    (sum, it) => sum + parseFloat(it.price_at_purchase || '0') * (it.quantity || 0),
    0
  );

  return (
    <div
      className="fixed inset-0 z-[300] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label={`Order ${order.order_number || order.id}`}
    >
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <aside className="relative w-full sm:max-w-md h-full overflow-y-auto" style={{ background: '#FFFFFF' }}>
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--brand-border)', background: '#FFFFFF' }}>
          <div>
            <h2 className="font-serif text-lg font-semibold" style={{ color: 'var(--brand-text)' }}>
              Order #{order.order_number || order.id}
            </h2>
            <p className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>
              {new Date(order.created_at).toLocaleString('en-KE')}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close order details" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--brand-warm)]">
            <X size={18} style={{ color: 'var(--brand-text)' }} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <section className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Status">
              <span className="text-xs px-2 py-1 rounded-full capitalize" style={{ background: `${STATUS_COLORS[order.status] || 'var(--brand-text-muted)'}20`, color: STATUS_COLORS[order.status] || 'var(--brand-text-muted)' }}>
                {order.status}
              </span>
            </Info>
            <Info label="Payment">
              <span className="capitalize">{order.payment_status || 'unknown'}</span>
            </Info>
            <Info label="Customer">
              <span>{order.customer_name || order.user_email || order.guest_email || 'Guest'}</span>
            </Info>
            <Info label="Phone">
              <span>{order.shipping_phone || '—'}</span>
            </Info>
            <Info label="Delivery region">
              <span className="capitalize">{order.delivery_region?.replace('_', ' ') || '—'}</span>
            </Info>
            <Info label="M-Pesa receipt">
              <span>{order.mpesa_receipt_number || '—'}</span>
            </Info>
          </section>

          <section>
            <h3 className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--brand-text-muted)' }}>Items</h3>

            {(order.items || []).length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No items recorded.</p>
            ) : (
              <ul className="divide-y rounded-xl border" style={{ borderColor: 'var(--brand-border)' }}>
                {order.items.map((it) => (
                  <li key={it.id} className="px-4 py-3 flex items-center justify-between gap-3 text-sm">
                    <span className="flex-1 min-w-0 truncate" style={{ color: 'var(--brand-text)' }}>{it.product_name}</span>
                    <span className="whitespace-nowrap" style={{ color: 'var(--brand-text-secondary)' }}>
                      ×{it.quantity} · KES {parseFloat(it.price_at_purchase || '0').toLocaleString('en-KE')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-center justify-between text-sm font-semibold" style={{ color: 'var(--brand-text)' }}>
              <span>Items total</span>
              <span>KES {itemsTotal.toLocaleString('en-KE')}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-base" style={{ color: 'var(--brand-gold)' }}>
              <span className="font-semibold">Order total</span>
              <span className="font-semibold">KES {parseFloat(order.total || '0').toLocaleString('en-KE')}</span>
            </div>
          </section>

          {NEXT_STATUSES[order.status]?.length ? (
            <section>
              <h3 className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--brand-text-muted)' }}>Update status</h3>
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUSES[order.status].map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={updating}
                    onClick={() => onUpdate(s)}
                    className="px-4 py-2 rounded-full text-xs font-medium capitalize disabled:opacity-60"
                    style={{ background: `${STATUS_COLORS[s] || 'var(--brand-gold)'}20`, color: STATUS_COLORS[s] || 'var(--brand-gold)', border: '1px solid rgba(0,0,0,0.05)' }}
                  >
                    Mark {s}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--brand-bg-alt)' }}>
      <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--brand-text-muted)' }}>{label}</div>
      <div style={{ color: 'var(--brand-text)' }}>{children}</div>
    </div>
  );
}
