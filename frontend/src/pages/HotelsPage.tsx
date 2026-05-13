import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Search, Home, ChevronRight, MapPin, ChevronDown, ChevronUp,
  X, Star, SlidersHorizontal,
} from 'lucide-react'
import type { HotelDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { HotelCard } from '@/components/hotels/HotelCard'
import { HotelCardSkeleton } from '@/components/ui/Skeleton'

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const HOTEL_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
  'Goa', 'Jaipur', 'Pune', 'Ahmedabad', 'Kochi', 'Lucknow',
  'Agra', 'Varanasi', 'Udaipur', 'Jodhpur', 'Shimla', 'Manali',
  'Rishikesh', 'Darjeeling', 'Mysore', 'Ooty', 'Coorg',
  'Amritsar', 'Chandigarh', 'Bhopal', 'Indore', 'Surat', 'Vadodara',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getDate().toString().padStart(2, '0')} ${dt.toLocaleDateString('en-US', { month: 'short' })} '${dt.getFullYear().toString().slice(2)}`
}

function dayLabel(d: string): string {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
}

function parseAmenities(raw: string): string[] {
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SortKey = 'rating_desc' | 'price_asc' | 'price_desc' | 'stars_desc'

interface GuestConfig { adults: number; children: number; infants: number; rooms: number }

interface Filters {
  minStars: number; maxPrice: number; minRating: number
  amenities: string[]; popularFilters: string[]
}

const INIT_FILTERS: Filters = { minStars: 0, maxPrice: 0, minRating: 0, amenities: [], popularFilters: [] }
const AMENITY_OPTS = ['Pool', 'Spa', 'Gym', 'Restaurant', 'WiFi', 'Parking', 'Business Center', 'Room Service']
const POPULAR_OPTS = ['Swimming Pool', 'Parking', 'Spa', 'Gym']
const RATING_LABELS: Record<number, string> = { 4.5: 'Exceptional', 4.0: 'Very Good', 3.5: 'Good', 3.0: 'Pleasant' }

// ── CitySearch ────────────────────────────────────────────────────────────────

interface CitySearchProps {
  value: string
  onChange: (city: string) => void
}

function CitySearch({ value, onChange }: CitySearchProps) {
  const [query,   setQuery]   = useState(value)
  const [open,    setOpen]    = useState(false)
  const ref                   = useRef<HTMLDivElement>(null)

  // sync external value (e.g. on mount from URL)
  useEffect(() => { setQuery(value) }, [value])

  // close on outside click
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

// ── DateField ─────────────────────────────────────────────────────────────────

interface DateFieldProps {
  label: string
  value: string
  min: string
  onChange: (v: string) => void
  nights?: number
  required?: boolean
}

function DateField({ label, value, min, onChange, nights }: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const open = () => {
    if (!inputRef.current) return
    // showPicker is widely supported in modern browsers
    try { (inputRef.current as HTMLInputElement & { showPicker?: () => void }).showPicker?.() }
    catch { inputRef.current.click() }
  }

  return (
    <div className="cursor-pointer select-none" onClick={open}>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{label}</p>
      {value ? (
        <>
          <p className="text-base font-bold text-gray-900 leading-tight">{fmtDate(value)}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {dayLabel(value)}{label === 'Check-out' && nights && nights > 0 ? ` · ${nights} night${nights > 1 ? 's' : ''}` : ''}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-300 font-medium">Select date</p>
      )}
      <input
        ref={inputRef}
        type="date"
        value={value}
        min={min}
        onChange={e => onChange(e.target.value)}
        className="sr-only"
      />
    </div>
  )
}

// ── GuestsDropdown ────────────────────────────────────────────────────────────

function GuestsDropdown({ value, onChange }: {
  value: GuestConfig
  onChange: (g: GuestConfig) => void
}) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const set = (key: keyof GuestConfig, delta: number, min = 0) =>
    onChange({ ...value, [key]: Math.max(min, value[key] + delta) })

  const summary = `${value.adults} Adult${value.adults !== 1 ? 's' : ''}${value.children ? `, ${value.children} Child${value.children !== 1 ? 'ren' : ''}` : ''}${value.infants ? `, ${value.infants} Infant${value.infants !== 1 ? 's' : ''}` : ''} · ${value.rooms} Room${value.rooms !== 1 ? 's' : ''}`

  const rows: { key: keyof GuestConfig; label: string; sub: string; min: number }[] = [
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
                  <button
                    type="button"
                    onClick={() => set(key, -1, min)}
                    disabled={value[key] <= min}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed font-bold transition-colors text-lg leading-none"
                  >−</button>
                  <span className="w-5 text-center font-bold text-gray-900">{value[key]}</span>
                  <button
                    type="button"
                    onClick={() => set(key, 1, min)}
                    className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-orange-500 hover:text-orange-500 font-bold transition-colors text-lg leading-none"
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          {value.infants > 0 && (
            <p className="mt-3 text-[11px] text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
              Infants travel on an adult's lap. Each infant must be accompanied by an adult.
            </p>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}

// ── FilterSidebar ─────────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-100 py-4">
      <h3 className="font-semibold text-gray-800 text-sm mb-3">{title}</h3>
      {children}
    </div>
  )
}

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
        <FilterSection title="Popular Filters">
          <div className="flex flex-col gap-2">
            {POPULAR_OPTS.map(f => (
              <label key={f} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filters.popularFilters.includes(f)}
                  onChange={() => setFilters(p => ({ ...p, popularFilters: toggle(p.popularFilters, f) }))}
                  className="accent-orange-500 rounded" />
                <span className="text-sm text-gray-700">{f}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Star Category">
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} type="button"
                onClick={() => setFilters(p => ({ ...p, minStars: p.minStars === s ? 0 : s }))}
                className={['flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-all',
                  filters.minStars === s ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-600 hover:border-orange-300'].join(' ')}>
                {s}<Star className="h-3 w-3 fill-current" />
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="User Rating">
          <div className="flex flex-col gap-1.5">
            {[4.5, 4.0, 3.5, 3.0].map(r => (
              <button key={r} type="button"
                onClick={() => setFilters(p => ({ ...p, minRating: p.minRating === r ? 0 : r }))}
                className={['flex items-center gap-2 text-sm px-3 py-1.5 rounded border transition-all text-left',
                  filters.minRating === r ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-orange-300'].join(' ')}>
                <span className={`font-bold text-[11px] px-1.5 py-0.5 rounded text-white ${r >= 4.5 ? 'bg-green-600' : r >= 4 ? 'bg-green-500' : r >= 3.5 ? 'bg-yellow-500' : 'bg-orange-400'}`}>
                  {r}+
                </span>
                {RATING_LABELS[r]}
              </button>
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Price Per Night">
          <div className="space-y-2">
            <input type="range" min={0} max={maxPriceCap} step={500}
              value={filters.maxPrice || maxPriceCap}
              onChange={e => setFilters(p => ({ ...p, maxPrice: Number(e.target.value) }))}
              className="w-full accent-orange-500" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>₹0</span>
              <span className="font-medium text-gray-800">
                {filters.maxPrice ? `up to ₹${filters.maxPrice.toLocaleString('en-IN')}` : 'Any price'}
              </span>
              <span>₹{maxPriceCap.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </FilterSection>

        <FilterSection title="Amenities">
          <div className="flex flex-wrap gap-1.5">
            {AMENITY_OPTS.map(a => (
              <button key={a} type="button"
                onClick={() => setFilters(p => ({ ...p, amenities: toggle(p.amenities, a) }))}
                className={['px-2.5 py-1 rounded-full border text-xs font-medium transition-all',
                  filters.amenities.includes(a) ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 text-gray-600 hover:border-orange-300'].join(' ')}>
                {a}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>
    </div>
  )
}

const SORT_TABS: { key: SortKey; label: string }[] = [
  { key: 'rating_desc', label: '⭐ Top Rated' },
  { key: 'price_asc',   label: '₹ Price ↑'   },
  { key: 'price_desc',  label: '₹ Price ↓'   },
  { key: 'stars_desc',  label: '★ Stars'      },
]

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HotelsPage() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()

  const [city,     setCity]     = useState(searchParams.get('city')     ?? '')
  const [checkIn,  setCheckIn]  = useState(searchParams.get('checkIn')  ?? '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ?? '')
  const [guests,   setGuests]   = useState<GuestConfig>(() => ({
    adults:   Number(searchParams.get('adults')   ?? 2),
    children: Number(searchParams.get('children') ?? 0),
    infants:  Number(searchParams.get('infants')  ?? 0),
    rooms:    Number(searchParams.get('rooms')    ?? 1),
  }))

  const [hotels,  setHotels]  = useState<HotelDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [sort,    setSort]    = useState<SortKey>('rating_desc')
  const [filters, setFilters] = useState<Filters>(INIT_FILTERS)

  const totalGuests = guests.adults + guests.children

  const fetchHotels = async (c = city) => {
    if (!c) return
    setLoading(true); setError(null)
    try {
      const res = await hotelService.search({ city: c, checkIn, checkOut, guests: totalGuests, pageSize: 50 })
      setHotels(res.data ?? [])
    } catch {
      setError('Failed to fetch hotels. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (city) fetchHotels() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Compute filtered list directly on every render — guarantees filters always reflect current state
  let filtered = [...hotels]

  // Star: exact match — "3★" shows only 3-star hotels
  if (filters.minStars > 0)
    filtered = filtered.filter(h => Math.floor(Number(h.starRating)) === filters.minStars)

  if (filters.maxPrice > 0) {
    filtered = filtered.filter(h => {
      const minPrice = h.rooms.length ? Math.min(...h.rooms.map(r => r.pricePerNight)) : Infinity
      return minPrice <= filters.maxPrice
    })
  }

  // Rating: minimum score (4.5+ means reviewScore >= 4.5)
  if (filters.minRating > 0)
    filtered = filtered.filter(h => Number(h.reviewScore) >= filters.minRating)

  // Amenities: OR logic — hotel must have at least one selected amenity
  if (filters.amenities.length > 0) {
    filtered = filtered.filter(h => {
      const ams = parseAmenities(h.amenities).map(a => a.toLowerCase())
      return filters.amenities.some(a => ams.some(ha => ha.includes(a.toLowerCase())))
    })
  }

  // Popular filters: OR logic — hotel must match at least one checked filter
  if (filters.popularFilters.length > 0) {
    filtered = filtered.filter(h => {
      const ams = parseAmenities(h.amenities).map(a => a.toLowerCase())
      return filters.popularFilters.some(f => {
        const fl = f.toLowerCase()
        if (fl === 'swimming pool') return ams.some(a => a.includes('pool'))
        if (fl === 'parking')       return ams.some(a => a.includes('parking'))
        if (fl === 'spa')           return ams.some(a => a.includes('spa'))
        if (fl === 'gym')           return ams.some(a => a.includes('gym'))
        return false
      })
    })
  }

  filtered.sort((a, b) => {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({
      city, checkIn, checkOut,
      adults: String(guests.adults), children: String(guests.children),
      infants: String(guests.infants), rooms: String(guests.rooms),
    })
    navigate(`/hotels?${params}`, { replace: true })
    fetchHotels()
  }

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Search Header ── */}
      <div className="bg-orange-500 py-8 px-4">
        {/* Search form */}
        <form onSubmit={handleSearch} className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white shadow-xl">
            <div className="flex flex-col divide-y divide-gray-200 lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0">

              {/* City with autocomplete */}
              <div className="relative z-20 flex-[2] px-4 py-4 lg:min-w-0">
                <CitySearch value={city} onChange={setCity} />
              </div>

              {/* Check-in */}
              <div className="px-4 py-4 lg:w-[220px]">
                <DateField
                  label="Check-in"
                  value={checkIn}
                  min={TODAY}
                  onChange={setCheckIn}
                  required
                />
              </div>

              {/* Check-out */}
              <div className="px-4 py-4 lg:w-[220px]">
                <DateField
                  label="Check-out"
                  value={checkOut}
                  min={checkIn || TODAY}
                  onChange={setCheckOut}
                  nights={nights}
                  required
                />
              </div>

              {/* Guests & Rooms */}
              <div className="relative z-10 px-4 py-4 lg:w-[280px]">
                <GuestsDropdown value={guests} onChange={setGuests} />
              </div>

              <div className="px-4 py-4 lg:flex lg:items-center lg:justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70 lg:w-auto"
                >
                  <Search className="h-5 w-5" />
                  {loading ? 'Searching…' : 'Search'}
                </button>
              </div>
            </div>
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
          {!loading && hotels.length > 0 && (
            <aside className="hidden lg:block w-60 flex-shrink-0">
              <FilterSidebar filters={filters} setFilters={setFilters} hotels={hotels} />
            </aside>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <p className="text-sm text-gray-500">
                {loading ? 'Searching…' : `${filtered.length} hotel${filtered.length !== 1 ? 's' : ''} found${city ? ` in ${city}` : ''}`}
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {SORT_TABS.map(t => (
                  <button key={t.key} onClick={() => setSort(t.key)}
                    className={['px-3 py-1.5 rounded-full border text-xs font-semibold transition-all',
                      sort === t.key ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'].join(' ')}>
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
                    <HotelCard key={h.id} hotel={h} checkIn={checkIn} checkOut={checkOut} guests={totalGuests} />
                  ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
