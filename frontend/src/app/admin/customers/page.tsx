'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone: string
  is_staff: boolean
  is_superuser: boolean
  is_active: boolean
  role: string
  date_joined: string
  total_orders: number
}

export default function CustomersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/products/admin/users/')
      setUsers(res.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePromoteToAdmin = async (userId: number) => {
    if (!confirm('Are you sure you want to promote this user to admin?')) return
    setActionLoading(userId)
    try {
      await api.patch(`/api/products/admin/users/${userId}/promote_to_admin/`)
      fetchUsers()
      alert('User promoted to admin successfully!')
    } catch (error) {
      alert('Failed to promote user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDemoteToCustomer = async (userId: number) => {
    if (!confirm('Are you sure you want to demote this admin to customer?')) return
    setActionLoading(userId)
    try {
      await api.patch(`/api/products/admin/users/${userId}/demote_to_customer/`)
      fetchUsers()
      alert('User demoted to customer successfully!')
    } catch (error) {
      alert('Failed to demote user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeactivate = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    setActionLoading(userId)
    try {
      await api.patch(`/api/products/admin/users/${userId}/deactivate/`)
      fetchUsers()
      alert('User deactivated successfully!')
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to deactivate user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivate = async (userId: number) => {
    setActionLoading(userId)
    try {
      await api.patch(`/api/products/admin/users/${userId}/activate/`)
      fetchUsers()
      alert('User activated successfully!')
    } catch (error) {
      alert('Failed to activate user')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
    user.phone?.includes(search)
  )

  const getRoleBadge = (user: User) => {
    if (user.is_superuser) {
      return <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Super Admin</span>
    }
    if (user.is_staff) {
      return <span className="px-2 py-1 text-xs bg-amber-100 text-amber-800 rounded">Admin</span>
    }
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">Customer</span>
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Active</span>
    }
    return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">Inactive</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-700"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Customers</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-700 font-medium">
                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.phone}
                </td>
                <td className="px-6 py-4">
                  {getRoleBadge(user)}
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(user.is_active)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.total_orders}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.date_joined).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {actionLoading === user.id ? (
                    <span className="text-gray-400">Processing...</span>
                  ) : (
                    <div className="flex gap-2">
                      {/* Promote/Demote Admin */}
                      {!user.is_superuser && (
                        <>
                          {!user.is_staff ? (
                            <button
                              onClick={() => handlePromoteToAdmin(user.id)}
                              className="text-amber-600 hover:text-amber-900 text-sm"
                              title="Promote to Admin"
                            >
                              ⬆ Admin
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDemoteToCustomer(user.id)}
                              className="text-gray-600 hover:text-gray-900 text-sm"
                              title="Demote to Customer"
                            >
                              ⬇ Customer
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* Activate/Deactivate */}
                      {user.is_active ? (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                          title="Deactivate User"
                        >
                          🚫
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(user.id)}
                          className="text-green-600 hover:text-green-900 text-sm"
                          title="Activate User"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}
      </div>
    </div>
  )
}
