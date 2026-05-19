import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Train, Clock, Filter, AlertCircle, Users, MapPin, Search, X } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { TrainDto, ApiResponse } from '@/types'
import { TrainCardSkeleton } from '@/components/ui/Skeleton'
import { DatePickerInput } from '@/components/ui/DatePickerInput'
import { CitySearch } from '@/components/search/CitySearch'

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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [origin, setOrigin]           = useState(searchParams.get('origin') || '')
  const [destination, setDestination] = useState(searchParams.get('destination') || '')
  const [date, setDate]               = useState(searchParams.get('date') || today)
  const [trainClass, setTrainClass]   = useState('')
  const [passengers, setPassengers]   = useState(Number(searchParams.get('passengers')) || 1)
  const [rawTrains, setRawTrains]     = useState<TrainDto[]>([])
  const [total, setTotal]             = useState(0)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [searched, setSearched]       = useState(false)
  const [filterTatkal, setFilterTatkal]     = useState(false)
  const [filterDeptSlot, setFilterDeptSlot] = useState('')
  const [filterMaxPrice, setFilterMaxPrice] = useState(0)
  const [filterClasses, setFilterClasses]   = useState<string[]>([])
  const [sortBy, setSortBy]                 = useState<'departure' | 'duration' | 'price'>('departure')

  const trains = useMemo(() => {
    const now = new Date()
    const isToday = date === today
    let results = [...rawTrains]
    if (isToday) results = results.filter(t => new Date(t.departureTime) > now)
    if (filterTatkal)       results = results.filter(t => t.isTatkal)
    if (filterClasses.length) results = results.filter(t => filterClasses.some(c => Object.keys(t.classes).includes(c)))
    if (filterDeptSlot) {
      results = results.filter(t => {
        const h = new Date(t.departureTime).getHours()
        if (filterDeptSlot === 'night')     return h >= 0  && h < 6
        if (filterDeptSlot === 'morning')   return h >= 6  && h < 12
        if (filterDeptSlot === 'afternoon') return h >= 12 && h < 18
        if (filterDeptSlot === 'evening')   return h >= 18 && h < 24
        return true
      })
    }
    if (filterMaxPrice > 0) results = results.filter(t => Object.values(t.classes).some(c => c.price <= filterMaxPrice))
    if (sortBy === 'duration') results = results.sort((a, b) => a.durationMinutes - b.durationMinutes)
    else if (sortBy === 'price') results = results.sort((a, b) => {
      const aPrice = Object.values(a.classes)[0]?.price ?? 0
      const bPrice = Object.values(b.classes)[0]?.price ?? 0
      return aPrice - bPrice
    })
    else results = results.sort((a, b) => a.departureTime.localeCompare(b.departureTime))
    return results
  }, [rawTrains, filterTatkal, filterClasses, filterDeptSlot, filterMaxPrice, sortBy])

  const showFilters = !loading && rawTrains.length > 0

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
      setRawTrains(data.data ?? [])
      setTotal(data.meta?.total ?? (data.data ?? []).length)
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
      <div className="py-6 px-4" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #312e81 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
            <Train className="w-6 h-6" /> Train Tickets
          </h1>
          <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <CitySearch label="FROM" value={origin} onChange={setOrigin} focusColor="blue" />
            </div>
            <div className="flex-1 min-w-40">
              <CitySearch label="TO" value={destination} onChange={setDestination} focusColor="blue" />
            </div>
            <DatePickerInput
              label="DATE"
              value={date}
              min={today}
              onChange={setDate}
              accentColor="blue"
              className="flex-1 min-w-36"
            />
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
              className="flex items-center gap-2 bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition">
              <Search className="w-4 h-4" /> Search
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Filters */}
        {showFilters && (
        <div className="w-60 shrink-0">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm"><Filter className="w-4 h-4" /> Filters</h3>
              {(filterTatkal || filterClasses.length > 0 || filterDeptSlot || filterMaxPrice > 0) && (
                <button onClick={() => { setFilterTatkal(false); setFilterClasses([]); setFilterDeptSlot(''); setFilterMaxPrice(0) }}
                  className="text-xs text-blue-600 font-semibold flex items-center gap-0.5 hover:text-red-500"><X className="w-3 h-3" />Clear</button>
              )}
            </div>

            {/* Sort tabs */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sort By</p>
              <div className="grid grid-cols-3 gap-1">
                {([['departure', '⏰', 'Earliest'], ['duration', '⚡', 'Fastest'], ['price', '₹', 'Cheapest']] as [typeof sortBy, string, string][]).map(([k, icon, label]) => (
                  <button key={k} onClick={() => setSortBy(k)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${sortBy === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                    <span className="text-sm">{icon}</span><span className="mt-0.5 leading-tight text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Departure time slots */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Departure Time</p>
              <div className="grid grid-cols-2 gap-1">
                {[['night','🌙','Before 6 AM'],['morning','🌅','6 AM–12 PM'],['afternoon','☀️','12 PM–6 PM'],['evening','🌆','After 6 PM']].map(([k, icon, lbl]) => (
                  <button key={k} onClick={() => setFilterDeptSlot(s => s === k ? '' : k)}
                    className={`flex flex-col items-center py-2 rounded-lg border text-xs font-medium transition-all ${filterDeptSlot === k ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-blue-300'}`}>
                    <span>{icon}</span><span className="mt-0.5 text-center leading-tight">{lbl}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular filters */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Popular Filters</p>
              <label className="flex items-center gap-2 cursor-pointer py-0.5">
                <input type="checkbox" checked={filterTatkal} onChange={e => setFilterTatkal(e.target.checked)} className="w-4 h-4 accent-blue-700 shrink-0" />
                <span className="text-sm text-gray-700">Tatkal only</span>
              </label>
            </div>

            {/* Train class */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Train Class</p>
              <div className="space-y-2">
                {['SL', '3A', '2A', '1A', 'CC'].map(cls => (
                  <label key={cls} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input type="checkbox" checked={filterClasses.includes(cls)}
                      onChange={e => setFilterClasses(prev => e.target.checked ? [...prev, cls] : prev.filter(c => c !== cls))}
                      className="w-4 h-4 accent-blue-700 shrink-0" />
                    <span className="text-sm text-gray-700">{CLASSES.find(c => c.code === cls)?.label ?? cls}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Max price */}
            <div className="px-4 py-3 border-t border-gray-100 pb-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Max Price (₹)</p>
              <input type="number" value={filterMaxPrice || ''} placeholder="e.g. 1200"
                onChange={e => setFilterMaxPrice(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        )}

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
                            {train.intermediateStops && (
                              <p className="text-xs text-blue-500 mt-1 flex items-center justify-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" />via {train.intermediateStops}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">{formatTime(train.arrivalTime)}</p>
                            <p className="text-xs text-gray-500">{destination}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Class grid */}
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 items-stretch">
                      {Object.entries(train.classes).map(([cls, info]) => (
                        <div key={cls} className="border border-gray-200 rounded-lg p-2 text-center flex flex-col">
                          <p className="text-xs font-bold text-gray-700">{cls}</p>
                          <p className="text-sm font-bold text-gray-900 mt-0.5">₹{info.price.toLocaleString()}</p>
                          <p className={`text-xs mt-0.5 px-1.5 py-0.5 rounded-full inline-block font-medium ${availabilityColor(info.availability)}`}>
                            {info.availability}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center justify-center gap-0.5 min-h-[1rem]">
                            {info.availability === 'AVAILABLE' && info.availableSeats > 0 && (
                              <><Users className="w-3 h-3" />{info.availableSeats} seats</>
                            )}
                          </p>
                          <div className="mt-auto pt-1.5">
                            {info.availability !== 'REGRET' ? (
                              <button
                                onClick={() => navigate('/trains/book', {
                                  state: { train, classInfo: info, className: cls, passengers }
                                })}
                                className="w-full bg-blue-700 text-white text-xs py-1 rounded-md hover:bg-blue-800 transition font-semibold"
                              >
                                BOOK
                              </button>
                            ) : (
                              <div className="w-full py-1" />
                            )}
                          </div>
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
