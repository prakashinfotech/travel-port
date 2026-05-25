import { Plane, Mail, Phone, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="mt-auto bg-brand-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-brand-pink shadow-glow-orange">
                <Plane className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Travel<span className="text-gradient">Port</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-white/50 leading-relaxed">
              India's smartest travel booking portal. Flights, hotels, buses, trains & cabs — all in one place.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-xs text-white/40">
              <span className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-brand-orange" /> support@travelport.in</span>
              <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-brand-orange" /> 1800-123-4567</span>
              <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-brand-orange" /> Mumbai, India</span>
            </div>
          </div>

          {/* Travel */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-4">Travel</h3>
            <ul className="space-y-2.5 text-sm text-white/50">
              {[
                { to: '/flights', label: 'Flights' },
                { to: '/hotels',  label: 'Hotels' },
                { to: '/buses',   label: 'Buses' },
                { to: '/trains',  label: 'Trains' },
                { to: '/cabs',    label: 'Cabs' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="hover:text-brand-orange transition-colors duration-200">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-4">Account</h3>
            <ul className="space-y-2.5 text-sm text-white/50">
              {[
                { to: '/bookings',    label: 'My Bookings' },
                { to: '/profile',     label: 'Profile' },
                { to: '/ai-planner',  label: 'AI Trip Planner' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="hover:text-brand-orange transition-colors duration-200">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-orange mb-4">Support</h3>
            <ul className="space-y-2.5 text-sm text-white/50">
              <li><span className="cursor-default hover:text-brand-orange transition-colors">Help Centre</span></li>
              <li><span className="cursor-default hover:text-brand-orange transition-colors">Contact Us</span></li>
              <li><span className="cursor-default hover:text-brand-orange transition-colors">Cancellation Policy</span></li>
              <li><span className="cursor-default hover:text-brand-orange transition-colors">Privacy Policy</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} TravelPort. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {['Visa', 'Mastercard', 'UPI', 'NetBanking'].map(method => (
              <span key={method} className="px-2.5 py-1 rounded-md bg-white/5 text-[10px] font-semibold text-white/40 border border-white/10">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
