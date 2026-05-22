import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Search, Loader2 } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'

interface NlSearchResult {
  type: 'flight' | 'hotel' | 'bus' | 'train' | 'cab'
  origin?: string
  originCity?: string
  destination?: string
  destinationCity?: string
  date?: string
  returnDate?: string
  passengers?: number
  hotelCity?: string
  checkIn?: string
  checkOut?: string
  guests?: number
}

const EXAMPLES = [
  'Flights from Mumbai to Goa this weekend',
  'Hotels in Jaipur for 2 nights next week',
  'Bus from Delhi to Agra tomorrow for 2',
  'Train Mumbai to Delhi on 28 May',
]

export function NaturalLanguageSearch() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exampleIdx, setExampleIdx] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSearch = async (q: string) => {
    const text = q.trim()
    if (!text) return

    setLoading(true)
    setError('')

    try {
      const res = await api.post<NlSearchResult>(endpoints.ai.nlSearch, { query: text })
      const data = res.data as unknown as NlSearchResult

      const params = new URLSearchParams()

      switch (data.type) {
        case 'flight': {
          if (data.origin) params.set('origin', data.origin)
          if (data.destination) params.set('destination', data.destination)
          if (data.date) params.set('departureDate', data.date)
          if (data.returnDate) params.set('returnDate', data.returnDate)
          if (data.passengers) params.set('passengers', String(data.passengers))
          navigate(`/flights?${params}`)
          break
        }
        case 'hotel': {
          const city = data.hotelCity || data.destinationCity || data.destination || ''
          if (city) params.set('city', city)
          if (data.checkIn || data.date) params.set('checkIn', data.checkIn || data.date || '')
          if (data.checkOut || data.returnDate) params.set('checkOut', data.checkOut || data.returnDate || '')
          if (data.guests) params.set('adults', String(data.guests))
          navigate(`/hotels?${params}`)
          break
        }
        case 'bus': {
          if (data.originCity || data.origin) params.set('origin', data.originCity || data.origin || '')
          if (data.destinationCity || data.destination) params.set('destination', data.destinationCity || data.destination || '')
          if (data.date) params.set('date', data.date)
          if (data.passengers) params.set('passengers', String(data.passengers))
          navigate(`/buses?${params}`)
          break
        }
        case 'train': {
          if (data.originCity || data.origin) params.set('origin', data.originCity || data.origin || '')
          if (data.destinationCity || data.destination) params.set('destination', data.destinationCity || data.destination || '')
          if (data.date) params.set('date', data.date)
          if (data.passengers) params.set('passengers', String(data.passengers))
          navigate(`/trains?${params}`)
          break
        }
        case 'cab': {
          if (data.originCity || data.origin) params.set('origin', data.originCity || data.origin || '')
          if (data.destinationCity || data.destination) params.set('destination', data.destinationCity || data.destination || '')
          navigate(`/cabs?${params}`)
          break
        }
      }
    } catch {
      setError('Could not parse your search. Try being more specific, e.g. "Flights from Mumbai to Delhi tomorrow".')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const cycleExample = () => {
    const next = (exampleIdx + 1) % EXAMPLES.length
    setExampleIdx(next)
    setQuery(EXAMPLES[next])
    inputRef.current?.focus()
  }

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-yellow-300" />
        <span className="text-sm font-semibold text-white/90">AI Smart Search</span>
        <span className="text-xs text-white/60">— describe your trip in plain English</span>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-sm focus-within:ring-white/50 transition-all">
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setError('') }}
            placeholder={EXAMPLES[exampleIdx]}
            disabled={loading}
            className="flex-1 bg-transparent px-5 py-3.5 text-sm text-white placeholder-white/40 outline-none disabled:opacity-60"
          />
          <button
            type="button"
            onClick={cycleExample}
            className="px-3 text-xs text-white/50 hover:text-white/80 transition-colors whitespace-nowrap"
            title="Cycle example queries"
          >
            Try example
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 bg-yellow-400 px-5 py-3.5 text-sm font-bold text-gray-900 transition-colors hover:bg-yellow-300 disabled:opacity-50"
          >
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Search className="h-4 w-4" />}
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <p className="mt-2 text-xs text-red-300">{error}</p>
      )}
    </div>
  )
}
