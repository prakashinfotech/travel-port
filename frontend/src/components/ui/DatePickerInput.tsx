import { Calendar, Clock } from 'lucide-react'

type AccentColor = 'green' | 'blue' | 'yellow' | 'orange'

interface Props {
  label: string
  type?: 'date' | 'datetime-local'
  value: string
  onChange: (val: string) => void
  min?: string
  max?: string
  accentColor?: AccentColor
  className?: string
}

const accent: Record<AccentColor, { border: string; ring: string; icon: string }> = {
  green:  { border: 'focus-within:border-green-500',  ring: 'focus-within:ring-green-100',  icon: 'text-green-600'  },
  blue:   { border: 'focus-within:border-blue-600',   ring: 'focus-within:ring-blue-100',   icon: 'text-blue-600'   },
  yellow: { border: 'focus-within:border-yellow-500', ring: 'focus-within:ring-yellow-100', icon: 'text-yellow-600' },
  orange: { border: 'focus-within:border-orange-500', ring: 'focus-within:ring-orange-100', icon: 'text-orange-500' },
}

function formatDisplay(val: string, type: 'date' | 'datetime-local'): string {
  if (!val) return 'Select…'
  try {
    if (type === 'date') {
      const d = new Date(val + 'T00:00:00')
      return d.toLocaleDateString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
      })
    }
    const d = new Date(val)
    return d.toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short',
    }) + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  } catch {
    return val
  }
}

export function DatePickerInput({
  label, type = 'date', value, onChange, min, max, accentColor = 'orange', className = '',
}: Props) {
  const { border, ring, icon } = accent[accentColor]
  const Icon = type === 'datetime-local' ? Clock : Calendar

  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-widest">
        {label}
      </label>
      <div
        className={`
          relative border-2 border-gray-200 rounded-xl bg-white
          focus-within:ring-2 ${border} ${ring}
          hover:border-gray-300 transition-all duration-150 cursor-pointer
        `}
      >
        {/* Styled display — pointer-events-none so clicks pass through to the input */}
        <div className="flex items-center gap-2.5 px-3 py-2.5 pointer-events-none select-none">
          <Icon className={`w-4 h-4 shrink-0 ${icon}`} />
          <span className="text-sm font-semibold text-gray-800 truncate leading-none">
            {formatDisplay(value, type)}
          </span>
        </div>
        {/* Native input stretched over the whole div, invisible */}
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  )
}
