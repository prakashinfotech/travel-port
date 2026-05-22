import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Plane, Map } from 'lucide-react'
import { flightOperatorService } from '@/services/operatorService'
import { AirportSearch } from '@/components/search/AirportSearch'
import { AIRPORTS } from '@/data/airports'
import { FlightSeatMapModal } from './FlightSeatMapModal'
import type { OperatorFlightDto, CreateFlightRequest } from '@/types'

type FlightFormState = Partial<CreateFlightRequest> & {
  isActive: boolean
  travelDate?: string
  departureClock?: string
  arrivalClock?: string
  ladiesSeatsRaw?: string  // comma-separated seat IDs entered by user
}

const LAYOUT_PRESETS = ['3-3', '2-2', '2-3-2', '3-4-3', '2-4-2', '2-2-2']

function formatDuration(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function extractDateTimeParts(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return { date: '', time: '' }
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` }
}

function combineDateAndTime(date: string, time: string): string {
  return `${date}T${time}`
}

function airportDisplay(code?: string) {
  if (!code) return ''
  const airport = AIRPORTS.find(a => a.code === code)
  return airport ? `${airport.city} (${airport.code})` : code
}

export default function FlightOperatorFlightsPage() {
  const [flights, setFlights] = useState<OperatorFlightDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editFlight, setEditFlight] = useState<OperatorFlightDto | null>(null)
  const [form, setForm] = useState<FlightFormState>({ isActive: true, stops: 0, seatLayoutConfig: '3-3', seatRows: 30 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSeatMap, setShowSeatMap] = useState(false)

  useEffect(() => {
    flightOperatorService.getFlights()
      .then(setFlights)
      .catch(() => setError('Failed to load flights.'))
      .finally(() => setLoading(false))
  }, [])

  const openAdd = () => {
    setEditFlight(null)
    setForm({ isActive: true, stops: 0, seatLayoutConfig: '3-3', seatRows: 30 })
    setShowForm(true)
    setError('')
  }

  const openEdit = (f: OperatorFlightDto) => {
    const departure = extractDateTimeParts(f.departureTime)
    const arrival = extractDateTimeParts(f.arrivalTime)
    setEditFlight(f)
    setForm({
      flightNumber: f.flightNumber,
      source: f.source,
      destination: f.destination,
      departureTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      travelDate: departure.date,
      departureClock: departure.time,
      arrivalClock: arrival.time,
      totalSeats: f.totalSeats,
      economyPrice: f.economyPrice,
      businessPrice: f.businessPrice,
      stops: f.stops,
      layoverAirport: f.layoverAirport,
      layoverDurationMinutes: f.layoverDurationMinutes,
      isActive: f.isActive,
      seatLayoutConfig: f.seatLayoutConfig ?? '3-3',
      seatRows: f.seatRows ?? 30,
      ladiesSeatsRaw: (f.ladiesSeats ?? []).join(', '),
    })
    setShowForm(true)
    setError('')
  }

  const setField = <K extends keyof FlightFormState>(key: K, value: FlightFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleStopsChange = (value: number) => {
    setForm(prev => ({
      ...prev,
      stops: value,
      layoverAirport: value === 1 ? prev.layoverAirport : undefined,
      layoverDurationMinutes: value === 1 ? prev.layoverDurationMinutes : undefined,
    }))
  }

  const handleSave = async () => {
    if (!form.flightNumber || !form.source || !form.destination || !form.travelDate || !form.departureClock || !form.arrivalClock || !form.totalSeats || !form.economyPrice) {
      setError('Please fill all required fields.')
      return
    }
    if (form.source === form.destination) {
      setError('Source and destination airports must be different.')
      return
    }
    if ((form.stops ?? 0) === 1 && (!form.layoverAirport || !form.layoverDurationMinutes)) {
      setError('Layover airport and layover duration are required for 1-stop flights.')
      return
    }

    const ladiesSeats = form.ladiesSeatsRaw
      ? form.ladiesSeatsRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      : []

    const payload: CreateFlightRequest = {
      flightNumber: form.flightNumber.trim().toUpperCase(),
      source: form.source,
      destination: form.destination,
      departureTime: combineDateAndTime(form.travelDate, form.departureClock),
      arrivalTime: combineDateAndTime(form.travelDate, form.arrivalClock),
      totalSeats: Number(form.totalSeats),
      economyPrice: Number(form.economyPrice),
      businessPrice: form.businessPrice ? Number(form.businessPrice) : undefined,
      stops: Number(form.stops ?? 0),
      layoverAirport: (form.stops ?? 0) === 1 ? form.layoverAirport : undefined,
      layoverDurationMinutes: (form.stops ?? 0) === 1 ? Number(form.layoverDurationMinutes) : undefined,
      seatLayoutConfig: form.seatLayoutConfig || '3-3',
      seatRows: Number(form.seatRows ?? 30),
      ladiesSeats: ladiesSeats.length > 0 ? ladiesSeats : undefined,
    }

    setSaving(true)
    setError('')
    try {
      if (editFlight) {
        const updated = await flightOperatorService.updateFlight(editFlight.id, {
          ...payload,
          isActive: form.isActive,
        })
        setFlights(fs => fs.map(f => f.id === updated.id ? updated : f))
      } else {
        const added = await flightOperatorService.addFlight(payload)
        setFlights(fs => [added, ...fs])
      }
      setShowForm(false)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save flight.')
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
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSeatMap(true)}
            className="flex items-center gap-2 border border-blue-200 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition"
          >
            <Map className="w-4 h-4" /> View Seat Map
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" /> Add Flight
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">{editFlight ? 'Edit Flight' : 'Add New Flight'}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Flight Number</label>
              <input
                type="text"
                placeholder="e.g. AI201"
                value={form.flightNumber ?? ''}
                onChange={e => setField('flightNumber', e.target.value.toUpperCase())}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Stops</label>
              <select
                value={form.stops ?? 0}
                onChange={e => handleStopsChange(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Non-stop</option>
                <option value={1}>1 Stop</option>
              </select>
            </div>

            <AirportSearch
              label="Source (IATA)"
              placeholder="Search city or airport"
              value={airportDisplay(form.source)}
              onChange={code => setField('source', code)}
            />

            <AirportSearch
              label="Destination (IATA)"
              placeholder="Search city or airport"
              value={airportDisplay(form.destination)}
              onChange={code => setField('destination', code)}
            />

            <div>
              <label className="block text-xs text-gray-500 mb-1">Travel Date</label>
              <input
                type="date"
                value={form.travelDate ?? ''}
                onChange={e => setField('travelDate', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Departure Time</label>
              <input
                type="time"
                value={form.departureClock ?? ''}
                onChange={e => setField('departureClock', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Arrival Time</label>
              <input
                type="time"
                value={form.arrivalClock ?? ''}
                onChange={e => setField('arrivalClock', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Total Seats</label>
              <input
                type="number"
                placeholder="180"
                value={form.totalSeats ?? ''}
                onChange={e => setField('totalSeats', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Economy Price (Rs)</label>
              <input
                type="number"
                placeholder="3500"
                value={form.economyPrice ?? ''}
                onChange={e => setField('economyPrice', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Business Price (Rs)</label>
              <input
                type="number"
                placeholder="Optional"
                value={form.businessPrice ?? ''}
                onChange={e => setField('businessPrice', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(form.stops ?? 0) === 1 && (
              <>
                <AirportSearch
                  label="Layover Airport"
                  placeholder="Search layover airport"
                  value={airportDisplay(form.layoverAirport)}
                  onChange={code => setField('layoverAirport', code)}
                />

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Layover Duration (minutes)</label>
                  <input
                    type="number"
                    placeholder="e.g. 90"
                    value={form.layoverDurationMinutes ?? ''}
                    onChange={e => setField('layoverDurationMinutes', e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {/* Seat Layout Config */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Seat Layout Configuration</label>
              <select
                value={form.seatLayoutConfig ?? '3-3'}
                onChange={e => setField('seatLayoutConfig', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {LAYOUT_PRESETS.map(p => (
                  <option key={p} value={p}>{p} ({p.split('-').map((n, i, a) => `${n} seats${i < a.length - 1 ? ' | aisle |' : ''}`).join(' ')})</option>
                ))}
                <option value="custom">Custom</option>
              </select>
              {form.seatLayoutConfig === 'custom' && (
                <input
                  type="text"
                  placeholder="e.g. 3-3 or 2-3-2"
                  className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={e => setField('seatLayoutConfig', e.target.value)}
                />
              )}
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Seat Rows</label>
              <input
                type="number"
                placeholder="30"
                min={1}
                max={60}
                value={form.seatRows ?? 30}
                onChange={e => setField('seatRows', Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">
                Ladies-Only Seats <span className="text-gray-400">(comma-separated, e.g. 1A, 1B, 2A, 2B)</span>
              </label>
              <input
                type="text"
                placeholder="1A, 1B, 2A, 2B"
                value={form.ladiesSeatsRaw ?? ''}
                onChange={e => setField('ladiesSeatsRaw', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {editFlight && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Active</label>
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={e => setField('isActive', e.target.checked)}
                  className="w-4 h-4 accent-blue-600"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
            >
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
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{`${f.source} → ${f.destination}`}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {f.isActive ? 'Active' : 'Inactive'}
                  </span>
                  {f.seatLayoutConfig && (
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      Layout: {f.seatLayoutConfig} · {f.seatRows}R
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {new Date(f.departureTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  {' → '}
                  {new Date(f.arrivalTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  &nbsp;·&nbsp;{formatDuration(f.duration)}
                  &nbsp;·&nbsp;{f.stops === 0 ? 'Non-stop' : '1 stop'}
                  &nbsp;·&nbsp;{f.availableSeats}/{f.totalSeats} seats
                </div>
                {f.stops === 1 && f.layoverAirport && f.layoverDurationMinutes && (
                  <div className="text-xs text-amber-700 mt-1">
                    Layover at {f.layoverAirport} · {formatDuration(f.layoverDurationMinutes)}
                  </div>
                )}
                <div className="text-sm font-medium text-blue-700 mt-0.5">
                  Economy Rs{f.economyPrice.toLocaleString('en-IN')}
                  {f.businessPrice && ` · Business Rs${f.businessPrice.toLocaleString('en-IN')}`}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openEdit(f)}
                  className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                  title="Edit flight"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(f.id)}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                  title="Delete flight"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSeatMap && <FlightSeatMapModal onClose={() => setShowSeatMap(false)} />}
    </div>
  )
}
