import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Train, Clock, Filter, AlertCircle, Users } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { TrainDto, ApiResponse } from '@/types'
import { TrainCardSkeleton } from '@/components/ui/Skeleton'

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Goa', 'Pune', 'Jaipur', 'Kolkata']
const CLASSES = [
  { code: '', label: 'All Classes' },
  { code: 'SL', label: 'Sleeper (SL)' },
  { code: '3A', label: 'AC 3 Tier (3A)' },
  { code: '2A', label: 'AC 2 Tier (2A)' },
  { code: '1A', label: 'First AC (1A)' },
  { code: 'CC', label: 'Chair Car (CC)' },
]

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

function availabilityColor(avail: string) {
  if (avail === 'AVAILABLE') return 'text-green-700 bg-green-50'
  if (avail.startsWith('WL')) return 'text-orange-700 bg-orange-50'
  if (avail.startsWith('RAC')) return 'text-yellow-700 bg-yellow-50'
  return 'text-red-700 bg-red-50'
}

export default function TrainsPage() {
  const today = new Date().toISOString().split('T')[0]
  const [searchParams] = useSearchParams()
  const [origin, setOrigin]           = useState(searchParams.get('origin') || 'Mumbai')
  const [destination, setDestination] = useState(searchParams.get('destination') || 'Delhi')
  const [date, setDate]               = useState(searchParams.get('date') || today)
  const [trainClass, setTrainClass]   = useState('')
  const [passengers, setPassengers]   = useState(Number(searchParams.get('passengers')) || 1)
  const [trains, setTrains]           = useState<TrainDto[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [searched, setSearched]       = useState(false)
  const [filterTatkal, setFilterTatkal] = useState(false)
  const [sortBy, setSortBy]           = useState<'departure' | 'duration' | 'price'>('departure')

  useEffect(() => {
    if (searchParams.get('origin')) search()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const search = async () => {
    if (!origin || !destination || !date) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<ApiResponse<TrainDto[]>>(endpoints.trains.search, {
        params: { origin, destination, travelDate: date, class: trainClass || undefined, passengers, pageSize: 30 }
      })
      let results = data.data ?? []
      if (filterTatkal) results = results.filter(t => t.isTatkal)
      if (sortBy === 'duration') results = results.sort((a, b) => a.durationMinutes - b.durationMinutes)
      else if (sortBy === 'price') results = results.sort((a, b) => {
        const aPrice = Object.values(a.classes)[0]?.price ?? 0
        const bPrice = Object.values(b.classes)[0]?.price ?? 0
        return aPrice - bPrice
      })
      else results = results.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
      setTrains(results)
      setTotal(data.meta?.total ?? results.length)
      setSearched(true)
    } catch {
      setError('Failed to search trains. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-blue-800 py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
            <Train className="w-6 h-6" /> Train Tickets
          </h1>
          <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">FROM</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">TO</label>
              <select value={destination} onChange={e => setDestination(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-36">
              <label className="block text-xs text-gray-500 mb-1">DATE</label>
              <input type="date" value={date} min={today}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1 min-w-36">
              <label className="block text-xs text-gray-500 mb-1">CLASS</label>
              <select value={trainClass} onChange={e => setTrainClass(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CLASSES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">PASSENGERS</label>
              <input type="number" value={passengers} min={1} max={6}
                onChange={e => setPassengers(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={search}
              className="bg-blue-700 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition">
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
                <input type="checkbox" checked={filterTatkal} onChange={e => setFilterTatkal(e.target.checked)} className="accent-blue-700" />
                Tatkal only
              </label>
            </div>
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1">Sort by</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="departure">Departure</option>
                <option value="duration">Duration</option>
                <option value="price">Price</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <TrainCardSkeleton key={i} />)}
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>}

          {!loading && searched && trains.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400">
              <Train className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No trains found</p>
              <p className="text-sm">Try different cities or dates</p>
            </div>
          )}

          {!loading && trains.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-3">{total} trains found · {origin} → {destination}</p>
              <div className="space-y-3">
                {trains.map(train => (
                  <div key={train.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-gray-800">{train.trainNumber}</span>
                          <span className="font-semibold text-gray-700">{train.trainName}</span>
                          {train.isTatkal && (
                            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Tatkal</span>
                          )}
                        </div>
                        <div className="flex items-center gap-6 mt-2">
                          <div>
                            <p className="text-lg font-bold">{formatTime(train.departureTime)}</p>
                            <p className="text-xs text-gray-500">{origin}</p>
                          </div>
                          <div className="flex-1 text-center">
                            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3" />{formatDuration(train.durationMinutes)}
                            </p>
                            <div className="h-px bg-gray-200 my-1" />
                            <p className="text-xs text-gray-400">{train.runningDays}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatTime(train.arrivalTime)}</p>
                            <p className="text-xs text-gray-500">{destination}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Class grid */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                      {Object.entries(train.classes).map(([cls, info]) => (
                        <div key={cls} className="border border-gray-200 rounded-lg p-2 text-center">
                          <p className="text-xs font-bold text-gray-700">{cls}</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">₹{info.price.toLocaleString()}</p>
                          <p className={`text-xs mt-0.5 px-1.5 py-0.5 rounded-full inline-block font-medium ${availabilityColor(info.availability)}`}>
                            {info.availability}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-0.5">
                            <Users className="w-3 h-3" />{info.availableSeats}
                          </p>
                          {info.availability !== 'REGRET' && (
                            <button className="mt-1.5 w-full bg-blue-700 text-white text-xs py-1 rounded-md hover:bg-blue-800 transition font-semibold">
                              BOOK
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!searched && !loading && (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400">
              <Train className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Search for trains between cities</p>
              <p className="text-sm mt-1 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" /> Data includes real Indian train names and routes
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
