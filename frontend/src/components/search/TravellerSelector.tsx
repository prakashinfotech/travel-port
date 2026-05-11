import { useState, useRef, useEffect } from 'react'
import { Users, ChevronDown } from 'lucide-react'

export interface TravellerConfig {
  adults: number
  children: number
  infants: number
  cabinClass: 'Economy' | 'Business' | 'First'
}

interface TravellerSelectorProps {
  value: TravellerConfig
  onChange: (v: TravellerConfig) => void
}

const CLASS_LABELS: Record<string, string> = {
  Economy: 'Economy',
  Business: 'Business',
  First: 'First Class',
}

export function TravellerSelector({ value, onChange }: TravellerSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const total = value.adults + value.children + value.infants
  const label = `${total} Traveller${total !== 1 ? 's' : ''}, ${CLASS_LABELS[value.cabinClass]}`

  const set = (key: keyof TravellerConfig, delta: number) => {
    const next = { ...value }
    if (key === 'cabinClass') return
    const newVal = (next[key] as number) + delta
    if (key === 'adults' && newVal < 1) return
    if (key !== 'adults' && newVal < 0) return
    if (newVal > 9) return
    ;(next[key] as number) = newVal
    onChange(next)
  }

  const Counter = ({ label: lbl, sub, field }: { label: string; sub: string; field: 'adults' | 'children' | 'infants' }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{lbl}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set(field, -1)}
          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600 disabled:opacity-40"
          disabled={field === 'adults' ? value[field] <= 1 : value[field] <= 0}
        >
          −
        </button>
        <span className="w-5 text-center font-semibold text-gray-900">{value[field]}</span>
        <button
          type="button"
          onClick={() => set(field, 1)}
          className="h-8 w-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-blue-600 hover:text-blue-600"
          disabled={value[field] >= 9}
        >
          +
        </button>
      </div>
    </div>
  )

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Travellers & Class</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 border-b-2 border-gray-300 pb-1 w-full focus:outline-none focus:border-blue-600"
      >
        <Users className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="text-sm font-medium text-gray-900 flex-1 text-left truncate">{label}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 z-50 mt-2 w-72 rounded-xl bg-white shadow-2xl border border-gray-100 p-4">
          <Counter label="Adults" sub="12+ years" field="adults" />
          <Counter label="Children" sub="2–12 years" field="children" />
          <Counter label="Infants" sub="Under 2 years" field="infants" />

          <div className="mt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cabin Class</p>
            <div className="flex flex-col gap-1">
              {(['Economy', 'Business', 'First'] as const).map(cls => (
                <label key={cls} className="flex items-center gap-2 cursor-pointer py-1">
                  <input
                    type="radio"
                    name="cabinClass"
                    value={cls}
                    checked={value.cabinClass === cls}
                    onChange={() => onChange({ ...value, cabinClass: cls })}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-800">{CLASS_LABELS[cls]}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-4 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
