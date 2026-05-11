import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plane, Hotel, Car, Train, Bus, Search, ArrowLeftRight,
  ChevronDown, ChevronUp, Clock, MapPin, TrendingUp,
  Shield, HeadphonesIcon, Tag, BadgePercent, Zap
} from 'lucide-react'
import { AirportSearch } from '@/components/search/AirportSearch'
import { TravellerSelector, type TravellerConfig } from '@/components/search/TravellerSelector'
import { AuthModal } from '@/components/home/AuthModal'

type MainTab = 'flights' | 'hotels' | 'cabs' | 'trains' | 'buses'
type TripType = 'oneway' | 'roundtrip' | 'multicity'
type OfferFilter = 'All' | 'Bank Offers' | 'Flights' | 'Hotels' | 'Cabs' | 'Trains'

const TODAY = new Date().toISOString().split('T')[0]

const OFFERS = [
  { id: 1, category: 'Flights', title: 'Flat 10% off on first flight booking', code: 'FIRST10', bank: null, color: 'from-blue-500 to-blue-700', desc: 'Use code at checkout. Valid for new users.' },
  { id: 2, category: 'Bank Offers', title: 'Extra ₹500 off with HDFC Credit Card', code: 'HDFC500', bank: 'HDFC', color: 'from-purple-500 to-purple-700', desc: 'Applicable on bookings above ₹3000.' },
  { id: 3, category: 'Hotels', title: 'Up to ₹500 off on hotel booking', code: 'HOTEL500', bank: null, color: 'from-orange-500 to-orange-700', desc: 'Save big on your next hotel stay.' },
  { id: 4, category: 'Flights', title: 'Summer special — 20% off domestic flights', code: 'SUMMER20', bank: null, color: 'from-sky-500 to-sky-700', desc: 'Limited period offer, book now!' },
  { id: 5, category: 'Bank Offers', title: 'Save ₹100 with SBI Debit Card', code: 'SAVE100', bank: 'SBI', color: 'from-green-500 to-green-700', desc: 'Valid on all bookings.' },
  { id: 6, category: 'Cabs', title: 'Flat 15% off on cab bookings', code: 'FLAT15', bank: null, color: 'from-yellow-500 to-yellow-700', desc: 'Book your ride at a great price.' },
]

const POPULAR_ROUTES = [
  { from: 'DEL', fromCity: 'Delhi', to: 'BOM', toCity: 'Mumbai', price: 2899, duration: '2h 15m' },
  { from: 'BOM', fromCity: 'Mumbai', to: 'GOI', toCity: 'Goa', price: 3199, duration: '1h 20m' },
  { from: 'BLR', fromCity: 'Bangalore', to: 'DEL', toCity: 'Delhi', price: 3499, duration: '2h 40m' },
  { from: 'HYD', fromCity: 'Hyderabad', to: 'BOM', toCity: 'Mumbai', price: 2599, duration: '1h 30m' },
  { from: 'DEL', fromCity: 'Delhi', to: 'BLR', toCity: 'Bangalore', price: 3299, duration: '2h 50m' },
  { from: 'MAA', fromCity: 'Chennai', to: 'BOM', toCity: 'Mumbai', price: 3099, duration: '2h 10m' },
]

const POPULAR_DESTINATIONS = [
  { city: 'Goa', desc: 'Beaches & Nightlife', img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=300&fit=crop', hotels: 120 },
  { city: 'Jaipur', desc: 'Forts & Culture', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&h=300&fit=crop', hotels: 95 },
  { city: 'Mumbai', desc: 'City of Dreams', img: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&h=300&fit=crop', hotels: 210 },
  { city: 'Bangalore', desc: 'Garden City', img: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=300&fit=crop', hotels: 175 },
  { city: 'Kerala', desc: 'God\'s Own Country', img: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop', hotels: 140 },
  { city: 'Delhi', desc: 'Heart of India', img: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=300&fit=crop', hotels: 280 },
]

const FAQS = [
  { q: 'How do I book a flight on TravelPort?', a: 'Search for flights by entering your origin, destination, and date. Select a flight and click "Book Now". Complete the passenger details and payment to confirm your booking.' },
  { q: 'Can I cancel my booking?', a: 'Yes, you can cancel bookings from the "My Bookings" section. A 90% refund will be credited to your TravelPort wallet within 24 hours of cancellation.' },
  { q: 'What payment methods are accepted?', a: 'We accept Credit/Debit Cards, UPI, Net Banking, and TravelPort Wallet. All payments are secured with 256-bit SSL encryption.' },
  { q: 'How do I use a coupon code?', a: 'Enter the coupon code in the designated field on the booking page before completing payment. The discount will be applied automatically.' },
  { q: 'Is my personal data safe?', a: 'Absolutely. We use industry-standard encryption to protect your data. We never share your information with third parties without consent.' },
  { q: 'How do I track my booking?', a: 'Log in to your account and go to "My Bookings". You\'ll find all your flight and hotel bookings along with their status and details.' },
]

const RECENT_KEY = 'tp_recent_searches'

function saveRecentSearch(search: { type: string; label: string; sub: string }) {
  const prev = getRecentSearches()
  const updated = [search, ...prev.filter(s => s.label !== search.label)].slice(0, 5)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

function getRecentSearches(): Array<{ type: string; label: string; sub: string }> {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') } catch { return [] }
}

const HERO_THEME: Record<MainTab, { from: string; to: string; accent: string }> = {
  flights: { from: '#1a56db', to: '#1e3a8a', accent: '#f97316' },
  hotels:  { from: '#ea580c', to: '#9a3412', accent: '#fbbf24' },
  cabs:    { from: '#059669', to: '#064e3b', accent: '#34d399' },
  trains:  { from: '#7c3aed', to: '#4c1d95', accent: '#a78bfa' },
  buses:   { from: '#0891b2', to: '#0c4a6e', accent: '#38bdf8' },
}

export default function HomePage() {
  const navigate = useNavigate()
  const [mainTab, setMainTab] = useState<MainTab>('flights')
  const [tripType, setTripType] = useState<TripType>('oneway')
  const [offerFilter, setOfferFilter] = useState<OfferFilter>('All')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [recentSearches, setRecentSearches] = useState(getRecentSearches())

  // Flight state
  const [origin, setOrigin] = useState('')
  const [originCity, setOriginCity] = useState('')
  const [destination, setDestination] = useState('')
  const [destinationCity, setDestinationCity] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [travellers, setTravellers] = useState<TravellerConfig>({ adults: 1, children: 0, infants: 0, cabinClass: 'Economy' })

  // Hotel state
  const [city, setCity] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(1)
  const [rooms, setRooms] = useState(1)

  const theme = HERO_THEME[mainTab]

  const swapCities = () => {
    setOrigin(destination); setOriginCity(destinationCity)
    setDestination(origin); setDestinationCity(originCity)
  }

  const handleFlightSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination || !departureDate) return
    const total = travellers.adults + travellers.children + travellers.infants
    const label = `${originCity || origin} → ${destinationCity || destination}`
    const sub = `${departureDate} · ${total} Traveller${total !== 1 ? 's' : ''} · ${travellers.cabinClass}`
    saveRecentSearch({ type: 'flight', label, sub })
    setRecentSearches(getRecentSearches())
    navigate(`/flights?${new URLSearchParams({
      origin,
      destination,
      departureDate,
      passengers: String(total),
      cabinClass: travellers.cabinClass,
      ...(tripType === 'roundtrip' && returnDate ? { returnDate } : {}),
    })}`)
  }

  const handleHotelSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!city || !checkIn || !checkOut) return
    saveRecentSearch({ type: 'hotel', label: city, sub: `${checkIn} – ${checkOut} · ${guests} Guest${guests !== 1 ? 's' : ''} · ${rooms} Room${rooms !== 1 ? 's' : ''}` })
    setRecentSearches(getRecentSearches())
    navigate(`/hotels?${new URLSearchParams({ city, checkIn, checkOut, guests: String(guests), rooms: String(rooms) })}`)
  }

  const filteredOffers = offerFilter === 'All' ? OFFERS : OFFERS.filter(o => o.category === offerFilter)

  const TabIcon: Record<MainTab, React.ElementType> = { flights: Plane, hotels: Hotel, cabs: Car, trains: Train, buses: Bus }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthModal />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative text-white transition-all duration-500"
        style={{ background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)` }}
      >
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 lg:px-8">

          {/* Main mode tabs */}
          <div className="flex gap-1 mb-8 overflow-x-auto pb-1">
            {(Object.keys(HERO_THEME) as MainTab[]).map(t => {
              const Icon = TabIcon[t]
              return (
                <button
                  key={t}
                  onClick={() => setMainTab(t)}
                  className={[
                    'flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all capitalize',
                    mainTab === t ? 'bg-white text-gray-900 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4" /> {t}
                </button>
              )
            })}
          </div>

          {/* ── FLIGHT SEARCH ── */}
          {mainTab === 'flights' && (
            <div>
              {/* Trip type */}
              <div className="flex gap-4 mb-4">
                {([['oneway', 'One Way'], ['roundtrip', 'Round Trip'], ['multicity', 'Multi City']] as [TripType, string][]).map(([v, lbl]) => (
                  <label key={v} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-white">
                    <input
                      type="radio"
                      name="tripType"
                      value={v}
                      checked={tripType === v}
                      onChange={() => setTripType(v)}
                      className="accent-white"
                    />
                    {lbl}
                  </label>
                ))}
              </div>

              <form onSubmit={handleFlightSearch}>
                <div className="bg-white rounded-2xl shadow-2xl p-4">
                  <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                    {/* From */}
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <AirportSearch
                        label="From"
                        placeholder="City or Airport"
                        value={origin ? `${originCity} (${origin})` : ''}
                        onChange={(code, city) => { setOrigin(code); setOriginCity(city) }}
                      />
                    </div>

                    {/* Swap */}
                    <div className="flex items-center px-2">
                      <button
                        type="button"
                        onClick={swapCities}
                        className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-blue-300 transition-colors"
                      >
                        <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>

                    {/* To */}
                    <div className="flex-1 min-w-[160px] px-4 py-2">
                      <AirportSearch
                        label="To"
                        placeholder="City or Airport"
                        value={destination ? `${destinationCity} (${destination})` : ''}
                        onChange={(code, city) => { setDestination(code); setDestinationCity(city) }}
                      />
                    </div>

                    {/* Departure */}
                    <div className="flex-1 min-w-[130px] px-4 py-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Departure</label>
                      <input
                        type="date"
                        value={departureDate}
                        min={TODAY}
                        onChange={e => setDepartureDate(e.target.value)}
                        className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b-2 border-gray-300 focus:border-blue-600 pb-1"
                      />
                    </div>

                    {/* Return (only for round trip) */}
                    {tripType === 'roundtrip' && (
                      <div className="flex-1 min-w-[130px] px-4 py-2">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Return</label>
                        <input
                          type="date"
                          value={returnDate}
                          min={departureDate || TODAY}
                          onChange={e => setReturnDate(e.target.value)}
                          className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b-2 border-gray-300 focus:border-blue-600 pb-1"
                        />
                      </div>
                    )}

                    {/* Travellers & Class */}
                    <div className="flex-1 min-w-[200px] px-4 py-2">
                      <TravellerSelector value={travellers} onChange={setTravellers} />
                    </div>
                  </div>

                  <div className="mt-4 flex justify-center">
                    <button
                      type="submit"
                      className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100"
                      style={{ background: `linear-gradient(90deg, ${theme.from}, ${theme.accent})` }}
                    >
                      <Search className="h-5 w-5" /> Search Flights
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ── HOTEL SEARCH ── */}
          {mainTab === 'hotels' && (
            <form onSubmit={handleHotelSearch}>
              <div className="bg-white rounded-2xl shadow-2xl p-4">
                <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
                  <div className="flex-1 min-w-[180px] px-4 py-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">City / Destination</label>
                    <div className="flex items-center gap-2 border-b-2 border-gray-300 focus-within:border-orange-500 pb-1">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Where do you want to stay?"
                        className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-[130px] px-4 py-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Check-in</label>
                    <input type="date" value={checkIn} min={TODAY} onChange={e => setCheckIn(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b-2 border-gray-300 focus:border-orange-500 pb-1" required />
                  </div>
                  <div className="flex-1 min-w-[130px] px-4 py-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Check-out</label>
                    <input type="date" value={checkOut} min={checkIn || TODAY} onChange={e => setCheckOut(e.target.value)}
                      className="w-full bg-transparent text-sm font-medium text-gray-900 focus:outline-none border-b-2 border-gray-300 focus:border-orange-500 pb-1" required />
                  </div>
                  <div className="flex-1 min-w-[130px] px-4 py-2">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rooms & Guests</label>
                    <div className="flex items-center gap-3 border-b-2 border-gray-300 focus-within:border-orange-500 pb-1">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-gray-500 text-xs">Rooms:</span>
                        <button type="button" onClick={() => setRooms(Math.max(1, rooms - 1))} className="text-gray-500 hover:text-orange-600 font-bold px-1">−</button>
                        <span className="font-semibold text-gray-900 w-4 text-center">{rooms}</span>
                        <button type="button" onClick={() => setRooms(rooms + 1)} className="text-gray-500 hover:text-orange-600 font-bold px-1">+</button>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-gray-500 text-xs">Guests:</span>
                        <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="text-gray-500 hover:text-orange-600 font-bold px-1">−</button>
                        <span className="font-semibold text-gray-900 w-4 text-center">{guests}</span>
                        <button type="button" onClick={() => setGuests(guests + 1)} className="text-gray-500 hover:text-orange-600 font-bold px-1">+</button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-center">
                  <button type="submit" className="flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-600 px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100">
                    <Search className="h-5 w-5" /> Search Hotels
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Coming soon for cabs/trains/buses */}
          {['cabs', 'trains', 'buses'].includes(mainTab) && (
            <div className="bg-white/10 rounded-2xl p-10 text-center text-white/80 backdrop-blur-sm">
              <p className="text-lg font-semibold capitalize">{mainTab} booking</p>
              <p className="text-sm mt-1">Coming soon — stay tuned!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── RECENT SEARCHES ── */}
      {recentSearches.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 mb-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1">
              <Clock className="h-3 w-3" /> Recent Searches
            </p>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {recentSearches.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm whitespace-nowrap hover:border-blue-200 hover:bg-blue-50 cursor-pointer transition-colors shrink-0">
                  {s.type === 'flight' ? <Plane className="h-4 w-4 text-blue-500" /> : <Hotel className="h-4 w-4 text-orange-500" />}
                  <div>
                    <p className="font-semibold text-gray-800 text-xs">{s.label}</p>
                    <p className="text-gray-400 text-xs">{s.sub}</p>
                  </div>
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

        {/* Filter chips */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {(['All', 'Bank Offers', 'Flights', 'Hotels', 'Cabs', 'Trains'] as OfferFilter[]).map(f => (
            <button
              key={f}
              onClick={() => setOfferFilter(f)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                offerFilter === f
                  ? 'bg-blue-700 text-white shadow'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300',
              ].join(' ')}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-4 overflow-x-auto pb-3">
          {filteredOffers.map(offer => (
            <div
              key={offer.id}
              className={`flex-shrink-0 w-72 rounded-2xl bg-gradient-to-br ${offer.color} text-white p-5 shadow-lg`}
            >
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

      {/* ── POPULAR FLIGHT ROUTES ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
          <TrendingUp className="h-5 w-5 text-blue-600" /> Popular Flight Routes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_ROUTES.map(r => (
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
      </section>

      {/* ── POPULAR DESTINATIONS ── */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-5">
          <MapPin className="h-5 w-5 text-blue-600" /> Popular Destinations
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {POPULAR_DESTINATIONS.map(d => (
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
      </section>

      {/* ── WHY TRAVELPORT ── */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">Why Book with TravelPort?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {[
              { icon: Tag,             title: 'Best Prices',       desc: 'Compare across 500+ airlines & 1M+ hotels' },
              { icon: Shield,          title: 'Secure Booking',     desc: '256-bit SSL secured transactions' },
              { icon: HeadphonesIcon,  title: '24/7 Support',       desc: 'Round-the-clock customer assistance' },
              { icon: Zap,             title: 'Instant Booking',    desc: 'Instant confirmation on all bookings' },
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

      {/* ── FLIGHT BOOKING FAQs ── */}
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Flight Booking FAQs</h2>
        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                {faq.q}
                {openFaq === i
                  ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                  : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                }
              </button>
              {openFaq === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
