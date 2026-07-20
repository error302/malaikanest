'use client';

import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import api from '@/lib/api';

interface Invoice {
  id: number;
  invoice_number: string;
  order: number;
  pdf_url?: string;
  created_at: string;
  download_count?: number;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/v1/orders/invoices/')
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
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} style={{ borderTop: '1px solid var(--brand-border)' }}>
                    <td className="p-4 font-medium" style={{ color: 'var(--brand-text)' }}>{inv.invoice_number}</td>
                    <td className="p-4" style={{ color: 'var(--brand-text-secondary)' }}>#{inv.order}</td>
                    <td className="p-4" style={{ color: 'var(--brand-text-secondary)' }}>{new Date(inv.created_at).toLocaleDateString('en-KE')}</td>
                    <td className="p-4 hidden sm:table-cell" style={{ color: 'var(--brand-text-muted)' }}>{inv.download_count ?? 0}</td>
                    <td className="p-4 text-right">
                      {inv.pdf_url ? (
                        <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--brand-gold)' }}>
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
