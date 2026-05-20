import { Plane } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-primary-700 font-bold text-lg">
              <Plane className="h-5 w-5" /> TravelPort
            </Link>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Book flights & hotels at the best prices.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Travel</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/flights" className="hover:text-primary-600 dark:hover:text-blue-400">Flights</Link></li>
              <li><Link to="/hotels" className="hover:text-primary-600 dark:hover:text-blue-400">Hotels</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/bookings" className="hover:text-primary-600 dark:hover:text-blue-400">My Bookings</Link></li>
              <li><Link to="/profile" className="hover:text-primary-600 dark:hover:text-blue-400">Profile</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Support</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
              <li><span className="cursor-default">Help Centre</span></li>
              <li><span className="cursor-default">Contact Us</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6 text-center text-xs text-gray-400 dark:text-gray-500">
          © {new Date().getFullYear()} TravelPort. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
