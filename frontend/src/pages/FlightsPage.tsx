import { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search, Home, ChevronRight, ArrowLeftRight, ChevronDown, X } from 'lucide-react'
import type { FlightDto } from '@/types'
import { flightService } from '@/services/flightService'
import { FlightCard } from '@/components/flights/FlightCard'
import { FlightCardSkeleton } from '@/components/ui/Skeleton'
import { AirportSearch } from '@/components/search/AirportSearch'
import { TravellerSelector, type TravellerConfig } from '@/components/search/TravellerSelector'
import { formatCurrency } from '@/utils/formatters'
import { AIRPORTS } from '@/data/airports'

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeSlot = 'early' | 'morning' | 'afternoon' | 'night'
type SortKey  = 'cheapest' | 'nonstop' | 'prefer' | 'departure'
type TripType = 'oneway' | 'roundtrip'

interface Filters {
  nonStop:    boolean
  oneStop:    boolean
  airlines:   string[]
  depSlots:   TimeSlot[]
  arrSlots:   TimeSlot[]
  refundable: boolean
  hideNearby: boolean
  priceMax:   number
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const DEFAULT_FILTERS: Filters = {
  nonStop: false, oneStop: false, airlines: [], depSlots: [],
  arrSlots: [], refundable: false, hideNearby: false, priceMax: 0,
}

const TIME_SLOTS: { key: TimeSlot; label: string; sub: string; icon: string; range: [number, number] }[] = [
  { key: 'early',     label: 'Before 6 am',  sub: '12am - 6am',  icon: '🌙', range: [0,  6]  },
  { key: 'morning',   label: '6 am - 12 pm', sub: '6am - 12pm',  icon: '🌅', range: [6,  12] },
  { key: 'afternoon', label: '12 pm - 6 pm', sub: '12pm - 6pm',  icon: '☀️', range: [12, 18] },
  { key: 'night',     label: 'After 6 pm',   sub: '6pm - 11pm',  icon: '🌆', range: [18, 24] },
]

const AIRLINE_COLORS: Record<string, string> = {
  'IndiGo':            '#0056a2',
  'SpiceJet':          '#e31837',
  'Air India':         '#c8102e',
  'Vistara':           '#6f2c91',
  'Akasa Air':         '#ff6600',
  'Air India Express': '#007ba7',
  'Go First':          '#003580',
}

const AIRPORT_NAMES: Record<string, string> = {
  BOM: 'Chhatrapati Shivaji Maharaj International Airport',
  DEL: 'Indira Gandhi International Airport',
  BLR: 'Kempegowda International Airport',
  HYD: 'Rajiv Gandhi International Airport',
  MAA: 'Chennai International Airport',
  CCU: 'Netaji Subhas Chandra Bose International Airport',
  AMD: 'Sardar Vallabhbhai Patel International Airport',
  GOI: 'Goa International Airport',
  COK: 'Cochin International Airport',
  LKO: 'Chaudhary Charan Singh International Airport',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}


function flightHour(f: FlightDto, field: 'dep' | 'arr'): number {
  return new Date(field === 'dep' ? f.departureTime : f.arrivalTime).getHours()
}

function slotMatch(hour: number, slot: TimeSlot): boolean {
  const { range } = TIME_SLOTS.find(s => s.key === slot)!
  return hour >= range[0] && hour < range[1]
}

function minPrice(arr: FlightDto[]): number {
  return arr.length ? Math.min(...arr.map(f => f.price)) : Infinity
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AirlineDot({ airline }: { airline: string }) {
  const color = AIRLINE_COLORS[airline] ?? '#777'
  const initials = airline.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span
      style={{ backgroundColor: color }}
      className="inline-flex items-center justify-center w-5 h-5 rounded text-white text-xs font-bold flex-shrink-0"
    >
      {initials}
    </span>
  )
}

function FilterSection({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-100 py-4">
      <button
        className="flex items-center justify-between w-full text-sm font-bold text-gray-800 mb-3"
        onClick={() => setOpen(p => !p)}
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && children}
    </div>
  )
}

function CheckRow({
  label, price, checked, onChange, icon,
}: {
  label: string; price?: number; checked: boolean
  onChange: (v: boolean) => void; icon?: React.ReactNode
}) {
  return (
    <label className="flex items-center justify-between gap-2 cursor-pointer py-1 group">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="w-4 h-4 accent-blue-600 flex-shrink-0"
        />
        {icon}
        <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors">{label}</span>
      </div>
      {price !== undefined && price !== Infinity && (
        <span className="text-xs text-gray-500 whitespace-nowrap">₹ {price.toLocaleString('en-IN')}</span>
      )}
    </label>
  )
}

function TimeSlotButton({
  slot, selected, price, onToggle,
}: {
  slot: typeof TIME_SLOTS[0]; selected: boolean; price?: number; onToggle: () => void
}) {
  return (
    <button
      onClick={onToggle}
      className={`flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all text-xs ${
        selected
          ? 'border-blue-500 bg-blue-50 text-blue-700'
          : 'border-gray-200 text-gray-600 hover:border-blue-300'
      }`}
    >
      <span className="text-base leading-none">{slot.icon}</span>
      <span className="font-medium mt-1 leading-tight">{slot.label.replace(' am', ' am').replace(' pm', ' pm')}</span>
      {price !== undefined && price !== Infinity && (
        <span className="text-gray-400 mt-0.5">₹{Math.round(price / 1000)}k+</span>
      )}
    </button>
  )
}

// ── Sort Tabs ─────────────────────────────────────────────────────────────────

function SortTabs({
  sortKey, onSort, flights,
}: { sortKey: SortKey; onSort: (k: SortKey) => void; flights: FlightDto[] }) {
  const cheapest   = minPrice(flights)
  const nonstopMin = minPrice(flights.filter(f => f.stops === 0))
  const preferMin  = minPrice(flights.filter(f => f.stops === 0)) || cheapest

  const tabs: { key: SortKey; label: string; price: number | null; icon: string }[] = [
    { key: 'cheapest',  label: 'CHEAPEST',        price: cheapest,   icon: '₹' },
    { key: 'nonstop',   label: 'NON STOP FIRST',  price: nonstopMin, icon: '⚡' },
    { key: 'prefer',    label: 'YOU MAY PREFER',  price: preferMin,  icon: '⭐' },
    { key: 'departure', label: 'OTHER SORT',       price: null,       icon: '⇅' },
  ]

  return (
    <div className="flex gap-2 mb-4">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onSort(tab.key)}
          className={`flex-1 flex flex-col items-center py-3 px-2 rounded-lg border text-xs font-semibold transition-all ${
            sortKey === tab.key
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
          }`}
        >
          <span className="text-base mb-1">{tab.icon}</span>
          <span>{tab.label}</span>
          {tab.price !== undefined && tab.price !== null && tab.price !== Infinity && (
            <span className={`mt-0.5 ${sortKey === tab.key ? 'text-blue-500' : 'text-gray-400'}`}>
              {formatCurrency(tab.price)}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

// ── Filter Sidebar ────────────────────────────────────────────────────────────

function FilterSidebar({
  flights, filters, setFilters, origin, destination,
}: {
  flights: FlightDto[]
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  origin: string
  destination: string
}) {
  const [showAllPopular, setShowAllPopular] = useState(false)

  // Precompute min prices from all unfiltered flights
  const minByStop = useMemo(() => {
    const m: Record<number, number> = {}
    flights.forEach(f => { if (!(f.stops in m) || f.price < m[f.stops]) m[f.stops] = f.price })
    return m
  }, [flights])

  const minByAirline = useMemo(() => {
    const m: Record<string, number> = {}
    flights.forEach(f => { if (!(f.airline in m) || f.price < m[f.airline]) m[f.airline] = f.price })
    return m
  }, [flights])

  const minByDepSlot = useMemo(() => {
    const m: Record<TimeSlot, number> = { early: Infinity, morning: Infinity, afternoon: Infinity, night: Infinity }
    flights.forEach(f => {
      const h = flightHour(f, 'dep')
      TIME_SLOTS.forEach(s => { if (slotMatch(h, s.key) && f.price < m[s.key]) m[s.key] = f.price })
    })
    return m
  }, [flights])

  const minByArrSlot = useMemo(() => {
    const m: Record<TimeSlot, number> = { early: Infinity, morning: Infinity, afternoon: Infinity, night: Infinity }
    flights.forEach(f => {
      const h = flightHour(f, 'arr')
      TIME_SLOTS.forEach(s => { if (slotMatch(h, s.key) && f.price < m[s.key]) m[s.key] = f.price })
    })
    return m
  }, [flights])

  const minRefundable = useMemo(() => minPrice(flights.filter(f => f.isRefundable)), [flights])
  const priceMaxCap   = useMemo(() => flights.length ? Math.max(...flights.map(f => f.price)) : 100000, [flights])
  const priceMinCap   = useMemo(() => flights.length ? Math.min(...flights.map(f => f.price)) : 0, [flights])
  const airlines      = useMemo(() => Object.keys(minByAirline).sort((a, b) => minByAirline[a] - minByAirline[b]), [minByAirline])

  const toggle = <K extends keyof Filters>(key: K, val: Filters[K]) =>
    setFilters(p => ({ ...p, [key]: val }))

  const toggleArr = (key: 'airlines' | 'depSlots' | 'arrSlots', val: string) =>
    setFilters(p => {
      const arr = p[key] as string[]
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })

  const hasActive = filters.nonStop || filters.oneStop || filters.airlines.length > 0 ||
    filters.depSlots.length > 0 || filters.arrSlots.length > 0 ||
    filters.refundable || filters.priceMax > 0

  // Popular filter rows
  const popularRows = [
    { label: 'Non Stop',               price: minByStop[0],         act: filters.nonStop,               fn: (v: boolean) => toggle('nonStop', v) },
    { label: 'Hide Nearby Airports',   price: priceMinCap,          act: filters.hideNearby,            fn: (v: boolean) => toggle('hideNearby', v) },
    ...airlines.map(a => ({ label: a, price: minByAirline[a],       act: filters.airlines.includes(a),  fn: (_: boolean) => toggleArr('airlines', a), icon: <AirlineDot airline={a} /> })),
    { label: 'Late Departures',        price: minByDepSlot.night,   act: filters.depSlots.includes('night'),     fn: (_: boolean) => toggleArr('depSlots', 'night') },
    { label: '1 Stop',                 price: minByStop[1],         act: filters.oneStop,               fn: (v: boolean) => toggle('oneStop', v) },
    { label: 'AfterNoon Departures',   price: minByDepSlot.afternoon, act: filters.depSlots.includes('afternoon'), fn: (_: boolean) => toggleArr('depSlots', 'afternoon') },
    { label: 'Refundable Fares',       price: minRefundable,        act: filters.refundable,            fn: (v: boolean) => toggle('refundable', v) },
    { label: 'Early Morning Departures', price: minByDepSlot.early, act: filters.depSlots.includes('early'),     fn: (_: boolean) => toggleArr('depSlots', 'early') },
    { label: 'Morning Departures',     price: minByDepSlot.morning, act: filters.depSlots.includes('morning'),   fn: (_: boolean) => toggleArr('depSlots', 'morning') },
  ] as { label: string; price: number; act: boolean; fn: (v: boolean) => void; icon?: React.ReactNode }[]

  const visiblePopular = showAllPopular ? popularRows : popularRows.slice(0, 6)

  if (!flights.length) return null

  return (
    <aside className="w-60 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-gray-800 text-sm">Filters</span>
          {hasActive && (
            <button
              onClick={() => setFilters(DEFAULT_FILTERS)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>

        <div className="px-4 max-h-[calc(100vh-180px)] overflow-y-auto">

          {/* Popular Filters */}
          <FilterSection title="Popular Filters">
            {visiblePopular.map(r => (
              <CheckRow
                key={r.label}
                label={r.label}
                price={r.price}
                checked={r.act}
                onChange={r.fn}
                icon={r.icon}
              />
            ))}
            <button
              className="text-xs text-blue-600 hover:underline mt-1 font-medium"
              onClick={() => setShowAllPopular(p => !p)}
            >
              {showAllPopular ? 'Show less' : `Show more (${popularRows.length - visiblePopular.length} more)`}
            </button>
          </FilterSection>

          {/* Arrival Airports */}
          <FilterSection title="Arrival Airports" defaultOpen>
            <CheckRow
              label={AIRPORT_NAMES[destination] ?? destination}
              price={priceMinCap}
              checked
              onChange={() => {}}
            />
          </FilterSection>

          {/* Price range */}
          <FilterSection title="One Way Price">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>₹ {priceMinCap.toLocaleString('en-IN')}</span>
              <span>₹ {(filters.priceMax > 0 ? filters.priceMax : priceMaxCap).toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min={priceMinCap}
              max={priceMaxCap}
              step={500}
              value={filters.priceMax > 0 ? filters.priceMax : priceMaxCap}
              onChange={e => toggle('priceMax', Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="mt-3 space-y-0.5">
              <CheckRow label="Non Stop" price={minByStop[0]}   checked={filters.nonStop} onChange={v => toggle('nonStop', v)} />
              <CheckRow label="1 Stop"   price={minByStop[1]}   checked={filters.oneStop} onChange={v => toggle('oneStop', v)} />
            </div>
          </FilterSection>

          {/* Departure time */}
          <FilterSection title={`Departure From ${AIRPORT_NAMES[origin]?.split(' ')[0] ?? origin}`}>
            <div className="grid grid-cols-2 gap-1.5">
              {TIME_SLOTS.map(s => (
                <TimeSlotButton
                  key={s.key}
                  slot={s}
                  selected={filters.depSlots.includes(s.key)}
                  price={minByDepSlot[s.key]}
                  onToggle={() => toggleArr('depSlots', s.key)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Arrival time */}
          <FilterSection title={`Arrival at ${AIRPORT_NAMES[destination]?.split(' ')[0] ?? destination}`}>
            <div className="grid grid-cols-2 gap-1.5">
              {TIME_SLOTS.map(s => (
                <TimeSlotButton
                  key={s.key}
                  slot={s}
                  selected={filters.arrSlots.includes(s.key)}
                  price={minByArrSlot[s.key]}
                  onToggle={() => toggleArr('arrSlots', s.key)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Airlines */}
          <FilterSection title="Airlines">
            {airlines.map(a => (
              <CheckRow
                key={a}
                label={a}
                price={minByAirline[a]}
                checked={filters.airlines.includes(a)}
                onChange={() => toggleArr('airlines', a)}
                icon={<AirlineDot airline={a} />}
              />
            ))}
          </FilterSection>

        </div>
      </div>
    </aside>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FlightsPage() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()

  // Search state — resolve city names from AIRPORTS on initial load
  const _originCode = searchParams.get('origin') ?? ''
  const _destCode   = searchParams.get('destination') ?? ''
  const [origin,           setOrigin]          = useState(_originCode)
  const [originCity,       setOriginCity]       = useState(AIRPORTS.find(a => a.code === _originCode)?.city ?? '')
  const [destination,      setDestination]      = useState(_destCode)
  const [destinationCity,  setDestinationCity]  = useState(AIRPORTS.find(a => a.code === _destCode)?.city ?? '')
  const [departureDate,    setDepartureDate]    = useState(searchParams.get('departureDate') ?? '')
  const [returnDate,       setReturnDate]       = useState(searchParams.get('returnDate')    ?? '')
  const [tripType,         setTripType]         = useState<TripType>(searchParams.get('returnDate') ? 'roundtrip' : 'oneway')
  const [travellers,       setTravellers]       = useState<TravellerConfig>({
    adults:     Number(searchParams.get('passengers') ?? 1),
    children:   0, infants: 0,
    cabinClass: (searchParams.get('cabinClass') as TravellerConfig['cabinClass']) ?? 'Economy',
  })
  const [flights,  setFlights]  = useState<FlightDto[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Filters & sort
  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS)
  const [sortKey,  setSortKey]  = useState<SortKey>('cheapest')

  // Date bar prices
  const [datePriceMap, setDatePriceMap] = useState<Record<string, number | null>>({})

  // ── Fetch flights ────────────────────────────────────────────────────────

  const fetchFlights = useCallback(async (src = origin, dst = destination, date = departureDate) => {
    if (!src || !dst || !date) return
    setLoading(true)
    setError(null)
    setFilters(DEFAULT_FILTERS)
    const total = travellers.adults + travellers.children + travellers.infants
    try {
      const res = await flightService.search({
        origin: src,
        destination: dst,
        departureDate: date,
        passengers: total,
        cabinClass: travellers.cabinClass,
        pageSize: 100,
      })
      setFlights(res.data ?? [])
      if (res.data?.length) {
        const minP = Math.min(...res.data.map(f => f.price))
        setDatePriceMap(p => ({ ...p, [date]: minP }))
      }
    } catch {
      setError('Failed to fetch flights. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [origin, destination, departureDate, travellers])

  useEffect(() => { fetchFlights() }, []) // eslint-disable-line

  // ── Fetch adjacent date prices in background ─────────────────────────────

  useEffect(() => {
    if (!origin || !destination || !departureDate) return
    const adjacentDates: string[] = []
    for (let i = -3; i <= 4; i++) {
      const d = addDays(departureDate, i)
      if (d >= TODAY && !(d in datePriceMap)) adjacentDates.push(d)
    }
    if (!adjacentDates.length) return

    adjacentDates.forEach(async (d) => {
      try {
        const res = await flightService.search({ origin, destination, departureDate: d, passengers: 1, pageSize: 1 })
        const p = res.data?.length ? Math.min(...res.data.map(f => f.price)) : null
        setDatePriceMap(prev => ({ ...prev, [d]: p }))
      } catch {
        setDatePriceMap(prev => ({ ...prev, [d]: null }))
      }
    })
  }, [origin, destination, departureDate]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtered + sorted results ────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = [...flights]

    if (filters.nonStop && !filters.oneStop)         list = list.filter(f => f.stops === 0)
    else if (filters.oneStop && !filters.nonStop)    list = list.filter(f => f.stops === 1)
    else if (filters.nonStop && filters.oneStop)     list = list.filter(f => f.stops <= 1)

    if (filters.airlines.length)                     list = list.filter(f => filters.airlines.includes(f.airline))
    if (filters.refundable)                          list = list.filter(f => f.isRefundable)
    if (filters.priceMax > 0)                        list = list.filter(f => f.price <= filters.priceMax)

    if (filters.depSlots.length) {
      list = list.filter(f => {
        const h = flightHour(f, 'dep')
        return filters.depSlots.some(s => slotMatch(h, s))
      })
    }

    if (filters.arrSlots.length) {
      list = list.filter(f => {
        const h = flightHour(f, 'arr')
        return filters.arrSlots.some(s => slotMatch(h, s))
      })
    }

    switch (sortKey) {
      case 'cheapest':  list.sort((a, b) => a.price - b.price); break
      case 'nonstop':   list.sort((a, b) => a.stops - b.stops || a.price - b.price); break
      case 'prefer':    list.sort((a, b) => (a.price + a.stops * 4000) - (b.price + b.stops * 4000)); break
      case 'departure': list.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()); break
    }

    return list
  }, [flights, filters, sortKey])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const total = travellers.adults + travellers.children + travellers.infants
    const p = new URLSearchParams({ origin, destination, departureDate, passengers: String(total), cabinClass: travellers.cabinClass })
    if (tripType === 'roundtrip' && returnDate) p.set('returnDate', returnDate)
    navigate(`/flights?${p}`, { replace: true })
    fetchFlights(origin, destination, departureDate)
  }

  const swap = () => {
    setOrigin(destination);      setOriginCity(destinationCity)
    setDestination(origin);      setDestinationCity(originCity)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-blue-800 py-5 px-4 shadow-md">
        {/* Trip type */}
        <div className="mx-auto max-w-6xl mb-3 flex gap-4">
          {(['oneway', 'roundtrip'] as TripType[]).map(t => (
            <label key={t} className="flex items-center gap-1.5 text-xs font-semibold text-white cursor-pointer capitalize">
              <input type="radio" name="tripType" value={t} checked={tripType === t} onChange={() => setTripType(t)} className="accent-white" />
              {t === 'oneway' ? 'One Way' : 'Round Trip'}
            </label>
          ))}
        </div>

        <form onSubmit={handleSearch} className="mx-auto max-w-6xl">
          <div className="bg-white rounded-2xl shadow-2xl p-4">
            <div className="flex flex-wrap gap-0 divide-x divide-gray-200">
              {/* From */}
              <div className="flex-1 min-w-[160px] px-4 py-2">
                <AirportSearch
                  label="From"
                  placeholder="City or Airport"
                  value={origin ? `${originCity || origin} (${origin})` : ''}
                  onChange={(code, city) => { setOrigin(code); setOriginCity(city) }}
                />
              </div>

              {/* Swap */}
              <div className="flex items-center px-2">
                <button
                  type="button"
                  onClick={swap}
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
                  value={destination ? `${destinationCity || destination} (${destination})` : ''}
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

              {/* Return */}
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

            {/* Search button */}
            <div className="mt-4 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(90deg, #1a56db, #f97316)' }}
              >
                <Search className="h-5 w-5" /> {loading ? 'Searching...' : 'Search Flights'}
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-xs text-gray-400 mb-4">
          <Link to="/" className="hover:text-blue-600 flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Flights</span>
          {origin && destination && (
            <><ChevronRight className="h-3 w-3" /><span className="text-gray-600 font-medium">{origin} → {destination}</span></>
          )}
        </nav>

        <div className="flex gap-5">
          {/* Filters sidebar */}
          <FilterSidebar
            flights={flights}
            filters={filters}
            setFilters={setFilters}
            origin={origin}
            destination={destination}
          />

          {/* Results */}
          <div className="flex-1 min-w-0">
            <SortTabs sortKey={sortKey} onSort={setSortKey} flights={flights} />
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                {loading ? 'Searching...' : `${filtered.length} flight${filtered.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
            )}

            <div className="flex flex-col gap-3">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => <FlightCardSkeleton key={i} />)
                : filtered.length === 0
                  ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
                      <p className="text-lg font-semibold">No flights found</p>
                      <p className="text-sm mt-1">Try different dates, airports, or adjust filters</p>
                    </div>
                  )
                  : filtered.map(f => <FlightCard key={f.id} flight={f} passengerCount={travellers.adults + travellers.children + travellers.infants} />)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
