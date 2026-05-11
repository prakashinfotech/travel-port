import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search, SlidersHorizontal, Home, ChevronRight, ArrowLeftRight } from 'lucide-react'
import type { FlightDto } from '@/types'
import { flightService } from '@/services/flightService'
import { FlightCard } from '@/components/flights/FlightCard'
import { FlightCardSkeleton } from '@/components/ui/Skeleton'
import { AirportSearch } from '@/components/search/AirportSearch'
import { TravellerSelector, type TravellerConfig } from '@/components/search/TravellerSelector'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

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

export default function FlightsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

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

  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [airline,  setAirline]  = useState('')
  const [sort,     setSort]     = useState<SortKey>('price_asc')

  const fetchFlights = async () => {
    if (!origin || !destination || !departureDate) return
    setLoading(true)
    setError(null)
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
      if (res.data?.length) {
        setMaxPrice(Math.max(...res.data.map(f => f.price)))
      }
    } catch {
      setError('Failed to fetch flights. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFlights() }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    return list
  }, [flights, airline, maxPrice, sort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const total = travellers.adults + travellers.children + travellers.infants
    const p = new URLSearchParams({ origin, destination, departureDate, passengers: String(total), cabinClass: travellers.cabinClass })
    if (tripType === 'roundtrip' && returnDate) p.set('returnDate', returnDate)
    navigate(`/flights?${p}`, { replace: true })
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
