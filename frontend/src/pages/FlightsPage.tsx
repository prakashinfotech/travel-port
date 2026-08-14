import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search, Home, ChevronRight, ArrowLeftRight, ChevronDown, ChevronLeft, CalendarDays, X, BarChart2, Check, Clock, Luggage, ShieldCheck, Plane } from 'lucide-react'
import type { FlightDto } from '@/types'
import { flightService } from '@/services/flightService'
import { FlightCard } from '@/components/flights/FlightCard'
import { FlightCardSkeleton } from '@/components/ui/Skeleton'
import { AirportSearch } from '@/components/search/AirportSearch'
import { TravellerSelector, type TravellerConfig } from '@/components/search/TravellerSelector'
import { DatePickerInput } from '@/components/ui/DatePickerInput'
import { formatCurrency, formatDuration } from '@/utils/formatters'
import { AIRPORTS } from '@/data/airports'
import { PriceTrendInsight } from '@/components/ai/PriceTrendInsight'

// ── Types ─────────────────────────────────────────────────────────────────────

type TimeSlot = 'early' | 'morning' | 'afternoon' | 'night'
type SortKey  = 'cheapest' | 'nonstop' | 'prefer' | 'departure'
type TripType  = 'oneway' | 'roundtrip'
type RTSortKey = 'departure' | 'duration' | 'arrival' | 'price'

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

interface RTFilters {
  depNonStop:  boolean
  depOneStop:  boolean
  depDepSlots: TimeSlot[]
  depArrSlots: TimeSlot[]
  retNonStop:  boolean
  retOneStop:  boolean
  retDepSlots: TimeSlot[]
  retArrSlots: TimeSlot[]
  airlines:    string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split('T')[0]

const DEFAULT_FILTERS: Filters = {
  nonStop: false, oneStop: false, airlines: [], depSlots: [],
  arrSlots: [], refundable: false, hideNearby: false, priceMax: 0,
}

const DEFAULT_RT_FILTERS: RTFilters = {
  depNonStop: false, depOneStop: false, depDepSlots: [], depArrSlots: [],
  retNonStop: false, retOneStop: false, retDepSlots: [], retArrSlots: [],
  airlines: [],
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

function sortByRTKey(list: FlightDto[], key: RTSortKey): FlightDto[] {
  const s = [...list]
  if (key === 'departure') s.sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
  else if (key === 'duration') s.sort((a, b) => a.durationMinutes - b.durationMinutes)
  else if (key === 'arrival') s.sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime())
  else s.sort((a, b) => a.price - b.price)
  return s
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

// ── Round Trip Filter Sidebar ─────────────────────────────────────────────────

function RTFilterSidebar({
  depFlights, retFlights, filters, setFilters, origin, destination,
}: {
  depFlights: FlightDto[]
  retFlights: FlightDto[]
  filters: RTFilters
  setFilters: React.Dispatch<React.SetStateAction<RTFilters>>
  origin: string
  destination: string
}) {
  const allFlights = useMemo(() => [...depFlights, ...retFlights], [depFlights, retFlights])

  const depMinByStop = useMemo(() => {
    const m: Record<number, number> = {}
    depFlights.forEach(f => { if (!(f.stops in m) || f.price < m[f.stops]) m[f.stops] = f.price })
    return m
  }, [depFlights])

  const retMinByStop = useMemo(() => {
    const m: Record<number, number> = {}
    retFlights.forEach(f => { if (!(f.stops in m) || f.price < m[f.stops]) m[f.stops] = f.price })
    return m
  }, [retFlights])

  const depMinByDepSlot = useMemo(() => {
    const m: Record<TimeSlot, number> = { early: Infinity, morning: Infinity, afternoon: Infinity, night: Infinity }
    depFlights.forEach(f => { const h = flightHour(f, 'dep'); TIME_SLOTS.forEach(s => { if (slotMatch(h, s.key) && f.price < m[s.key]) m[s.key] = f.price }) })
    return m
  }, [depFlights])

  const depMinByArrSlot = useMemo(() => {
    const m: Record<TimeSlot, number> = { early: Infinity, morning: Infinity, afternoon: Infinity, night: Infinity }
    depFlights.forEach(f => { const h = flightHour(f, 'arr'); TIME_SLOTS.forEach(s => { if (slotMatch(h, s.key) && f.price < m[s.key]) m[s.key] = f.price }) })
    return m
  }, [depFlights])

  const retMinByDepSlot = useMemo(() => {
    const m: Record<TimeSlot, number> = { early: Infinity, morning: Infinity, afternoon: Infinity, night: Infinity }
    retFlights.forEach(f => { const h = flightHour(f, 'dep'); TIME_SLOTS.forEach(s => { if (slotMatch(h, s.key) && f.price < m[s.key]) m[s.key] = f.price }) })
    return m
  }, [retFlights])

  const retMinByArrSlot = useMemo(() => {
    const m: Record<TimeSlot, number> = { early: Infinity, morning: Infinity, afternoon: Infinity, night: Infinity }
    retFlights.forEach(f => { const h = flightHour(f, 'arr'); TIME_SLOTS.forEach(s => { if (slotMatch(h, s.key) && f.price < m[s.key]) m[s.key] = f.price }) })
    return m
  }, [retFlights])

  const minByAirline = useMemo(() => {
    const m: Record<string, number> = {}
    allFlights.forEach(f => { if (!(f.airline in m) || f.price < m[f.airline]) m[f.airline] = f.price })
    return m
  }, [allFlights])

  const airlines = useMemo(() => Object.keys(minByAirline).sort((a, b) => minByAirline[a] - minByAirline[b]), [minByAirline])

  const toggle = <K extends keyof RTFilters>(key: K, val: RTFilters[K]) =>
    setFilters(p => ({ ...p, [key]: val }))

  const toggleSlot = (key: 'depDepSlots' | 'depArrSlots' | 'retDepSlots' | 'retArrSlots', val: TimeSlot) =>
    setFilters(p => {
      const arr = p[key] as TimeSlot[]
      return { ...p, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
    })

  const toggleAirline = (airline: string) =>
    setFilters(p => ({ ...p, airlines: p.airlines.includes(airline) ? p.airlines.filter(a => a !== airline) : [...p.airlines, airline] }))

  const hasActive = filters.depNonStop || filters.depOneStop || filters.retNonStop || filters.retOneStop ||
    filters.depDepSlots.length > 0 || filters.depArrSlots.length > 0 ||
    filters.retDepSlots.length > 0 || filters.retArrSlots.length > 0 || filters.airlines.length > 0

  const originName  = AIRPORT_NAMES[origin]?.split(' ')[0]  ?? origin
  const destName    = AIRPORT_NAMES[destination]?.split(' ')[0] ?? destination

  if (!depFlights.length && !retFlights.length) return null

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-20 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-gray-800 text-sm">Filters</span>
          {hasActive && (
            <button onClick={() => setFilters(DEFAULT_RT_FILTERS)} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              <X className="h-3 w-3" /> Clear all
            </button>
          )}
        </div>

        <div className="px-4 max-h-[calc(100vh-180px)] overflow-y-auto">

          {/* Onward Journey */}
          <FilterSection title="Onward Journey">
            <CheckRow label="Non Stop" price={depMinByStop[0]} checked={filters.depNonStop} onChange={v => toggle('depNonStop', v)} />
            <CheckRow label="1 Stop"   price={depMinByStop[1]} checked={filters.depOneStop} onChange={v => toggle('depOneStop', v)} />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Departure From {originName}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TIME_SLOTS.map(s => (
                <TimeSlotButton key={s.key} slot={s} selected={filters.depDepSlots.includes(s.key)} price={depMinByDepSlot[s.key]} onToggle={() => toggleSlot('depDepSlots', s.key)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Arrival at {destName}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TIME_SLOTS.map(s => (
                <TimeSlotButton key={s.key} slot={s} selected={filters.depArrSlots.includes(s.key)} price={depMinByArrSlot[s.key]} onToggle={() => toggleSlot('depArrSlots', s.key)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">Arrival Airports</p>
            <CheckRow label={AIRPORT_NAMES[destination] ?? destination} price={undefined} checked onChange={() => {}} />
          </FilterSection>

          {/* Return Journey */}
          <FilterSection title="Return Journey">
            <CheckRow label="Non Stop" price={retMinByStop[0]} checked={filters.retNonStop} onChange={v => toggle('retNonStop', v)} />
            <CheckRow label="1 Stop"   price={retMinByStop[1]} checked={filters.retOneStop} onChange={v => toggle('retOneStop', v)} />
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Departure From {destName}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TIME_SLOTS.map(s => (
                <TimeSlotButton key={s.key} slot={s} selected={filters.retDepSlots.includes(s.key)} price={retMinByDepSlot[s.key]} onToggle={() => toggleSlot('retDepSlots', s.key)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-2">Arrival at {originName}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TIME_SLOTS.map(s => (
                <TimeSlotButton key={s.key} slot={s} selected={filters.retArrSlots.includes(s.key)} price={retMinByArrSlot[s.key]} onToggle={() => toggleSlot('retArrSlots', s.key)} />
              ))}
            </div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3 mb-1">Departure Airports</p>
            <CheckRow label={AIRPORT_NAMES[destination] ?? destination} price={undefined} checked onChange={() => {}} />
          </FilterSection>

          {/* Airlines */}
          <FilterSection title="Airlines">
            {airlines.map(a => (
              <CheckRow key={a} label={a} price={minByAirline[a]} checked={filters.airlines.includes(a)} onChange={() => toggleAirline(a)} icon={<AirlineDot airline={a} />} />
            ))}
          </FilterSection>

        </div>
      </div>
    </aside>
  )
}

// ── Round Trip Sub-components ─────────────────────────────────────────────────

function RTSortHeader({ sortKey, onSort }: { sortKey: RTSortKey; onSort: (k: RTSortKey) => void }) {
  const cols: { key: RTSortKey; label: string }[] = [
    { key: 'departure', label: 'Departure' },
    { key: 'duration',  label: 'Duration'  },
    { key: 'arrival',   label: 'Arrival'   },
    { key: 'price',     label: 'Price'     },
  ]
  return (
    <div className="flex items-center bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs">
      <div className="w-28 flex-shrink-0" />
      <div className="flex flex-1 items-center">
        {cols.map(col => (
          <button
            key={col.key}
            onClick={() => onSort(col.key)}
            className={`flex-1 flex items-center justify-center gap-0.5 font-semibold transition-colors ${
              sortKey === col.key ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {col.label}{sortKey === col.key ? ' ↑' : ''}
          </button>
        ))}
        <div className="w-10 flex-shrink-0" />
      </div>
    </div>
  )
}

function RoundTripFlightRow({ flight, selected, onSelect }: {
  flight: FlightDto; selected: boolean; onSelect: () => void
}) {
  const dep = new Date(flight.departureTime)
  const arr = new Date(flight.arrivalTime)
  const fmt = (d: Date) => d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const isNextDay = arr.getDate() !== dep.getDate() || arr.getMonth() !== dep.getMonth()
  const color = AIRLINE_COLORS[flight.airline] ?? '#555'
  const initials = flight.airline.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50 ${
        selected ? 'bg-blue-50 border-l-[3px] border-l-blue-500' : ''
      }`}
    >
      {/* Airline */}
      <div className="w-28 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div style={{ backgroundColor: color }} className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{initials}</div>
          <div>
            <p className="text-xs font-semibold text-gray-800 leading-tight">{flight.airline}</p>
            <p className="text-[10px] text-gray-400">{flight.flightNumber}</p>
          </div>
        </div>
      </div>

      {/* Times + duration */}
      <div className="flex-1 flex items-center gap-1">
        <p className="text-base font-bold tabular-nums text-gray-900 w-12 text-right">{fmt(dep)}</p>
        <div className="flex-1 flex flex-col items-center mx-1">
          <p className="text-[10px] text-gray-400 leading-none">{formatDuration(flight.durationMinutes)}</p>
          <div className="flex w-full items-center gap-0.5 my-0.5">
            <div className="h-px flex-1 bg-gray-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-gray-400 flex-shrink-0" />
          </div>
          <p className={`text-[10px] font-semibold leading-none ${flight.stops === 0 ? 'text-green-600' : 'text-orange-500'}`}>
            {flight.stops === 0 ? 'Non stop' : `${flight.stops} Stop`}
          </p>
        </div>
        <p className="text-base font-bold tabular-nums text-gray-900 w-12">
          {fmt(arr)}{isNextDay && <sup className="text-orange-500 text-xs ml-0.5">+1</sup>}
        </p>
      </div>

      {/* Price + Radio */}
      <div className="flex items-center gap-2 w-24 flex-shrink-0 justify-end">
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">₹{flight.price.toLocaleString('en-IN')}</p>
          <p className="text-[10px] text-gray-400">per adult</p>
        </div>
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
        }`}>
          {selected && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </div>
  )
}

function RoundTripStickyBar({ dep, ret, passengerCount, onBook }: {
  dep: FlightDto; ret: FlightDto; passengerCount: number; onBook: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const perAdult = dep.price + ret.price
  const total = perAdult * Math.max(1, passengerCount)

  const AirlineBadge = ({ airline }: { airline: string }) => {
    const color    = AIRLINE_COLORS[airline] ?? '#555'
    const initials = airline.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    return (
      <span style={{ backgroundColor: color }} className="inline-flex items-center justify-center w-6 h-6 rounded text-white text-xs font-bold flex-shrink-0">
        {initials}
      </span>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 shadow-2xl">
      {/* Collapse toggle strip */}
      <div
        className="flex items-center justify-center bg-gray-800 border-t border-gray-700 py-1 cursor-pointer hover:bg-gray-700 transition-colors"
        onClick={() => setCollapsed(p => !p)}
      >
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </div>

      {!collapsed && (
        <div className="bg-gray-900 text-white border-t border-gray-700">
          <div className="max-w-6xl mx-auto flex items-stretch">

            {/* Departure leg */}
            <div className="flex-1 px-5 py-3 border-r border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <AirlineBadge airline={dep.airline} />
                <p className="text-xs text-gray-400">Departure · <span className="font-semibold text-white">{dep.airline}</span></p>
              </div>
              <p className="text-sm font-bold tabular-nums">
                {fmt(dep.departureTime)} → {fmt(dep.arrivalTime)}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-base font-black">₹{dep.price.toLocaleString('en-IN')}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${dep.stops === 0 ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'}`}>
                  {dep.stops === 0 ? 'Non stop' : `${dep.stops} stop`}
                </span>
              </div>
            </div>

            {/* Return leg */}
            <div className="flex-1 px-5 py-3 border-r border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <AirlineBadge airline={ret.airline} />
                <p className="text-xs text-gray-400">Return · <span className="font-semibold text-white">{ret.airline}</span></p>
              </div>
              <p className="text-sm font-bold tabular-nums">
                {fmt(ret.departureTime)} → {fmt(ret.arrivalTime)}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-base font-black">₹{ret.price.toLocaleString('en-IN')}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ret.stops === 0 ? 'bg-green-900 text-green-300' : 'bg-orange-900 text-orange-300'}`}>
                  {ret.stops === 0 ? 'Non stop' : `${ret.stops} stop`}
                </span>
              </div>
            </div>

            {/* Total + actions */}
            <div className="flex items-center gap-4 px-6 py-3">
              <div className="text-right">
                <p className="text-2xl font-black tabular-nums">₹{total.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-400">per adult · ₹{perAdult.toLocaleString('en-IN')} × {Math.max(1, passengerCount)}</p>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors mt-0.5">Fare Details</button>
              </div>
              <div className="flex flex-col gap-2 min-w-[130px]">
                <button
                  onClick={onBook}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-colors tracking-wide"
                >
                  BOOK NOW
                </button>
                <button className="border border-gray-500 text-white font-bold px-5 py-2 rounded-lg text-sm hover:bg-white/10 transition-colors text-center tracking-wide">
                  LOCK PRICE
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

// ── Compare Bar ───────────────────────────────────────────────────────────────

function CompareBar({
  flights, onRemove, onCompareNow, onClear,
}: {
  flights: FlightDto[]
  onRemove: (id: string) => void
  onCompareNow: () => void
  onClear: () => void
}) {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const slots = [0, 1, 2]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-2xl">
      <div className="mx-auto max-w-6xl flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2 text-white shrink-0">
          <BarChart2 className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-bold">Compare Flights</span>
          <span className="text-xs text-gray-400">({flights.length}/3)</span>
        </div>

        <div className="flex flex-1 items-center gap-3 overflow-x-auto">
          {slots.map(i => {
            const f = flights[i]
            if (!f) {
              return (
                <div key={i} className="flex h-14 min-w-[160px] flex-1 items-center justify-center rounded-xl border border-dashed border-gray-600 text-xs text-gray-500">
                  + Add flight
                </div>
              )
            }
            return (
              <div key={f.id} className="relative flex h-14 min-w-[160px] flex-1 items-center gap-3 rounded-xl bg-gray-800 px-3">
                <div className="flex flex-col min-w-0">
                  <p className="text-xs font-bold text-white truncate">{f.airline}</p>
                  <p className="text-[11px] text-gray-400 tabular-nums">
                    {fmt(f.departureTime)} → {fmt(f.arrivalTime)}
                  </p>
                  <p className="text-xs font-bold text-orange-400">₹{f.price.toLocaleString('en-IN')}</p>
                </div>
                <button
                  onClick={() => onRemove(f.id)}
                  className="absolute right-2 top-2 rounded-full p-0.5 text-gray-500 hover:bg-gray-700 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onClear}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear
          </button>
          <button
            onClick={onCompareNow}
            disabled={flights.length < 2}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Compare Now
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Compare Modal ─────────────────────────────────────────────────────────────

function CompareModal({ flights, onClose }: { flights: FlightDto[]; onClose: () => void }) {
  const fmt = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })

  // Best-value indices
  const minPrice = Math.min(...flights.map(f => f.price))
  const minDur   = Math.min(...flights.map(f => f.durationMinutes))
  const minStops = Math.min(...flights.map(f => f.stops))

  type Row = {
    label: string
    icon: React.ReactNode
    values: (f: FlightDto) => React.ReactNode
    best?: (f: FlightDto) => boolean
  }

  const rows: Row[] = [
    {
      label: 'Price (per adult)',
      icon: <span className="text-base">₹</span>,
      values: f => <span className="text-xl font-black tabular-nums">₹{f.price.toLocaleString('en-IN')}</span>,
      best:  f => f.price === minPrice,
    },
    {
      label: 'Duration',
      icon: <Clock className="h-4 w-4" />,
      values: f => formatDuration(f.durationMinutes),
      best:  f => f.durationMinutes === minDur,
    },
    {
      label: 'Stops',
      icon: <Plane className="h-4 w-4" />,
      values: f => f.stops === 0 ? 'Non-stop' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`,
      best:  f => f.stops === minStops,
    },
    {
      label: 'Departure',
      icon: <span className="text-sm font-bold">DEP</span>,
      values: f => fmt(f.departureTime),
    },
    {
      label: 'Arrival',
      icon: <span className="text-sm font-bold">ARR</span>,
      values: f => {
        const dep = new Date(f.departureTime); const arr = new Date(f.arrivalTime)
        const nextDay = arr.getDate() !== dep.getDate() || arr.getMonth() !== dep.getMonth()
        return <>{fmt(f.arrivalTime)}{nextDay && <sup className="ml-0.5 text-orange-500">+1</sup>}</>
      },
    },
    {
      label: 'Cabin Baggage',
      icon: <Luggage className="h-4 w-4" />,
      values: () => '7 Kgs',
    },
    {
      label: 'Check-in Baggage',
      icon: <Luggage className="h-4 w-4" />,
      values: f => f.baggageIncluded ? (f.checkedBags ? `${f.checkedBags} Kgs` : 'Included') : '15 Kgs (chargeable)',
      best:  f => !!f.baggageIncluded,
    },
    {
      label: 'Refund Policy',
      icon: <ShieldCheck className="h-4 w-4" />,
      values: f => f.isRefundable ? 'Refundable' : 'Non-refundable',
      best:  f => !!f.isRefundable,
    },
    {
      label: 'Available Seats',
      icon: <span className="text-sm font-bold">🪑</span>,
      values: f => f.availableSeats > 0 ? `${f.availableSeats} left` : 'Sold out',
      best:  f => f.availableSeats > 9,
    },
  ]

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/60 px-3 py-6 backdrop-blur-sm sm:px-6" onClick={onClose}>
      <div
        className="mx-auto flex h-full max-w-5xl items-start justify-center"
        onClick={e => e.stopPropagation()}
      >
        <div className="max-h-full w-full overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5 shrink-0">
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900">Flight Comparison</h3>
              <p className="mt-0.5 text-sm text-gray-500">Best values highlighted in green</p>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Table */}
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="w-40 px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Feature</th>
                  {flights.map(f => (
                    <th key={f.id} className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: AIRLINE_COLORS[f.airline] ?? '#555' }}
                        >
                          {f.airline.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <p className="text-sm font-bold text-gray-900 leading-tight">{f.airline}</p>
                        <p className="text-xs text-gray-400">{f.flightNumber}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.label} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                        {row.icon}
                        {row.label}
                      </div>
                    </td>
                    {flights.map(f => {
                      const isBest = row.best?.(f) ?? false
                      return (
                        <td key={f.id} className={`px-4 py-3.5 text-center ${isBest ? 'bg-emerald-50' : ''}`}>
                          <div className={`flex items-center justify-center gap-1.5 text-sm font-semibold ${isBest ? 'text-emerald-700' : 'text-gray-700'}`}>
                            {isBest && <Check className="h-3.5 w-3.5 shrink-0" />}
                            {row.values(f)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
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

  // Round-trip state
  const [returnFlights,          setReturnFlights]         = useState<FlightDto[]>([])
  const [returnFlightsLoading,   setReturnFlightsLoading]  = useState(false)
  const [selectedDepartureFlight, setSelectedDepartureFlight] = useState<FlightDto | null>(null)
  const [selectedReturnFlight,   setSelectedReturnFlight]  = useState<FlightDto | null>(null)
  const [depRTSort,  setDepRTSort]  = useState<RTSortKey>('price')
  const [retRTSort,  setRetRTSort]  = useState<RTSortKey>('price')
  const [rtFilters,  setRtFilters]  = useState<RTFilters>(DEFAULT_RT_FILTERS)
  const [hasSearched, setHasSearched] = useState(false)

  // Compare state (one-way only)
  const [compareIds,    setCompareIds]    = useState<string[]>([])
  const [compareOpen,   setCompareOpen]   = useState(false)

  const handleCompareToggle = useCallback((id: string, checked: boolean) => {
    setCompareIds(prev =>
      checked ? (prev.length < 3 ? [...prev, id] : prev) : prev.filter(x => x !== id)
    )
  }, [])

  const compareFlights = useMemo(() => flights.filter(f => compareIds.includes(f.id)), [flights, compareIds])

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
    setHasSearched(true)
    setLoading(true)
    setError(null)
    setFilters(DEFAULT_FILTERS)
    setRtFilters(DEFAULT_RT_FILTERS)
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

  const fetchReturnFlights = useCallback(async (src = origin, dst = destination, date = returnDate) => {
    if (!src || !dst || !date) return
    setReturnFlightsLoading(true)
    const total = travellers.adults + travellers.children + travellers.infants
    try {
      const res = await flightService.search({
        origin: dst,
        destination: src,
        departureDate: date,
        passengers: total,
        cabinClass: travellers.cabinClass,
        pageSize: 100,
      })
      setReturnFlights(res.data ?? [])
    } catch {
      setReturnFlights([])
    } finally {
      setReturnFlightsLoading(false)
    }
  }, [origin, destination, returnDate, travellers])

  useEffect(() => {
    fetchFlights()
    if (tripType === 'roundtrip' && returnDate) fetchReturnFlights()
  }, [])

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

  const filteredDepartureFlights = useMemo(() => {
    let list = [...flights]
    if (rtFilters.depNonStop && !rtFilters.depOneStop) list = list.filter(f => f.stops === 0)
    else if (rtFilters.depOneStop && !rtFilters.depNonStop) list = list.filter(f => f.stops === 1)
    else if (rtFilters.depNonStop && rtFilters.depOneStop) list = list.filter(f => f.stops <= 1)
    if (rtFilters.airlines.length) list = list.filter(f => rtFilters.airlines.includes(f.airline))
    if (rtFilters.depDepSlots.length) list = list.filter(f => rtFilters.depDepSlots.some(s => slotMatch(flightHour(f, 'dep'), s)))
    if (rtFilters.depArrSlots.length) list = list.filter(f => rtFilters.depArrSlots.some(s => slotMatch(flightHour(f, 'arr'), s)))
    return list
  }, [flights, rtFilters])

  const filteredReturnFlights = useMemo(() => {
    let list = [...returnFlights]
    if (rtFilters.retNonStop && !rtFilters.retOneStop) list = list.filter(f => f.stops === 0)
    else if (rtFilters.retOneStop && !rtFilters.retNonStop) list = list.filter(f => f.stops === 1)
    else if (rtFilters.retNonStop && rtFilters.retOneStop) list = list.filter(f => f.stops <= 1)
    if (rtFilters.airlines.length) list = list.filter(f => rtFilters.airlines.includes(f.airline))
    if (rtFilters.retDepSlots.length) list = list.filter(f => rtFilters.retDepSlots.some(s => slotMatch(flightHour(f, 'dep'), s)))
    if (rtFilters.retArrSlots.length) list = list.filter(f => rtFilters.retArrSlots.some(s => slotMatch(flightHour(f, 'arr'), s)))
    return list
  }, [returnFlights, rtFilters])

  const sortedDepartureFlights = useMemo(() => sortByRTKey(filteredDepartureFlights, depRTSort), [filteredDepartureFlights, depRTSort])
  const sortedReturnFlights    = useMemo(() => sortByRTKey(filteredReturnFlights, retRTSort), [filteredReturnFlights, retRTSort])

  // Auto-select first flight whenever the sorted lists change (new search or filter change)
  useEffect(() => {
    if (sortedDepartureFlights.length > 0) setSelectedDepartureFlight(prev => {
      if (prev && sortedDepartureFlights.find(f => f.id === prev.id)) return prev
      return sortedDepartureFlights[0]
    })
    else setSelectedDepartureFlight(null)
  }, [sortedDepartureFlights])

  useEffect(() => {
    if (sortedReturnFlights.length > 0) setSelectedReturnFlight(prev => {
      if (prev && sortedReturnFlights.find(f => f.id === prev.id)) return prev
      return sortedReturnFlights[0]
    })
    else setSelectedReturnFlight(null)
  }, [sortedReturnFlights])
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
    setSelectedDepartureFlight(null)
    setSelectedReturnFlight(null)
    fetchFlights(origin, destination, departureDate)
    if (tripType === 'roundtrip' && returnDate) fetchReturnFlights(origin, destination, returnDate)
  }

  const handleRoundTripBook = () => {
    if (!selectedDepartureFlight || !selectedReturnFlight) return
    const total = travellers.adults + travellers.children + travellers.infants
    const p = new URLSearchParams({
      fare: 'saver',
      passengers: String(total),
      cabinClass: travellers.cabinClass,
      returnFlightId: selectedReturnFlight.id,
    })
    navigate(`/flights/${selectedDepartureFlight.id}/book?${p}`)
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
      {/* Hero — flight search */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=80)', filter: 'saturate(1.8) brightness(0.8) contrast(1.15)' }} />
        <div className="absolute inset-0 bg-blue-950/72" />
        <div className="relative z-10 py-10 px-4">
          <div className="mx-auto max-w-6xl">
            <div className="mb-5 text-white">
              <h1 className="text-3xl font-bold flex items-center gap-2 mb-1"><Plane className="w-7 h-7" /> Search Flights</h1>
              <p className="text-blue-200 text-sm">900+ routes · 7 airlines · best fares guaranteed</p>
            </div>
            <div className="mb-3 flex gap-4">
              {(['oneway', 'roundtrip'] as TripType[]).map(t => (
                <label key={t} className="flex items-center gap-1.5 text-xs font-semibold text-white cursor-pointer">
                  <input type="radio" name="tripType" value={t} checked={tripType === t} onChange={() => setTripType(t)} className="accent-orange-400" />
                  {t === 'oneway' ? 'One Way' : 'Round Trip'}
                </label>
              ))}
            </div>
            <form onSubmit={handleSearch}>
              <div className="rounded-2xl bg-white shadow-xl">
                <div className="flex flex-col divide-y divide-gray-100 lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0">
                  <div className="flex-1 min-w-[160px] px-4 py-4">
                    <AirportSearch label="From" placeholder="City or Airport"
                      value={origin ? `${originCity || origin} (${origin})` : ''}
                      onChange={(code, city) => { setOrigin(code); setOriginCity(city) }} />
                  </div>
                  <div className="hidden lg:flex items-center px-2">
                    <button type="button" onClick={swap} className="h-8 w-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-blue-300 transition-colors">
                      <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-[160px] px-4 py-4">
                    <AirportSearch label="To" placeholder="City or Airport"
                      value={destination ? `${destinationCity || destination} (${destination})` : ''}
                      onChange={(code, city) => { setDestination(code); setDestinationCity(city) }} />
                  </div>
                  <div className="px-4 py-4 lg:w-[170px]">
                    <DatePickerInput label="Departure" value={departureDate} min={TODAY} onChange={setDepartureDate} accentColor="blue" variant="underline" />
                  </div>
                  {tripType === 'roundtrip' && (
                    <div className="px-4 py-4 lg:w-[160px]">
                      <DatePickerInput label="Return" value={returnDate} min={departureDate || TODAY} onChange={setReturnDate} accentColor="blue" variant="underline" />
                    </div>
                  )}
                  <div className="flex-1 min-w-[200px] px-4 py-4">
                    <TravellerSelector value={travellers} onChange={setTravellers} />
                  </div>
                  <div className="px-4 py-4 lg:flex lg:items-center lg:justify-center">
                    <button type="submit" disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100 disabled:opacity-70 disabled:cursor-not-allowed lg:w-auto"
                      style={{ background: 'linear-gradient(90deg, #1e3a8a, #f97316)' }}>
                      <Search className="h-5 w-5" /> {loading ? 'Searching…' : 'Search'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
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

        {/* ── Round-trip two-column selector ────────────────────────────────── */}
        {tripType === 'roundtrip' ? (
          <div className={hasSearched ? 'pb-36' : ''}>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
            )}
            {!hasSearched ? null : <div className="flex gap-4">
              <RTFilterSidebar
                depFlights={flights}
                retFlights={returnFlights}
                filters={rtFilters}
                setFilters={setRtFilters}
                origin={origin}
                destination={destination}
              />
              <div className="flex-1 grid grid-cols-2 gap-4">
              {/* Departure column */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-900 text-white">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{originCity || origin} → {destinationCity || destination}</p>
                  <p className="text-sm font-semibold mt-0.5">{departureDate ? dayLabel(departureDate) : 'Select date'}</p>
                </div>
                <RTSortHeader sortKey={depRTSort} onSort={setDepRTSort} />
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="px-4 py-3 border-b border-gray-100">
                        <div className="h-4 bg-gray-100 rounded animate-pulse mb-1.5" />
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                      </div>
                    ))
                  : sortedDepartureFlights.length === 0
                    ? <div className="py-16 text-center text-gray-400 text-sm">No flights available.</div>
                    : sortedDepartureFlights.map(f => (
                        <RoundTripFlightRow
                          key={f.id}
                          flight={f}
                          selected={selectedDepartureFlight?.id === f.id}
                          onSelect={() => setSelectedDepartureFlight(f)}
                        />
                      ))
                }
              </div>

              {/* Return column */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-900 text-white">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">{destinationCity || destination} → {originCity || origin}</p>
                  <p className="text-sm font-semibold mt-0.5">{returnDate ? dayLabel(returnDate) : 'Select return date'}</p>
                </div>
                <RTSortHeader sortKey={retRTSort} onSort={setRetRTSort} />
                {!returnDate
                  ? <div className="py-16 text-center text-gray-400 text-sm">Select a return date above to see flights.</div>
                  : returnFlightsLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="px-4 py-3 border-b border-gray-100">
                          <div className="h-4 bg-gray-100 rounded animate-pulse mb-1.5" />
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                        </div>
                      ))
                    : sortedReturnFlights.length === 0
                      ? <div className="py-16 text-center text-gray-400 text-sm">No flights available.</div>
                      : sortedReturnFlights.map(f => (
                          <RoundTripFlightRow
                            key={f.id}
                            flight={f}
                            selected={selectedReturnFlight?.id === f.id}
                            onSelect={() => setSelectedReturnFlight(f)}
                          />
                        ))
                }
              </div>
            </div></div>}

            {selectedDepartureFlight && selectedReturnFlight && (
              <RoundTripStickyBar
                dep={selectedDepartureFlight}
                ret={selectedReturnFlight}
                passengerCount={travellers.adults + travellers.children + travellers.infants}
                onBook={handleRoundTripBook}
              />
            )}
          </div>
        ) : (

        /* ── One-way layout ────────────────────────────────────────────── */
        <div className={`flex gap-5 ${compareIds.length > 0 ? 'pb-24' : ''}`}>
          <FilterSidebar
            flights={flights}
            filters={filters}
            setFilters={setFilters}
            origin={origin}
            destination={destination}
          />

          <div className="flex-1 min-w-0">
            <DatePriceStrip
              departureDate={departureDate}
              datePriceMap={datePriceMap}
              onSelectDate={handleDateSelect}
              onOpenCalendar={() => setCalendarOpen(true)}
            />
            <SortTabs sortKey={sortKey} onSort={setSortKey} flights={flights} />

            {/* AI price trend insight */}
            {!loading && origin && destination && (
              <div className="mb-3">
                <PriceTrendInsight origin={origin} destination={destination} />
              </div>
            )}

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
                  : paginatedFlights.map(f => (
                    <FlightCard
                      key={f.id}
                      flight={f}
                      passengerCount={travellers.adults + travellers.children + travellers.infants}
                      isCompared={compareIds.includes(f.id)}
                      compareDisabled={compareIds.length >= 3}
                      onCompare={checked => handleCompareToggle(f.id, checked)}
                    />
                  ))
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
        )}
      </div>

      <PriceCalendar
        open={calendarOpen}
        departureDate={departureDate}
        datePriceMap={datePriceMap}
        onClose={() => setCalendarOpen(false)}
        onSelectDate={handleDateSelect}
        onMonthChange={handleCalendarMonthChange}
      />

      {compareIds.length > 0 && tripType === 'oneway' && (
        <CompareBar
          flights={compareFlights}
          onRemove={id => handleCompareToggle(id, false)}
          onCompareNow={() => setCompareOpen(true)}
          onClear={() => setCompareIds([])}
        />
      )}

      {compareOpen && compareFlights.length >= 2 && (
        <CompareModal flights={compareFlights} onClose={() => setCompareOpen(false)} />
      )}
    </div>
  )
}
