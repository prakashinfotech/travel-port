import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plane, Hotel, Bus, Train, Car,
  Search, ArrowLeftRight,
  ChevronDown, ChevronUp, Clock, MapPin, TrendingUp,
  Shield, HeadphonesIcon, Tag, BadgePercent, Zap, X
} from 'lucide-react'
import { AirportSearch } from '@/components/search/AirportSearch'
import { TravellerSelector, type TravellerConfig } from '@/components/search/TravellerSelector'
import { AuthModal } from '@/components/home/AuthModal'

type TravelMode   = 'flight' | 'hotel' | 'bus' | 'train' | 'cab'
type TripType     = 'oneway' | 'roundtrip'
type OfferFilter  = 'All' | 'Bank Offers' | 'Flights' | 'Hotels' | 'Cabs' | 'Trains'

const TODAY = new Date().toISOString().split('T')[0]

// ── Mode config ──────────────────────────────────────────────────────────────
const MODES: { id: TravelMode; label: string; icon: React.ElementType }[] = [
  { id: 'flight', label: 'Flights', icon: Plane  },
  { id: 'hotel',  label: 'Hotels',  icon: Hotel  },
  { id: 'bus',    label: 'Bus',     icon: Bus    },
  { id: 'train',  label: 'Trains',  icon: Train  },
  { id: 'cab',    label: 'Cabs',    icon: Car    },
]

const MODE_THEME: Record<TravelMode, { bg: string; accent: string; ring: string }> = {
  flight: { bg: 'linear-gradient(135deg, #0c1445 0%, #1e3a8a 40%, #0369a1 100%)', accent: '#f97316', ring: 'focus:ring-blue-500'  },
  hotel:  { bg: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 50%, #ea580c 100%)', accent: '#f97316', ring: 'focus:ring-orange-500' },
  bus:    { bg: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)', accent: '#22c55e', ring: 'focus:ring-green-500'  },
  train:  { bg: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #312e81 100%)', accent: '#818cf8', ring: 'focus:ring-indigo-500' },
  cab:    { bg: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)', accent: '#fbbf24', ring: 'focus:ring-yellow-500' },
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

// ── Main component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate()

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
  const [hotelCity, setHotelCity]       = useState('')
  const [checkIn, setCheckIn]           = useState('')
  const [checkOut, setCheckOut]         = useState('')
  const [hotelRooms, setHotelRooms]     = useState('1')
  const [hotelGuests, setHotelGuests]   = useState('1')

  // Bus / Train / Cab shared state
  const [tOrigin, setTOrigin]   = useState('')
  const [tDest, setTDest]       = useState('')
  const [tDate, setTDate]       = useState('')
  const [tPassengers, setTPass] = useState('1')
  const [trainClass, setTrainClass] = useState('Sleeper')
  const [cabDateTime, setCabDateTime] = useState('')

  const theme = MODE_THEME[mode]

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
    const sub   = `${checkIn}${checkOut ? ' → ' + checkOut : ''} · ${hotelRooms} Room · ${hotelGuests} Guest`
    const href  = `/hotels?${new URLSearchParams({ city: hotelCity, checkIn, ...(checkOut ? { checkOut } : {}), rooms: hotelRooms, guests: hotelGuests })}`
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
    const href  = `/cabs?${new URLSearchParams({ origin: tOrigin, destination: tDest, ...(cabDateTime ? { pickupTime: cabDateTime } : {}) })}`
    saveRecentSearch({ type: 'cab', label, sub, href })
    setRecentSearches(getRecentSearches())
    navigate(href)
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModal />

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section className="relative text-white transition-all duration-500" style={{ background: theme.bg }}>
        <div className="mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">

          {/* Mode tab bar */}
          <div className="flex gap-1 mb-6 bg-white/10 rounded-2xl p-1 w-fit">
            {MODES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
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
                    <HeroInput label="Departure" type="date" value={departureDate} min={TODAY} onChange={setDepartureDate} />
                    {tripType === 'roundtrip' && (
                      <HeroInput label="Return" type="date" value={returnDate} min={departureDate || TODAY} onChange={setReturnDate} />
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
            </div>
          )}

          {/* ── HOTEL SEARCH ── */}
          {mode === 'hotel' && (
            <form onSubmit={handleHotelSearch}>
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                  <HeroInput label="City / Destination" placeholder="e.g. Mumbai, Goa" value={hotelCity} onChange={setHotelCity} />
                  <HeroInput label="Check-in"  type="date" value={checkIn}  min={TODAY}       onChange={setCheckIn}  />
                  <HeroInput label="Check-out" type="date" value={checkOut} min={checkIn || TODAY} onChange={setCheckOut} />
                  <HeroInput label="Rooms"     type="number" placeholder="1" value={hotelRooms}  onChange={setHotelRooms}  />
                  <HeroInput label="Guests"    type="number" placeholder="1" value={hotelGuests} onChange={setHotelGuests} />
                </div>
                <div className="mt-4 flex justify-center">
                  <button type="submit" className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100" style={{ background: `linear-gradient(90deg, #c2410c, ${theme.accent})` }}>
                    <Search className="h-5 w-5" /> Search
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── BUS SEARCH ── */}
          {mode === 'bus' && (
            <form onSubmit={handleBusSearch}>
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                  <HeroInput label="From" placeholder="e.g. Mumbai" value={tOrigin} onChange={setTOrigin} />
                  <div className="flex items-center px-2">
                    <button type="button" onClick={swapTransport} className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-green-300 transition-colors">
                      <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <HeroInput label="To"   placeholder="e.g. Pune"   value={tDest} onChange={setTDest} />
                  <HeroInput label="Date" type="date" value={tDate}  min={TODAY}   onChange={setTDate} />
                  <HeroInput label="Passengers" type="number" placeholder="1" value={tPassengers} onChange={setTPass} />
                </div>
                <div className="mt-4 flex justify-center">
                  <button type="submit" className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100" style={{ background: `linear-gradient(90deg, #15803d, ${theme.accent})` }}>
                    <Search className="h-5 w-5" /> Search
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── TRAIN SEARCH ── */}
          {mode === 'train' && (
            <form onSubmit={handleTrainSearch}>
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                  <HeroInput label="From" placeholder="e.g. Delhi"    value={tOrigin} onChange={setTOrigin} />
                  <div className="flex items-center px-2">
                    <button type="button" onClick={swapTransport} className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-indigo-300 transition-colors">
                      <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <HeroInput label="To"   placeholder="e.g. Mumbai"   value={tDest}  onChange={setTDest}  />
                  <HeroInput label="Date" type="date" value={tDate}    min={TODAY}    onChange={setTDate}  />
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
          )}

          {/* ── CAB SEARCH ── */}
          {mode === 'cab' && (
            <form onSubmit={handleCabSearch}>
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                  <HeroInput label="Pickup City"  placeholder="e.g. Delhi"  value={tOrigin} onChange={setTOrigin} />
                  <div className="flex items-center px-2">
                    <button type="button" onClick={swapTransport} className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-yellow-300 transition-colors">
                      <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <HeroInput label="Drop City"    placeholder="e.g. Agra"   value={tDest} onChange={setTDest} />
                  <div className="flex-1 min-w-[200px] px-4 py-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Pickup Date & Time</label>
                    <input
                      type="datetime-local"
                      value={cabDateTime}
                      min={TODAY}
                      onChange={e => setCabDateTime(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b-2 border-gray-300 focus:border-yellow-500 pb-1"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <button type="submit" className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100" style={{ background: `linear-gradient(90deg, #b45309, ${theme.accent})` }}>
                    <Search className="h-5 w-5" /> Search
                  </button>
                </div>
              </div>
            </form>
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
