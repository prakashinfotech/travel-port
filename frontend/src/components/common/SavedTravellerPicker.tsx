import { useState } from 'react'
import { Users, ChevronDown, X } from 'lucide-react'
import { userService } from '@/services/userService'
import type { SavedTravellerDto } from '@/types'

interface Props {
  // react-hook-form setValue — called with firstName, lastName, email, phone
  onFill: (data: { firstName: string; lastName: string; email: string; phone: string }) => void
  accentColor?: 'blue' | 'green' | 'yellow' | 'orange'
}

const ring: Record<string, string> = {
  blue:   'focus:ring-blue-500',
  green:  'focus:ring-green-500',
  yellow: 'focus:ring-yellow-500',
  orange: 'focus:ring-orange-400',
}

const btnCls: Record<string, string> = {
  blue:   'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200',
  green:  'text-green-700 bg-green-50 hover:bg-green-100 border-green-200',
  yellow: 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 border-yellow-200',
  orange: 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200',
}

export function SavedTravellerPicker({ onFill, accentColor = 'blue' }: Props) {
  const [open, setOpen]             = useState(false)
  const [travellers, setTravellers] = useState<SavedTravellerDto[] | null>(null)
  const [loading, setLoading]       = useState(false)

  const handleOpen = () => {
    if (travellers !== null) { setOpen(true); return }
    setLoading(true)
    userService.getTravellers()
      .then(r => { setTravellers(r.data ?? []); setOpen(true) })
      .catch(() => { setTravellers([]); setOpen(true) })
      .finally(() => setLoading(false))
  }

  const select = (t: SavedTravellerDto) => {
    const parts = t.name.trim().split(' ')
    const firstName = parts[0] ?? ''
    const lastName  = parts.slice(1).join(' ') || parts[0]
    onFill({ firstName, lastName, email: t.email, phone: t.phone })
    setOpen(false)
  }

  return (
    <div className="relative mb-3">
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={`flex items-center gap-1.5 text-xs font-semibold border rounded-lg px-3 py-1.5 transition-colors ${btnCls[accentColor]} ${ring[accentColor]}`}
      >
        <Users size={13} />
        {loading ? 'Loading...' : 'Use saved traveller'}
        <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-semibold text-gray-600">Saved Travellers</span>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={13} /></button>
            </div>
            {!travellers || travellers.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <Users size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No saved travellers yet.</p>
                <p className="text-xs text-gray-400 mt-1">Add travellers in your Profile page.</p>
              </div>
            ) : (
              <div className="py-1 max-h-48 overflow-y-auto">
                {travellers.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => select(t)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.email} · {t.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
