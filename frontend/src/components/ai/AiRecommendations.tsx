import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, MapPin, Plane, Loader2, RefreshCw } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'

interface Recommendation {
  city: string
  tagline: string
  reason: string
  bestFor: string
  flightCode: string
}

const CITY_IMAGES: Record<string, string> = {
  Goa:       'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400&h=220&fit=crop',
  Jaipur:    'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&h=220&fit=crop',
  Mumbai:    'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&h=220&fit=crop',
  Delhi:     'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=220&fit=crop',
  Bangalore: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=220&fit=crop',
  Hyderabad: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=220&fit=crop',
  Chennai:   'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=400&h=220&fit=crop',
  Kolkata:   'https://images.unsplash.com/photo-1558431382-27e303142255?w=400&h=220&fit=crop',
  Kochi:     'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=220&fit=crop',
  Lucknow:   'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400&h=220&fit=crop',
  Pune:      'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?w=400&h=220&fit=crop',
  Ahmedabad: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?w=400&h=220&fit=crop',
}

function getImage(city: string): string {
  return CITY_IMAGES[city] ?? `https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=220&fit=crop`
}

const BEST_FOR_COLOR: Record<string, string> = {
  Beaches:    'bg-blue-100 text-blue-700',
  Culture:    'bg-amber-100 text-amber-700',
  Food:       'bg-red-100 text-red-700',
  Adventure:  'bg-green-100 text-green-700',
  Heritage:   'bg-purple-100 text-purple-700',
  Nightlife:  'bg-pink-100 text-pink-700',
  Nature:     'bg-emerald-100 text-emerald-700',
  Shopping:   'bg-orange-100 text-orange-700',
}

function getBestForColor(tag: string): string {
  for (const [key, color] of Object.entries(BEST_FOR_COLOR)) {
    if (tag.includes(key)) return color
  }
  return 'bg-gray-100 text-gray-700'
}

interface Props {
  bookingHistory?: string[]
}

export function AiRecommendations({ bookingHistory = [] }: Props) {
  const [recs, setRecs] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const fetchRecs = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await api.post<Recommendation[]>(endpoints.ai.recommendations, {
        bookingHistory,
      })
      const data = res.data as unknown as Recommendation[]
      if (Array.isArray(data) && data.length > 0) setRecs(data)
      else setError(true)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRecs() }, [])

  const handleBook = (rec: Recommendation) => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 7)
    const date = tomorrow.toISOString().split('T')[0]
    navigate(`/flights?destination=${rec.flightCode}&departureDate=${date}`)
  }

  if (error) return null

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            AI Recommended For You
          </h2>
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900 dark:text-purple-300">
            Powered by Claude
          </span>
        </div>
        {!loading && (
          <button
            onClick={fetchRecs}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-12 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
          <span className="text-sm">AI is personalising your recommendations…</span>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recs.map((rec) => (
            <div
              key={rec.city}
              className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Image */}
              <div className="relative h-36 overflow-hidden">
                <img
                  src={getImage(rec.city)}
                  alt={rec.city}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-3">
                  <p className="text-lg font-bold text-white leading-none">{rec.city}</p>
                  <p className="text-xs text-white/80">{rec.tagline}</p>
                </div>
                <span className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${getBestForColor(rec.bestFor)}`}>
                  {rec.bestFor}
                </span>
              </div>

              {/* Content */}
              <div className="p-3">
                <div className="flex items-start gap-1.5 mb-3">
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-purple-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{rec.reason}</p>
                </div>
                <button
                  onClick={() => handleBook(rec)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                >
                  <Plane className="h-3.5 w-3.5" />
                  Explore Flights
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
