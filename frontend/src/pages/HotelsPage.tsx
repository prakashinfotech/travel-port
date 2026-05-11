import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search, SlidersHorizontal, Star, Home, ChevronRight, MapPin } from 'lucide-react'
import type { HotelDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { HotelCard } from '@/components/hotels/HotelCard'
import { HotelCardSkeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

type SortKey = 'price_asc' | 'price_desc' | 'rating_desc' | 'stars_desc'

const TODAY = new Date().toISOString().split('T')[0]

const SORT_OPTIONS = [
  { value: 'rating_desc', label: 'Top Rated' },
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'stars_desc',  label: 'Star Rating' },
]

export default function HotelsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [city,     setCity]     = useState(searchParams.get('city')    ?? '')
  const [checkIn,  setCheckIn]  = useState(searchParams.get('checkIn') ?? '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ?? '')
  const [guests,   setGuests]   = useState(Number(searchParams.get('guests') ?? 1))
  const [rooms,    setRooms]    = useState(Number(searchParams.get('rooms')  ?? 1))

  const [hotels,  setHotels]  = useState<HotelDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const [minStars, setMinStars] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [sort,     setSort]     = useState<SortKey>('rating_desc')

  const fetchHotels = async () => {
    if (!city) return
    setLoading(true)
    setError(null)
    try {
      const res = await hotelService.search({ city, checkIn, checkOut, guests, pageSize: 50 })
      setHotels(res.data ?? [])
    } catch {
      setError('Failed to fetch hotels. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHotels() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    let list = [...hotels]
    if (minStars) list = list.filter(h => h.starRating >= minStars)
    if (maxPrice) {
      list = list.filter(h => {
        const min = h.rooms.length ? Math.min(...h.rooms.map(r => r.pricePerNight)) : Infinity
        return min <= maxPrice
      })
    }
    list.sort((a, b) => {
      const aMin = a.rooms.length ? Math.min(...a.rooms.map(r => r.pricePerNight)) : 0
      const bMin = b.rooms.length ? Math.min(...b.rooms.map(r => r.pricePerNight)) : 0
      switch (sort) {
        case 'price_asc':   return aMin - bMin
        case 'price_desc':  return bMin - aMin
        case 'rating_desc': return b.reviewScore - a.reviewScore
        case 'stars_desc':  return b.starRating - a.starRating
        default:            return 0
      }
    })
    return list
  }, [hotels, minStars, maxPrice, sort])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/hotels?${new URLSearchParams({ city, checkIn, checkOut, guests: String(guests), rooms: String(rooms) })}`, { replace: true })
    fetchHotels()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-orange-600 py-5 px-4 shadow-md">
        <form onSubmit={handleSearch} className="mx-auto max-w-6xl">
          <div className="bg-white rounded-xl p-3 flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">City / Destination</label>
              <div className="flex items-center gap-2 border-b-2 border-gray-300 focus-within:border-orange-500 pb-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Where do you want to stay?"
                  className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="min-w-[130px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Check-in</label>
              <input
                type="date"
                value={checkIn}
                min={TODAY}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full text-sm font-medium text-gray-900 border-b-2 border-gray-300 focus:border-orange-500 focus:outline-none pb-1 bg-transparent"
                required
              />
            </div>

            <div className="min-w-[130px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Check-out</label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || TODAY}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full text-sm font-medium text-gray-900 border-b-2 border-gray-300 focus:border-orange-500 focus:outline-none pb-1 bg-transparent"
                required
              />
            </div>

            {/* Rooms */}
            <div className="min-w-[100px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rooms</label>
              <div className="flex items-center gap-2 border-b-2 border-gray-300 focus-within:border-orange-500 pb-1">
                <button type="button" onClick={() => setRooms(Math.max(1, rooms - 1))} className="text-gray-400 hover:text-orange-600 font-bold">−</button>
                <span className="text-sm font-semibold text-gray-900 w-4 text-center">{rooms}</span>
                <button type="button" onClick={() => setRooms(rooms + 1)} className="text-gray-400 hover:text-orange-600 font-bold">+</button>
              </div>
            </div>

            {/* Guests */}
            <div className="min-w-[100px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Guests</label>
              <div className="flex items-center gap-2 border-b-2 border-gray-300 focus-within:border-orange-500 pb-1">
                <button type="button" onClick={() => setGuests(Math.max(1, guests - 1))} className="text-gray-400 hover:text-orange-600 font-bold">−</button>
                <span className="text-sm font-semibold text-gray-900 w-4 text-center">{guests}</span>
                <button type="button" onClick={() => setGuests(guests + 1)} className="text-gray-400 hover:text-orange-600 font-bold">+</button>
              </div>
            </div>

            <Button type="submit" loading={loading} className="shrink-0 bg-orange-500 hover:bg-orange-600 border-orange-500">
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
          <span>Hotels</span>
          {city && (
            <><ChevronRight className="h-3 w-3" /><span className="text-gray-600 font-medium">{city}</span></>
          )}
        </nav>

        <div className="flex gap-5">
          {/* Filters */}
          <aside className="hidden lg:block w-56 flex-shrink-0">
            <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 sticky top-20">
              <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4 text-sm">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Min Star Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMinStars(minStars === s ? 0 : s)}
                        className={`p-0.5 rounded ${minStars >= s ? 'text-yellow-400' : 'text-gray-200'}`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Max Price / Night</label>
                  <Input
                    type="number"
                    placeholder="e.g. 5000"
                    value={maxPrice || ''}
                    onChange={e => setMaxPrice(Number(e.target.value))}
                  />
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setMinStars(0); setMaxPrice(0) }}>
                  Clear Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500">
                {loading ? 'Searching...' : `${filtered.length} hotel${filtered.length !== 1 ? 's' : ''} found${city ? ` in ${city}` : ''}`}
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

            <div className="flex flex-col gap-4">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => <HotelCardSkeleton key={i} />)
                : filtered.length === 0
                  ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
                      <p className="text-lg font-semibold">No hotels found</p>
                      <p className="text-sm mt-1">Try a different city or adjust filters</p>
                    </div>
                  )
                  : filtered.map(h => <HotelCard key={h.id} hotel={h} />)
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
