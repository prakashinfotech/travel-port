import { useRef } from 'react'
import { CalendarDays } from 'lucide-react'

interface DatePickerInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  min?: string
  type?: 'date' | 'datetime-local'
  accentColor?: 'blue' | 'green' | 'yellow' | 'orange' | 'indigo'
  variant?: 'box' | 'underline'
  className?: string
}

const THEME: Record<string, { border: string; bg: string; icon: string; txt: string }> = {
  blue:   { border: 'border-blue-400',   bg: 'bg-blue-50',   icon: 'text-blue-500',   txt: 'text-blue-700'   },
  green:  { border: 'border-green-500',  bg: 'bg-green-50',  icon: 'text-green-600',  txt: 'text-green-700'  },
  yellow: { border: 'border-yellow-400', bg: 'bg-yellow-50', icon: 'text-yellow-600', txt: 'text-yellow-700' },
  orange: { border: 'border-orange-400', bg: 'bg-orange-50', icon: 'text-orange-500', txt: 'text-orange-700' },
  indigo: { border: 'border-indigo-400', bg: 'bg-indigo-50', icon: 'text-indigo-500', txt: 'text-indigo-700' },
}

function formatDisplay(value: string, type: string): string | null {
  if (!value) return null
  try {
    const d = type === 'datetime-local' ? new Date(value) : new Date(value + 'T00:00:00')
    if (type === 'datetime-local') {
      return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
    }
    return d.toLocaleDateString('en-IN', {
      weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
    })
  } catch { return value }
}

export function DatePickerInput({
  label, value, onChange, min, type = 'date', accentColor = 'blue', variant = 'box', className = '',
}: DatePickerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const t = THEME[accentColor] ?? THEME.blue
  const display = formatDisplay(value, type)
  const hasValue = !!value

  const openPicker = () => {
    if (!inputRef.current) return
    try { inputRef.current.showPicker() } catch { inputRef.current.focus() }
  }

  const hiddenInput = (
    <input
      ref={inputRef}
      type={type}
      value={value}
      min={min}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => e.stopPropagation()}
      className="sr-only"
      tabIndex={-1}
      aria-hidden
    />
  )

  if (variant === 'underline') {
    return (
      <div className={className}>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
        <div
          role="button"
          tabIndex={0}
          onClick={openPicker}
          onKeyDown={e => e.key === 'Enter' && openPicker()}
          className={`flex items-center gap-2 border-b-2 pb-1 cursor-pointer select-none transition-colors ${hasValue ? 'border-blue-600' : 'border-gray-300 hover:border-blue-400'}`}
        >
          <CalendarDays className={`h-4 w-4 shrink-0 ${hasValue ? 'text-blue-600' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium flex-1 leading-tight ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>
            {display ?? (type === 'datetime-local' ? 'Select date & time' : 'Select date')}
          </span>
          {hiddenInput}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <label className="block text-xs text-gray-500 mb-1 font-medium">{label}</label>
      <div
        role="button"
        tabIndex={0}
        onClick={openPicker}
        onKeyDown={e => e.key === 'Enter' && openPicker()}
        className={[
          'relative flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2 transition-all select-none',
          hasValue ? `${t.border} ${t.bg}` : 'border-gray-200 bg-white hover:border-gray-300',
        ].join(' ')}
      >
        <CalendarDays className={`h-4 w-4 shrink-0 ${hasValue ? t.icon : 'text-gray-400'}`} />
        <span className={`text-sm font-medium flex-1 leading-tight ${hasValue ? t.txt : 'text-gray-400'}`}>
          {display ?? (type === 'datetime-local' ? 'Select date & time' : 'Select date')}
        </span>
        {hiddenInput}
      </div>
    </div>
  )
}
