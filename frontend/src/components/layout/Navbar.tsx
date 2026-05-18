import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plane, Hotel, Car, Train, Bus, LogOut, Menu, X, ShieldCheck, Wallet, BookOpen, UserCircle, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { userService } from '@/services/userService'
import { formatCurrency } from '@/utils/formatters'

const MODES = [
  { to: '/flights', label: 'Flights', icon: Plane },
  { to: '/hotels',  label: 'Hotels',  icon: Hotel },
  { to: '/cabs',    label: 'Cabs',    icon: Car },
  { to: '/trains',  label: 'Trains',  icon: Train },
  { to: '/buses',   label: 'Buses',   icon: Bus },
]

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen]         = useState(false)
  const [profileOpen, setProfileOpen]   = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Fetch wallet balance when dropdown opens
  useEffect(() => {
    if (profileOpen && walletBalance === null && isAuthenticated) {
      userService.getWallet()
        .then(r => setWalletBalance(r.data?.balance ?? 0))
        .catch(() => setWalletBalance(0))
    }
  }, [profileOpen, isAuthenticated, walletBalance])

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
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-blue-700 font-bold text-xl shrink-0">
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
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </div>

          {/* Auth actions (desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <ShieldCheck className="h-4 w-4" /> Admin
                    </Button>
                  </Link>
                )}

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
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 ml-auto"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-1 text-sm">
            {MODES.map(({ to, label, icon: Icon }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700"
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
