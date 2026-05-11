import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Users, BarChart2, BookOpen, Tag, TrendingUp, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/api/axios'

interface DashboardStats {
  totalUsers: number
  totalBookings: number
  totalRevenue: number
  activeBookings: number
}

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isBlocked: boolean
  createdAt: string
}

interface AdminBooking {
  id: string
  bookingRef: string
  userEmail: string
  type: string
  status: string
  finalAmount: number
  createdAt: string
}

export default function AdminPage() {
  const { isAdmin, isAuthenticated } = useAuth()
  const [tab, setTab] = useState<'dashboard' | 'users' | 'bookings'>('dashboard')
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [loading, setLoading] = useState(true)

  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center">
        <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h1 className="text-xl font-bold text-gray-900 mb-1">Access Denied</h1>
        <p className="text-gray-500">You need admin privileges to view this page.</p>
      </div>
    </div>
  )

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      api.get('/admin/dashboard'),
      api.get('/admin/users'),
      api.get('/admin/bookings'),
    ]).then(([d, u, b]) => {
      if (d.status === 'fulfilled') setStats((d.value.data as { data: DashboardStats }).data)
      if (u.status === 'fulfilled') setUsers(((u.value.data as { data: AdminUser[] }).data) ?? [])
      if (b.status === 'fulfilled') setBookings(((b.value.data as { data: AdminBooking[] }).data) ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const StatCard = ({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) => (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-6 flex items-center gap-4">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart2 },
    { key: 'users',     label: 'Users',     icon: Users },
    { key: 'bookings',  label: 'Bookings',  icon: BookOpen },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white py-6 px-4">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-blue-200 text-sm mt-1">TravelPort Management Console</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                tab === key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : (
          <>
            {tab === 'dashboard' && stats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard icon={Users}     label="Total Users"     value={stats.totalUsers}    color="bg-blue-500" />
                <StatCard icon={BookOpen}  label="Total Bookings"  value={stats.totalBookings}  color="bg-green-500" />
                <StatCard icon={TrendingUp} label="Revenue (₹)"   value={`₹${(stats.totalRevenue ?? 0).toLocaleString('en-IN')}`} color="bg-purple-500" />
                <StatCard icon={Tag}       label="Active Bookings" value={stats.activeBookings} color="bg-orange-500" />
              </div>
            )}

            {tab === 'users' && (
              <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Name', 'Email', 'Role', 'Status', 'Joined'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-10 text-gray-400">No users found</td></tr>
                    ) : users.map(u => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {u.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {tab === 'bookings' && (
              <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Booking Ref', 'User', 'Type', 'Status', 'Amount', 'Date'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-10 text-gray-400">No bookings found</td></tr>
                    ) : bookings.map(b => (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.bookingRef}</td>
                        <td className="px-4 py-3 text-gray-600">{b.userEmail}</td>
                        <td className="px-4 py-3">{b.type}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            b.status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                            b.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{b.status}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-800">₹{b.finalAmount?.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(b.createdAt).toLocaleDateString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
