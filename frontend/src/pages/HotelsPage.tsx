import { useEffect, useState, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search, Home, ChevronRight, MapPin, ChevronDown, ChevronUp, X, Star, SlidersHorizontal, Plane, Building2, Car, TrainFront, Bus } from 'lucide-react'
import type { HotelDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { HotelCard } from '@/components/hotels/HotelCard'
import { HotelCardSkeleton } from '@/components/ui/Skeleton'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

function fmtDate(d: string): string {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  const day = dt.getDate().toString().padStart(2, '0')
  const month = dt.toLocaleDateString('en-US', { month: 'short' })
  const yr = dt.getFullYear().toString().slice(2)
  return `${day} ${month} '${yr}`
}

function dayName(d: string): string {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
}

function parseAmenities(raw: string): string[] {
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'rating_desc' | 'price_asc' | 'price_desc' | 'stars_desc'

interface Filters {
  minStars:       number
  maxPrice:       number
  minRating:      number
  amenities:      string[]
  popularFilters: string[]
}

const INIT_FILTERS: Filters = { minStars: 0, maxPrice: 0, minRating: 0, amenities: [], popularFilters: [] }

const AMENITY_OPTS   = ['Pool', 'Spa', 'Gym', 'Restaurant', 'WiFi', 'Parking', 'Bar', 'Beach']
const POPULAR_OPTS   = ['Swimming Pool', 'Parking', 'Spa', 'Gym']
const RATING_LABELS: Record<number, string> = { 4.5: 'Exceptional', 4: 'Very Good', 3.5: 'Good', 3: 'Pleasant' }

function toggle<T>(arr: T[], v: T): T[] { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }

// ── FilterSection ─────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-4">
      <h3 className="font-semibold text-gray-800 text-sm mb-3">{title}</h3>
      {children}
    </div>
  )
}

// ── FilterSidebar ─────────────────────────────────────────────────────────────

function FilterSidebar({ filters, setFilters, hotels }: {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  hotels: HotelDto[]
}) {
  const hasFilters = filters.minStars > 0 || filters.maxPrice > 0 || filters.minRating > 0 ||
    filters.amenities.length > 0 || filters.popularFilters.length > 0

  const maxPriceCap = hotels.length
    ? Math.ceil(Math.max(...hotels.flatMap(h => h.rooms.map(r => r.pricePerNight))) / 1000) * 1000
    : 20000

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm sticky top-20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h2 className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
          <SlidersHorizontal className="h-4 w-4 text-orange-500" /> Filters
        </h2>
        {hasFilters && (
          <button onClick={() => setFilters(INIT_FILTERS)} className="text-xs text-orange-500 font-medium flex items-center gap-1 hover:text-orange-600">
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      <div className="px-4 max-h-[calc(100vh-180px)] overflow-y-auto scrollbar-hide">
        {/* Popular Filters */}
        <FilterSection title="Popular Filters">
          <div className="flex flex-col gap-2">
            {POPULAR_OPTS.map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.popularFilters.includes(f)}
                  onChange={() => setFilters(p => ({ ...p, popularFilters: toggle(p.popularFilters, f) }))}
                  className="accent-orange-500 rounded"
                />
                <span className="text-sm text-gray-700">{f}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Star Category */}
        <FilterSection title="Star Category">
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setFilters(p => ({ ...p, minStars: p.minStars === s ? 0 : s }))}
                className={[
                  'flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all',
                  filters.minStars === s
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300',
                ].join(' ')}
              >
                {s}<Star className="h-3 w-3 fill-current" />
              </button>
            ))}
          </div>
        </FilterSection>

        {/* User Rating */}
        <FilterSection title="User Rating">
          <div className="flex flex-col gap-1.5">
            {[4.5, 4.0, 3.5, 3.0].map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setFilters(p => ({ ...p, minRating: p.minRating === r ? 0 : r }))}
                className={[
                  'flex items-center gap-2 text-sm px-3 py-1.5 rounded border transition-all text-left',
                  filters.minRating === r
                    ? 'bg-orange-50 border-orange-400 text-orange-700'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300',
                ].join(' ')}
              >
                <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded text-white ${r >= 4.5 ? 'bg-green-600' : r >= 4 ? 'bg-green-500' : r >= 3.5 ? 'bg-yellow-500' : 'bg-orange-400'}`}>
                  {r}+
                </span>
                {RATING_LABELS[r]}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price Range */}
        <FilterSection title="Price Per Night">
          <div className="space-y-2">
            <input
              type="range"
              min={0}
              max={maxPriceCap}
              step={500}
              value={filters.maxPrice || maxPriceCap}
              onChange={e => setFilters(p => ({ ...p, maxPrice: Number(e.target.value) }))}
              className="w-full accent-orange-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>₹0</span>
              <span className="font-medium text-gray-800">
                {filters.maxPrice ? `up to ₹${filters.maxPrice.toLocaleString('en-IN')}` : 'Any price'}
              </span>
              <span>₹{maxPriceCap.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </FilterSection>

        {/* Amenities */}
        <FilterSection title="Amenities">
          <div className="flex flex-wrap gap-1.5">
            {AMENITY_OPTS.map(a => (
              <button
                key={a}
                type="button"
                onClick={() => setFilters(p => ({ ...p, amenities: toggle(p.amenities, a) }))}
                className={[
                  'px-2.5 py-1 rounded-full border text-xs font-medium transition-all',
                  filters.amenities.includes(a)
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300',
                ].join(' ')}
              >
                {a}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}

// ── GuestsDropdown ────────────────────────────────────────────────────────────

function GuestsDropdown({ guests, rooms, onGuests, onRooms }: {
  guests: number; rooms: number; onGuests: (n: number) => void; onRooms: (n: number) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button type="button" className="text-left w-full" onClick={() => setOpen(v => !v)}>
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Guests &amp; Rooms</p>
        <div className="flex items-center gap-1.5">
          <p className="text-lg font-bold text-gray-900">
            {guests} Adult{guests !== 1 ? 's' : ''} | {rooms} Room{rooms !== 1 ? 's' : ''}
          </p>
          {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </div>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-5 z-50 min-w-[230px]">
          {[
            { label: 'Adults', val: guests, min: 1, max: 10, set: onGuests },
            { label: 'Rooms',  val: rooms,  min: 1, max: 10, set: onRooms  },
          ].map(({ label, val, min, max, set }) => (
            <div key={label} className="flex items-center justify-between mb-4 last:mb-0">
              <span className="text-sm font-semibold text-gray-800">{label}</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => set(Math.max(min, val - 1))}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 font-bold transition-colors">−</button>
                <span className="w-5 text-center font-bold text-gray-900">{val}</span>
                <button type="button" onClick={() => set(Math.min(max, val + 1))}
                  className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 font-bold transition-colors">+</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setOpen(false)}
            className="mt-4 w-full py-2 bg-orange-500 text-white text-sm font-semibold rounded-lg hover:bg-orange-600 transition-colors">
            Done
          </button>
        </div>
      )}
    </div>
  )
}

// ── SortTabs ──────────────────────────────────────────────────────────────────

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'rating_desc', label: '⭐ Top Rated' },
  { key: 'price_asc',   label: '₹ Price ↑'   },
  { key: 'price_desc',  label: '₹ Price ↓'   },
  { key: 'stars_desc',  label: '★ Stars'      },
]

// ── Main Page ─────────────────────────────────────────────────────────────────

const MODE_TABS = [
  { label: 'Flights', to: '/flights', Icon: Plane,     active: false },
  { label: 'Hotels',  to: '/hotels',  Icon: Building2, active: true  },
  { label: 'Cabs',    to: '/cabs',    Icon: Car,       active: false },
  { label: 'Trains',  to: '/trains',  Icon: TrainFront,active: false },
  { label: 'Buses',   to: '/buses',   Icon: Bus,       active: false },
]

export default function HotelsPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const [city,     setCity]     = useState(searchParams.get('city')     ?? '')
  const [checkIn,  setCheckIn]  = useState(searchParams.get('checkIn')  ?? '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ?? '')
  const [guests,   setGuests]   = useState(Number(searchParams.get('guests') ?? 2))
  const [rooms,    setRooms]    = useState(Number(searchParams.get('rooms')  ?? 1))

  const [hotels,  setHotels]  = useState<HotelDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [sort,    setSort]    = useState<SortKey>('rating_desc')
  const [filters, setFilters] = useState<Filters>(INIT_FILTERS)

  const fetchHotels = async (c = city) => {
    if (!c) return
    setLoading(true); setError(null)
    try {
      const res = await hotelService.search({ city: c, checkIn, checkOut, guests, pageSize: 50 })
      setHotels(res.data ?? [])
    } catch {
      setError('Failed to fetch hotels. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (city) fetchHotels() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = [...hotels]
    if (filters.minStars) list = list.filter(h => h.starRating >= filters.minStars)
    if (filters.maxPrice) {
      list = list.filter(h => {
        const min = h.rooms.length ? Math.min(...h.rooms.map(r => r.pricePerNight)) : Infinity
        return min <= filters.maxPrice
      })
    }
    if (filters.minRating) list = list.filter(h => h.reviewScore >= filters.minRating)
    if (filters.amenities.length) {
      list = list.filter(h => {
        const ams = parseAmenities(h.amenities)
        return filters.amenities.every(a => ams.some(ha => ha.toLowerCase().includes(a.toLowerCase())))
      })
    }
    if (filters.popularFilters.length) {
      list = list.filter(h => {
        const ams = parseAmenities(h.amenities).map(a => a.toLowerCase())
        return filters.popularFilters.every(f => {
          const fl = f.toLowerCase()
          if (fl === 'swimming pool') return ams.some(a => a.includes('pool'))
          if (fl === 'parking') return ams.some(a => a.includes('parking'))
          if (fl === 'spa') return ams.some(a => a.includes('spa'))
          if (fl === 'gym') return ams.some(a => a.includes('gym'))
          return true
        })
      })
    }
    list.sort((a, b) => {
      const aMin = a.rooms.length ? Math.min(...a.rooms.map(r => r.pricePerNight)) : 0
      const bMin = b.rooms.length ? Math.min(...b.rooms.map(r => r.pricePerNight)) : 0
      switch (sort) {
        case 'price_asc':   return aMin - bMin
        case 'price_desc':  return bMin - aMin
        case 'rating_desc': return b.reviewScore - a.reviewScore
        case 'stars_desc':  return b.starRating - a.starRating
        default:            return 0
      }
    })
    return list
  }, [hotels, filters, sort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/hotels?${new URLSearchParams({ city, checkIn, checkOut, guests: String(guests), rooms: String(rooms) })}`, { replace: true })
    fetchHotels()
  }

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Search Header ── */}
      <div className="bg-orange-500 py-8 px-4">

        {/* Mode tabs */}
        <div className="mx-auto max-w-6xl mb-5 flex gap-1 overflow-x-auto pb-1">
          {MODE_TABS.map(({ label, to, Icon, active }) => (
            <Link key={label} to={to} className={[
              'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all',
              active ? 'bg-white text-gray-900 shadow-lg' : 'text-white/80 hover:text-white hover:bg-white/10',
            ].join(' ')}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mx-auto max-w-5xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="flex flex-wrap items-stretch divide-x divide-gray-200">

              {/* Where to */}
              <div className="flex-[2] min-w-[200px] px-5 py-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Where to</p>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-400 shrink-0" />
                  <input
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Enter city, area or hotel"
                    className="w-full text-xl font-bold text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-300 placeholder:font-normal placeholder:text-sm"
                    required
                  />
                </div>
              </div>

              {/* Check-in */}
              <div className="relative flex-1 min-w-[130px] px-5 py-4 cursor-pointer">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Check-in</p>
                {checkIn ? (
                  <>
                    <p className="text-base font-bold text-gray-900">{fmtDate(checkIn)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{dayName(checkIn)}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-300 font-medium mt-1">Select date</p>
                )}
                <input
                  type="date" value={checkIn} min={TODAY}
                  onChange={e => setCheckIn(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required
                />
              </div>

              {/* Check-out */}
              <div className="relative flex-1 min-w-[130px] px-5 py-4 cursor-pointer">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Check-out</p>
                {checkOut ? (
                  <>
                    <p className="text-base font-bold text-gray-900">{fmtDate(checkOut)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {dayName(checkOut)}{nights > 0 ? ` · ${nights} night${nights > 1 ? 's' : ''}` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-300 font-medium mt-1">Select date</p>
                )}
                <input
                  type="date" value={checkOut} min={checkIn || TODAY}
                  onChange={e => setCheckOut(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  required
                />
              </div>

              {/* Guests & Rooms */}
              <div className="flex-1 min-w-[180px] px-5 py-4">
                <GuestsDropdown guests={guests} rooms={rooms} onGuests={setGuests} onRooms={setRooms} />
              </div>

            </div>
          </div>

          <div className="mt-5 flex justify-center">
            <button
              type="submit"
              disabled={loading}
              className="px-14 py-3.5 rounded-full bg-white text-orange-600 border-2 border-orange-200 font-bold text-lg uppercase tracking-widest shadow-xl hover:bg-orange-50 transition-all hover:scale-105 active:scale-100 flex items-center gap-2"
            >
              <Search className="h-5 w-5" />
              {loading ? 'Searching…' : 'SEARCH'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Results ── */}
      <div className="mx-auto max-w-6xl px-4 py-4">

        <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link to="/" className="hover:text-orange-600 flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-3 w-3" /><span>Hotels</span>
          {city && <><ChevronRight className="h-3 w-3" /><span className="text-gray-600 font-medium">{city}</span></>}
        </nav>

        <div className="flex gap-5">
          <aside className="hidden lg:block w-60 flex-shrink-0">
            <FilterSidebar filters={filters} setFilters={setFilters} hotels={hotels} />
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm text-gray-500">
                {loading ? 'Searching…' : `${filtered.length} hotel${filtered.length !== 1 ? 's' : ''} found${city ? ` in ${city}` : ''}`}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {SORT_TABS.map(t => (
                  <button key={t.key} onClick={() => setSort(t.key)}
                    className={[
                      'px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                      sort === t.key
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300',
                    ].join(' ')}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

            <div className="flex flex-col gap-4">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <HotelCardSkeleton key={i} />)
                : filtered.length === 0
                  ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
                      <p className="text-lg font-semibold">No hotels found</p>
                      <p className="text-sm mt-1">Try a different city or adjust filters</p>
                    </div>
                  )
                  : filtered.map(h => (
                    <HotelCard key={h.id} hotel={h} checkIn={checkIn} checkOut={checkOut} guests={guests} />
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
