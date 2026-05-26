import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Bus, Map, Wifi, Zap, Wind, Droplets } from 'lucide-react'
import { busOperatorService } from '@/services/operatorService'
import { BusSeatMapModal } from './BusSeatMapModal'
import type { OperatorBusDto, CreateBusRequest } from '@/types'

const BUS_TYPES = ['AC Seater', 'Non-AC Seater', 'Sleeper', 'Semi-Sleeper', 'Volvo AC', 'Mini Bus']
const LAYOUT_PRESETS = ['2-2', '2-1', '1-1', '3-2', '2-2-2']
const SCHEDULE_TYPES = ['OneTime', 'Daily', 'Weekly']
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const AMENITY_OPTIONS = ['WiFi', 'Charging Point', 'Blanket', 'Water Bottle', 'Snacks', 'AC', 'Reading Light', 'Entertainment System', 'GPS Tracking']

const AMENITY_ICONS: Record<string, React.ElementType> = {
  'WiFi': Wifi,
  'Charging Point': Zap,
  'AC': Wind,
  'Water Bottle': Droplets,
}

type BusFormState = Partial<CreateBusRequest> & {
  isActive: boolean
  travelDate?: string
  departureClock?: string
  arrivalClock?: string
  ladiesSeatsRaw?: string
  amenitiesSelected: string[]
  daysSelected: string[]
}

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

const defaultForm = (): BusFormState => ({
  isActive: true,
  busType: 'AC Seater',
  seatLayoutConfig: '2-2',
  seatRows: 10,
  scheduleType: 'OneTime',
  amenitiesSelected: [],
  daysSelected: [],
})

export default function BusOperatorBusesPage() {
  const [buses, setBuses] = useState<OperatorBusDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBus, setEditBus] = useState<OperatorBusDto | null>(null)
  const [form, setForm] = useState<BusFormState>(defaultForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showSeatMap, setShowSeatMap] = useState(false)

  useEffect(() => {
    busOperatorService.getBuses()
      .then(setBuses)
      .catch(() => setError('Failed to load buses.'))
      .finally(() => setLoading(false))
  }, [])

  const openAdd = () => {
    setEditBus(null)
    setForm(defaultForm())
    setShowForm(true)
    setError('')
  }

  const openEdit = (b: OperatorBusDto) => {
    const departure = extractDateTimeParts(b.departureTime)
    const arrival   = extractDateTimeParts(b.arrivalTime)
    setEditBus(b)
    setForm({
      busNumber: b.busNumber,
      origin: b.origin,
      destination: b.destination,
      travelDate: departure.date,
      departureClock: departure.time,
      arrivalClock: arrival.time,
      totalSeats: b.totalSeats,
      price: b.price,
      busType: b.busType,
      seatLayoutConfig: b.seatLayoutConfig,
      seatRows: b.seatRows,
      ladiesSeatsRaw: (b.ladiesSeats ?? []).join(', '),
      amenitiesSelected: b.amenities ?? [],
      driverName: b.driverName,
      driverPhone: b.driverPhone,
      driverLicense: b.driverLicense,
      photoUrl: b.photoUrl,
      scheduleType: b.scheduleType,
      daysSelected: b.daysOfWeek ?? [],
      boardingPoints: b.boardingPoints,
      droppingPoints: b.droppingPoints,
      isActive: b.isActive,
    })
    setShowForm(true)
    setError('')
  }

  const setField = <K extends keyof BusFormState>(key: K, value: BusFormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const toggleAmenity = (a: string) => {
    setForm(prev => ({
      ...prev,
      amenitiesSelected: prev.amenitiesSelected.includes(a)
        ? prev.amenitiesSelected.filter(x => x !== a)
        : [...prev.amenitiesSelected, a],
    }))
  }

  const toggleDay = (d: string) => {
    setForm(prev => ({
      ...prev,
      daysSelected: prev.daysSelected.includes(d)
        ? prev.daysSelected.filter(x => x !== d)
        : [...prev.daysSelected, d],
    }))
  }

  const handleSave = async () => {
    if (!form.busNumber || !form.origin || !form.destination || !form.travelDate || !form.departureClock || !form.arrivalClock || !form.totalSeats || !form.price) {
      setError('Please fill all required fields.')
      return
    }
    if (form.origin?.toLowerCase() === form.destination?.toLowerCase()) {
      setError('Origin and destination must be different.')
      return
    }
    if (form.scheduleType === 'Weekly' && form.daysSelected.length === 0) {
      setError('Select at least one day for weekly schedule.')
      return
    }

    const ladiesSeats = form.ladiesSeatsRaw
      ? form.ladiesSeatsRaw.split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      : []

    const payload: CreateBusRequest = {
      busNumber: form.busNumber.trim().toUpperCase(),
      origin: form.origin.trim(),
      destination: form.destination.trim(),
      departureTime: combineDateAndTime(form.travelDate, form.departureClock),
      arrivalTime: combineDateAndTime(form.travelDate, form.arrivalClock),
      totalSeats: Number(form.totalSeats),
      price: Number(form.price),
      busType: form.busType ?? 'AC Seater',
      seatLayoutConfig: form.seatLayoutConfig ?? '2-2',
      seatRows: Number(form.seatRows ?? 10),
      ladiesSeats: ladiesSeats.length > 0 ? ladiesSeats : undefined,
      amenities: form.amenitiesSelected.length > 0 ? form.amenitiesSelected : undefined,
      driverName: form.driverName || undefined,
      driverPhone: form.driverPhone || undefined,
      driverLicense: form.driverLicense || undefined,
      photoUrl: form.photoUrl || undefined,
      scheduleType: form.scheduleType ?? 'OneTime',
      daysOfWeek: form.scheduleType === 'Weekly' ? form.daysSelected : undefined,
      boardingPoints: form.boardingPoints || undefined,
      droppingPoints: form.droppingPoints || undefined,
    }

    setSaving(true)
    setError('')
    try {
      if (editBus) {
        const updated = await busOperatorService.updateBus(editBus.id, {
          ...payload,
          isActive: form.isActive,
        })
        setBuses(bs => bs.map(b => b.id === updated.id ? updated : b))
      } else {
        const added = await busOperatorService.addBus(payload)
        setBuses(bs => [added, ...bs])
      }
      setShowForm(false)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to save bus.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this bus?')) return
    try {
      await busOperatorService.deleteBus(id)
      setBuses(bs => bs.filter(b => b.id !== id))
    } catch {
      setError('Failed to delete bus.')
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500'
  const labelCls = 'block text-xs text-gray-500 mb-1'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Buses</h1>
          <p className="text-sm text-gray-500 mt-1">{buses.length} buses managed</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSeatMap(true)}
            className="flex items-center gap-2 border border-green-200 text-green-700 bg-green-50 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-100 transition"
          >
            <Map className="w-4 h-4" /> View Seat Map
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Bus
          </button>
        </div>
      </div>

      {error && <div className="mb-4 bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-5">{editBus ? 'Edit Bus' : 'Add New Bus'}</h2>

          {/* Section 1: Route & Schedule */}
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">Route & Schedule</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Bus Number *</label>
              <input type="text" placeholder="e.g. KA01AB1234" value={form.busNumber ?? ''} onChange={e => setField('busNumber', e.target.value.toUpperCase())} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Bus Type</label>
              <select value={form.busType ?? 'AC Seater'} onChange={e => setField('busType', e.target.value)} className={inputCls}>
                {BUS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Origin *</label>
              <input type="text" placeholder="e.g. Bangalore" value={form.origin ?? ''} onChange={e => setField('origin', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Destination *</label>
              <input type="text" placeholder="e.g. Mumbai" value={form.destination ?? ''} onChange={e => setField('destination', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Travel Date *</label>
              <input type="date" value={form.travelDate ?? ''} onChange={e => setField('travelDate', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Departure Time *</label>
              <input type="time" value={form.departureClock ?? ''} onChange={e => setField('departureClock', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Arrival Time *</label>
              <input type="time" value={form.arrivalClock ?? ''} onChange={e => setField('arrivalClock', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price per Seat (₹) *</label>
              <input type="number" placeholder="800" value={form.price ?? ''} onChange={e => setField('price', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Schedule Type</label>
              <select value={form.scheduleType ?? 'OneTime'} onChange={e => setField('scheduleType', e.target.value)} className={inputCls}>
                {SCHEDULE_TYPES.map(s => <option key={s} value={s}>{s === 'OneTime' ? 'One-Time' : s}</option>)}
              </select>
            </div>
            {form.scheduleType === 'Weekly' && (
              <div className="md:col-span-2">
                <label className={labelCls}>Days of Operation</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {DAYS_OF_WEEK.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDay(d)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                        form.daysSelected.includes(d)
                          ? 'bg-green-700 text-white border-green-700'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                      }`}
                    >
                      {d.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Seat Layout */}
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">Seat Configuration</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Total Seats</label>
              <input type="number" placeholder="40" min={1} max={60} value={form.totalSeats ?? ''} onChange={e => setField('totalSeats', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Seat Layout</label>
              <select value={form.seatLayoutConfig ?? '2-2'} onChange={e => setField('seatLayoutConfig', e.target.value)} className={inputCls}>
                {LAYOUT_PRESETS.map(p => (
                  <option key={p} value={p}>{p} — {p.split('-').join(' | ')}</option>
                ))}
                <option value="custom">Custom</option>
              </select>
              {form.seatLayoutConfig === 'custom' && (
                <input type="text" placeholder="e.g. 2-2 or 2-1" className={`mt-2 ${inputCls}`} onChange={e => setField('seatLayoutConfig', e.target.value)} />
              )}
            </div>
            <div>
              <label className={labelCls}>Seat Rows</label>
              <input type="number" placeholder="10" min={1} max={30} value={form.seatRows ?? 10} onChange={e => setField('seatRows', Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Ladies-Only Seats <span className="text-gray-400">(comma-separated, e.g. 1A, 1B)</span></label>
              <input type="text" placeholder="1A, 1B, 2A" value={form.ladiesSeatsRaw ?? ''} onChange={e => setField('ladiesSeatsRaw', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Boarding Points <span className="text-gray-400">(comma-separated)</span></label>
              <input type="text" placeholder="Majestic, Electronic City" value={form.boardingPoints ?? ''} onChange={e => setField('boardingPoints', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Dropping Points <span className="text-gray-400">(comma-separated)</span></label>
              <input type="text" placeholder="Dadar, Thane" value={form.droppingPoints ?? ''} onChange={e => setField('droppingPoints', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Section 3: Amenities */}
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">Amenities</p>
          <div className="flex flex-wrap gap-2 mb-5">
            {AMENITY_OPTIONS.map(a => {
              const Icon = AMENITY_ICONS[a]
              const selected = form.amenitiesSelected.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    selected
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {a}
                </button>
              )
            })}
          </div>

          {/* Section 4: Driver & Staff */}
          <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-3">Driver & Staff</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <label className={labelCls}>Driver Name</label>
              <input type="text" placeholder="Driver's full name" value={form.driverName ?? ''} onChange={e => setField('driverName', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Driver Phone</label>
              <input type="tel" placeholder="+91 9876543210" value={form.driverPhone ?? ''} onChange={e => setField('driverPhone', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Driver License</label>
              <input type="text" placeholder="License number" value={form.driverLicense ?? ''} onChange={e => setField('driverLicense', e.target.value)} className={inputCls} />
            </div>
            <div className="md:col-span-3">
              <label className={labelCls}>Bus Photo URL</label>
              <input type="url" placeholder="https://example.com/bus.jpg" value={form.photoUrl ?? ''} onChange={e => setField('photoUrl', e.target.value)} className={inputCls} />
            </div>
          </div>

          {editBus && (
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-gray-600">Active</label>
              <input type="checkbox" checked={form.isActive ?? true} onChange={e => setField('isActive', e.target.checked)} className="w-4 h-4 accent-green-600" />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-50 transition">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowForm(false)} className="border border-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : buses.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          <Bus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No buses yet</p>
          <p className="text-sm">Add your first bus to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {buses.map(b => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
              <div className="flex items-start gap-4">
                {b.photoUrl ? (
                  <img src={b.photoUrl} alt={b.busNumber} className="h-16 w-24 object-cover rounded-lg shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-green-50 shrink-0">
                    <Bus className="h-6 w-6 text-green-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-800">{b.busNumber}</span>
                    <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">{b.busType}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{b.origin} → {b.destination}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {b.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{b.scheduleType}</span>
                    <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      {b.seatLayoutConfig} · {b.seatRows}R
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {new Date(b.departureTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    {' → '}
                    {new Date(b.arrivalTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    &nbsp;·&nbsp;{formatDuration(b.durationMinutes)}
                    &nbsp;·&nbsp;{b.availableSeats}/{b.totalSeats} seats
                  </div>
                  <div className="text-sm font-medium text-green-700 mt-0.5">₹{b.price.toLocaleString('en-IN')} per seat</div>
                  {b.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {b.amenities.slice(0, 5).map(a => (
                        <span key={a} className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">{a}</span>
                      ))}
                      {b.amenities.length > 5 && <span className="text-xs text-gray-400">+{b.amenities.length - 5} more</span>}
                    </div>
                  )}
                  {b.driverName && (
                    <div className="text-xs text-gray-400 mt-1">Driver: {b.driverName}{b.driverPhone ? ` · ${b.driverPhone}` : ''}</div>
                  )}
                  {b.scheduleType === 'Weekly' && b.daysOfWeek.length > 0 && (
                    <div className="text-xs text-blue-600 mt-0.5">Runs: {b.daysOfWeek.map(d => d.slice(0, 3)).join(', ')}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(b)} className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition" title="Edit bus">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition" title="Delete bus">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showSeatMap && <BusSeatMapModal onClose={() => setShowSeatMap(false)} />}
    </div>
  )
}
