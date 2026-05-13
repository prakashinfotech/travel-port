import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bus, Clock, Wifi, Star, Filter } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { BusDto, ApiResponse } from '@/types'
import { BusCardSkeleton } from '@/components/ui/Skeleton'

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Goa', 'Pune', 'Jaipur', 'Kolkata']

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

export default function BusesPage() {
  const today = new Date().toISOString().split('T')[0]
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
      {/* Search bar */}
      <div className="bg-green-700 py-6 px-4">
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
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">DATE</label>
              <input type="date" value={date} min={today}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">SEATS</label>
              <input type="number" value={seats} min={1} max={10}
                onChange={e => setSeats(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <button onClick={search}
              className="bg-green-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition">
              SEARCH
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
            <div className="mt-4">
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
                  <div key={bus.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-800">{bus.operator}</span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bus.busType}</span>
                          {bus.acAvailable && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">AC</span>}
                          {bus.isRefundable && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Refundable</span>}
                        </div>
                        <div className="flex items-center gap-6 mt-2">
                          <div>
                            <p className="text-lg font-bold">{formatTime(bus.departureTime)}</p>
                            <p className="text-xs text-gray-500">{origin}</p>
                          </div>
                          <div className="flex-1 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3" />{formatDuration(bus.durationMinutes)}
                            </p>
                            <div className="h-px bg-gray-200 my-1" />
                            <p className="text-xs text-green-600">{bus.availableSeats} seats left</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatTime(bus.arrivalTime)}</p>
                            <p className="text-xs text-gray-500">{destination}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Wifi className="w-3 h-3" />{bus.amenities}</span>
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400" />{bus.rating}/5</span>
                        </div>
                      </div>
                      <div className="ml-6 text-right">
                        <p className="text-2xl font-bold text-gray-800">₹{bus.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mb-2">per seat</p>
                        <button className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                          SELECT SEATS
                        </button>
                      </div>
                    </div>
                  </div>
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
