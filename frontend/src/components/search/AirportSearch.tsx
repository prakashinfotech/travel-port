import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'
import { searchAirports, type Airport } from '@/data/airports'

interface AirportSearchProps {
  label: string
  placeholder?: string
  value: string
  onChange: (code: string, city: string) => void
  className?: string
}

export function AirportSearch({ label, placeholder, value, onChange, className = '' }: AirportSearchProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Airport[]>([])
  const [open, setOpen] = useState(false)
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
    const results = searchAirports(q)
    setSuggestions(results)
    setOpen(results.length > 0)
  }

  const handleSelect = (airport: Airport) => {
    setQuery(`${airport.city} (${airport.code})`)
    onChange(airport.code, airport.city)
    setOpen(false)
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <div className="flex items-center gap-2 border-b-2 border-gray-300 focus-within:border-blue-600 pb-1">
        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => query && setOpen(suggestions.length > 0)}
          placeholder={placeholder ?? 'City or Airport'}
          className="w-full bg-transparent text-gray-900 text-sm font-medium placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-72 rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
          {suggestions.map(airport => (
            <button
              key={airport.code}
              type="button"
              onClick={() => handleSelect(airport)}
              className="w-full flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 shrink-0">
                <span className="text-xs font-bold text-blue-700">{airport.code}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{airport.city}</p>
                <p className="text-xs text-gray-400 leading-tight">{airport.name}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
