'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import api from '@/lib/api';

interface InvoiceOrder {
  id: number;
  order_number?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  total?: string;
  status?: string;
}

interface Invoice {
  id: number;
  invoice_number: string;
  order: InvoiceOrder | number;
  pdf_file?: string | null;
  generated_at?: string | null;
  created_at?: string;
  download_count?: number;
  payment_status?: string;
  invoice_status?: string;
}

const orderNumber = (inv: Invoice): string => {
  if (typeof inv.order === 'number') return String(inv.order);
  return inv.order?.order_number || `#${inv.order?.id ?? inv.order}`;
};

const orderCustomer = (inv: Invoice): string => {
  if (typeof inv.order === 'number' || !inv.order) return '';
  return [inv.order.customer_name, inv.order.customer_email]
    .filter(Boolean)
    .join(' · ');
};

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/api/v1/orders/admin/invoices/', { params: { page_size: 50 } })
      .then((res) => {
        const data = res.data;
        setInvoices(data?.results ?? data?.data?.results ?? []);
      })
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--brand-text)', fontFamily: 'var(--font-cormorant)' }}>
          Invoices
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--brand-text-muted)' }}>
          {invoices.length} invoice{invoices.length === 1 ? '' : 's'} generated
        </p>
      </div>

      <div className="rounded-2xl border overflow-hidden" style={{ background: '#FFFFFF', borderColor: 'var(--brand-border)' }}>
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: 'var(--brand-text-muted)' }}>Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--brand-text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--brand-text-muted)' }}>No invoices yet. Invoices are generated automatically when orders are paid.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--brand-bg-alt)' }}>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Invoice #</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Order</th>
                  <th className="text-left p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Date</th>
                  <th className="text-left p-4 font-semibold hidden sm:table-cell" style={{ color: 'var(--brand-text)' }}>Downloads</th>
                  <th className="text-right p-4 font-semibold" style={{ color: 'var(--brand-text)' }}>Action</th>
                  <th className="text-left p-4 font-semibold hidden md:table-cell" style={{ color: 'var(--brand-text)' }}>Customer</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--brand-text)' }}>{inv.invoice_number}</td>
                    <td className="p-4" style={{ color: 'var(--brand-text-secondary)' }}>#{orderNumber(inv)}</td>
                    <td className="p-4 hidden md:table-cell" style={{ color: 'var(--brand-text-secondary)' }}>
                      {orderCustomer(inv) || <span style={{ color: 'var(--brand-text-muted)' }}>—</span>}
                    </td>
                    <td className="p-4" style={{ color: 'var(--brand-text-secondary)' }}>
                      {new Date(inv.generated_at || inv.created_at || Date.now()).toLocaleDateString('en-KE')}
                    </td>
                    <td className="p-4 hidden sm:table-cell" style={{ color: 'var(--brand-text-muted)' }}>{inv.download_count ?? 0}</td>
                    <td className="p-4 text-right">
                      {inv.pdf_file ? (
                        <a href={inv.pdf_file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--brand-gold)' }}>
                          <Download size={12} /> PDF
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: 'var(--brand-text-muted)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
