import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { searchCities, POPULAR_CITIES, type City } from '@/data/cities'

interface CitySearchProps {
  label: string
  placeholder?: string
  value: string
  onChange: (city: string) => void
  focusColor?: 'blue' | 'green' | 'indigo' | 'yellow' | 'orange'
}

const FOCUS_BORDER: Record<string, string> = {
  blue:   'focus-within:border-blue-600',
  green:  'focus-within:border-green-600',
  indigo: 'focus-within:border-indigo-600',
  yellow: 'focus-within:border-yellow-500',
  orange: 'focus-within:border-orange-500',
}

const HOVER_BG: Record<string, string> = {
  blue:   'hover:bg-blue-50',
  green:  'hover:bg-green-50',
  indigo: 'hover:bg-indigo-50',
  yellow: 'hover:bg-yellow-50',
  orange: 'hover:bg-orange-50',
}

const BADGE_CLS: Record<string, string> = {
  blue:   'bg-blue-100 text-blue-700',
  green:  'bg-green-100 text-green-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
}

export function CitySearch({ label, placeholder, value, onChange, focusColor = 'blue' }: CitySearchProps) {
  const [query, setQuery]           = useState(value)
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [open, setOpen]             = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleInput = (q: string) => {
    setQuery(q)
    setSuggestions(searchCities(q))
    setOpen(true)
    if (!q.trim()) onChange('')
  }

  const handleFocus = () => {
    setSuggestions(query.trim() ? searchCities(query) : POPULAR_CITIES)
    setOpen(true)
  }

  const handleSelect = (city: City) => {
    setQuery(city.name)
    onChange(city.name)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <div className={`flex items-center gap-2 border-b-2 border-gray-300 pb-1 ${FOCUS_BORDER[focusColor]}`}>
        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={handleFocus}
          placeholder={placeholder ?? 'Enter city'}
          className="w-full bg-transparent text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
          {!query.trim() && (
            <p className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Popular Cities</p>
          )}
          {suggestions.map(city => (
            <button
              key={city.name}
              type="button"
              onClick={() => handleSelect(city)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${HOVER_BG[focusColor]}`}
            >
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${BADGE_CLS[focusColor]}`}>
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{city.name}</p>
                <p className="text-xs text-gray-400">{city.state}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
