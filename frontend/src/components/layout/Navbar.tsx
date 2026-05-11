import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Plane, Hotel, Car, Train, Bus, User, LogOut, Menu, X, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

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
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) =>
    path.startsWith('#') ? false : location.pathname.startsWith(path)

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

          {/* Auth actions */}
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
                <Link to="/bookings" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-700 transition-colors px-2">
                  <User className="h-4 w-4" />
                  {user?.name?.split(' ')[0]}
                </Link>
                <Link to="/profile">
                  <Button variant="outline" size="sm">Profile</Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Logout
                </Button>
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
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                      <ShieldCheck className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                  <Link to="/bookings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    <User className="h-4 w-4" /> My Bookings
                  </Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
                    Profile
                  </Link>
                  <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 w-full">
                    <LogOut className="h-4 w-4" /> Logout
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
