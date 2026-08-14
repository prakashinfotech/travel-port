import { useState, useRef, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  Plane, Hotel, Bus, Train, Car,
  Search, ArrowLeftRight, CalendarDays,
  ChevronDown, ChevronUp, Clock, MapPin, TrendingUp,
  Shield, HeadphonesIcon, Tag, BadgePercent, Zap, X, Copy, Check, Sparkles
} from 'lucide-react'
import { AirportSearch } from '@/components/search/AirportSearch'
import { CitySearch } from '@/components/search/CitySearch'
import { TravellerSelector, type TravellerConfig } from '@/components/search/TravellerSelector'
import { AuthModal } from '@/components/home/AuthModal'
import { NaturalLanguageSearch } from '@/components/ai/NaturalLanguageSearch'
import { AiRecommendations } from '@/components/ai/AiRecommendations'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { FeaturedCouponDto } from '@/types'

type TravelMode   = 'flight' | 'hotel' | 'bus' | 'train' | 'cab'
type TripType     = 'oneway' | 'roundtrip'
type OfferFilter  = 'All' | 'Bank Offers' | 'Flights' | 'Hotels' | 'Cabs' | 'Trains'

const TODAY = new Date().toISOString().split('T')[0]

function localDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultCabPickup(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0)
  return localDatetimeValue(d)
}

// ── Mode config ──────────────────────────────────────────────────────────────
const MODES: { id: TravelMode; label: string; icon: React.ElementType }[] = [
  { id: 'flight', label: 'Flights', icon: Plane  },
  { id: 'hotel',  label: 'Hotels',  icon: Hotel  },
  { id: 'cab',    label: 'Cabs',    icon: Car    },
  { id: 'train',  label: 'Trains',  icon: Train  },
  { id: 'bus',    label: 'Bus',     icon: Bus    },
]

const MODE_THEME: Record<TravelMode, { bgImage: string; overlay: string; accent: string; ring: string }> = {
  flight: { bgImage: 'url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80)', overlay: 'rgba(12,20,69,0.72)',   accent: '#f97316', ring: 'focus:ring-blue-500'  },
  hotel:  { bgImage: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80)', overlay: 'rgba(124,45,18,0.70)', accent: '#f97316', ring: 'focus:ring-orange-500' },
  bus:    { bgImage: 'url(https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=80)', overlay: 'rgba(20,83,45,0.72)',   accent: '#22c55e', ring: 'focus:ring-green-500'  },
  train:  { bgImage: 'url(https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1600&q=80)', overlay: 'rgba(30,58,138,0.72)', accent: '#818cf8', ring: 'focus:ring-indigo-500' },
  cab:    { bgImage: 'url(https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1600&q=80)', overlay: 'rgba(120,53,15,0.72)', accent: '#fbbf24', ring: 'focus:ring-yellow-500' },
}

// ── Offers ───────────────────────────────────────────────────────────────────
const OFFERS = [
  { id: 1, category: 'Flights',      title: 'Flat 10% off on first flight booking',  code: 'FIRST10',  bank: null,   color: 'from-blue-500 to-blue-700',    desc: 'Use code at checkout. Valid for new users.'  },
  { id: 2, category: 'Bank Offers',  title: 'Extra ₹500 off with HDFC Credit Card',  code: 'HDFC500',  bank: 'HDFC', color: 'from-purple-500 to-purple-700', desc: 'Applicable on bookings above ₹3000.'          },
  { id: 3, category: 'Hotels',       title: 'Up to ₹500 off on hotel booking',        code: 'HOTEL500', bank: null,   color: 'from-orange-500 to-orange-700', desc: 'Save big on your next hotel stay.'            },
  { id: 4, category: 'Flights',      title: 'Summer special — 20% off domestic flights', code: 'SUMMER20', bank: null, color: 'from-sky-500 to-sky-700',      desc: 'Limited period offer, book now!'             },
  { id: 5, category: 'Bank Offers',  title: 'Save ₹100 with SBI Debit Card',          code: 'SAVE100',  bank: 'SBI', color: 'from-green-500 to-green-700',   desc: 'Valid on all bookings.'                       },
  { id: 6, category: 'Cabs',         title: 'Flat 15% off on cab bookings',           code: 'FLAT15',   bank: null,  color: 'from-yellow-500 to-yellow-700', desc: 'Book your ride at a great price.'            },
]

// ── Popular content per mode ─────────────────────────────────────────────────
const POPULAR_FLIGHT_ROUTES = [
  { from: 'DEL', fromCity: 'Delhi',     to: 'BOM', toCity: 'Mumbai',    price: 2899, duration: '2h 15m' },
  { from: 'BOM', fromCity: 'Mumbai',    to: 'GOI', toCity: 'Goa',       price: 3199, duration: '1h 20m' },
  { from: 'BLR', fromCity: 'Bangalore', to: 'DEL', toCity: 'Delhi',     price: 3499, duration: '2h 40m' },
  { from: 'HYD', fromCity: 'Hyderabad', to: 'BOM', toCity: 'Mumbai',    price: 2599, duration: '1h 30m' },
  { from: 'DEL', fromCity: 'Delhi',     to: 'BLR', toCity: 'Bangalore', price: 3299, duration: '2h 50m' },
  { from: 'MAA', fromCity: 'Chennai',   to: 'BOM', toCity: 'Mumbai',    price: 3099, duration: '2h 10m' },
]

const POPULAR_BUS_ROUTES = [
  { from: 'Mumbai',    to: 'Pune',           price: 299,  duration: '3h 30m' },
  { from: 'Delhi',     to: 'Agra',           price: 399,  duration: '4h 00m' },
  { from: 'Bangalore', to: 'Mysore',         price: 199,  duration: '3h 00m' },
  { from: 'Chennai',   to: 'Pondicherry',    price: 249,  duration: '3h 30m' },
  { from: 'Jaipur',    to: 'Jodhpur',        price: 450,  duration: '5h 00m' },
  { from: 'Hyderabad', to: 'Tirupati',       price: 599,  duration: '6h 30m' },
]

const POPULAR_TRAIN_ROUTES = [
  { from: 'Delhi',     to: 'Mumbai',    name: 'Rajdhani Express',  price: 1499, duration: '16h 35m' },
  { from: 'Mumbai',    to: 'Goa',       name: 'Tejas Express',     price: 899,  duration: '8h 30m'  },
  { from: 'Bangalore', to: 'Chennai',   name: 'Shatabdi Express',  price: 699,  duration: '5h 00m'  },
  { from: 'Kolkata',   to: 'Delhi',     name: 'Duronto Express',   price: 1999, duration: '17h 00m' },
  { from: 'Jaipur',    to: 'Delhi',     name: 'Intercity Express', price: 349,  duration: '4h 30m'  },
  { from: 'Hyderabad', to: 'Bangalore', name: 'Shatabdi Express',  price: 899,  duration: '10h 45m' },
]

const POPULAR_CAB_ROUTES = [
  { from: 'Mumbai Airport', to: 'Pune',             price: 1999, duration: '3h 30m' },
  { from: 'Delhi',          to: 'Agra',             price: 2499, duration: '3h 30m' },
  { from: 'Bangalore',      to: 'Mysore',           price: 1499, duration: '2h 45m' },
  { from: 'Chennai',        to: 'Mahabalipuram',    price: 899,  duration: '1h 30m' },
  { from: 'Jaipur',         to: 'Ajmer',            price: 1299, duration: '2h 30m' },
  { from: 'Hyderabad',      to: 'Visakhapatnam',    price: 5999, duration: '8h 00m' },
]

const POPULAR_HOTEL_CITIES = [
  { city: 'Goa',       desc: 'Beaches & Nightlife', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop', hotels: 120 },
  { city: 'Jaipur',    desc: 'Forts & Culture',     img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&h=300&fit=crop', hotels: 95  },
  { city: 'Mumbai',    desc: 'City of Dreams',       img: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&h=300&fit=crop', hotels: 210 },
  { city: 'Bangalore', desc: 'Garden City',          img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=300&fit=crop', hotels: 175 },
  { city: 'Kerala',    desc: "God's Own Country",    img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop', hotels: 140 },
  { city: 'Delhi',     desc: 'Heart of India',       img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop', hotels: 280 },
]

const FAQS = [
  { q: 'How do I book a flight on TravelPort?', a: 'Search for flights by entering your origin, destination, and date. Select a flight and click "Book Now". Complete the passenger details and payment to confirm your booking.' },
  { q: 'Can I cancel my booking?',              a: 'Yes, you can cancel bookings from the "My Bookings" section. A 90% refund will be credited to your TravelPort wallet within 24 hours of cancellation.' },
  { q: 'What payment methods are accepted?',    a: 'We accept Credit/Debit Cards, UPI, Net Banking, and TravelPort Wallet. All payments are secured with 256-bit SSL encryption.' },
  { q: 'How do I use a coupon code?',           a: 'Enter the coupon code in the designated field on the booking page before completing payment. The discount will be applied automatically.' },
  { q: 'Is my personal data safe?',             a: 'Absolutely. We use industry-standard encryption to protect your data. We never share your information with third parties without consent.' },
  { q: 'How do I track my booking?',            a: 'Log in to your account and go to "My Bookings". You\'ll find all your flight and hotel bookings along with their status and details.' },
]

// ── Recent searches ──────────────────────────────────────────────────────────
const RECENT_KEY = 'tp_recent_searches'
function saveRecentSearch(search: { type: string; label: string; sub: string; href: string }) {
  const prev    = getRecentSearches()
  const updated = [search, ...prev.filter(s => s.label !== search.label)].slice(0, 10)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}
function getRecentSearches(): Array<{ type: string; label: string; sub: string; href: string }> {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}
function removeRecentSearch(label: string) {
  const updated = getRecentSearches().filter(s => s.label !== label)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

// ── Mode icon for recent search chips ───────────────────────────────────────
function ModeIcon({ type, className }: { type: string; className: string }) {
  switch (type) {
    case 'hotel': return <Hotel className={className} />
    case 'bus':   return <Bus   className={className} />
    case 'train': return <Train className={className} />
    case 'cab':   return <Car   className={className} />
    default:      return <Plane className={className} />
  }
}

const MODE_ICON_COLOR: Record<string, string> = {
  flight: 'text-blue-500',
  hotel:  'text-orange-500',
  bus:    'text-green-500',
  train:  'text-indigo-500',
  cab:    'text-yellow-500',
}

// ── Hero date picker — underline style, opens system picker on full-div click ─
function HeroDatePicker({ label, value, onChange, min, type = 'date' }: {
  label: string; value: string; onChange: (v: string) => void; min?: string; type?: 'date' | 'datetime-local'
}) {
  const ref = useRef<HTMLInputElement>(null)
  const openPicker = () => { try { ref.current?.showPicker() } catch { ref.current?.focus() } }

  const display = value
    ? type === 'datetime-local'
      ? new Date(value).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
      : new Date(value + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <div className="flex-1 min-w-[130px] px-4 py-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <div
        role="button" tabIndex={0}
        onClick={openPicker}
        onKeyDown={e => e.key === 'Enter' && openPicker()}
        className="flex items-center gap-1.5 border-b-2 border-gray-300 focus-within:border-blue-600 pb-1 cursor-pointer select-none"
      >
        <CalendarDays className="h-4 w-4 text-gray-400 shrink-0" />
        <span className={`text-sm font-medium flex-1 ${display ? 'text-gray-900' : 'text-gray-400'}`}>
          {display ?? (type === 'datetime-local' ? 'Select date & time' : 'Select date')}
        </span>
        <input
          ref={ref}
          type={type}
          value={value}
          min={min}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.stopPropagation()}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
        />
      </div>
    </div>
  )
}

// ── Input helper ─────────────────────────────────────────────────────────────
function HeroInput({ label, value, onChange, type = 'text', placeholder, min }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; min?: string
}) {
  return (
    <div className="flex-1 min-w-[130px] px-4 py-2">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type} value={value} min={min} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b-2 border-gray-300 focus:border-blue-600 pb-1"
      />
    </div>
  )
}

// ── Hotel search sub-components (mirrors HotelsPage exactly) ─────────────────

const HOTEL_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Goa', 'Jaipur', 'Pune', 'Ahmedabad', 'Kochi', 'Lucknow',
  'Agra', 'Varanasi', 'Udaipur', 'Jodhpur', 'Shimla', 'Manali',
  'Rishikesh', 'Darjeeling', 'Mysore', 'Ooty', 'Coorg',
  'Amritsar', 'Chandigarh', 'Bhopal', 'Indore', 'Surat', 'Vadodara',
]

interface HotelGuestConfig { adults: number; children: number; infants: number; rooms: number }

function hotelFmtDate(d: string): string {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getDate().toString().padStart(2, '0')} ${dt.toLocaleDateString('en-US', { month: 'short' })} '${dt.getFullYear().toString().slice(2)}`
}

function hotelDayLabel(d: string): string {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
}

function HotelCitySearch({ value, onChange }: { value: string; onChange: (city: string) => void }) {
  const [query, setQuery] = useState(value)
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const suggestions = query.trim().length > 0
    ? HOTEL_CITIES.filter(c => c.toLowerCase().includes(query.trim().toLowerCase()))
    : HOTEL_CITIES

  const select = (city: string) => { setQuery(city); onChange(city); setOpen(false) }

  return (
    <div className="relative" ref={ref}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Where to</p>
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-orange-400 shrink-0" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Enter city, area or hotel"
          className="w-full text-xl font-bold text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-300 placeholder:font-normal placeholder:text-sm"
          autoComplete="off"
          required
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); onChange(''); setOpen(false) }}>
            <X className="h-4 w-4 text-gray-300 hover:text-gray-500" />
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide px-4 pt-3 pb-1">
            {query.trim() ? 'Matching cities' : 'Popular destinations'}
          </p>
          <ul className="max-h-60 overflow-y-auto">
            {suggestions.slice(0, 8).map(city => (
              <li key={city}>
                <button
                  type="button"
                  onMouseDown={e => { e.preventDefault(); select(city) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-left transition-colors"
                >
                  <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-800">{city}</span>
                  <span className="ml-auto text-xs text-gray-400">Hotels</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function HotelDateField({ label, value, min, onChange, nights }: {
  label: string; value: string; min: string; onChange: (v: string) => void; nights?: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const open = () => {
    try { (inputRef.current as HTMLInputElement & { showPicker?: () => void })?.showPicker?.() }
    catch { inputRef.current?.click() }
  }
  return (
    <div className="cursor-pointer select-none" onClick={open}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
      {value ? (
        <>
          <p className="text-base font-bold text-gray-900 leading-tight">{hotelFmtDate(value)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {hotelDayLabel(value)}{label === 'Check-out' && nights && nights > 0 ? ` · ${nights} night${nights > 1 ? 's' : ''}` : ''}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-300 font-medium">Select date</p>
      )}
      <input ref={inputRef} type="date" value={value} min={min} onChange={e => onChange(e.target.value)} className="sr-only" />
    </div>
  )
}

function HotelGuestsDropdown({ value, onChange }: { value: HotelGuestConfig; onChange: (g: HotelGuestConfig) => void }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const set = (key: keyof HotelGuestConfig, delta: number, min = 0) =>
    onChange({ ...value, [key]: Math.max(min, value[key] + delta) })

  const summary = `${value.adults} Adult${value.adults !== 1 ? 's' : ''}${value.children ? `, ${value.children} Child${value.children !== 1 ? 'ren' : ''}` : ''}${value.infants ? `, ${value.infants} Infant${value.infants !== 1 ? 's' : ''}` : ''} · ${value.rooms} Room${value.rooms !== 1 ? 's' : ''}`

  const rows: { key: keyof HotelGuestConfig; label: string; sub: string; min: number }[] = [
    { key: 'adults',   label: 'Adults',   sub: 'Age 12+',  min: 1 },
    { key: 'children', label: 'Children', sub: 'Age 2–11', min: 0 },
    { key: 'infants',  label: 'Infants',  sub: 'Under 2',  min: 0 },
    { key: 'rooms',    label: 'Rooms',    sub: '',         min: 1 },
  ]

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="text-left w-full" onClick={() => setOpen(v => !v)}>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Guests &amp; Rooms</p>
        <div className="flex items-center gap-1">
          <p className="text-base font-bold text-gray-900 leading-tight truncate">{summary}</p>
          {open ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
        </div>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-5 z-50 w-72">
          <div className="space-y-4">
            {rows.map(({ key, label, sub, min }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  {sub && <p className="text-xs text-gray-400">{sub}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => set(key, -1, min)} disabled={value[key] <= min}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-colors text-lg leading-none">−</button>
                  <span className="w-5 text-center font-bold text-gray-900">{value[key]}</span>
                  <button type="button" onClick={() => set(key, 1, min)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 font-bold transition-colors text-lg leading-none">+</button>
                </div>
              </div>
            ))}
          </div>
          {value.infants > 0 && (
            <p className="mt-3 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Infants travel on an adult's lap. Each infant must be accompanied by an adult.
            </p>
          )}
          <button type="button" onClick={() => setOpen(false)}
            className="mt-4 w-full py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors">
            Done
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────
const DEAL_GRADIENTS = [
  'from-blue-500 to-indigo-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-purple-500 to-violet-600',
  'from-cyan-500 to-sky-600',
]

function DealsSection() {
  const [deals, setDeals]         = useState<FeaturedCouponDto[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    api.get(endpoints.coupons.featured)
      .then(res => setDeals((res.data as { data: FeaturedCouponDto[] }).data ?? []))
      .catch(() => {})
  }, [])

  if (deals.length === 0) return null

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const daysLeft = (expiresAt?: string) => {
    if (!expiresAt) return null
    const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)
    if (diff < 0) return null
    if (diff === 0) return 'Expires today'
    return `${diff}d left`
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-bold text-gray-900">Exclusive Deals & Offers</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((deal, i) => {
          const gradient = DEAL_GRADIENTS[i % DEAL_GRADIENTS.length]
          const expiry = daysLeft(deal.expiresAt)
          const copied = copiedCode === deal.code
          return (
            <div key={deal.code} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className={`bg-gradient-to-r ${gradient} px-5 py-4`}>
                <p className="text-2xl font-black text-white">{deal.discount}</p>
                {deal.maxSaving && <p className="mt-0.5 text-sm text-white/80">{deal.maxSaving}</p>}
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-2.5 py-1 font-mono text-sm font-bold tracking-widest text-gray-800">
                      {deal.code}
                    </span>
                    {expiry && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {expiry}
                      </span>
                    )}
                  </div>
                  {deal.minOrder && <p className="mt-1.5 text-xs text-gray-500">{deal.minOrder}</p>}
                </div>
                <button
                  onClick={() => handleCopy(deal.code)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [mode, setMode]               = useState<TravelMode>('flight')
  const [tripType, setTripType]       = useState<TripType>('oneway')
  const [offerFilter, setOfferFilter] = useState<OfferFilter>('All')
  const [openFaq, setOpenFaq]         = useState<number | null>(null)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches())

  // Flight state
  const [flightOrigin, setFlightOrigin]           = useState('')
  const [flightOriginCity, setFlightOriginCity]   = useState('')
  const [flightDest, setFlightDest]               = useState('')
  const [flightDestCity, setFlightDestCity]       = useState('')
  const [departureDate, setDepartureDate]         = useState('')
  const [returnDate, setReturnDate]               = useState('')
  const [flightTravellers, setFlightTravellers]   = useState<TravellerConfig>({ adults: 1, children: 0, infants: 0, cabinClass: 'Economy' })

  // Hotel state
  const [hotelCity, setHotelCity]     = useState('')
  const [checkIn, setCheckIn]         = useState('')
  const [checkOut, setCheckOut]       = useState('')
  const [hotelGuests, setHotelGuests] = useState<HotelGuestConfig>({ adults: 2, children: 0, infants: 0, rooms: 1 })

  // Bus / Train / Cab shared state
  const [tOrigin, setTOrigin]   = useState('')
  const [tDest, setTDest]       = useState('')
  const [tDate, setTDate]       = useState('')
  const [tPassengers, setTPass] = useState('1')
  const [trainClass, setTrainClass] = useState('Sleeper')
  const [cabDateTime, setCabDateTime]   = useState(() => defaultCabPickup())
  const [cabTripType, setCabTripType]   = useState<'OneWay' | 'RoundTrip'>('OneWay')

  const theme = MODE_THEME[mode]

  const switchMode = (next: TravelMode) => {
    setMode(next)
    // Reset all search form state so each mode starts blank
    setFlightOrigin(''); setFlightOriginCity(''); setFlightDest(''); setFlightDestCity('')
    setDepartureDate(''); setReturnDate('')
    setFlightTravellers({ adults: 1, children: 0, infants: 0, cabinClass: 'Economy' })
    setHotelCity(''); setCheckIn(''); setCheckOut(''); setHotelGuests({ adults: 2, children: 0, infants: 0, rooms: 1 })
    setTOrigin(''); setTDest(''); setTDate(''); setTPass('1')
    setTrainClass('Sleeper'); setCabDateTime(defaultCabPickup()); setCabTripType('OneWay')
  }

  // ── Search handlers ────────────────────────────────────────────────────────
  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!flightOrigin || !flightDest || !departureDate) return
    const total = flightTravellers.adults + flightTravellers.children + flightTravellers.infants
    const label = `${flightOriginCity || flightOrigin} → ${flightDestCity || flightDest}`
    const sub   = `${departureDate} · ${total} Traveller${total !== 1 ? 's' : ''} · ${flightTravellers.cabinClass}`
    const href  = `/flights?${new URLSearchParams({
      origin: flightOrigin, destination: flightDest, departureDate,
      passengers: String(total), cabinClass: flightTravellers.cabinClass,
      ...(tripType === 'roundtrip' && returnDate ? { returnDate } : {}),
    })}`
    saveRecentSearch({ type: 'flight', label, sub, href })
    setRecentSearches(getRecentSearches())
    navigate(href)
  }

  const handleHotelSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hotelCity || !checkIn) return
    const label = `Hotels in ${hotelCity}`
    const sub   = `${checkIn}${checkOut ? ' → ' + checkOut : ''} · ${hotelGuests.rooms} Room · ${hotelGuests.adults + hotelGuests.children} Guest`
    const href  = `/hotels?${new URLSearchParams({
      city: hotelCity, checkIn, ...(checkOut ? { checkOut } : {}),
      adults: String(hotelGuests.adults), children: String(hotelGuests.children),
      infants: String(hotelGuests.infants), rooms: String(hotelGuests.rooms),
    })}`
    saveRecentSearch({ type: 'hotel', label, sub, href })
    setRecentSearches(getRecentSearches())
    navigate(href)
  }

  const handleBusSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tOrigin || !tDest || !tDate) return
    const label = `${tOrigin} → ${tDest}`
    const sub   = `${tDate} · ${tPassengers} Seat${Number(tPassengers) !== 1 ? 's' : ''} · Bus`
    const href  = `/buses?${new URLSearchParams({ origin: tOrigin, destination: tDest, date: tDate, passengers: tPassengers })}`
    saveRecentSearch({ type: 'bus', label, sub, href })
    setRecentSearches(getRecentSearches())
    navigate(href)
  }

  const handleTrainSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tOrigin || !tDest || !tDate) return
    const label = `${tOrigin} → ${tDest}`
    const sub   = `${tDate} · ${tPassengers} Passenger${Number(tPassengers) !== 1 ? 's' : ''} · ${trainClass}`
    const href  = `/trains?${new URLSearchParams({ origin: tOrigin, destination: tDest, date: tDate, passengers: tPassengers, class: trainClass })}`
    saveRecentSearch({ type: 'train', label, sub, href })
    setRecentSearches(getRecentSearches())
    navigate(href)
  }

  const handleCabSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tOrigin || !tDest) return
    const label = `${tOrigin} → ${tDest}`
    const sub   = cabDateTime ? new Date(cabDateTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : 'Cab'
    const href  = `/cabs?${new URLSearchParams({ origin: tOrigin, destination: tDest, tripType: cabTripType, ...(cabDateTime ? { pickupTime: cabDateTime } : {}) })}`
    saveRecentSearch({ type: 'cab', label, sub, href })
    setRecentSearches(getRecentSearches())
    navigate(href)
  }

  const hotelNights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0

  const swapFlight = () => {
    const [o, oc, d, dc] = [flightOrigin, flightOriginCity, flightDest, flightDestCity]
    setFlightOrigin(d); setFlightOriginCity(dc)
    setFlightDest(o);   setFlightDestCity(oc)
  }

  const swapTransport = () => { const t = tOrigin; setTOrigin(tDest); setTDest(t) }

  const filteredOffers = offerFilter === 'All' ? OFFERS : OFFERS.filter(o => o.category === offerFilter)
  const filteredRecent = recentSearches.filter(s => s.type === mode)

  // ── Popular section label & content ───────────────────────────────────────
  const popularLabel = {
    flight: 'Popular Flight Routes',
    hotel:  'Popular Destinations',
    bus:    'Popular Bus Routes',
    train:  'Popular Train Routes',
    cab:    'Popular Cab Routes',
  }[mode]

  // Keep redirects after all hooks so every render preserves hook order.
  if (user?.role === 'Admin') return <Navigate to="/admin" replace />
  if (user?.role === 'Hotel') return <Navigate to="/hotel/dashboard" replace />
  if (user?.role === 'FlightOperator') return <Navigate to="/flight-operator/dashboard" replace />
  if (user?.role === 'BusOperator') return <Navigate to="/bus-operator/dashboard" replace />
  if (user?.role === 'CabOperator') return <Navigate to="/cab-operator/dashboard" replace />

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModal />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden text-white">
        <div key={mode} className="absolute inset-0 bg-cover bg-center animate-fade-in" style={{ backgroundImage: theme.bgImage, filter: 'saturate(1.8) brightness(0.8) contrast(1.15)' }} />
        <div className="absolute inset-0 transition-colors duration-500" style={{ background: theme.overlay }} />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">

          {/* Mode tab bar */}
          <div className="flex gap-1 mb-6 bg-white/10 rounded-2xl p-1 w-fit">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchMode(id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap',
                  mode === id
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-white/80 hover:text-white hover:bg-white/10',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── FLIGHT SEARCH ── */}
          {mode === 'flight' && (
            <div>
              <div className="flex gap-4 mb-4">
                {([['oneway', 'One Way'], ['roundtrip', 'Round Trip']] as [TripType, string][]).map(([v, lbl]) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-white">
                    <input type="radio" name="tripType" value={v} checked={tripType === v} onChange={() => setTripType(v)} className="accent-white" />
                    {lbl}
                  </label>
                ))}
              </div>
              <form onSubmit={handleFlightSearch}>
                <div className="bg-white rounded-2xl shadow-2xl p-4">
                  <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <AirportSearch label="From" placeholder="City or Airport"
                        value={flightOrigin ? `${flightOriginCity} (${flightOrigin})` : ''}
                        onChange={(code, city) => { setFlightOrigin(code); setFlightOriginCity(city) }}
                      />
                    </div>
                    <div className="flex items-center px-2">
                      <button type="button" onClick={swapFlight} className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-blue-300 transition-colors">
                        <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <AirportSearch label="To" placeholder="City or Airport"
                        value={flightDest ? `${flightDestCity} (${flightDest})` : ''}
                        onChange={(code, city) => { setFlightDest(code); setFlightDestCity(city) }}
                      />
                    </div>
                    <HeroDatePicker label="Departure" value={departureDate} min={TODAY} onChange={setDepartureDate} />
                    {tripType === 'roundtrip' && (
                      <HeroDatePicker label="Return" value={returnDate} min={departureDate || TODAY} onChange={setReturnDate} />
                    )}
                    <div className="flex-1 min-w-[200px] px-4 py-2">
                      <TravellerSelector value={flightTravellers} onChange={setFlightTravellers} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button type="submit" className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100" style={{ background: `linear-gradient(90deg, #1e3a8a, ${theme.accent})` }}>
                      <Search className="h-5 w-5" /> Search
                    </button>
                  </div>
                </div>
              </form>
              <div className="mt-3">
                <NaturalLanguageSearch />
              </div>
            </div>
          )}

          {/* ── HOTEL SEARCH ── */}
          {mode === 'hotel' && (
            <div>
              <form onSubmit={handleHotelSearch}>
                <div className="rounded-2xl bg-white shadow-xl p-4">
                  <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                    <div className="relative z-20 flex-[2] min-w-[160px] px-4 py-2">
                      <HotelCitySearch value={hotelCity} onChange={setHotelCity} />
                    </div>
                    <div className="px-4 py-2 lg:w-[220px]">
                      <HotelDateField label="Check-in" value={checkIn} min={TODAY} onChange={setCheckIn} />
                    </div>
                    <div className="px-4 py-2 lg:w-[220px]">
                      <HotelDateField label="Check-out" value={checkOut} min={checkIn || TODAY} onChange={setCheckOut} nights={hotelNights} />
                    </div>
                    <div className="relative z-10 flex-1 min-w-[200px] px-4 py-2">
                      <HotelGuestsDropdown value={hotelGuests} onChange={setHotelGuests} />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button type="submit" className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100" style={{ background: `linear-gradient(90deg, #c2410c, ${theme.accent})` }}>
                      <Search className="h-5 w-5" /> Search
                    </button>
                  </div>
                </div>
              </form>
              <div className="mt-3">
                <NaturalLanguageSearch />
              </div>
            </div>
          )}

          {/* ── BUS SEARCH ── */}
          {mode === 'bus' && (
            <div>
              <form onSubmit={handleBusSearch}>
                <div className="bg-white rounded-2xl shadow-2xl p-4">
                  <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <CitySearch label="From" placeholder="e.g. Mumbai" value={tOrigin} onChange={setTOrigin} focusColor="green" />
                    </div>
                    <div className="flex items-center px-2">
                      <button type="button" onClick={swapTransport} className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-green-300 transition-colors">
                        <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <CitySearch label="To" placeholder="e.g. Pune" value={tDest} onChange={setTDest} focusColor="green" />
                    </div>
                    <HeroDatePicker label="Date" value={tDate}  min={TODAY}   onChange={setTDate} />
                    <HeroInput label="Passengers" type="number" placeholder="1" value={tPassengers} onChange={setTPass} />
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button type="submit" className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100" style={{ background: `linear-gradient(90deg, #15803d, ${theme.accent})` }}>
                      <Search className="h-5 w-5" /> Search
                    </button>
                  </div>
                </div>
              </form>
              <div className="mt-3">
                <NaturalLanguageSearch />
              </div>
            </div>
          )}

          {/* ── TRAIN SEARCH ── */}
          {mode === 'train' && (
            <div>
              <form onSubmit={handleTrainSearch}>
                <div className="bg-white rounded-2xl shadow-2xl p-4">
                  <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <CitySearch label="From" placeholder="e.g. Delhi" value={tOrigin} onChange={setTOrigin} focusColor="indigo" />
                    </div>
                    <div className="flex items-center px-2">
                      <button type="button" onClick={swapTransport} className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-indigo-300 transition-colors">
                        <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <CitySearch label="To" placeholder="e.g. Mumbai" value={tDest} onChange={setTDest} focusColor="indigo" />
                    </div>
                    <HeroDatePicker label="Date" value={tDate}    min={TODAY}    onChange={setTDate}  />
                    <HeroInput label="Passengers" type="number" placeholder="1" value={tPassengers} onChange={setTPass} />
                    <div className="flex-1 min-w-[130px] px-4 py-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Class</label>
                      <select value={trainClass} onChange={e => setTrainClass(e.target.value)} className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b-2 border-gray-300 focus:border-indigo-600 pb-1">
                        {['Sleeper', 'AC 3 Tier', 'AC 2 Tier', 'AC 1 Tier', 'Chair Car'].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button type="submit" className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100" style={{ background: `linear-gradient(90deg, #1e40af, ${theme.accent})` }}>
                      <Search className="h-5 w-5" /> Search
                    </button>
                  </div>
                </div>
              </form>
              <div className="mt-3">
                <NaturalLanguageSearch />
              </div>
            </div>
          )}

          {/* ── CAB SEARCH ── */}
          {mode === 'cab' && (
            <div>
              <form onSubmit={handleCabSearch}>
                <div className="bg-white rounded-2xl shadow-2xl p-4">
                  <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <CitySearch label="Pickup City" placeholder="e.g. Delhi" value={tOrigin} onChange={setTOrigin} focusColor="yellow" />
                    </div>
                    <div className="flex items-center px-2">
                      <button type="button" onClick={swapTransport} className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-yellow-300 transition-colors">
                        <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <CitySearch label="Drop City" placeholder="e.g. Agra" value={tDest} onChange={setTDest} focusColor="yellow" />
                    </div>
                    <HeroDatePicker label="Pickup Date & Time" type="datetime-local" value={cabDateTime} min={localDatetimeValue(new Date())} onChange={setCabDateTime} />
                    <div className="flex-1 min-w-[130px] px-4 py-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Trip Type</label>
                      <select
                        value={cabTripType}
                        onChange={e => setCabTripType(e.target.value as 'OneWay' | 'RoundTrip')}
                        className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b-2 border-gray-300 focus:border-yellow-500 pb-1"
                      >
                        <option value="OneWay">One Way</option>
                        <option value="RoundTrip">Round Trip</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-center">
                    <button type="submit" className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100" style={{ background: `linear-gradient(90deg, #b45309, ${theme.accent})` }}>
                      <Search className="h-5 w-5" /> Search
                    </button>
                  </div>
                </div>
              </form>
              <div className="mt-3">
                <NaturalLanguageSearch />
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── RECENT SEARCHES (filtered by mode) ── */}
      {filteredRecent.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 mb-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent Searches
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {filteredRecent.map((s, i) => (
                <div
                  key={i}
                  onClick={() => navigate(s.href)}
                  className="relative flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 pl-3 pr-8 py-2 text-sm whitespace-nowrap hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors shrink-0 group"
                >
                  <ModeIcon type={s.type} className={`h-4 w-4 ${MODE_ICON_COLOR[s.type] ?? 'text-blue-500'}`} />
                  <div>
                    <p className="font-semibold text-gray-800 text-xs">{s.label}</p>
                    <p className="text-gray-400 text-xs">{s.sub}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removeRecentSearch(s.label); setRecentSearches(getRecentSearches()) }}
                    className="absolute right-1.5 top-1.5 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── OFFERS FOR YOU ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BadgePercent className="h-5 w-5 text-blue-600" /> Offers For You
          </h2>
        </div>
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(['All', 'Bank Offers', 'Flights', 'Hotels', 'Cabs', 'Trains'] as OfferFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setOfferFilter(f)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                offerFilter === f ? 'bg-blue-700 text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {filteredOffers.map(offer => (
            <div key={offer.id} className={`flex-shrink-0 w-72 rounded-2xl bg-gradient-to-br ${offer.color} text-white p-5 shadow-lg`}>
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold bg-white/20 rounded-full px-3 py-0.5">{offer.category}</span>
                {offer.bank && <span className="text-xs font-bold bg-white/20 rounded-full px-2 py-0.5">{offer.bank}</span>}
              </div>
              <p className="font-bold text-base leading-snug mb-2">{offer.title}</p>
              <p className="text-sm text-white/80 mb-4">{offer.desc}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-1.5">
                  <Tag className="h-3 w-3" />
                  <span className="font-mono font-bold text-sm tracking-widest">{offer.code}</span>
                </div>
                <button className="text-xs font-semibold underline text-white/80 hover:text-white">Copy</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── POPULAR ROUTES / DESTINATIONS (mode-aware) ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-blue-600" /> {popularLabel}
        </h2>

        {/* Flights */}
        {mode === 'flight' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_FLIGHT_ROUTES.map(r => (
              <button
                key={r.from + r.to}
                onClick={() => navigate(`/flights?origin=${r.from}&destination=${r.to}&departureDate=${TODAY}&passengers=1&cabinClass=Economy`)}
                className="group flex items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <span>{r.fromCity}</span>
                    <Plane className="h-3 w-3 text-blue-500 rotate-90" />
                    <span>{r.toCity}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.from} → {r.to} · {r.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Starts from</p>
                  <p className="text-lg font-bold text-blue-700">₹{r.price.toLocaleString('en-IN')}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Hotels */}
        {mode === 'hotel' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {POPULAR_HOTEL_CITIES.map(d => (
              <button
                key={d.city}
                onClick={() => navigate(`/hotels?city=${d.city}&checkIn=${TODAY}`)}
                className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="relative h-32 overflow-hidden">
                  <img src={d.img} alt={d.city} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-2 text-white text-left">
                    <p className="font-bold text-sm">{d.city}</p>
                    <p className="text-xs text-white/80">{d.hotels} hotels</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Bus */}
        {mode === 'bus' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_BUS_ROUTES.map(r => (
              <button
                key={r.from + r.to}
                onClick={() => navigate(`/buses?origin=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}&date=${TODAY}&passengers=1`)}
                className="group flex items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-green-200 transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <span>{r.from}</span>
                    <Bus className="h-3 w-3 text-green-500" />
                    <span>{r.to}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Starts from</p>
                  <p className="text-lg font-bold text-green-700">₹{r.price}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Train */}
        {mode === 'train' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_TRAIN_ROUTES.map(r => (
              <button
                key={r.from + r.to}
                onClick={() => navigate(`/trains?origin=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}&date=${TODAY}&passengers=1`)}
                className="group flex items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-indigo-200 transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <span>{r.from}</span>
                    <Train className="h-3 w-3 text-indigo-500" />
                    <span>{r.to}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.name} · {r.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Starts from</p>
                  <p className="text-lg font-bold text-indigo-700">₹{r.price.toLocaleString('en-IN')}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Cab */}
        {mode === 'cab' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POPULAR_CAB_ROUTES.map(r => (
              <button
                key={r.from + r.to}
                onClick={() => navigate(`/cabs?origin=${encodeURIComponent(r.from)}&destination=${encodeURIComponent(r.to)}`)}
                className="group flex items-center justify-between rounded-xl bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-yellow-200 transition-all text-left"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
                    <MapPin className="h-3 w-3 text-yellow-500" />
                    <span>{r.from}</span>
                    <span className="text-gray-400">→</span>
                    <span>{r.to}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{r.duration}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Starts from</p>
                  <p className="text-lg font-bold text-yellow-600">₹{r.price.toLocaleString('en-IN')}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── DEALS SECTION ── */}
      <DealsSection />

      {/* ── WHY TRAVELPORT ── */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Why Book with TravelPort?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Tag,            title: 'Best Prices',    desc: 'Compare across 500+ airlines & 1M+ hotels' },
              { icon: Shield,         title: 'Secure Booking', desc: '256-bit SSL secured transactions'           },
              { icon: HeadphonesIcon, title: '24/7 Support',   desc: 'Round-the-clock customer assistance'       },
              { icon: Zap,            title: 'Instant Booking',desc: 'Instant confirmation on all bookings'      },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
                <p className="mt-1 text-xs text-gray-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI RECOMMENDATIONS ── */}
      <AiRecommendations />

      {/* ── FAQs ── */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Travel Booking FAQs</h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                {faq.q}
                {openFaq === i
                  ? <ChevronUp   className="h-4 w-4 text-gray-400 shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                }
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-50 pt-3">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
