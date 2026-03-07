'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
  date_joined: string
  total_orders: number
}

export default function CustomersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/products/admin/users/')
      const data = Array.isArray(res.data) ? res.data : res.data?.results || []
      setUsers(data)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase()
    const q = search.toLowerCase()
    return fullName.includes(q) || user.email.toLowerCase().includes(q)
  })

  if (loading) return <div className="p-6">Loading customers...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Customers</h2>
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg w-72"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs">Name</th>
              <th className="px-4 py-3 text-left text-xs">Email</th>
              <th className="px-4 py-3 text-left text-xs">Phone</th>
              <th className="px-4 py-3 text-left text-xs">Total Orders</th>
              <th className="px-4 py-3 text-left text-xs">Join Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3 text-sm">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Customer'}</td>
                <td className="px-4 py-3 text-sm">{user.email}</td>
                <td className="px-4 py-3 text-sm">{user.phone || '-'}</td>
                <td className="px-4 py-3 text-sm">{user.total_orders || 0}</td>
                <td className="px-4 py-3 text-sm">{new Date(user.date_joined).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}