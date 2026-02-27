"use client"
import React, {useEffect, useState} from 'react'
import api from '../../lib/api'
import { LoadingPage } from '../../components/Loading'

interface Order {
  id: number
  total: string
  status: string
  created_at: string
  receipt_number: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  initiated: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export default function Dashboard(){
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{
    api.get('/api/orders/orders/')
      .then(r=>{
        setOrders(r.data)
        setLoading(false)
      })
      .catch(()=>{
        setError('Unable to load orders. Please try again.')
        setLoading(false)
      })
  },[])

  if(loading) return <LoadingPage />
  
  if(error) return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {error}
      </div>
    </div>
  )

  const getStatusColor = (status: string) => statusColors[status] || 'bg-gray-100 text-gray-800'

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Orders</h2>
      
      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
            <p className="text-gray-600 mb-4">Start shopping to see your orders here!</p>
            <a 
              href="/" 
              className="inline-block px-6 py-2 bg-pastelPink hover:bg-pink-200 text-gray-800 font-medium rounded-lg"
            >
              Browse Products
            </a>
          </div>
        ) : (
          orders.map(o => (
            <div key={o.id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-800">Order #{o.id}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    <span>Date: {new Date(o.created_at).toLocaleDateString('en-KE', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                    {o.receipt_number && (
                      <span className="ml-4">Receipt: {o.receipt_number.slice(0, 8)}...</span>
                    )}
                  </div>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  KSH {parseFloat(o.total).toLocaleString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
