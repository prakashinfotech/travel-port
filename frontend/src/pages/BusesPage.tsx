import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Bus, Clock, Wifi, Star, Filter, MapPin, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { BusDto, ApiResponse } from '@/types'
import { BusCardSkeleton } from '@/components/ui/Skeleton'
import { DatePickerInput } from '@/components/ui/DatePickerInput'

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Goa', 'Pune', 'Jaipur', 'Kolkata']

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
  const totalSeats = bus.totalSeats ?? 40
  const available  = bus.availableSeats
  const booked     = totalSeats - available
  const rows       = 10
  let hash = 0
  for (let i = 0; i < bus.id.length; i++) hash = (hash * 31 + bus.id.charCodeAt(i)) & 0x7fffffff
  const rng = () => { hash = (hash * 1664525 + 1013904223) & 0x7fffffff; return hash & 0x7fffffff }

  const bookedSet = new Set<string>()
  const allSeats  = Array.from({ length: rows }, (_, r) => ['A','B','C','D'].map(c => `${r+1}${c}`)).flat()
  while (bookedSet.size < Math.min(booked, totalSeats - 4)) {
    bookedSet.add(allSeats[rng() % allSeats.length])
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-4 h-4 inline-block rounded bg-green-100 border border-green-400" /> Available ({available})</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 inline-block rounded bg-red-100 border border-red-300" /> Booked ({booked})</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 inline-block rounded bg-yellow-50 border border-yellow-400" /> Window +₹50</span>
      </div>
      <div className="space-y-1">
        {Array.from({ length: Math.min(5, rows) }, (_, ri) => (
          <div key={ri} className="flex items-center gap-1">
            <span className="text-xs text-gray-400 w-4 text-right">{ri + 1}</span>
            {['A','B'].map(c => {
              const id   = `${ri+1}${c}`
              const book = bookedSet.has(id)
              const win  = c === 'A'
              return <div key={c} className={`w-7 h-6 rounded text-xs flex items-center justify-center border ${book ? 'bg-red-100 border-red-200 text-red-300' : win ? 'bg-yellow-50 border-yellow-400 text-yellow-600' : 'bg-green-50 border-green-400 text-green-600'}`}>{c}</div>
            })}
            <div className="w-4" />
            {['C','D'].map(c => {
              const id   = `${ri+1}${c}`
              const book = bookedSet.has(id)
              const win  = c === 'D'
              return <div key={c} className={`w-7 h-6 rounded text-xs flex items-center justify-center border ${book ? 'bg-red-100 border-red-200 text-red-300' : win ? 'bg-yellow-50 border-yellow-400 text-yellow-600' : 'bg-green-50 border-green-400 text-green-600'}`}>{c}</div>
            })}
          </div>
        ))}
        <p className="text-xs text-gray-400 mt-1">...{rows - 5} more rows · Book to select exact seat</p>
      </div>
      <p className="text-xs text-gray-500 mt-2">Base fare: ₹{bus.price.toLocaleString()} · Window seat: ₹{(bus.price + 50).toLocaleString()}</p>
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
  const [origin, setOrigin]           = useState(searchParams.get('origin') || 'Mumbai')
  const [destination, setDestination] = useState(searchParams.get('destination') || 'Pune')
  const [date, setDate]               = useState(searchParams.get('date') || today)
  const [seats, setSeats]             = useState(Number(searchParams.get('seats')) || 1)
  const [buses, setBuses]             = useState<BusDto[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [searched, setSearched]       = useState(false)
  const [sortBy, setSortBy]           = useState<'price' | 'departure' | 'duration'>('price')
  const [filterAc, setFilterAc]       = useState(false)
  const [filterRefund, setFilterRefund] = useState(false)
  const [filterOperator, setFilterOperator] = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState(0)

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
      let results = data.data ?? []
      if (filterAc)     results = results.filter(b => b.acAvailable)
      if (filterRefund) results = results.filter(b => b.isRefundable)
      if (filterOperator) results = results.filter(b => b.operator === filterOperator)
      if (filterMaxPrice > 0) results = results.filter(b => b.price <= filterMaxPrice)
      if (sortBy === 'departure') results = results.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
      else if (sortBy === 'duration') results = results.sort((a, b) => a.durationMinutes - b.durationMinutes)
      else results = results.sort((a, b) => a.price - b.price)
      setBuses(results)
      setTotal(data.meta?.total ?? results.length)
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
              <label className="block text-xs text-gray-500 mb-1">FROM</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">TO</label>
              <select value={destination} onChange={e => setDestination(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
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
        <div className="w-56 shrink-0">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filters
            </h3>
            <div className="space-y-2 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filterAc} onChange={e => setFilterAc(e.target.checked)} className="accent-green-600" />
                AC only
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={filterRefund} onChange={e => setFilterRefund(e.target.checked)} className="accent-green-600" />
                Refundable
              </label>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Operator</label>
              <select value={filterOperator} onChange={e => setFilterOperator(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="">All Operators</option>
                <option value="VRL Travels">VRL Travels</option>
                <option value="Orange Travels">Orange Travels</option>
                <option value="MSRTC">MSRTC</option>
                <option value="KSRTC">KSRTC</option>
                <option value="IntrCity SmartBus">IntrCity SmartBus</option>
                <option value="Neeta Travels">Neeta Travels</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Max Price (₹)</label>
              <input type="number" value={filterMaxPrice || ''} placeholder="e.g. 1500"
                onChange={e => setFilterMaxPrice(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Sort by</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="price">Price</option>
                <option value="departure">Departure</option>
                <option value="duration">Duration</option>
              </select>
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
