import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plane, Hotel, Car, Train, Bus, LogOut, Menu, X, ShieldCheck, Wallet, BookOpen, UserCircle, ChevronDown, Bell, Check, Moon, Sun, Sparkles } from 'lucide-react'
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

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false)
      if (!notifRef.current?.contains(e.target as Node))   setNotifOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

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

  const handleDelete = async (e: React.MouseEvent, id: string, isRead: boolean) => {
    e.stopPropagation()
    await api.delete(`/users/notifications/${id}`).catch(() => {})
    setNotifications(prev => prev.filter(n => n.id !== id))
    if (!isRead) setUnreadCount(c => Math.max(0, c - 1))
  }

  const notifIcon: Record<string, string> = {
    BookingConfirmed: '✈️',
    BookingCancelled: '❌',
    CouponExpiring:   '🎫',
    PriceDrop:        '📉',
  }

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
    <nav className="sticky top-0 z-50 bg-navbar-gradient shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-pink shadow-glow-orange">
              <Plane className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              Travel<span className="text-gradient">Port</span>
            </span>
          </Link>

          {/* Mode tabs (desktop) */}
          <div className="hidden md:flex items-center gap-0.5 ml-8">
            {MODES.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                className={[
                  'relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive(to)
                    ? 'text-white bg-white/15'
                    : 'text-white/70 hover:text-white hover:bg-white/10',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {label}
                {isActive(to) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-brand-orange" />
                )}
              </Link>
            ))}
          </div>

          {/* Right actions (desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="flex items-center justify-center h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-all">
                      <ShieldCheck className="h-4 w-4" /> Admin
                    </button>
                  </Link>
                )}

                {/* Notification bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotifOpen(p => !p)}
                    className="relative flex items-center justify-center h-9 w-9 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    aria-label="Notifications"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white shadow">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
                        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-brand-orange hover:text-brand-orange-dark font-semibold">
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
                            <div
                              key={n.id}
                              className={`group relative flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700 transition-colors hover:bg-orange-50/50 dark:hover:bg-gray-700/50 ${n.isRead ? '' : 'bg-orange-50/30 dark:bg-orange-900/10'}`}
                            >
                              <button
                                onClick={() => !n.isRead && handleMarkRead(n.id)}
                                className="flex items-start gap-3 min-w-0 flex-1 text-left"
                              >
                                <span className="text-xl shrink-0 mt-0.5">{notifIcon[n.type] ?? '🔔'}</span>
                                <div className="min-w-0 flex-1 pr-5">
                                  <p className={`text-sm leading-snug ${n.isRead ? 'text-gray-700 dark:text-gray-300' : 'font-semibold text-gray-900 dark:text-gray-100'}`}>{n.title}</p>
                                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-snug">{n.message}</p>
                                  <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">
                                    {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              </button>
                              {!n.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-orange shrink-0" />}
                              <button
                                onClick={e => handleDelete(e, n.id, n.isRead)}
                                className="absolute right-2 top-2 p-1 rounded-md text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-600 transition-all"
                                title="Dismiss"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
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
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition-all border border-white/20"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-orange to-brand-pink flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {initials}
                    </div>
                    {firstName}
                    <ChevronDown className={`h-3.5 w-3.5 opacity-70 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
                      {/* User header */}
                      <div className="px-4 py-3 bg-navbar-gradient text-white">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-orange to-brand-pink flex items-center justify-center text-sm font-bold shrink-0">{initials}</div>
                          <div>
                            <p className="font-semibold text-sm">{user?.name}</p>
                            <p className="text-xs text-white/60">{user?.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Wallet */}
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-orange-50 dark:bg-orange-900/10">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-3.5 w-3.5 text-brand-orange" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">Wallet Balance</span>
                          <span className="ml-auto text-sm font-bold text-brand-orange">
                            {walletBalance === null ? '...' : formatCurrency(walletBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        <Link to="/bookings" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                          <BookOpen className="h-4 w-4 text-brand-orange" /> My Bookings
                        </Link>
                        <Link to="/ai-planner" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                          <Sparkles className="h-4 w-4 text-brand-purple" />
                          <span>AI Trip Planner</span>
                          <span className="ml-auto rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-700">New</span>
                        </Link>
                        <Link to="/profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                          <UserCircle className="h-4 w-4 text-gray-400" /> Profile & Settings
                        </Link>
                      </div>

                      <div className="border-t border-gray-100 dark:border-gray-700 p-2">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
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
                  <button className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white hover:bg-white/10 border border-white/20 transition-all">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-4 py-1.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-orange to-brand-pink hover:shadow-glow-orange transition-all">
                    Sign Up
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 ml-auto transition-all"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 py-3 flex flex-col gap-1 text-sm">
            {MODES.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  isActive(to)
                    ? 'bg-white/15 text-white font-semibold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm bg-orange-500/10 rounded-xl mx-1 mb-1">
                    <Wallet className="h-4 w-4 text-brand-orange" />
                    <span className="text-white/70">Wallet</span>
                    <span className="ml-auto font-bold text-brand-orange">{walletBalance !== null ? formatCurrency(walletBalance) : '...'}</span>
                  </div>
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10">
                      <ShieldCheck className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <Link to="/bookings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10">
                    <BookOpen className="h-4 w-4" /> My Bookings
                  </Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/80 hover:bg-white/10">
                    <UserCircle className="h-4 w-4" /> Profile & Settings
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false) }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 w-full font-semibold mt-1 transition-all"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-xl text-white/80 hover:bg-white/10">Login</Link>
                  <Link to="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-pink text-white font-semibold mt-1">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
