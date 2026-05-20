import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plane, Hotel, Car, Train, Bus, LogOut, Menu, X, ShieldCheck, Wallet, BookOpen, UserCircle, ChevronDown, Bell, Check, Moon, Sun } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { userService } from '@/services/userService'
import { formatCurrency } from '@/utils/formatters'
import { api } from '@/api/axios'
import { useDarkMode } from '@/hooks/useDarkMode'

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

const MODES = [
  { to: '/flights', label: 'Flights', icon: Plane },
  { to: '/hotels',  label: 'Hotels',  icon: Hotel },
  { to: '/cabs',    label: 'Cabs',    icon: Car },
  { to: '/trains',  label: 'Trains',  icon: Train },
  { to: '/buses',   label: 'Buses',   icon: Bus },
]

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { dark, toggle: toggleDark } = useDarkMode()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen]           = useState(false)
  const [profileOpen, setProfileOpen]     = useState(false)
  const [notifOpen, setNotifOpen]         = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [unreadCount, setUnreadCount]     = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const profileRef = useRef<HTMLDivElement>(null)
  const notifRef   = useRef<HTMLDivElement>(null)

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false)
      if (!notifRef.current?.contains(e.target as Node))   setNotifOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Poll unread count every 30s when logged in
  const fetchUnread = useCallback(async () => {
    if (!isAuthenticated) return
    try {
      const res = await api.get<{ data: number }>('/users/notifications/unread-count')
      setUnreadCount((res.data as { data: number }).data ?? 0)
    } catch { /* ignore */ }
  }, [isAuthenticated])

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30_000)
    return () => clearInterval(interval)
  }, [fetchUnread])

  // Load notifications when bell opens
  useEffect(() => {
    if (!notifOpen || !isAuthenticated) return
    api.get<{ data: NotificationItem[] }>('/users/notifications')
      .then(res => setNotifications((res.data as { data: NotificationItem[] }).data ?? []))
      .catch(() => {})
  }, [notifOpen, isAuthenticated])

  const handleMarkAllRead = async () => {
    await api.patch('/users/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const handleMarkRead = async (id: string) => {
    await api.patch(`/users/notifications/${id}/read`).catch(() => {})
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  const notifIcon: Record<string, string> = {
    BookingConfirmed: '✈️',
    BookingCancelled: '❌',
    CouponExpiring:   '🎫',
    PriceDrop:        '📉',
  }

  // Fetch wallet balance when dropdown opens
  useEffect(() => {
    if (profileOpen && isAuthenticated) {
      userService.getWallet()
        .then(r => setWalletBalance(r.data?.balance ?? 0))
        .catch(() => setWalletBalance(0))
    }
  }, [profileOpen, isAuthenticated])

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    navigate('/')
  }

  const isActive = (path: string) =>
    path.startsWith('#') ? false : location.pathname.startsWith(path)

  const firstName = user?.name?.split(' ')[0] ?? 'Account'
  const initials  = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U'

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 shadow-sm border-b border-gray-100 dark:border-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xl shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-700">
              <Plane className="h-4 w-4 text-white" />
            </div>
            TravelPort
          </Link>

          {/* Mode tabs (desktop) */}
          <div className="hidden md:flex items-center gap-1 ml-6">
            {MODES.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className={[
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(to)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </div>

          {/* Auth actions (desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="flex items-center justify-center h-9 w-9 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <ShieldCheck className="h-4 w-4" /> Admin
                    </Button>
                  </Link>
                )}

                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(p => !p)}
                    className="relative flex items-center justify-center h-9 w-9 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                            <Check className="h-3 w-3" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="py-10 text-center text-gray-400 text-sm">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={() => !n.isRead && handleMarkRead(n.id)}
                              className={`w-full text-left px-4 py-3 border-b border-gray-50 transition-colors hover:bg-gray-50 ${n.isRead ? '' : 'bg-blue-50/50'}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-xl shrink-0 mt-0.5">{notifIcon[n.type] ?? '🔔'}</span>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm leading-snug ${n.isRead ? 'text-gray-700' : 'font-semibold text-gray-900'}`}>{n.title}</p>
                                  <p className="mt-0.5 text-xs text-gray-500 leading-snug">{n.message}</p>
                                  <p className="mt-1 text-[10px] text-gray-400">
                                    {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 transition-colors border border-blue-100"
                  >
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {initials}
                    </div>
                    {firstName}
                    <ChevronDown className={`h-3 w-3 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                      {/* User info */}
                      <div className="px-4 py-3 bg-gradient-to-r from-blue-700 to-blue-900 text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
                          <div>
                            <p className="font-semibold text-sm">{user?.name}</p>
                            <p className="text-xs text-blue-200">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Wallet balance (info only) */}
                      <div className="px-4 py-2.5 border-b border-gray-100 bg-green-50">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs text-gray-500">Wallet Balance</span>
                          <span className="ml-auto text-sm font-bold text-green-700">
                            {walletBalance === null ? '...' : formatCurrency(walletBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Navigation links */}
                      <div className="py-1">
                        <Link
                          to="/bookings"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <BookOpen className="h-4 w-4 text-gray-400" /> My Bookings
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <UserCircle className="h-4 w-4 text-gray-400" /> Profile & Settings
                        </Link>
                      </div>

                      {/* Logout — distinct red styling */}
                      <div className="border-t border-gray-100 p-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ml-auto"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-gray-800 py-3 flex flex-col gap-1 text-sm">
            {MODES.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-2">
              {isAuthenticated ? (
                <>
                  {/* Wallet info in mobile */}
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 bg-green-50 rounded-lg mx-1 mb-1">
                    <Wallet className="h-4 w-4 text-green-600" />
                    <span>Wallet</span>
                    <span className="ml-auto font-bold text-green-700">{walletBalance !== null ? formatCurrency(walletBalance) : '...'}</span>
                  </div>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <ShieldCheck className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <Link to="/bookings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <BookOpen className="h-4 w-4" /> My Bookings
                  </Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <UserCircle className="h-4 w-4" /> Profile & Settings
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false) }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 w-full font-semibold mt-1"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">Login</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg hover:bg-blue-50 text-blue-700 font-medium">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
