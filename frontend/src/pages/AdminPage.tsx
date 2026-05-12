import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, Tag,
  TrendingUp, TrendingDown, Plane, Hotel,
  ShieldCheck, ShieldOff, Pencil, Trash2,
  Plus, Search, ChevronLeft, ChevronRight,
  RefreshCw, X,
} from 'lucide-react'
import type { RootState } from '@/store'
import type {
  AdminDashboardDto, AdminUserDto, AdminAnalyticsDto,
  CouponDto, CreateCouponRequest, UpdateCouponRequest,
  BookingDto,
} from '@/types'
import { adminService } from '@/services/adminService'
import { formatCurrency } from '@/utils/formatters'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type Tab = 'dashboard' | 'users' | 'bookings' | 'coupons'

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number
  icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ── Revenue Bar ───────────────────────────────────────────────────────────────
function SimpleBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-gray-500 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 text-xs font-semibold text-gray-700 shrink-0 text-right">{formatCurrency(value)}</span>
    </div>
  )
}

// ── Coupon Modal ──────────────────────────────────────────────────────────────
function CouponModal({ coupon, onClose, onSaved }: {
  coupon: CouponDto | null; onClose: () => void; onSaved: () => void
}) {
  const isEdit = coupon !== null
  const [form, setForm] = useState({
    code:        coupon?.code        ?? '',
    type:        (coupon?.type       ?? 'Percentage') as 'Fixed' | 'Percentage',
    value:       coupon?.value       ?? 10,
    minAmount:   coupon?.minAmount   ?? 0,
    maxDiscount: coupon?.maxDiscount != null ? String(coupon.maxDiscount) : '',
    usageLimit:  coupon?.usageLimit  != null ? String(coupon.usageLimit)  : '',
    expiresAt:   coupon?.expiresAt   ? coupon.expiresAt.slice(0, 10) : '',
    isActive:    coupon?.isActive    ?? true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Code is required.'); return }
    setSaving(true); setError('')
    try {
      if (isEdit) {
        const req: UpdateCouponRequest = {
          type: form.type, value: Number(form.value), minAmount: Number(form.minAmount),
          maxDiscount: form.maxDiscount !== '' ? Number(form.maxDiscount) : undefined,
          usageLimit:  form.usageLimit  !== '' ? Number(form.usageLimit)  : undefined,
          expiresAt:   form.expiresAt   || undefined, isActive: form.isActive,
        }
        await adminService.updateCoupon(coupon!.id, req)
      } else {
        const req: CreateCouponRequest = {
          code: form.code.trim().toUpperCase(), type: form.type,
          value: Number(form.value), minAmount: Number(form.minAmount),
          maxDiscount: form.maxDiscount !== '' ? Number(form.maxDiscount) : undefined,
          usageLimit:  form.usageLimit  !== '' ? Number(form.usageLimit)  : undefined,
          expiresAt:   form.expiresAt   || undefined,
        }
        await adminService.createCoupon(req)
      }
      onSaved(); onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to save coupon.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Coupon' : 'Create Coupon'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Code *', key: 'code', type: 'text',   disabled: isEdit, transform: (v: string) => v.toUpperCase() },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                <input value={String(form[f.key as keyof typeof form])}
                  onChange={e => set(f.key, f.transform ? f.transform(e.target.value) : e.target.value)}
                  disabled={f.disabled}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono uppercase
                             focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed (₹)</option>
              </select>
            </div>
            {[
              { label: `Value ${form.type === 'Percentage' ? '(%)' : '(₹)'}`, key: 'value' },
              { label: 'Min Order (₹)',   key: 'minAmount' },
              { label: 'Max Discount (₹) — optional', key: 'maxDiscount', placeholder: 'No limit' },
              { label: 'Usage Limit — optional',       key: 'usageLimit',  placeholder: 'Unlimited' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                <input type="number" min="0" value={String(form[f.key as keyof typeof form])}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Expires At — optional</label>
              <input type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {isEdit && (
              <div className="flex items-center gap-2 pt-5">
                <input type="checkbox" id="isActive" checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <Button onClick={handleSave} loading={saving} className="flex-1 rounded-xl py-2.5 text-sm">
            {isEdit ? 'Save Changes' : 'Create Coupon'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-gray-600">Page {page} of {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === pages}
        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const user     = useSelector((s: RootState) => s.auth.user)
  const [tab, setTab] = useState<Tab>('dashboard')

  // Dashboard
  const [dashboard,   setDashboard]   = useState<AdminDashboardDto | null>(null)
  const [analytics,   setAnalytics]   = useState<AdminAnalyticsDto | null>(null)
  const [dashLoading, setDashLoading] = useState(true)

  // Users
  const [users,         setUsers]         = useState<AdminUserDto[]>([])
  const [userTotal,     setUserTotal]     = useState(0)
  const [userPage,      setUserPage]      = useState(1)
  const [userSearch,    setUserSearch]    = useState('')
  const [usersLoading,  setUsersLoading]  = useState(false)
  const [blockTarget,   setBlockTarget]   = useState<AdminUserDto | null>(null)
  const [blocking,      setBlocking]      = useState(false)

  // Bookings
  const [bookings,        setBookings]        = useState<BookingDto[]>([])
  const [bookingTotal,    setBookingTotal]    = useState(0)
  const [bookingPage,     setBookingPage]     = useState(1)
  const [bookingStatus,   setBookingStatus]   = useState('')
  const [bookingType,     setBookingType]     = useState('')
  const [bookingsLoading, setBookingsLoading] = useState(false)

  // Coupons
  const [coupons,         setCoupons]         = useState<CouponDto[]>([])
  const [couponsLoading,  setCouponsLoading]  = useState(false)
  const [couponModal,     setCouponModal]     = useState<'create' | CouponDto | null>(null)
  const [deleteTarget,    setDeleteTarget]    = useState<CouponDto | null>(null)
  const [deleting,        setDeleting]        = useState(false)

  const PAGE_SIZE = 15

  useEffect(() => {
    if (user && user.role !== 'Admin') navigate('/')
  }, [user, navigate])

  // Load dashboard + analytics together
  useEffect(() => {
    if (tab !== 'dashboard') return
    setDashLoading(true)
    Promise.all([adminService.getDashboard(), adminService.getAnalytics()])
      .then(([d, a]) => { setDashboard(d); setAnalytics(a) })
      .finally(() => setDashLoading(false))
  }, [tab])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await adminService.getUsers(userPage, PAGE_SIZE, userSearch || undefined)
      setUsers(res.data ?? [])
      setUserTotal(res.meta?.total ?? 0)
    } finally { setUsersLoading(false) }
  }, [userPage, userSearch])

  useEffect(() => { if (tab === 'users') loadUsers() }, [tab, loadUsers])

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const res = await adminService.getBookings(bookingPage, PAGE_SIZE, bookingStatus, bookingType)
      setBookings(res.data ?? [])
      setBookingTotal(res.meta?.total ?? 0)
    } finally { setBookingsLoading(false) }
  }, [bookingPage, bookingStatus, bookingType])

  useEffect(() => { if (tab === 'bookings') loadBookings() }, [tab, loadBookings])

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true)
    try { setCoupons(await adminService.getCoupons()) }
    finally { setCouponsLoading(false) }
  }, [])

  useEffect(() => { if (tab === 'coupons') loadCoupons() }, [tab, loadCoupons])

  const handleToggleBlock = async () => {
    if (!blockTarget) return
    setBlocking(true)
    try {
      const updated = await adminService.toggleBlock(blockTarget.id)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      setBlockTarget(null)
    } finally { setBlocking(false) }
  }

  const handleDeleteCoupon = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminService.deleteCoupon(deleteTarget.id)
      setCoupons(prev => prev.filter(c => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users',     label: 'Users',     icon: Users },
    { id: 'bookings',  label: 'Bookings',  icon: BookOpen },
    { id: 'coupons',   label: 'Coupons',   icon: Tag },
  ]

  const skeletonRows = (cols: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}><td colSpan={cols} className="px-5 py-3.5">
        <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
      </td></tr>
    ))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {couponModal !== null && (
        <CouponModal
          coupon={couponModal === 'create' ? null : couponModal}
          onClose={() => setCouponModal(null)}
          onSaved={loadCoupons}
        />
      )}
      <ConfirmDialog
        open={blockTarget !== null}
        title={blockTarget?.isActive ? 'Block User?' : 'Unblock User?'}
        message={blockTarget?.isActive
          ? `Block "${blockTarget?.name}"? They won't be able to log in.`
          : `Unblock "${blockTarget?.name}"? They can log in again.`}
        confirmLabel={blockTarget?.isActive ? 'Block User' : 'Unblock User'}
        cancelLabel="Cancel"
        variant={blockTarget?.isActive ? 'danger' : 'warning'}
        loading={blocking}
        onConfirm={handleToggleBlock}
        onCancel={() => setBlockTarget(null)}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Deactivate Coupon?"
        message={`Deactivate coupon "${deleteTarget?.code}"? It will no longer be usable by customers.`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteCoupon}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">TravelPort Management Console</p>
          </div>
          <span className="text-sm font-medium text-gray-500">Logged in as <strong>{user?.name}</strong></span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-100 px-6 sticky top-[57px] z-10">
        <div className="mx-auto max-w-7xl flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}>
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-8">
            {dashLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : dashboard && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Users"      value={dashboard.totalUsers}                      icon={Users}         color="bg-blue-500" />
                  <StatCard label="Total Bookings"   value={dashboard.totalBookings}                   icon={BookOpen}      color="bg-indigo-500" />
                  <StatCard label="Total Revenue"    value={formatCurrency(dashboard.totalRevenue)}    icon={TrendingUp}    color="bg-green-500" />
                  <StatCard label="Avg Booking"      value={formatCurrency(dashboard.avgBookingValue)} icon={TrendingDown}  color="bg-purple-500" />
                  <StatCard label="Active Bookings"  value={dashboard.activeBookings}                  icon={BookOpen}      color="bg-emerald-500" />
                  <StatCard label="Cancelled"        value={dashboard.cancelledBookings}               icon={Tag}           color="bg-red-500" />
                  <StatCard label="Flight Bookings"  value={dashboard.flightBookings}                  icon={Plane}         color="bg-orange-500" />
                  <StatCard label="Hotel Bookings"   value={dashboard.hotelBookings}                   icon={Hotel}         color="bg-cyan-500" />
                </div>

                {analytics && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-5">Monthly Revenue (Last 6 Months)</h3>
                      {analytics.monthlyRevenue.length === 0
                        ? <p className="text-sm text-gray-400">No revenue data yet.</p>
                        : (() => {
                            const max = Math.max(...analytics.monthlyRevenue.map(m => m.revenue), 1)
                            return (
                              <div className="space-y-3">
                                {analytics.monthlyRevenue.map(m => (
                                  <SimpleBar key={m.month} label={m.month} value={m.revenue} max={max} color="bg-blue-500" />
                                ))}
                              </div>
                            )
                          })()
                      }
                    </div>

                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Bookings by Type</h3>
                        <div className="space-y-3">
                          {analytics.bookingsByType.map(bt => (
                            <div key={bt.type} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                              <div className="flex items-center gap-2">
                                {bt.type === 'Flight'
                                  ? <Plane className="h-4 w-4 text-orange-500" />
                                  : <Hotel className="h-4 w-4 text-blue-600" />}
                                <span className="text-sm font-semibold text-gray-700">{bt.type}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{bt.count} bookings</p>
                                <p className="text-xs text-gray-400">{formatCurrency(bt.revenue)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Bookings by Status</h3>
                        <div className="flex flex-wrap gap-2">
                          {analytics.bookingsByStatus.map(bs => (
                            <div key={bs.status}
                              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700">
                              {bs.status}
                              <span className="bg-white rounded-full px-1.5 py-0.5 text-gray-900">{bs.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── USERS ─────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
                  placeholder="Search name or email…"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={loadUsers} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
              <span className="text-sm text-gray-400">{userTotal} total</span>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Bookings</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usersLoading ? skeletonRows(7) : users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={u.role === 'Admin' ? 'info' : 'default'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Blocked'}</Badge>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-700">{formatCurrency(u.walletBalance)}</td>
                      <td className="px-4 py-3.5 text-gray-600">{u.totalBookings}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        {u.role !== 'Admin' && (
                          <button onClick={() => setBlockTarget(u)}
                            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                              u.isActive
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}>
                            {u.isActive
                              ? <><ShieldOff className="h-3.5 w-3.5" /> Block</>
                              : <><ShieldCheck className="h-3.5 w-3.5" /> Unblock</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={userPage} total={userTotal} pageSize={PAGE_SIZE} onChange={setUserPage} />
          </div>
        )}

        {/* ── BOOKINGS ──────────────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select value={bookingStatus} onChange={e => { setBookingStatus(e.target.value); setBookingPage(1) }}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                <option>Confirmed</option><option>Pending</option>
                <option>Cancelled</option><option>Completed</option>
              </select>
              <select value={bookingType} onChange={e => { setBookingType(e.target.value); setBookingPage(1) }}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Types</option>
                <option>Flight</option><option>Hotel</option>
              </select>
              <button onClick={loadBookings} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
              <span className="text-sm text-gray-400">{bookingTotal} total</span>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookingsLoading ? skeletonRows(7) : bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs font-bold text-gray-900">{b.bookingReference}</p>
                        {b.couponCode && <p className="text-xs text-green-600 mt-0.5">🏷 {b.couponCode}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800 text-xs">{b.userName ?? '—'}</p>
                        <p className="text-xs text-gray-400">{b.userEmail ?? ''}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {b.type === 'Flight'
                            ? <Plane className="h-3.5 w-3.5 text-orange-500" />
                            : <Hotel className="h-3.5 w-3.5 text-blue-600" />}
                          <span className="text-xs font-semibold text-gray-600">{b.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[140px] truncate">
                        {b.type === 'Flight'
                          ? `${b.origin ?? ''} → ${b.destination ?? ''}`
                          : (b.hotelName ?? '—')}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={
                          b.status === 'Confirmed' ? 'success'
                            : b.status === 'Cancelled' ? 'danger'
                            : b.status === 'Pending'   ? 'warning' : 'default'
                        }>{b.status}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-gray-900">{formatCurrency(b.finalAmount)}</p>
                        {b.discountAmount > 0 && (
                          <p className="text-xs text-green-600">-{formatCurrency(b.discountAmount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{fmtDate(b.bookingDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={bookingPage} total={bookingTotal} pageSize={PAGE_SIZE} onChange={setBookingPage} />
          </div>
        )}

        {/* ── COUPONS ───────────────────────────────────────────────────── */}
        {tab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={loadCoupons} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                </button>
                <span className="text-sm text-gray-400">{coupons.length} coupons</span>
              </div>
              <Button onClick={() => setCouponModal('create')} className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" /> Create Coupon
              </Button>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Min Order</th>
                    <th className="px-4 py-3">Usage</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {couponsLoading ? skeletonRows(8) : coupons.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs">{c.type}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900">
                        {c.type === 'Percentage' ? `${c.value}%` : formatCurrency(c.value)}
                        {c.maxDiscount != null && (
                          <span className="text-xs text-gray-400 ml-1">(max {formatCurrency(c.maxDiscount)})</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{formatCurrency(c.minAmount)}</td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs">
                        {c.usedCount}{c.usageLimit != null ? `/${c.usageLimit}` : ' used'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">
                        {c.expiresAt ? fmtDate(c.expiresAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={c.isActive ? 'success' : 'danger'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setCouponModal(c)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {c.isActive && (
                            <button onClick={() => setDeleteTarget(c)}
                              title="Deactivate"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
