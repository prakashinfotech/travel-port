import { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, Star } from 'lucide-react'
import type { HotelDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { HotelCard } from '@/components/hotels/HotelCard'
import { HotelCardSkeleton } from '@/components/ui/Skeleton'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'

type SortKey = 'price_asc' | 'price_desc' | 'rating_desc' | 'stars_desc'

const SORT_OPTIONS = [
  { value: 'price_asc',   label: 'Price: Low to High' },
  { value: 'price_desc',  label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Top Rated' },
  { value: 'stars_desc',  label: 'Star Rating' },
]

export default function HotelsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [city,     setCity]     = useState(searchParams.get('city')    ?? '')
  const [checkIn,  setCheckIn]  = useState(searchParams.get('checkIn') ?? '')
  const [checkOut, setCheckOut] = useState(searchParams.get('checkOut') ?? '')
  const [guests,   setGuests]   = useState(Number(searchParams.get('guests') ?? 1))

  const [hotels,  setHotels]  = useState<HotelDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Filters
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
    navigate(`/hotels?${new URLSearchParams({ city, checkIn, checkOut, guests: String(guests) })}`, { replace: true })
    fetchHotels()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search bar */}
      <div className="bg-primary-700 py-6 px-4">
        <form onSubmit={handleSearch} className="mx-auto max-w-5xl flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <Input label="" placeholder="City (e.g. Mumbai)" value={city} onChange={e => setCity(e.target.value)} className="bg-white" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Input label="" type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} className="bg-white" />
          </div>
          <div className="flex-1 min-w-[140px]">
            <Input label="" type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} className="bg-white" />
          </div>
          <div className="w-24">
            <Input label="" type="number" min={1} max={10} value={guests} onChange={e => setGuests(Number(e.target.value))} className="bg-white" />
          </div>
          <Button type="submit" variant="secondary" loading={loading}>
            <Search className="h-4 w-4" /> Search
          </Button>
        </form>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 flex gap-6">
        {/* Filters */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-5 sticky top-20">
            <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Min Star Rating</label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setMinStars(minStars === s ? 0 : s)}
                      className={`p-1 rounded ${minStars >= s ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      <Star className="h-5 w-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Max Price / Night</label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  value={maxPrice || ''}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="mt-1"
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {loading ? 'Searching...' : `${filtered.length} hotel${filtered.length !== 1 ? 's' : ''} found`}
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
                  <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <p className="text-lg font-medium">No hotels found</p>
                    <p className="text-sm mt-1">Try a different city or adjust filters</p>
                  </div>
                )
                : filtered.map(h => <HotelCard key={h.id} hotel={h} />)
            }
          </div>
        </div>
      </div>
    </div>
  )
}
