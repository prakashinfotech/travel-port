import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Bus, Clock, Wifi, Star, Filter, MapPin, Search, ChevronDown, ChevronUp, X } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { BusDto, ApiResponse } from '@/types'
import { BusCardSkeleton } from '@/components/ui/Skeleton'
import { DatePickerInput } from '@/components/ui/DatePickerInput'
import { CitySearch } from '@/components/search/CitySearch'

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

// Simplified seat layout preview (4 rows shown)
function SeatLayoutPreview({ bus }: { bus: BusDto }) {
  const totalSeats  = bus.totalSeats ?? 40
  const available   = bus.availableSeats
  const booked      = totalSeats - available

  // Deterministic RNG seeded from bus ID
  let hash = 0
  for (let i = 0; i < bus.id.length; i++) hash = (hash * 31 + bus.id.charCodeAt(i)) & 0x7fffffff
  const rng = () => { hash = (hash * 1664525 + 1013904223) & 0x7fffffff; return hash }

  // Each deck: 4 seats per row (left-window, left-aisle | right-aisle, right-window)
  const seatsPerDeck = Math.floor(totalSeats / 2)   // e.g. 20
  const rowsPerDeck  = Math.ceil(seatsPerDeck / 4)   // e.g. 5

  // Deterministically mark booked seats (seat numbers 1..totalSeats)
  const bookedSet = new Set<number>()
  while (bookedSet.size < Math.min(booked, totalSeats)) {
    bookedSet.add((rng() % totalSeats) + 1)
  }

  // Right-window column of lower deck is female-reserved
  // Lower deck right-window seats: 4, 8, 12 … (position index 3 in each row, 1-based)
  const femaleSeats = new Set(Array.from({ length: rowsPerDeck }, (_, r) => r * 4 + 4))
  // Mirror to upper deck
  for (let r = 0; r < rowsPerDeck; r++) femaleSeats.add(seatsPerDeck + r * 4 + 4)

  const seatCls = (n: number) => {
    if (bookedSet.has(n))   return 'bg-red-100 border-red-200 text-red-400'
    if (femaleSeats.has(n)) return 'bg-pink-100 border-pink-300 text-pink-700'
    const pos = (n - 1) % 4
    if (pos === 0 || pos === 3) return 'bg-yellow-50 border-yellow-400 text-yellow-700'
    return 'bg-green-50 border-green-400 text-green-700'
  }

  const DeckGrid = ({ label, start }: { label: string; start: number }) => (
    <div className="mb-4">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-center gap-1 mb-1 pl-5 text-xs text-gray-400">
        <span className="w-8 text-center">Win</span>
        <span className="w-8 text-center">Aisle</span>
        <div className="w-5" />
        <span className="w-8 text-center">Aisle</span>
        <span className="w-8 text-center">Win</span>
      </div>
      <div className="space-y-1.5">
        {Array.from({ length: rowsPerDeck }, (_, row) => {
          const s = start + row * 4
          return (
            <div key={row} className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-4 text-right shrink-0">{row + 1}</span>
              {[s, s + 1].map(n => (
                <div key={n} className={`w-8 h-7 rounded border text-xs flex items-center justify-center font-semibold ${seatCls(n)}`}>{n}</div>
              ))}
              <div className="w-5 flex items-center justify-center text-gray-300 text-sm select-none">|</div>
              {[s + 2, s + 3].map(n => (
                <div key={n} className={`w-8 h-7 rounded border text-xs flex items-center justify-center font-semibold ${seatCls(n)}`}>{n}</div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-50 border border-green-400 shrink-0" />Available ({available})</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-100 border border-red-200 shrink-0" />Booked ({booked})</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-50 border border-yellow-400 shrink-0" />Window</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-pink-100 border border-pink-300 shrink-0" />Female</span>
      </div>
      <DeckGrid label="Lower Deck" start={1} />
      <DeckGrid label="Upper Deck" start={seatsPerDeck + 1} />
      <p className="text-xs text-gray-500 mt-1">Base fare: ₹{bus.price.toLocaleString()} · Window seat: ₹{(bus.price + 50).toLocaleString()}</p>
    </div>
  )
}

type TabKey = 'amenities' | 'points' | 'seats'

function BusCard({ bus, onBook }: { bus: BusDto; onBook: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('amenities')

  const amenityList = bus.amenities.split(',').map(a => a.trim()).filter(Boolean)

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Main row */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-800">{bus.operator}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bus.busType}</span>
              {bus.acAvailable && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">AC</span>}
              {bus.isRefundable && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Refundable</span>}
              {bus.busNumber && <span className="text-xs text-gray-400 ml-1">{bus.busNumber}</span>}
            </div>
            <div className="flex items-center gap-6 mt-2">
              <div>
                <p className="text-lg font-bold">{formatTime(bus.departureTime)}</p>
                <p className="text-xs text-gray-500">{bus.origin}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />{formatDuration(bus.durationMinutes)}
                </p>
                <div className="h-px bg-gray-200 my-1" />
                <p className="text-xs text-green-600">{bus.availableSeats} seats left</p>
                {bus.intermediateStops && (
                  <p className="text-xs text-green-600 mt-0.5 flex items-center justify-center gap-0.5 opacity-70">
                    <MapPin className="w-2.5 h-2.5" />via {bus.intermediateStops}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{formatTime(bus.arrivalTime)}</p>
                <p className="text-xs text-gray-500">{bus.destination}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Wifi className="w-3 h-3" />{amenityList[0]}{amenityList.length > 1 ? ` +${amenityList.length - 1} more` : ''}</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{bus.rating}/5</span>
            </div>
          </div>
          <div className="ml-6 text-right shrink-0">
            <p className="text-2xl font-bold text-gray-800">₹{bus.price.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mb-2">per seat</p>
            <button
              onClick={onBook}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition"
            >
              BOOK NOW
            </button>
          </div>
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-center gap-1 text-xs text-green-600 font-medium py-2 border-t border-gray-100 hover:bg-gray-50 transition"
      >
        {expanded ? <><ChevronUp className="w-3.5 h-3.5" />Hide details</> : <><ChevronDown className="w-3.5 h-3.5" />View details</>}
      </button>

      {/* Expanded tabs */}
      {expanded && (
        <div className="border-t border-gray-100">
          <div className="flex border-b border-gray-100">
            {([['amenities', 'Amenities'], ['points', 'Stops & Points'], ['seats', 'Seat Layout']] as [TabKey, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === key ? 'text-green-700 border-b-2 border-green-600 bg-green-50' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="p-4">
            {activeTab === 'amenities' && (
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {amenityList.map(a => (
                    <span key={a} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Wifi className="w-3 h-3" />{a}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2">
                    <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 shrink-0">✓</span>
                    {bus.isRefundable ? 'Fully Refundable' : 'Non-Refundable'}
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">✓</span>
                    {bus.acAvailable ? 'Air Conditioned' : 'Non-AC'}
                  </div>
                  {bus.driverPhone && (
                    <div className="flex items-center gap-1.5 bg-gray-50 rounded-lg p-2 col-span-2">
                      <span className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 shrink-0">📞</span>
                      Driver: {bus.driverPhone}
                    </div>
                  )}
                </div>
              </div>
            )}
            {activeTab === 'points' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3 text-green-600" />Boarding Points</p>
                  <div className="space-y-1.5">
                    {(bus.boardingPoints ?? bus.origin).split(',').map(p => p.trim()).filter(Boolean).map(pt => (
                      <div key={pt} className="text-xs text-gray-600 bg-green-50 rounded px-2.5 py-1.5 border border-green-100">{pt}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3 text-red-500" />Dropping Points</p>
                  <div className="space-y-1.5">
                    {(bus.droppingPoints ?? bus.destination).split(',').map(p => p.trim()).filter(Boolean).map(pt => (
                      <div key={pt} className="text-xs text-gray-600 bg-red-50 rounded px-2.5 py-1.5 border border-red-100">{pt}</div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'seats' && (
              <SeatLayoutPreview bus={bus} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BusesPage() {
  const today = new Date().toISOString().split('T')[0]
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [origin, setOrigin]           = useState(searchParams.get('origin') || '')
  const [destination, setDestination] = useState(searchParams.get('destination') || '')
  const [date, setDate]               = useState(searchParams.get('date') || today)
  const [seats, setSeats]             = useState(Number(searchParams.get('seats')) || 1)
  const [rawBuses, setRawBuses]       = useState<BusDto[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [searched, setSearched]       = useState(false)
  const [sortBy, setSortBy]               = useState<'price' | 'departure' | 'duration'>('price')
  const [filterAc, setFilterAc]           = useState(false)
  const [filterRefund, setFilterRefund]   = useState(false)
  const [filterOperators, setFilterOps]   = useState<string[]>([])
  const [filterBusTypes, setFilterTypes]  = useState<string[]>([])
  const [filterDeptSlot, setFilterSlot]   = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState(0)

  const buses = useMemo(() => {
    const now = new Date()
    const isToday = date === today
    let results = [...rawBuses]
    if (isToday) results = results.filter(b => new Date(b.departureTime) > now)
    if (filterAc)               results = results.filter(b => b.acAvailable)
    if (filterRefund)           results = results.filter(b => b.isRefundable)
    if (filterOperators.length) results = results.filter(b => filterOperators.includes(b.operator))
    if (filterBusTypes.length)  results = results.filter(b => filterBusTypes.some(t => b.busType.toLowerCase().includes(t.toLowerCase())))
    if (filterMaxPrice > 0)     results = results.filter(b => b.price <= filterMaxPrice)
    if (filterDeptSlot) {
      results = results.filter(b => {
        const h = new Date(b.departureTime).getHours()
        if (filterDeptSlot === 'early')     return h >= 0  && h < 6
        if (filterDeptSlot === 'morning')   return h >= 6  && h < 12
        if (filterDeptSlot === 'afternoon') return h >= 12 && h < 18
        if (filterDeptSlot === 'evening')   return h >= 18 && h < 24
        return true
      })
    }
    if (sortBy === 'departure')     results = results.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
    else if (sortBy === 'duration') results = results.sort((a, b) => a.durationMinutes - b.durationMinutes)
    else                            results = results.sort((a, b) => a.price - b.price)
    return results
  }, [rawBuses, filterAc, filterRefund, filterOperators, filterBusTypes, filterDeptSlot, filterMaxPrice, sortBy])

  useEffect(() => {
    if (searchParams.get('origin')) search()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const search = async () => {
    if (!origin || !destination || !date) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<ApiResponse<BusDto[]>>(endpoints.buses.search, {
        params: { origin, destination, travelDate: date, seats, pageSize: 30 }
      })
      setRawBuses(data.data ?? [])
      setTotal(data.meta?.total ?? (data.data ?? []).length)
      setSearched(true)
    } catch {
      setError('Failed to search buses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar — lush travel-themed gradient */}
      <div className="py-6 px-4" style={{ background: 'linear-gradient(135deg, #14532d 0%, #15803d 50%, #16a34a 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
            <Bus className="w-6 h-6" /> Bus Tickets
          </h1>
          <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <CitySearch label="FROM" value={origin} onChange={setOrigin} focusColor="green" />
            </div>
            <div className="flex-1 min-w-40">
              <CitySearch label="TO" value={destination} onChange={setDestination} focusColor="green" />
            </div>
            <DatePickerInput
              label="DATE"
              value={date}
              min={today}
              onChange={setDate}
              accentColor="green"
              className="flex-1 min-w-40"
            />
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">SEATS</label>
              <input type="number" value={seats} min={1} max={10}
                onChange={e => setSeats(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={search}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Filters */}
        <div className="w-60 shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><Filter className="w-4 h-4" /> Filters</h3>
              {(filterAc || filterRefund || filterOperators.length > 0 || filterBusTypes.length > 0 || filterDeptSlot || filterMaxPrice > 0) && (
                <button onClick={() => { setFilterAc(false); setFilterRefund(false); setFilterOps([]); setFilterTypes([]); setFilterSlot(''); setFilterMaxPrice(0) }}
                  className="text-xs text-green-600 font-semibold flex items-center gap-0.5 hover:text-red-500"><X className="w-3 h-3" />Clear</button>
              )}
            </div>

            {/* Sort tabs */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sort By</p>
              <div className="grid grid-cols-3 gap-1">
                {([['price', '₹', 'Cheapest'], ['departure', '⏰', 'Earliest'], ['duration', '⚡', 'Fastest']] as [typeof sortBy, string, string][]).map(([k, icon, label]) => (
                  <button key={k} onClick={() => setSortBy(k)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${sortBy === k ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'}`}>
                    <span className="text-sm">{icon}</span><span className="mt-0.5 leading-tight text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Departure time slots */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Departure Time</p>
              <div className="grid grid-cols-2 gap-1">
                {[['early','🌙','Before 6 AM'],['morning','🌅','6 AM–12 PM'],['afternoon','☀️','12 PM–6 PM'],['evening','🌆','After 6 PM']].map(([k, icon, lbl]) => (
                  <button key={k} onClick={() => setFilterSlot(s => s === k ? '' : k)}
                    className={`flex flex-col items-center py-2 rounded-lg border text-xs font-medium transition-all ${filterDeptSlot === k ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-green-300'}`}>
                    <span>{icon}</span><span className="mt-0.5 text-center leading-tight">{lbl}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular filters */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Popular Filters</p>
              <div className="space-y-2">
                {[['AC Bus', filterAc, setFilterAc], ['Refundable', filterRefund, setFilterRefund]].map(([lbl, val, set]) => (
                  <label key={lbl as string} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input type="checkbox" checked={val as boolean} onChange={e => (set as (v: boolean) => void)(e.target.checked)} className="w-4 h-4 accent-green-600 shrink-0" />
                    <span className="text-sm text-gray-700">{lbl as string}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Bus type */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Bus Type</p>
              <div className="space-y-2">
                {['Sleeper', 'Semi-Sleeper', 'Seater', 'Volvo'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input type="checkbox" checked={filterBusTypes.includes(t)}
                      onChange={e => setFilterTypes(prev => e.target.checked ? [...prev, t] : prev.filter(x => x !== t))}
                      className="w-4 h-4 accent-green-600 shrink-0" />
                    <span className="text-sm text-gray-700">{t}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Operator */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Operator</p>
              <div className="space-y-2">
                {['VRL Travels','Orange Travels','MSRTC','KSRTC','IntrCity SmartBus','Neeta Travels'].map(op => (
                  <label key={op} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input type="checkbox" checked={filterOperators.includes(op)}
                      onChange={e => setFilterOps(prev => e.target.checked ? [...prev, op] : prev.filter(x => x !== op))}
                      className="w-4 h-4 accent-green-600 shrink-0" />
                    <span className="text-sm text-gray-700">{op}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Max price */}
            <div className="px-4 py-3 border-t border-gray-100 pb-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Max Price (₹)</p>
              <input type="number" value={filterMaxPrice || ''} placeholder="e.g. 1500"
                onChange={e => setFilterMaxPrice(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <BusCardSkeleton key={i} />)}
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>}

          {!loading && searched && buses.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400">
              <Bus className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No buses found</p>
              <p className="text-sm">Try different cities or dates</p>
            </div>
          )}

          {!loading && buses.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-3">{total} buses found · {origin} → {destination}</p>
              <div className="space-y-3">
                {buses.map(bus => (
                  <BusCard
                    key={bus.id}
                    bus={bus}
                    onBook={() => navigate('/buses/book', { state: { bus, seats } })}
                  />
                ))}
              </div>
            </>
          )}

          {!searched && !loading && (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400">
              <Bus className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Search for buses between cities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
