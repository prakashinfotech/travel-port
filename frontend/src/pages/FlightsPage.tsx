import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search, Home, ChevronRight, ArrowLeftRight, ChevronLeft, ChevronDown, X } from 'lucide-react'
import type { FlightDto } from '@/types'
import { flightService } from '@/services/flightService'
import { FlightCard } from '@/components/flights/FlightCard'
import { FlightCardSkeleton } from '@/components/ui/Skeleton'
import { AirportSearch } from '@/components/search/AirportSearch'
import { TravellerSelector, type TravellerConfig } from '@/components/search/TravellerSelector'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/formatters'

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
type SortKey = 'price_asc' | 'price_desc' | 'duration_asc' | 'departure_asc' | 'arrival_asc'
type TripType = 'oneway' | 'roundtrip'

const TODAY = new Date().toISOString().split('T')[0]

const SORT_OPTIONS = [
  { value: 'price_asc',     label: 'Price: Low to High' },
  { value: 'price_desc',    label: 'Price: High to Low' },
  { value: 'duration_asc',  label: 'Duration: Shortest' },
  { value: 'departure_asc', label: 'Departure: Earliest' },
  { value: 'arrival_asc',   label: 'Arrival: Earliest' },
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

const FARE_TYPES = ['Regular', 'Student', 'Armed Forces', 'Have a GST number ?', 'Senior Citizen', 'Doctor and Nurses']

// ── Helpers ───────────────────────────────────────────────────────────────────

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function fmtDateLabel(dateStr: string): { day: string; date: string } {
  const d = new Date(dateStr)
  return {
    day:  d.toLocaleDateString('en-IN', { weekday: 'short' }),
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }
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

// ── Date Bar ──────────────────────────────────────────────────────────────────

function DateBar({
  baseDate,
  onSelect,
  priceMap,
}: {
  baseDate: string
  onSelect: (d: string) => void
  priceMap: Record<string, number | null>
}) {
  const dates = useMemo(() => {
    const arr = []
    for (let i = -3; i <= 4; i++) arr.push(addDays(baseDate, i))
    return arr
  }, [baseDate])

  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 relative">
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:shadow-md ml-1"
          onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
        >
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>

        <div ref={scrollRef} className="flex gap-1 overflow-x-auto scrollbar-hide py-2 mx-6 scroll-smooth">
          {dates.map(d => {
            const { day, date } = fmtDateLabel(d)
            const price = priceMap[d]
            const isSelected = d === baseDate
            const isPast = d < TODAY
            return (
              <button
                key={d}
                disabled={isPast}
                onClick={() => onSelect(d)}
                className={`flex flex-col items-center px-4 py-2.5 rounded-lg min-w-[90px] transition-all border flex-shrink-0 ${
                  isSelected
                    ? 'border-orange-500 bg-orange-50 text-orange-600'
                    : isPast
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent hover:border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className={`text-xs font-medium ${isSelected ? 'text-orange-500' : ''}`}>{day}</span>
                <span className={`text-sm font-semibold mt-0.5 ${isSelected ? 'text-orange-600' : ''}`}>{date}</span>
                {price !== undefined && price !== null ? (
                  <span className={`text-xs mt-0.5 font-medium ${isSelected ? 'text-orange-500' : 'text-gray-500'}`}>
                    ₹ {price.toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="text-xs mt-0.5 text-gray-300">—</span>
                )}
                {isSelected && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />}
              </button>
            )
          })}
        </div>

        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:shadow-md mr-1"
          onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
        >
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  )
}

// ── Calendar Picker ───────────────────────────────────────────────────────────

function CalendarPicker({
  value, onSelect, onClose, priceMap,
}: {
  value: string; onSelect: (d: string) => void; onClose: () => void; priceMap: Record<string, number | null>
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(value || TODAY)
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  function prevMonth() {
    setViewDate(p => p.month === 0 ? { year: p.year - 1, month: 11 } : { year: p.year, month: p.month - 1 })
  }
  function nextMonth() {
    setViewDate(p => p.month === 11 ? { year: p.year + 1, month: 0 } : { year: p.year, month: p.month + 1 })
  }

  function renderMonth(year: number, month: number) {
    const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    const firstDay  = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const blanks = Array.from({ length: firstDay }, (_, i) => i)

    return (
      <div className="flex-1 min-w-[260px]">
        <p className="font-semibold text-gray-800 mb-3 text-center">{monthName}</p>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
          ))}
          {blanks.map(i => <div key={`b${i}`} />)}
          {days.map(day => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const isPast     = dateStr < TODAY
            const isSelected = dateStr === value
            const price      = priceMap[dateStr]
            return (
              <button
                key={day}
                disabled={isPast}
                onClick={() => { onSelect(dateStr); onClose() }}
                className={`rounded-md py-1 flex flex-col items-center transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isPast
                    ? 'text-gray-200 cursor-not-allowed'
                    : 'hover:bg-blue-50 text-gray-800'
                }`}
              >
                <span className="text-sm font-medium">{day}</span>
                {price !== undefined && price !== null && !isSelected && (
                  <span className="text-xs text-green-600">{Math.round(price / 1000)}k</span>
                )}
                {price !== undefined && price !== null && isSelected && (
                  <span className="text-xs text-blue-200">{Math.round(price / 1000)}k</span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const next = viewDate.month === 11
    ? { year: viewDate.year + 1, month: 0 }
    : { year: viewDate.year, month: viewDate.month + 1 }

  return (
    <div className="absolute top-full left-0 z-50 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-5 w-[560px]">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-sm font-medium text-gray-600">Select departure date</span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100"><ChevronRight className="h-4 w-4 rotate-180" /></button>
      </div>
      <div className="flex gap-6">
        {renderMonth(viewDate.year, viewDate.month)}
        <div className="w-px bg-gray-100" />
        {renderMonth(next.year, next.month)}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-center">Showing lowest prices in ₹</p>
    </div>
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

  // Search state
  const [origin,           setOrigin]          = useState(searchParams.get('origin')        ?? '')
  const [originCity,       setOriginCity]       = useState('')
  const [destination,      setDestination]      = useState(searchParams.get('destination')   ?? '')
  const [destinationCity,  setDestinationCity]  = useState('')
  const [departureDate,    setDepartureDate]    = useState(searchParams.get('departureDate') ?? '')
  const [returnDate,       setReturnDate]       = useState(searchParams.get('returnDate')    ?? '')
  const [tripType,         setTripType]         = useState<TripType>(searchParams.get('returnDate') ? 'roundtrip' : 'oneway')
  const [travellers,       setTravellers]       = useState<TravellerConfig>({
    adults:     Number(searchParams.get('passengers') ?? 1),
    children:   0, infants: 0,
    cabinClass: (searchParams.get('cabinClass') as TravellerConfig['cabinClass']) ?? 'Economy',
  })
  const [fareType, setFareType] = useState('Regular')

  // Data
  const [origin,        setOrigin]        = useState(searchParams.get('origin')        ?? '')
  const [originCity,    setOriginCity]    = useState('')
  const [destination,   setDestination]   = useState(searchParams.get('destination')   ?? '')
  const [destinationCity, setDestinationCity] = useState('')
  const [departureDate, setDepartureDate] = useState(searchParams.get('departureDate') ?? '')
  const [returnDate,    setReturnDate]    = useState(searchParams.get('returnDate')    ?? '')
  const [tripType,      setTripType]      = useState<TripType>(searchParams.get('returnDate') ? 'roundtrip' : 'oneway')
  const [travellers,    setTravellers]    = useState<TravellerConfig>({
    adults:     Number(searchParams.get('passengers') ?? 1),
    children:   0,
    infants:    0,
    cabinClass: (searchParams.get('cabinClass') as TravellerConfig['cabinClass']) ?? 'Economy',
  })

  const [flights,  setFlights]  = useState<FlightDto[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Filters & sort
  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS)
  const [sortKey,  setSortKey]  = useState<SortKey>('cheapest')
  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [airline,  setAirline]  = useState('')
  const [sort,     setSort]     = useState<SortKey>('price_asc')

  // Date bar prices
  const [datePriceMap, setDatePriceMap] = useState<Record<string, number | null>>({})

  // Calendar picker
  const [showCal,  setShowCal]  = useState(false)
  const calRef = useRef<HTMLDivElement>(null)

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setShowCal(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Fetch flights ────────────────────────────────────────────────────────

  const fetchFlights = useCallback(async (src = origin, dst = destination, date = departureDate) => {
    if (!src || !dst || !date) return
    setLoading(true)
    setError(null)
    setFilters(DEFAULT_FILTERS)
    const total = travellers.adults + travellers.children + travellers.infants
    try {
      const res = await flightService.search({ origin: src, destination: dst, departureDate: date, passengers: total, cabinClass: travellers.cabinClass, pageSize: 100 })
    const total = travellers.adults + travellers.children + travellers.infants
    try {
      const res = await flightService.search({
        origin,
        destination,
        departureDate,
        passengers: total,
        cabinClass: travellers.cabinClass,
        pageSize: 50,
      })
      setFlights(res.data ?? [])
      // Seed current date price into the map
      if (res.data?.length) {
        const minP = Math.min(...res.data.map(f => f.price))
        setDatePriceMap(p => ({ ...p, [date]: minP }))
        setMaxPrice(Math.max(...res.data.map(f => f.price)))
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
  const airlines = useMemo(() => [...new Set(flights.map(f => f.airline))], [flights])
  const maxPriceCap = useMemo(() => flights.length ? Math.max(...flights.map(f => f.price)) : 100000, [flights])

  const filtered = useMemo(() => {
    let list = [...flights]
    if (airline)  list = list.filter(f => f.airline === airline)
    if (maxPrice) list = list.filter(f => f.price <= maxPrice)
    list.sort((a, b) => {
      switch (sort) {
        case 'price_asc':     return a.price - b.price
        case 'price_desc':    return b.price - a.price
        case 'duration_asc':  return a.durationMinutes - b.durationMinutes
        case 'departure_asc': return new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
        case 'arrival_asc':   return new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime()
        default:              return 0
      }
    })
  }, [origin, destination, departureDate]) // eslint-disable-line

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

  const handleDateSelect = (d: string) => {
    setDepartureDate(d)
    setShowCal(false)
    fetchFlights(origin, destination, d)
  }

  const swap = () => {
    setOrigin(destination);      setOriginCity(destinationCity)
    setDestination(origin);      setDestinationCity(originCity)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Search Header ── */}
      <div className="bg-orange-500 pb-0">
        {/* Trip type */}
        <div className="mx-auto max-w-6xl px-4 pt-4 flex gap-4">
          {(['oneway', 'roundtrip'] as TripType[]).map(t => (
            <label key={t} className="flex items-center gap-1.5 text-xs font-semibold text-white cursor-pointer">
              <input type="radio" name="tripType" value={t} checked={tripType === t} onChange={() => setTripType(t)} className="accent-white" />
              {t === 'oneway' ? 'One Way' : 'Round Trip'}
            </label>
          ))}
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mx-auto max-w-6xl px-4 py-3">
          <div className="bg-white rounded-xl p-3 flex flex-wrap gap-2 items-end shadow-lg">
            <div className="flex-1 min-w-[150px]">
              <AirportSearch
                label="FROM"
    fetchFlights()
  }

  const swap = () => {
    setOrigin(destination); setOriginCity(destinationCity)
    setDestination(origin); setDestinationCity(originCity)
  }

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
          <div className="bg-white rounded-xl p-3 flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[150px]">
              <AirportSearch
                label="From"
                value={origin ? `${originCity || origin} (${origin})` : ''}
                onChange={(code, city) => { setOrigin(code); setOriginCity(city) }}
              />
            </div>
            <button type="button" onClick={swap} className="mb-1 p-1.5 rounded-full border border-gray-200 hover:border-blue-400 transition-colors">
              <ArrowLeftRight className="h-3.5 w-3.5 text-gray-400" />
            </button>
            <div className="flex-1 min-w-[150px]">
              <AirportSearch
                label="To"
                value={destination ? `${destinationCity || destination} (${destination})` : ''}
                onChange={(code, city) => { setDestination(code); setDestinationCity(city) }}
              />
            </div>
            <div className="min-w-[130px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Departure</label>
              <input
                type="date"
                value={departureDate}
                min={TODAY}
                onChange={e => setDepartureDate(e.target.value)}
                className="w-full text-sm font-medium text-gray-900 border-b-2 border-gray-300 focus:border-blue-600 focus:outline-none pb-1 bg-transparent"
              />
            </div>
            {tripType === 'roundtrip' && (
              <div className="min-w-[130px]">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Return</label>
                <input
                  type="date"
                  value={returnDate}
                  min={departureDate || TODAY}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full text-sm font-medium text-gray-900 border-b-2 border-gray-300 focus:border-blue-600 focus:outline-none pb-1 bg-transparent"
                />
              </div>
            )}
            <div className="min-w-[200px]">
              <TravellerSelector value={travellers} onChange={setTravellers} />
            </div>
            <Button type="submit" variant="secondary" loading={loading} className="shrink-0">
              <Search className="h-4 w-4" /> Search
            </Button>
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
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 sticky top-20">
              <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4 text-sm">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h2>
              <div className="flex flex-col gap-4">
                {airlines.length > 0 && (
                  <Select
                    label="Airline"
                    value={airline}
                    onChange={e => setAirline(e.target.value)}
                    options={[{ value: '', label: 'All Airlines' }, ...airlines.map(a => ({ value: a, label: a }))]}
                  />
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">Max Price</label>
                  <p className="text-xs text-gray-400 mb-1">
                    ₹{(maxPrice || maxPriceCap).toLocaleString('en-IN')}
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={maxPriceCap}
                    step={500}
                    value={maxPrice || maxPriceCap}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setAirline(''); setMaxPrice(0) }}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                {loading ? 'Searching...' : `${filtered.length} flight${filtered.length !== 1 ? 's' : ''} found`}
              </p>
              <Select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                options={SORT_OPTIONS}
                className="w-52"
              />
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
                  : filtered.map(f => <FlightCard key={f.id} flight={f} />)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
