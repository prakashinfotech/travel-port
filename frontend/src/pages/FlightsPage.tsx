import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal } from 'lucide-react'
import type { FlightDto } from '@/types'
import { flightService } from '@/services/flightService'
import { FlightCard } from '@/components/flights/FlightCard'
import { FlightCardSkeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

type SortKey = 'price_asc' | 'price_desc' | 'duration_asc' | 'departure_asc'

const SORT_OPTIONS = [
  { value: 'price_asc',     label: 'Price: Low to High' },
  { value: 'price_desc',    label: 'Price: High to Low' },
  { value: 'duration_asc',  label: 'Duration: Shortest' },
  { value: 'departure_asc', label: 'Departure: Earliest' },
]

export default function FlightsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Search form state
  const [origin,        setOrigin]        = useState(searchParams.get('origin')        ?? '')
  const [destination,   setDestination]   = useState(searchParams.get('destination')   ?? '')
  const [departureDate, setDepartureDate] = useState(searchParams.get('departureDate') ?? '')
  const [passengers,    setPassengers]    = useState(Number(searchParams.get('passengers') ?? 1))

  // Results + loading
  const [flights,  setFlights]  = useState<FlightDto[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Filters (client-side)
  const [maxPrice, setMaxPrice] = useState<number>(0)
  const [airline,  setAirline]  = useState('')
  const [sort,     setSort]     = useState<SortKey>('price_asc')

  const fetchFlights = async () => {
    if (!origin || !destination || !departureDate) return
    setLoading(true)
    setError(null)
    try {
      const res = await flightService.search({ origin, destination, departureDate, passengers, pageSize: 50 })
      setFlights(res.data ?? [])
      if (res.data?.length) {
        setMaxPrice(Math.max(...res.data.map(f => f.price)) + 1)
      }
    } catch {
      setError('Failed to fetch flights. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFlights() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const airlines = useMemo(() => [...new Set(flights.map(f => f.airline))], [flights])

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
        default:              return 0
      }
    })
    return list
  }, [flights, airline, maxPrice, sort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams({ origin, destination, departureDate, passengers: String(passengers) })
    navigate(`/flights?${params}`, { replace: true })
    fetchFlights()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-primary-700 py-6 px-4">
        <form onSubmit={handleSearch} className="mx-auto max-w-5xl flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[120px]">
            <Input label="" placeholder="From" value={origin} onChange={e => setOrigin(e.target.value)} className="bg-white" />
          </div>
          <div className="flex-1 min-w-[120px]">
            <Input label="" placeholder="To" value={destination} onChange={e => setDestination(e.target.value)} className="bg-white" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Input label="" type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="bg-white" />
          </div>
          <div className="w-24">
            <Input label="" type="number" min={1} max={9} value={passengers} onChange={e => setPassengers(Number(e.target.value))} className="bg-white" />
          </div>
          <Button type="submit" variant="secondary" loading={loading}>
            <Search className="h-4 w-4" /> Search
          </Button>
        </form>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 flex gap-6">
        {/* Filters sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 sticky top-20">
            <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
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
                  {maxPrice > 0 ? `Up to ₹${maxPrice.toLocaleString('en-IN')}` : 'No limit'}
                </p>
                <input
                  type="range"
                  min={0}
                  max={flights.length ? Math.max(...flights.map(f => f.price)) : 100000}
                  step={500}
                  value={maxPrice || (flights.length ? Math.max(...flights.map(f => f.price)) : 100000)}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-primary-600"
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? 'Searching...' : `${filtered.length} flight${filtered.length !== 1 ? 's' : ''} found`}
            </p>
            <Select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              options={SORT_OPTIONS}
              className="w-48"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
          )}

          <div className="flex flex-col gap-3">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <FlightCardSkeleton key={i} />)
              : filtered.length === 0 && !loading
                ? (
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p className="text-lg font-medium">No flights found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                  </div>
                )
                : filtered.map(f => <FlightCard key={f.id} flight={f} />)
            }
          </div>
        </div>
      </div>
    </div>
  )
}
