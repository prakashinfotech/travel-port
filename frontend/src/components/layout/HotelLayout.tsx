import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  BookOpen,
  BedDouble,
  Building2,
  LogOut,
  Hotel,
  CalendarSearch,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/hotel/dashboard',    icon: LayoutDashboard, label: 'Dashboard'    },
  { to: '/hotel/bookings',     icon: BookOpen,        label: 'Bookings'     },
  { to: '/hotel/rooms',        icon: BedDouble,       label: 'Rooms'        },
  { to: '/hotel/availability', icon: CalendarSearch,  label: 'Availability' },
  { to: '/hotel/profile',      icon: Building2,       label: 'My Hotel'     },
]

export function HotelLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600">
            <Hotel className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">Hotel Portal</p>
            <p className="text-xs text-gray-500 truncate max-w-[140px]">{user?.name}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-50 text-sky-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
