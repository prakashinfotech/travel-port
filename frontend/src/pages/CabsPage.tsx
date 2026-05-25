import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Car, Clock, MapPin, Users, Filter, Star, Phone, Search, X } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { CabDto, ApiResponse } from '@/types'
import { CabCardSkeleton } from '@/components/ui/Skeleton'
import { DatePickerInput } from '@/components/ui/DatePickerInput'
import { CitySearch } from '@/components/search/CitySearch'

const TRIP_TYPES = [
  { value: 'OneWay',     label: 'One Way' },
  { value: 'RoundTrip', label: 'Round Trip' },
]

function formatDuration(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function localDatetimeValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultPickupTime(): string {
  const d = new Date()
  d.setHours(d.getHours() + 1, 0, 0, 0) // +1 hour, round to the hour
  return localDatetimeValue(d)
}

export default function CabsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [origin, setOrigin]       = useState(searchParams.get('origin') || '')
  const [destination, setDest]    = useState(searchParams.get('destination') || '')
  const [pickup, setPickup]       = useState(searchParams.get('pickup') || defaultPickupTime())
  const [tripType, setTripType]   = useState<'OneWay' | 'RoundTrip'>((searchParams.get('tripType') as 'OneWay' | 'RoundTrip') || 'OneWay')
  const [rawCabs, setRawCabs]     = useState<CabDto[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [searched, setSearched]   = useState(false)
  const [filterAc, setFilterAc]               = useState(false)
  const [filterCabType, setFilterCabType]     = useState('')
  const [filterProviders, setFilterProviders] = useState<string[]>([])
  const [filterMinRating, setFilterMinRating] = useState(0)
  const [filterMaxPrice, setFilterMaxPrice]   = useState(0)
  const [sortBy, setSortBy]                   = useState<'price' | 'duration' | 'rating'>('price')

  const cabs = useMemo(() => {
    let results = [...rawCabs]
    if (filterAc)               results = results.filter(c => c.acAvailable)
    if (filterCabType)          results = results.filter(c => c.cabType === filterCabType)
    if (filterProviders.length) results = results.filter(c => filterProviders.includes(c.provider))
    if (filterMinRating > 0)    results = results.filter(c => (c.driverRating ?? 0) >= filterMinRating)
    if (filterMaxPrice > 0)     results = results.filter(c => c.price <= filterMaxPrice)
    if (sortBy === 'duration')      results = results.sort((a, b) => a.estimatedDurationMinutes - b.estimatedDurationMinutes)
    else if (sortBy === 'rating')   results = results.sort((a, b) => (b.driverRating ?? 0) - (a.driverRating ?? 0))
    else                            results = results.sort((a, b) => a.price - b.price)
    return results
  }, [rawCabs, filterAc, filterCabType, filterProviders, filterMinRating, filterMaxPrice, sortBy])

  const showFilters = !loading && rawCabs.length > 0

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
      setRawCabs(data.data ?? [])
      setTotal(data.meta?.total ?? (data.data ?? []).length)
      setSearched(true)
    } catch {
      setError('Failed to search cabs. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero — cab search */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1600&q=80)', filter: 'saturate(1.8) brightness(0.8) contrast(1.15)' }} />
        <div className="absolute inset-0 bg-amber-950/72" />
        <div className="relative z-10 py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 text-white">
              <h1 className="text-3xl font-bold flex items-center gap-2 mb-1"><Car className="w-7 h-7" /> Cab Booking</h1>
              <p className="text-amber-200 text-sm">Safe, reliable cab rides across Indian cities</p>
            </div>
            <form onSubmit={e => { e.preventDefault(); search(); }}>
              <div className="rounded-2xl bg-white shadow-xl">
                <div className="flex flex-col divide-y divide-gray-100 lg:flex-row lg:items-stretch lg:divide-x lg:divide-y-0">
                  <div className="flex-1 px-4 py-4">
                    <CitySearch label="PICKUP FROM" placeholder="City, area or landmark" value={origin} onChange={setOrigin} focusColor="yellow" />
                  </div>
                  <div className="flex-1 px-4 py-4">
                    <CitySearch label="DROP TO" placeholder="City, area or landmark" value={destination} onChange={setDest} focusColor="yellow" />
                  </div>
                  <div className="px-4 py-4 lg:w-[230px]">
                    <DatePickerInput label="PICKUP DATE & TIME" type="datetime-local" value={pickup} min={localDatetimeValue(new Date())} onChange={setPickup} accentColor="yellow" />
                  </div>
                  <div className="px-4 py-4 lg:w-[160px]">
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">TRIP TYPE</label>
                    <select value={tripType} onChange={e => setTripType(e.target.value as 'OneWay' | 'RoundTrip')}
                      className="w-full border-b border-gray-200 py-1 text-sm font-medium text-gray-800 focus:outline-none focus:border-yellow-500 bg-transparent">
                      {TRIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="px-4 py-4 lg:flex lg:items-center lg:justify-center">
                    <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full px-10 py-3 font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-100 lg:w-auto" style={{ background: 'linear-gradient(90deg, #b45309, #fbbf24)' }}>
                      <Search className="h-5 w-5" /> Search
                    </button>
                  </div>
                </div>
              </div>
            </form>
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
              {(filterAc || filterCabType || filterProviders.length > 0 || filterMinRating > 0 || filterMaxPrice > 0) && (
                <button onClick={() => { setFilterAc(false); setFilterCabType(''); setFilterProviders([]); setFilterMinRating(0); setFilterMaxPrice(0) }}
                  className="text-xs text-yellow-600 font-semibold flex items-center gap-0.5 hover:text-red-500"><X className="w-3 h-3" />Clear</button>
              )}
            </div>

            {/* Sort tabs */}
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Sort By</p>
              <div className="grid grid-cols-3 gap-1">
                {([['price', '₹', 'Cheapest'], ['duration', '⚡', 'Fastest'], ['rating', '⭐', 'Top Rated']] as [typeof sortBy, string, string][]).map(([k, icon, label]) => (
                  <button key={k} onClick={() => setSortBy(k)}
                    className={`flex flex-col items-center py-2 px-1 rounded-lg border text-xs font-semibold transition-all ${sortBy === k ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-500 hover:border-yellow-300'}`}>
                    <span className="text-sm">{icon}</span><span className="mt-0.5 leading-tight text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Popular filters */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Popular Filters</p>
              <label className="flex items-center gap-2 cursor-pointer py-0.5">
                <input type="checkbox" checked={filterAc} onChange={e => setFilterAc(e.target.checked)} className="w-4 h-4 accent-yellow-600 shrink-0" />
                <span className="text-sm text-gray-700">AC only</span>
              </label>
            </div>

            {/* Cab type cards */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Cab Type</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[['Mini', '🛺', '4 seats'], ['Sedan', '🚗', '4 seats'], ['Prime', '🚙', '4 seats'], ['SUV', '🚐', '6 seats']].map(([type, icon, cap]) => (
                  <button key={type} onClick={() => setFilterCabType(t => t === type ? '' : type)}
                    className={`flex flex-col items-center py-2.5 rounded-xl border text-xs font-semibold transition-all ${filterCabType === type ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-500 hover:border-yellow-300'}`}>
                    <span className="text-xl mb-0.5">{icon}</span>
                    <span>{type}</span>
                    <span className="text-gray-400 font-normal">{cap}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Provider checkboxes */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Provider</p>
              <div className="space-y-2">
                {['Ola', 'Uber', 'Meru', 'Zoom'].map(p => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input type="checkbox" checked={filterProviders.includes(p)}
                      onChange={e => setFilterProviders(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))}
                      className="w-4 h-4 accent-yellow-600 shrink-0" />
                    <span className="text-sm text-gray-700">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Min driver rating */}
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Min Driver Rating</p>
              <div className="flex gap-1">
                {[3, 3.5, 4, 4.5].map(r => (
                  <button key={r} onClick={() => setFilterMinRating(v => v === r ? 0 : r)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-0.5 ${filterMinRating === r ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-500 hover:border-yellow-300'}`}>
                    <Star className="w-2.5 h-2.5 fill-current" />{r}+
                  </button>
                ))}
              </div>
            </div>

            {/* Max price */}
            <div className="px-4 py-3 border-t border-gray-100 pb-4">
              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Max Price (₹)</p>
              <input type="number" value={filterMaxPrice || ''} placeholder="e.g. 2000"
                onChange={e => setFilterMaxPrice(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500" />
            </div>
          </div>
        </div>
        )}

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
                {cabs.map(cab => {
                  const isRoundTrip   = tripType === 'RoundTrip'
                  const displayPrice  = isRoundTrip ? cab.price * 2 : cab.price
                  return (
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
                            {isRoundTrip && <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold">Round Trip</span>}
                          </div>
                          <p className="text-sm text-gray-600">{cab.carModel}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {cab.capacity} seats
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {isRoundTrip ? `${cab.estimatedDistanceKm * 2} km` : `${cab.estimatedDistanceKm} km`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {isRoundTrip ? formatDuration(cab.estimatedDurationMinutes * 2) : formatDuration(cab.estimatedDurationMinutes)}
                            </span>
                            {cab.driverRating && (
                              <span className="flex items-center gap-1 text-amber-600 font-semibold">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {cab.driverRating.toFixed(1)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                            <span>₹{cab.pricePerKm}/km · Driver included{isRoundTrip ? ' · both legs' : ''}</span>
                            {cab.companyPhone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />{cab.companyPhone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-gray-800">₹{displayPrice.toLocaleString()}</p>
                        {isRoundTrip
                          ? <p className="text-xs text-gray-500 mb-2">round trip · <span className="text-gray-400">₹{cab.price.toLocaleString()} × 2</span></p>
                          : <p className="text-xs text-gray-500 mb-2">estimated total</p>
                        }
                        <button
                          onClick={() => navigate('/cabs/book', {
                            state: { cab: { ...cab, price: displayPrice }, pickupTime: pickup, origin, destination, tripType }
                          })}
                          className="bg-yellow-500 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 transition"
                        >
                          BOOK CAB
                        </button>
                      </div>
                    </div>
                  </div>
                  )
                })}
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
