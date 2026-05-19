import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Plane } from 'lucide-react'
import { flightOperatorService } from '@/services/operatorService'
import type { OperatorFlightDto, CreateFlightRequest } from '@/types'

function formatDuration(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function FlightOperatorFlightsPage() {
  const [flights, setFlights] = useState<OperatorFlightDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editFlight, setEditFlight] = useState<OperatorFlightDto | null>(null)
  const [form, setForm] = useState<Partial<CreateFlightRequest & { isActive: boolean }>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    flightOperatorService.getFlights()
      .then(setFlights)
      .catch(() => setError('Failed to load flights.'))
      .finally(() => setLoading(false))
  }, [])

  const openAdd = () => { setEditFlight(null); setForm({}); setShowForm(true) }
  const openEdit = (f: OperatorFlightDto) => {
    setEditFlight(f)
    setForm({
      flightNumber: f.flightNumber,
      source: f.source,
      destination: f.destination,
      departureTime: f.departureTime.slice(0, 16),
      arrivalTime: f.arrivalTime.slice(0, 16),
      totalSeats: f.totalSeats,
      economyPrice: f.economyPrice,
      businessPrice: f.businessPrice,
      stops: f.stops,
      isActive: f.isActive,
    })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.flightNumber || !form.source || !form.destination || !form.departureTime || !form.arrivalTime || !form.totalSeats || !form.economyPrice) {
      setError('Please fill all required fields.'); return
    }
    setSaving(true); setError('')
    try {
      if (editFlight) {
        const updated = await flightOperatorService.updateFlight(editFlight.id, form)
        setFlights(fs => fs.map(f => f.id === updated.id ? updated : f))
      } else {
        const added = await flightOperatorService.addFlight(form as CreateFlightRequest)
        setFlights(fs => [added, ...fs])
      }
      setShowForm(false)
    } catch {
      setError('Failed to save flight.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this flight?')) return
    try {
      await flightOperatorService.deleteFlight(id)
      setFlights(fs => fs.filter(f => f.id !== id))
    } catch {
      setError('Failed to delete flight.')
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Flights</h1>
          <p className="text-sm text-gray-500 mt-1">{flights.length} flights managed</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add Flight
        </button>
      </div>

      {error && <div className="mb-4 bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">{editFlight ? 'Edit Flight' : 'Add New Flight'}</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['Flight Number', 'flightNumber', 'text', 'e.g. AI201'],
              ['Source (IATA)', 'source', 'text', 'e.g. BOM'],
              ['Destination (IATA)', 'destination', 'text', 'e.g. DEL'],
              ['Departure Time', 'departureTime', 'datetime-local', ''],
              ['Arrival Time', 'arrivalTime', 'datetime-local', ''],
              ['Total Seats', 'totalSeats', 'number', '180'],
              ['Economy Price (₹)', 'economyPrice', 'number', '3500'],
              ['Business Price (₹)', 'businessPrice', 'number', 'Optional'],
              ['Stops', 'stops', 'number', '0'],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input type={type} placeholder={placeholder}
                  value={(form as Record<string, unknown>)[key] as string ?? ''}
                  onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            {editFlight && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Active</label>
                <input type="checkbox" checked={form.isActive ?? true}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600" />
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : flights.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          <Plane className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No flights yet</p>
          <p className="text-sm">Add your first flight to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flights.map(f => (
            <div key={f.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                <Plane className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">{f.flightNumber}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{f.source} → {f.destination}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {f.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {new Date(f.departureTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  &nbsp;→&nbsp;
                  {new Date(f.arrivalTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  &nbsp;·&nbsp;{formatDuration(f.duration)}
                  &nbsp;·&nbsp;{f.stops === 0 ? 'Non-stop' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}
                  &nbsp;·&nbsp;{f.availableSeats}/{f.totalSeats} seats
                </div>
                <div className="text-sm font-medium text-blue-700 mt-0.5">
                  Economy ₹{f.economyPrice.toLocaleString('en-IN')}
                  {f.businessPrice && ` · Business ₹${f.businessPrice.toLocaleString('en-IN')}`}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openEdit(f)}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(f.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
