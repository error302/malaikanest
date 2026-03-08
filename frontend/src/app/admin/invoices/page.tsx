"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Download, 
  Eye, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react'
import api from '@/lib/api'

interface Invoice {
  id: number
  invoice_number: string
  order: {
    id: number
    order_number?: string
    customer_name: string
    customer_email: string
    total: string
    status: string
  }
  subtotal: string
  tax: string
  shipping: string
  total_amount: string
  currency: string
  payment_status: string
  invoice_status: string
  generated_at: string
  sent_at: string | null
  download_count: number
  pdf_file?: string
}

export default function AdminInvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [page, filterStatus, filterPayment])

  const fetchInvoices = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: page.toString() }
      if (search) params.search = search
      if (filterStatus) params.invoice_status = filterStatus
      if (filterPayment) params.payment_status = filterPayment
      
      const res = await api.get('/api/orders/admin/invoices/', { params })
      setInvoices(res.data.results || res.data || [])
      setTotalPages(Math.ceil((res.data.count || res.data.length || 1) / 25))
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchInvoices()
  }

  const handleDownload = async (invoice: Invoice) => {
    setActionLoading(invoice.id)
    try {
      const res = await api.get(`/api/orders/admin/invoices/${invoice.id}/download/`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `invoice_${invoice.invoice_number}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error('Failed to download invoice:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleResend = async (invoice: Invoice) => {
    setActionLoading(invoice.id)
    try {
      await api.post(`/api/orders/admin/invoices/${invoice.id}/resend/`)
      alert('Invoice email sent successfully!')
    } catch (error) {
      console.error('Failed to resend invoice:', error)
      alert('Failed to resend invoice email')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRegenerate = async (invoice: Invoice) => {
    setActionLoading(invoice.id)
    try {
      await api.post(`/api/orders/admin/invoices/${invoice.id}/regenerate/`)
      alert('Invoice regenerated successfully!')
      fetchInvoices()
    } catch (error) {
      console.error('Failed to regenerate invoice:', error)
      alert('Failed to regenerate invoice')
    } finally {
      setActionLoading(null)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  const getInvoiceStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      generated: 'bg-blue-100 text-blue-800',
      sent: 'bg-purple-100 text-purple-800',
      viewed: 'bg-indigo-100 text-indigo-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
              <p className="mt-1 text-sm text-gray-500">View and manage all customer invoices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by invoice number or customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Payment Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="">All Invoice Status</option>
                <option value="generated">Generated</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
              </select>
              <button type="submit" className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                <Filter size={20} />
              </button>
            </div>
          </form>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-pink-600" size={32} />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          #{invoice.order?.id || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{invoice.order?.customer_name || 'Guest'}</div>
                        <div className="text-sm text-gray-500">{invoice.order?.customer_email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          KES {parseFloat(invoice.total_amount || invoice.order?.total || '0').toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadge(invoice.payment_status)}`}>
                          {invoice.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getInvoiceStatusBadge(invoice.invoice_status)}`}>
                          {invoice.invoice_status || 'generated'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.generated_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleDownload(invoice)}
                            disabled={actionLoading === invoice.id}
                            className="p-2 text-gray-600 hover:text-pink-600 disabled:opacity-50"
                            title="Download PDF"
                          >
                            {actionLoading === invoice.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                          </button>
                          <button
                            onClick={() => handleResend(invoice)}
                            disabled={actionLoading === invoice.id}
                            className="p-2 text-gray-600 hover:text-pink-600 disabled:opacity-50"
                            title="Resend Email"
                          >
                            <Mail size={18} />
                          </button>
                          <button
                            onClick={() => handleRegenerate(invoice)}
                            disabled={actionLoading === invoice.id}
                            className="p-2 text-gray-600 hover:text-pink-600 disabled:opacity-50"
                            title="Regenerate Invoice"
                          >
                            <RefreshCw size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
