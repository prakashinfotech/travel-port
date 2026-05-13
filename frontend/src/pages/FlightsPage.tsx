import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search, Home, ChevronRight, ArrowLeftRight, ChevronDown, ChevronLeft, CalendarDays, X } from 'lucide-react'
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

const RESULTS_PER_PAGE = 10

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

function monthStart(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(1)
  return d.toISOString().split('T')[0]
}

function monthLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

function dayLabel(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(dateStr))
}

function shortPrice(amount: number | null | undefined): string {
  if (amount == null) return '--'
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(amount)
}

function getMonthGrid(monthDate: string): Array<string | null> {
  const firstDay = new Date(monthDate)
  const startWeekday = firstDay.getDay()
  const year = firstDay.getFullYear()
  const month = firstDay.getMonth()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const cells: Array<string | null> = []

  for (let i = 0; i < startWeekday; i += 1) cells.push(null)
  for (let day = 1; day <= lastDate; day += 1) {
    const date = new Date(year, month, day)
    cells.push(date.toISOString().split('T')[0])
  }

  while (cells.length < 35) cells.push(null)
  return cells
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

function DatePriceStrip({
  departureDate,
  datePriceMap,
  onSelectDate,
  onOpenCalendar,
}: {
  departureDate: string
  datePriceMap: Record<string, number | null>
  onSelectDate: (date: string) => void
  onOpenCalendar: () => void
}) {
  const dates = useMemo(() => {
    if (!departureDate) return []
    return Array.from({ length: 8 }, (_, index) => addDays(departureDate, index - 1)).filter(date => date >= TODAY)
  }, [departureDate])

  if (!departureDate || dates.length === 0) return null

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-stretch">
        <button
          type="button"
          onClick={() => onSelectDate(addDays(departureDate, -1))}
          disabled={departureDate <= TODAY}
          className="flex w-12 items-center justify-center border-r border-gray-100 text-gray-400 transition-colors hover:bg-gray-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="grid min-w-0 flex-1 grid-cols-2 sm:grid-cols-4 lg:grid-cols-8">
          {dates.map(date => {
            const active = date === departureDate
            const price = datePriceMap[date]

            return (
              <button
                key={date}
                type="button"
                onClick={() => onSelectDate(date)}
                className={`border-r border-gray-100 px-3 py-3 text-left transition-colors last:border-r-0 ${
                  active ? 'bg-blue-50 text-blue-700 shadow-[inset_0_-3px_0_0_#2563eb]' : 'hover:bg-gray-50'
                }`}
              >
                <p className={`text-xs font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>
                  {dayLabel(date)}
                </p>
                <p className={`mt-1 text-lg font-bold ${active ? 'text-blue-700' : 'text-gray-900'}`}>
                  {price != null ? formatCurrency(price) : 'Fetching'}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-slate-50 px-4 py-2 text-xs text-gray-500">
        <p>Showing our lowest fares for nearby dates.</p>
        <button
          type="button"
          onClick={onOpenCalendar}
          className="inline-flex items-center gap-2 font-semibold text-blue-600 transition-colors hover:text-blue-700"
        >
          <CalendarDays className="h-4 w-4" /> View monthly calendar
        </button>
      </div>
    </div>
  )
}

function PriceCalendar({
  open,
  departureDate,
  datePriceMap,
  onClose,
  onSelectDate,
  onMonthChange,
}: {
  open: boolean
  departureDate: string
  datePriceMap: Record<string, number | null>
  onClose: () => void
  onSelectDate: (date: string) => void
  onMonthChange: (monthStartDate: string) => void
}) {
  const [baseMonth, setBaseMonth] = useState(() => monthStart(departureDate || TODAY))

  useEffect(() => {
    if (!open) return
    const nextBaseMonth = monthStart(departureDate || TODAY)
    setBaseMonth(nextBaseMonth)
    onMonthChange(nextBaseMonth)
    onMonthChange(addDays(nextBaseMonth, 31))
  }, [departureDate, onMonthChange, open])

  useEffect(() => {
    if (!open) return
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose, open])

  if (!open) return null

  const nextMonth = monthStart(addDays(baseMonth, 31))
  const weekdayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  const shiftMonths = (direction: number) => {
    const next = monthStart(new Date(new Date(baseMonth).getFullYear(), new Date(baseMonth).getMonth() + direction, 1).toISOString())
    setBaseMonth(next)
    onMonthChange(next)
    onMonthChange(monthStart(addDays(next, 31)))
  }

  const renderMonth = (monthDate: string) => (
    <div className="flex-1">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">{monthLabel(monthDate)}</h3>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
        {weekdayLabels.map(label => <span key={label}>{label}</span>)}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {getMonthGrid(monthDate).map((date, index) => {
          if (!date) {
            return <div key={`empty-${monthDate}-${index}`} className="h-16 rounded-xl" />
          }

          const active = date === departureDate
          const disabled = date < TODAY
          const price = datePriceMap[date]

          return (
            <button
              key={date}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(date)}
              className={`flex h-16 flex-col items-center justify-center rounded-xl border text-center transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                  : disabled
                    ? 'border-transparent text-gray-300'
                    : 'border-transparent text-gray-800 hover:border-blue-200 hover:bg-blue-50'
              }`}
            >
              <span className={`text-lg font-semibold ${active ? 'text-white' : disabled ? 'text-gray-300' : 'text-gray-900'}`}>
                {new Date(date).getDate()}
              </span>
              <span className={`mt-1 text-xs ${active ? 'text-blue-100' : disabled ? 'text-gray-200' : 'text-gray-600'}`}>
                {price != null ? shortPrice(price) : ''}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl rounded-3xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close calendar"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={() => shiftMonths(-1)}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-800">Lowest prices by departure date</p>
            <p className="text-xs text-gray-400">Pick a date to refresh the flight results</p>
          </div>
          <button
            type="button"
            onClick={() => shiftMonths(1)}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-blue-600"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-2">
          {renderMonth(baseMonth)}
          {renderMonth(nextMonth)}
        </div>

        <div className="rounded-b-3xl bg-blue-50 px-6 py-3 text-sm text-blue-700">
          Showing our lowest prices in Rs.
        </div>
      </div>
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
  const fetchedPriceDates = useRef(new Set<string>())

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
  const [currentPage, setCurrentPage] = useState(1)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Filters & sort
  const [filters,  setFilters]  = useState<Filters>(DEFAULT_FILTERS)
  const [sortKey,  setSortKey]  = useState<SortKey>('cheapest')

  // Date bar prices
  const [datePriceMap, setDatePriceMap] = useState<Record<string, number | null>>({})

  const fetchLowestPriceForDates = useCallback(async (dates: string[]) => {
    const uniqueDates = dates.filter(date => date >= TODAY && !fetchedPriceDates.current.has(date))
    if (!origin || !destination || uniqueDates.length === 0) return

    uniqueDates.forEach(date => fetchedPriceDates.current.add(date))

    await Promise.all(uniqueDates.map(async date => {
      try {
        const response = await flightService.search({
          origin,
          destination,
          departureDate: date,
          passengers: 1,
          cabinClass: travellers.cabinClass,
          pageSize: 1,
        })
        const price = response.data?.length ? Math.min(...response.data.map(flight => flight.price)) : null
        setDatePriceMap(prev => ({ ...prev, [date]: price }))
      } catch {
        setDatePriceMap(prev => ({ ...prev, [date]: null }))
      }
    }))
  }, [destination, origin, travellers.cabinClass])

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
      setCurrentPage(1)
      fetchedPriceDates.current.add(date)
      if (res.data?.length) {
        const minP = Math.min(...res.data.map(f => f.price))
        setDatePriceMap(p => ({ ...p, [date]: minP }))
      } else {
        setDatePriceMap(p => ({ ...p, [date]: null }))
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
    const adjacentDates = Array.from({ length: 8 }, (_, index) => addDays(departureDate, index - 1))
    void fetchLowestPriceForDates(adjacentDates)
  }, [departureDate, fetchLowestPriceForDates, origin, destination])

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

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, sortKey, flights])

  const totalPages = Math.max(1, Math.ceil(filtered.length / RESULTS_PER_PAGE))
  const paginatedFlights = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE
    return filtered.slice(start, start + RESULTS_PER_PAGE)
  }, [currentPage, filtered])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const total = travellers.adults + travellers.children + travellers.infants
    const p = new URLSearchParams({ origin, destination, departureDate, passengers: String(total), cabinClass: travellers.cabinClass })
    if (tripType === 'roundtrip' && returnDate) p.set('returnDate', returnDate)
    navigate(`/flights?${p}`, { replace: true })
    fetchFlights(origin, destination, departureDate)
  }

  const handleDateSelect = (date: string) => {
    if (date < TODAY) return
    setDepartureDate(date)
    setCalendarOpen(false)
    const total = travellers.adults + travellers.children + travellers.infants
    const params = new URLSearchParams({
      origin,
      destination,
      departureDate: date,
      passengers: String(total),
      cabinClass: travellers.cabinClass,
    })
    if (tripType === 'roundtrip' && returnDate) params.set('returnDate', returnDate)
    navigate(`/flights?${params}`, { replace: true })
    fetchFlights(origin, destination, date)
  }

  const handleCalendarMonthChange = useCallback((monthDate: string) => {
    const visibleDates = getMonthGrid(monthDate).filter((date): date is string => Boolean(date))
    void fetchLowestPriceForDates(visibleDates)
  }, [fetchLowestPriceForDates])

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
            <DatePriceStrip
              departureDate={departureDate}
              datePriceMap={datePriceMap}
              onSelectDate={handleDateSelect}
              onOpenCalendar={() => setCalendarOpen(true)}
            />
            <SortTabs sortKey={sortKey} onSort={setSortKey} flights={flights} />
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">
                  {loading ? 'Searching...' : `${filtered.length} flight${filtered.length !== 1 ? 's' : ''} found`}
                </p>
                {!loading && filtered.length > 0 && (
                  <p className="text-xs text-gray-400">
                    Showing {(currentPage - 1) * RESULTS_PER_PAGE + 1}-{Math.min(currentPage * RESULTS_PER_PAGE, filtered.length)} of {filtered.length}
                  </p>
                )}
              </div>
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
                  : paginatedFlights.map(f => <FlightCard key={f.id} flight={f} passengerCount={travellers.adults + travellers.children + travellers.infants} />)
              }
            </div>

            {!loading && filtered.length > RESULTS_PER_PAGE && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1)
                    .filter(page => Math.abs(page - currentPage) <= 1 || page === 1 || page === totalPages)
                    .map((page, index, pages) => {
                      const previousPage = pages[index - 1]
                      const showGap = previousPage && page - previousPage > 1

                      return (
                        <div key={page} className="flex items-center gap-2">
                          {showGap && <span className="text-sm text-gray-400">...</span>}
                          <button
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`h-9 w-9 rounded-lg border text-sm font-semibold transition-colors ${
                              page === currentPage
                                ? 'border-blue-600 bg-blue-600 text-white'
                                : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      )
                    })}

                  <button
                    type="button"
                    onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <PriceCalendar
        open={calendarOpen}
        departureDate={departureDate}
        datePriceMap={datePriceMap}
        onClose={() => setCalendarOpen(false)}
        onSelectDate={handleDateSelect}
        onMonthChange={handleCalendarMonthChange}
      />
    </div>
  )
}
