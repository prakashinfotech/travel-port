import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Car, Clock, MapPin, Users, Filter, Star, Phone, Search } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { CabDto, ApiResponse } from '@/types'
import { CabCardSkeleton } from '@/components/ui/Skeleton'
import { DatePickerInput } from '@/components/ui/DatePickerInput'

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Ahmedabad', 'Goa', 'Pune', 'Jaipur', 'Kolkata']
const TRIP_TYPES = [
  { value: 'OneWay',     label: 'One Way' },
  { value: 'RoundTrip', label: 'Round Trip' },
  { value: 'Outstation', label: 'Outstation' },
  { value: 'Local',     label: 'Local' },
]

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function CabsPage() {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30)
  const defaultPickup = now.toISOString().slice(0, 16)

  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [origin, setOrigin]       = useState(searchParams.get('origin') || 'Mumbai')
  const [destination, setDest]    = useState(searchParams.get('destination') || 'Pune')
  const [pickup, setPickup]       = useState(searchParams.get('pickup') || defaultPickup)
  const [tripType, setTripType]   = useState<string>(searchParams.get('tripType') || 'OneWay')
  const [cabs, setCabs]           = useState<CabDto[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [searched, setSearched]   = useState(false)
  const [filterAc, setFilterAc]         = useState(false)
  const [filterCabType, setFilterCabType] = useState('')
  const [filterProvider, setFilterProvider] = useState('')
  const [sortBy, setSortBy]       = useState<'price' | 'duration'>('price')

  useEffect(() => {
    if (searchParams.get('origin')) search()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const search = async () => {
    if (!origin || !destination || !pickup) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get<ApiResponse<CabDto[]>>(endpoints.cabs.search, {
        params: { origin, destination, pickupDateTime: pickup, tripType, pageSize: 20 }
      })
      let results = data.data ?? []
      if (filterAc) results = results.filter(c => c.acAvailable)
      if (filterCabType) results = results.filter(c => c.cabType === filterCabType)
      if (filterProvider) results = results.filter(c => c.provider === filterProvider)
      if (sortBy === 'duration') results = results.sort((a, b) => a.estimatedDurationMinutes - b.estimatedDurationMinutes)
      else results = results.sort((a, b) => a.price - b.price)
      setCabs(results)
      setTotal(data.meta?.total ?? results.length)
      setSearched(true)
    } catch {
      setError('Failed to search cabs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="py-6 px-4" style={{ background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
            <Car className="w-6 h-6" /> Cab Booking
          </h1>
          <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">PICKUP FROM</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="block text-xs text-gray-500 mb-1">DROP TO</label>
              <select value={destination} onChange={e => setDest(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500">
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <DatePickerInput
              label="PICKUP DATE & TIME"
              type="datetime-local"
              value={pickup}
              min={new Date().toISOString().slice(0, 16)}
              onChange={setPickup}
              accentColor="yellow"
              className="flex-1 min-w-44"
            />
            <div className="flex-1 min-w-36">
              <label className="block text-xs text-gray-500 mb-1">TRIP TYPE</label>
              <select value={tripType} onChange={e => setTripType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500">
                {TRIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <button onClick={search}
              className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-yellow-600 transition">
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
                <input type="checkbox" checked={filterAc} onChange={e => setFilterAc(e.target.checked)} className="accent-yellow-600" />
                AC only
              </label>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Cab Type</label>
              <select value={filterCabType} onChange={e => setFilterCabType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="">All Types</option>
                <option value="Mini">Mini</option>
                <option value="Sedan">Sedan</option>
                <option value="Prime">Prime</option>
                <option value="SUV">SUV</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Provider</label>
              <select value={filterProvider} onChange={e => setFilterProvider(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="">All Providers</option>
                <option value="Ola">Ola</option>
                <option value="Uber">Uber</option>
                <option value="Meru">Meru</option>
                <option value="Zoom">Zoom</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Sort by</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                <option value="price">Price</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <CabCardSkeleton key={i} />)}
            </div>
          )}

          {error && <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>}

          {!loading && searched && cabs.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No cabs found</p>
              <p className="text-sm">Try a different route or time</p>
            </div>
          )}

          {!loading && cabs.length > 0 && (
            <>
              <p className="text-sm text-gray-500 mb-3">{total} cabs available · {origin} → {destination}</p>
              <div className="space-y-3">
                {cabs.map(cab => (
                  <div key={cab.id} className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-20 h-14 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                          <Car className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-gray-800">{cab.provider}</span>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cab.cabType}</span>
                            {cab.acAvailable && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">AC</span>}
                          </div>
                          <p className="text-sm text-gray-600">{cab.carModel}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {cab.capacity} seats
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {cab.estimatedDistanceKm} km
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatDuration(cab.estimatedDurationMinutes)}
                            </span>
                            {cab.driverRating && (
                              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {cab.driverRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>₹{cab.pricePerKm}/km · Driver included</span>
                            {cab.companyPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />{cab.companyPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-gray-800">₹{cab.price.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mb-2">estimated total</p>
                        <button
                          onClick={() => navigate('/cabs/book', {
                            state: { cab, pickupTime: pickup, origin, destination }
                          })}
                          className="bg-yellow-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition"
                        >
                          BOOK CAB
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
              <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Search for cabs between cities</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
