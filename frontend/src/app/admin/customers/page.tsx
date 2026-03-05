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
  date_joined: string
  total_orders: number
}

export default function CustomersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [selectedTab, setSelectedTab] = useState('all')

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
    } catch (error) {
      console.error('Failed to promote user')
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
    } catch (error) {
      console.error('Failed to demote user')
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
    } catch (error: any) {
      console.error(error.response?.data?.detail || 'Failed to deactivate user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivate = async (userId: number) => {
    setActionLoading(userId)
    try {
      await api.patch(`/api/products/admin/users/${userId}/activate/`)
      fetchUsers()
    } catch (error) {
      console.error('Failed to activate user')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search)
    
    if (selectedTab === 'all') return matchesSearch
    if (selectedTab === 'admins') return matchesSearch && (user.is_staff || user.is_superuser)
    if (selectedTab === 'customers') return matchesSearch && !user.is_staff && !user.is_superuser
    if (selectedTab === 'active') return matchesSearch && user.is_active
    if (selectedTab === 'inactive') return matchesSearch && !user.is_active
    return matchesSearch
  })

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-KE', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr))
  }

  const getRoleBadge = (user: User) => {
    if (user.is_superuser) {
      return <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 rounded-full">Super Admin</span>
    }
    if (user.is_staff) {
      return <span className="px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 rounded-full">Admin</span>
    }
    return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-full">Customer</span>
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full">Active</span>
    }
    return <span className="px-2.5 py-1 text-xs font-medium bg-rose-100 text-rose-700 border border-rose-200 rounded-full">Inactive</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-amber-100"></div>
          <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'all', label: 'All Users', count: users.length },
    { id: 'admins', label: 'Admins', count: users.filter(u => u.is_staff || u.is_superuser).length },
    { id: 'customers', label: 'Customers', count: users.filter(u => !u.is_staff && !u.is_superuser).length },
    { id: 'active', label: 'Active', count: users.filter(u => u.is_active).length },
    { id: 'inactive', label: 'Inactive', count: users.filter(u => !u.is_active).length },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800" style={{ fontFamily: 'Montserrat, sans-serif' }}>Customers</h2>
          <p className="text-slate-500 mt-1">Manage user accounts and permissions</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedTab === tab.id
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                selectedTab === tab.id ? 'bg-white/20' : 'bg-slate-100'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-80">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold">
                        {user.first_name?.[0] || user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{user.first_name} {user.last_name}</p>
                        <p className="text-sm text-slate-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{user.phone || '-'}</td>
                  <td className="px-6 py-4">{getRoleBadge(user)}</td>
                  <td className="px-6 py-4">{getStatusBadge(user.is_active)}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-800">{user.total_orders}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{formatDate(user.date_joined)}</td>
                  <td className="px-6 py-4">
                    {actionLoading === user.id ? (
                      <span className="text-slate-400 text-sm">Processing...</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {!user.is_superuser && (
                          <>
                            {!user.is_staff ? (
                              <button
                                onClick={() => handlePromoteToAdmin(user.id)}
                                className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg font-medium text-xs hover:bg-amber-100 transition-colors"
                              >
                                Promote
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDemoteToCustomer(user.id)}
                                className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg font-medium text-xs hover:bg-slate-200 transition-colors"
                              >
                                Demote
                              </button>
                            )}
                          </>
                        )}
                        {user.is_active ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg font-medium text-xs hover:bg-rose-100 transition-colors"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id)}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-medium text-xs hover:bg-emerald-100 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-50 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-600 font-medium">No users found</p>
          </div>
        )}
      </div>
    </div>
  )
}
