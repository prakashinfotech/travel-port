import { Link, useNavigate } from 'react-router-dom'
import { Plane, Hotel, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-xl">
            <Plane className="h-6 w-6" />
            TravelPort
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/flights" className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
              <Plane className="h-4 w-4" /> Flights
            </Link>
            <Link to="/hotels" className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
              <Hotel className="h-4 w-4" /> Hotels
            </Link>
          </div>

          {/* Auth actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/bookings" className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-primary-600">
                  <User className="h-4 w-4" />
                  {user?.name}
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
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 flex flex-col gap-3 text-sm">
            <Link to="/flights" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50">
              <Plane className="h-4 w-4" /> Flights
            </Link>
            <Link to="/hotels" className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50">
              <Hotel className="h-4 w-4" /> Hotels
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/bookings" className="px-2 py-1 rounded hover:bg-gray-50">My Bookings</Link>
                <button onClick={handleLogout} className="text-left px-2 py-1 text-red-600">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-2 py-1">Login</Link>
                <Link to="/register" className="px-2 py-1">Sign Up</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
