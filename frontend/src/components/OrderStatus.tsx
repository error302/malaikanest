"use client"
import React, { useEffect, useState } from 'react'
import api, { handleApiError } from '../lib/api'

export default function OrderStatus({ orderId }: { orderId: string }) {
  const [status, setStatus] = useState('pending')

  useEffect(() => {
    let mounted = true

    const fetchStatus = async () => {
      try {
        const res = await api.get(`/api/orders/orders/${orderId}/`)
        if (mounted) setStatus(res.data.status)
      } catch (err) {
        console.error('Failed to fetch order status:', handleApiError(err))
      }
    }

    fetchStatus()
    const t = setInterval(fetchStatus, 5000)

    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [orderId])

  return <div className="p-3 bg-white rounded">Order status: <strong>{status}</strong></div>
}
