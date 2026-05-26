import { useEffect, useState, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BookOpen, Tag,
  TrendingUp, TrendingDown, Plane, Hotel,
  ShieldCheck, ShieldOff, Pencil, Trash2,
  Plus, Search, ChevronLeft, ChevronRight,
  RefreshCw, X, Bus, Car, Download, Megaphone, Eye,
} from 'lucide-react'
import type { RootState } from '@/store'
import type {
  AdminDashboardDto, AdminUserDto, AdminAnalyticsDto,
  CouponDto, CreateCouponRequest, UpdateCouponRequest,
  BookingDto, AdminHotelListDto, RegisterHotelRequest,
  FlightOperatorListDto, BusOperatorListDto, CabOperatorListDto,
  RegisterFlightOperatorRequest, RegisterBusOperatorRequest, RegisterCabOperatorRequest,
  AdminFlightDto, AdminUpdateFlightRequest,
  CouponAnalyticsDto, AnnouncementDto, CreateAnnouncementRequest, AdminUserOverviewDto,
} from '@/types'
import { adminService } from '@/services/adminService'
import { announcementService } from '@/services/announcementService'
import { formatCurrency } from '@/utils/formatters'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type Tab = 'dashboard' | 'users' | 'bookings' | 'coupons' | 'hotels' | 'operators' | 'flights' | 'announcements'

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number
  icon: React.ElementType; color: string
}) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-extrabold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

// ── Revenue Bar ───────────────────────────────────────────────────────────────
function SimpleBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 text-xs text-gray-500 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5">
        <div className={`h-2.5 rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-24 text-xs font-semibold text-gray-700 shrink-0 text-right">{formatCurrency(value)}</span>
    </div>
  )
}

// ── Coupon Modal ──────────────────────────────────────────────────────────────
function CouponModal({ coupon, onClose, onSaved }: {
  coupon: CouponDto | null; onClose: () => void; onSaved: () => void
}) {
  const isEdit = coupon !== null
  const [form, setForm] = useState({
    code:        coupon?.code        ?? '',
    type:        (coupon?.type       ?? 'Percentage') as 'Fixed' | 'Percentage',
    value:       coupon?.value       ?? 10,
    minAmount:   coupon?.minAmount   ?? 0,
    maxDiscount: coupon?.maxDiscount != null ? String(coupon.maxDiscount) : '',
    usageLimit:  coupon?.usageLimit  != null ? String(coupon.usageLimit)  : '',
    expiresAt:   coupon?.expiresAt   ? coupon.expiresAt.slice(0, 10) : '',
    isActive:    coupon?.isActive    ?? true,
    isFeatured:  coupon?.isFeatured  ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.code.trim()) { setError('Code is required.'); return }
    setSaving(true); setError('')
    try {
      if (isEdit) {
        const req: UpdateCouponRequest = {
          type: form.type, value: Number(form.value), minAmount: Number(form.minAmount),
          maxDiscount: form.maxDiscount !== '' ? Number(form.maxDiscount) : undefined,
          usageLimit:  form.usageLimit  !== '' ? Number(form.usageLimit)  : undefined,
          expiresAt:   form.expiresAt   || undefined, isActive: form.isActive, isFeatured: form.isFeatured,
        }
        await adminService.updateCoupon(coupon!.id, req)
      } else {
        const req: CreateCouponRequest = {
          code: form.code.trim().toUpperCase(), type: form.type,
          value: Number(form.value), minAmount: Number(form.minAmount),
          maxDiscount: form.maxDiscount !== '' ? Number(form.maxDiscount) : undefined,
          usageLimit:  form.usageLimit  !== '' ? Number(form.usageLimit)  : undefined,
          expiresAt:   form.expiresAt   || undefined,
        }
        await adminService.createCoupon(req)
      }
      onSaved(); onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to save coupon.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Coupon' : 'Create Coupon'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Code *', key: 'code', type: 'text',   disabled: isEdit, transform: (v: string) => v.toUpperCase() },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                <input value={String(form[f.key as keyof typeof form])}
                  onChange={e => set(f.key, f.transform ? f.transform(e.target.value) : e.target.value)}
                  disabled={f.disabled}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono uppercase
                             focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed (₹)</option>
              </select>
            </div>
            {[
              { label: `Value ${form.type === 'Percentage' ? '(%)' : '(₹)'}`, key: 'value' },
              { label: 'Min Order (₹)',   key: 'minAmount' },
              { label: 'Max Discount (₹) — optional', key: 'maxDiscount', placeholder: 'No limit' },
              { label: 'Usage Limit — optional',       key: 'usageLimit',  placeholder: 'Unlimited' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                <input type="number" min="0" value={String(form[f.key as keyof typeof form])}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Expires At — optional</label>
              <input type="date" value={form.expiresAt} onChange={e => set('expiresAt', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {isEdit && (
              <div className="col-span-2 flex items-center gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isActive" checked={form.isActive}
                    onChange={e => set('isActive', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="isFeatured" checked={form.isFeatured}
                    onChange={e => set('isFeatured', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-amber-500" />
                  <label htmlFor="isFeatured" className="text-sm font-medium text-gray-700">⭐ Featured on homepage</label>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <Button onClick={handleSave} loading={saving} className="flex-1 rounded-xl py-2.5 text-sm">
            {isEdit ? 'Save Changes' : 'Create Coupon'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Shared city + type lists ──────────────────────────────────────────────────
const HOTEL_CITIES = [
  'Agra', 'Ahmedabad', 'Amritsar', 'Aurangabad', 'Bangalore', 'Bhopal',
  'Bhubaneswar', 'Chandigarh', 'Chennai', 'Coimbatore', 'Delhi', 'Goa',
  'Guwahati', 'Hyderabad', 'Indore', 'Jaipur', 'Jammu', 'Jodhpur',
  'Kochi', 'Kolkata', 'Lucknow', 'Ludhiana', 'Madurai', 'Mangalore',
  'Mumbai', 'Mysore', 'Nagpur', 'Nashik', 'Patna', 'Pondicherry',
  'Pune', 'Raipur', 'Ranchi', 'Shimla', 'Surat', 'Udaipur',
  'Vadodara', 'Varanasi', 'Vijayawada', 'Visakhapatnam',
]

const BUS_TYPES = [
  'AC Seater', 'Non-AC Seater', 'AC Sleeper', 'Non-AC Sleeper',
  'Volvo AC', 'Mercedes Luxury', 'Semi-Sleeper', 'Luxury Coach',
  'Mini Bus', 'Electric Bus', 'Double Decker', 'Scania',
]

const CAB_TYPES = [
  'Mini (Hatchback)', 'Sedan', 'SUV', 'Innova / Crysta',
  'Tempo Traveller', 'Luxury Sedan', 'Luxury SUV',
  'Electric Car', 'Auto Rickshaw', 'Bike Taxi',
]

function CityCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = HOTEL_CITIES.filter(c =>
    c.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(city: string) {
    onChange(city)
    setQuery(city)
    setOpen(false)
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  return (
    <div ref={ref} className="relative">
      <input
        value={query}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        placeholder="Search city…"
        autoComplete="off"
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
          {filtered.map(city => (
            <li
              key={city}
              onMouseDown={() => select(city)}
              className={`cursor-pointer px-3 py-2 hover:bg-blue-50 hover:text-blue-700 ${
                city === value ? 'bg-blue-50 font-semibold text-blue-700' : 'text-gray-700'
              }`}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Multi-select dropdown ─────────────────────────────────────────────────────
function MultiSelectDropdown({ options, selected, onChange, placeholder }: {
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const toggle = (opt: string) =>
    onChange(selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full min-h-[36px] text-left rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {selected.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {selected.map(s => (
              <span key={s} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-xs">
                {s}
                <span onMouseDown={e => { e.stopPropagation(); toggle(s) }} className="cursor-pointer hover:text-blue-900">×</span>
              </span>
            ))}
          </span>
        ) : (
          <span className="text-gray-400 text-sm">{placeholder ?? 'Select types…'}</span>
        )}
      </button>
      {open && (
        <ul className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg text-sm">
          {options.map(opt => (
            <li
              key={opt}
              onMouseDown={() => toggle(opt)}
              className="flex items-center gap-2 cursor-pointer px-3 py-2 hover:bg-blue-50"
            >
              <input type="checkbox" readOnly checked={selected.includes(opt)} className="h-3.5 w-3.5 accent-blue-600" />
              <span className={selected.includes(opt) ? 'text-blue-700 font-medium' : 'text-gray-700'}>{opt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Register Hotel Modal ──────────────────────────────────────────────────────
function RegisterHotelModal({ onClose, onRegistered }: {
  onClose: () => void
  onRegistered: (hotel: AdminHotelListDto) => void
}) {
  const [form, setForm] = useState<RegisterHotelRequest>({
    hotelName: '', city: '', address: '', starRating: 3,
    managerEmail: '', managerPassword: '', managerName: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof RegisterHotelRequest, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.hotelName.trim() || !form.city.trim() || !form.managerEmail.trim() || !form.managerPassword.trim() || !form.managerName.trim()) {
      setError('All fields are required.'); return
    }
    setSaving(true); setError('')
    try {
      const hotel = await adminService.registerHotel(form)
      onRegistered(hotel)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to register hotel.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Register Hotel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
          <p className="text-xs text-gray-500 bg-sky-50 border border-sky-100 rounded-lg px-4 py-2">
            Hotel login credentials will be emailed to the manager after registration.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Hotel Name *</label>
              <input value={form.hotelName} onChange={e => set('hotelName', e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">City *</label>
              <CityCombobox value={form.city} onChange={v => set('city', v)} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Address *</label>
            <input value={form.address} onChange={e => set('address', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Star Rating</label>
            <select value={form.starRating} onChange={e => set('starRating', Number(e.target.value))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {[1, 2, 3, 4, 5].map(s => <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Manager Account</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Manager Name *</label>
                <input value={form.managerName} onChange={e => set('managerName', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Login Email *</label>
                <input type="email" value={form.managerEmail} onChange={e => set('managerEmail', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Temporary Password *</label>
              <input type="text" value={form.managerPassword} onChange={e => set('managerPassword', e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <Button onClick={handleSave} loading={saving} className="flex-1 rounded-xl py-2.5 text-sm">
            Register Hotel
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Register Operator Modal ───────────────────────────────────────────────────
function RegisterOperatorModal({ type, onClose, onRegistered }: {
  type: 'flight' | 'bus' | 'cab'
  onClose: () => void
  onRegistered: (op: FlightOperatorListDto | BusOperatorListDto | CabOperatorListDto) => void
}) {
  const [form, setForm] = useState<Record<string, string | boolean>>({
    companyName: '', managerName: '', managerEmail: '', managerPassword: '',
    iataCode: '', headquartersCity: '', city: '', contactPhone: '',
    busTypes: '', cabTypes: '', isIndividualDriver: false, driverLicenseNumber: '',
  })
  const [busTypesArr, setBusTypesArr] = useState<string[]>([])
  const [cabTypesArr, setCabTypesArr] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.companyName || !form.managerEmail || !form.managerPassword || !form.managerName) {
      setError('Company name, manager name, email, and password are required.'); return
    }
    const phone = String(form.contactPhone).replace(/\D/g, '')
    if (form.contactPhone && phone.length !== 10) {
      setError('Contact phone must be exactly 10 digits.'); return
    }
    setSaving(true); setError('')
    try {
      const payload = {
        ...form,
        busTypes: type === 'bus' ? busTypesArr.join(', ') : form.busTypes,
        cabTypes: type === 'cab' ? cabTypesArr.join(', ') : form.cabTypes,
      }
      let result: FlightOperatorListDto | BusOperatorListDto | CabOperatorListDto
      if (type === 'flight') {
        result = await adminService.registerFlightOperator(payload as unknown as RegisterFlightOperatorRequest)
      } else if (type === 'bus') {
        result = await adminService.registerBusOperator(payload as unknown as RegisterBusOperatorRequest)
      } else {
        result = await adminService.registerCabOperator(payload as unknown as RegisterCabOperatorRequest)
      }
      onRegistered(result)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to register operator.')
    } finally { setSaving(false) }
  }

  const title = type === 'flight' ? 'Register Airline' : type === 'bus' ? 'Register Bus Operator' : 'Register Cab Operator'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{error}</div>}
          <p className="text-xs text-gray-500 bg-sky-50 border border-sky-100 rounded-lg px-4 py-2">
            Login credentials will be emailed to the operator after registration.
          </p>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Company Name *</label>
            <input value={form.companyName as string} onChange={e => set('companyName', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {type === 'flight' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">IATA Code *</label>
                <input value={form.iataCode as string} onChange={e => set('iataCode', e.target.value)}
                  placeholder="e.g. AI" maxLength={3}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">HQ City</label>
                <CityCombobox value={form.headquartersCity as string} onChange={v => set('headquartersCity', v)} />
              </div>
            </div>
          )}

          {type === 'bus' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">HQ City</label>
                  <CityCombobox value={form.headquartersCity as string} onChange={v => set('headquartersCity', v)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Bus Types</label>
                <MultiSelectDropdown
                  options={BUS_TYPES}
                  selected={busTypesArr}
                  onChange={setBusTypesArr}
                  placeholder="Select bus types…"
                />
              </div>
            </>
          )}

          {type === 'cab' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Operating City</label>
                <CityCombobox value={form.city as string} onChange={v => set('city', v)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Cab Types</label>
                <MultiSelectDropdown
                  options={CAB_TYPES}
                  selected={cabTypesArr}
                  onChange={setCabTypesArr}
                  placeholder="Select cab types…"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.isIndividualDriver}
                  onChange={e => set('isIndividualDriver', e.target.checked)}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700">Individual Driver (not a company)</span>
              </label>
              {form.isIndividualDriver && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Driver License Number</label>
                  <input value={form.driverLicenseNumber as string} onChange={e => set('driverLicenseNumber', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Phone (10 digits)</label>
            <input
              value={form.contactPhone as string}
              onChange={e => set('contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              maxLength={10}
              inputMode="numeric"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.contactPhone && String(form.contactPhone).length > 0 && String(form.contactPhone).length !== 10 && (
              <p className="text-xs text-red-500 mt-1">Must be exactly 10 digits</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 mb-3">Manager Account</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Manager Name *</label>
                <input value={form.managerName as string} onChange={e => set('managerName', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Login Email *</label>
                <input type="email" value={form.managerEmail as string} onChange={e => set('managerEmail', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Temporary Password *</label>
              <input type="text" value={form.managerPassword as string} onChange={e => set('managerPassword', e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <Button onClick={handleSave} loading={saving} className="flex-1 rounded-xl py-2.5 text-sm">
            Register
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (pages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-2 pt-2">
      <button onClick={() => onChange(page - 1)} disabled={page === 1}
        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm text-gray-600">Page {page} of {pages}</span>
      <button onClick={() => onChange(page + 1)} disabled={page === pages}
        className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate()
  const user     = useSelector((s: RootState) => s.auth.user)
  const [tab, setTab] = useState<Tab>('dashboard')

  // Dashboard
  const [dashboard,   setDashboard]   = useState<AdminDashboardDto | null>(null)
  const [analytics,   setAnalytics]   = useState<AdminAnalyticsDto | null>(null)
  const [dashLoading, setDashLoading] = useState(true)

  // Users
  const [users,         setUsers]         = useState<AdminUserDto[]>([])
  const [userTotal,     setUserTotal]     = useState(0)
  const [userPage,      setUserPage]      = useState(1)
  const [userSearch,    setUserSearch]    = useState('')
  const [usersLoading,  setUsersLoading]  = useState(false)
  const [blockTarget,   setBlockTarget]   = useState<AdminUserDto | null>(null)
  const [blocking,      setBlocking]      = useState(false)

  // Bookings
  const [bookings,        setBookings]        = useState<BookingDto[]>([])
  const [bookingTotal,    setBookingTotal]    = useState(0)
  const [bookingPage,     setBookingPage]     = useState(1)
  const [bookingStatus,   setBookingStatus]   = useState('')
  const [bookingType,     setBookingType]     = useState('')
  const [bookingsLoading, setBookingsLoading] = useState(false)

  // Coupons
  const [coupons,         setCoupons]         = useState<CouponDto[]>([])
  const [couponsLoading,  setCouponsLoading]  = useState(false)
  const [couponModal,     setCouponModal]     = useState<'create' | CouponDto | null>(null)
  const [deleteTarget,    setDeleteTarget]    = useState<CouponDto | null>(null)
  const [deleting,        setDeleting]        = useState(false)

  // Hotels
  const [hotels,           setHotels]           = useState<AdminHotelListDto[]>([])
  const [hotelsLoading,    setHotelsLoading]    = useState(false)
  const [registerHotelOpen, setRegisterHotelOpen] = useState(false)
  const [togglingHotelId,  setTogglingHotelId]  = useState<string | null>(null)

  // Operators
  const [flightOperators,         setFlightOperators]        = useState<FlightOperatorListDto[]>([])
  const [busOperators,            setBusOperators]           = useState<BusOperatorListDto[]>([])
  const [cabOperators,            setCabOperators]           = useState<CabOperatorListDto[]>([])
  const [operatorsLoading,        setOperatorsLoading]       = useState(false)
  const [operatorSubTab,          setOperatorSubTab]         = useState<'flight' | 'bus' | 'cab'>('flight')
  const [registerOperatorType,    setRegisterOperatorType]   = useState<'flight' | 'bus' | 'cab' | null>(null)
  const [togglingOperatorId,      setTogglingOperatorId]     = useState<string | null>(null)

  // Flights
  const [adminFlights,       setAdminFlights]       = useState<AdminFlightDto[]>([])
  const [flightsLoading,     setFlightsLoading]     = useState(false)
  const [flightSearch,       setFlightSearch]       = useState('')
  const [editingFlight,      setEditingFlight]      = useState<AdminFlightDto | null>(null)
  const [flightEditForm,     setFlightEditForm]     = useState<AdminUpdateFlightRequest>({})
  const [savingFlight,       setSavingFlight]       = useState(false)

  // Announcements
  const [announcements,      setAnnouncements]      = useState<AnnouncementDto[]>([])
  const [announcementsLoading, setAnnouncementsLoading] = useState(false)
  const [announcementForm,   setAnnouncementForm]   = useState<CreateAnnouncementRequest>({ message: '', type: 'info' })
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Coupon analytics
  const [couponAnalytics,    setCouponAnalytics]    = useState<CouponAnalyticsDto[]>([])

  // View-as-user
  const [viewingUser,        setViewingUser]        = useState<AdminUserOverviewDto | null>(null)
  const [userOverviewLoading, setUserOverviewLoading] = useState(false)

  // CSV export
  const [exportingCsv,       setExportingCsv]       = useState(false)

  const PAGE_SIZE = 15

  useEffect(() => {
    if (user && user.role !== 'Admin') navigate('/')
  }, [user, navigate])

  // Load dashboard + analytics together
  useEffect(() => {
    if (tab !== 'dashboard') return
    setDashLoading(true)
    Promise.all([adminService.getDashboard(), adminService.getAnalytics()])
      .then(([d, a]) => { setDashboard(d); setAnalytics(a) })
      .finally(() => setDashLoading(false))
  }, [tab])

  const loadUsers = useCallback(async () => {
    setUsersLoading(true)
    try {
      const res = await adminService.getUsers(userPage, PAGE_SIZE, userSearch || undefined)
      setUsers(res.data ?? [])
      setUserTotal(res.meta?.total ?? 0)
    } finally { setUsersLoading(false) }
  }, [userPage, userSearch])

  useEffect(() => { if (tab === 'users') loadUsers() }, [tab, loadUsers])

  const loadBookings = useCallback(async () => {
    setBookingsLoading(true)
    try {
      const res = await adminService.getBookings(bookingPage, PAGE_SIZE, bookingStatus, bookingType)
      setBookings(res.data ?? [])
      setBookingTotal(res.meta?.total ?? 0)
    } finally { setBookingsLoading(false) }
  }, [bookingPage, bookingStatus, bookingType])

  useEffect(() => { if (tab === 'bookings') loadBookings() }, [tab, loadBookings])

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true)
    try { setCoupons(await adminService.getCoupons()) }
    finally { setCouponsLoading(false) }
  }, [])

  useEffect(() => { if (tab === 'coupons') loadCoupons() }, [tab, loadCoupons])

  const loadHotels = useCallback(async () => {
    setHotelsLoading(true)
    try { setHotels(await adminService.getHotels()) }
    finally { setHotelsLoading(false) }
  }, [])

  useEffect(() => { if (tab === 'hotels') loadHotels() }, [tab, loadHotels])

  const loadOperators = useCallback(async () => {
    setOperatorsLoading(true)
    try {
      const [fo, bo, co] = await Promise.all([
        adminService.getFlightOperators(),
        adminService.getBusOperators(),
        adminService.getCabOperators(),
      ])
      setFlightOperators(fo)
      setBusOperators(bo)
      setCabOperators(co)
    } finally { setOperatorsLoading(false) }
  }, [])

  useEffect(() => { if (tab === 'operators') loadOperators() }, [tab, loadOperators])

  const loadFlights = useCallback(async () => {
    setFlightsLoading(true)
    try { setAdminFlights(await adminService.getFlights(flightSearch || undefined)) }
    finally { setFlightsLoading(false) }
  }, [flightSearch])

  useEffect(() => { if (tab === 'flights') loadFlights() }, [tab, loadFlights])

  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true)
    try { setAnnouncements(await announcementService.getAll()) }
    finally { setAnnouncementsLoading(false) }
  }, [])

  useEffect(() => { if (tab === 'announcements') loadAnnouncements() }, [tab, loadAnnouncements])

  const loadCouponAnalytics = useCallback(async () => {
    try { setCouponAnalytics(await adminService.getCouponAnalytics()) }
    catch { /* analytics are supplemental */ }
  }, [])

  useEffect(() => { if (tab === 'coupons') loadCouponAnalytics() }, [tab, loadCouponAnalytics])

  const handleViewUser = async (userId: string) => {
    setUserOverviewLoading(true)
    try { setViewingUser(await adminService.getUserOverview(userId)) }
    finally { setUserOverviewLoading(false) }
  }

  const handleSaveFlight = async () => {
    if (!editingFlight) return
    setSavingFlight(true)
    try {
      const updated = await adminService.updateFlight(editingFlight.id, flightEditForm)
      setAdminFlights(prev => prev.map(f => f.id === updated.id ? updated : f))
      setEditingFlight(null)
    } finally { setSavingFlight(false) }
  }

  const handleCreateAnnouncement = async () => {
    if (!announcementForm.message.trim()) return
    setSavingAnnouncement(true)
    try {
      const created = await announcementService.create(announcementForm)
      setAnnouncements(prev => [created, ...prev])
      setAnnouncementForm({ message: '', type: 'info' })
    } finally { setSavingAnnouncement(false) }
  }

  const handleToggleAnnouncement = async (a: AnnouncementDto) => {
    const updated = await announcementService.update(a.id, { isActive: !a.isActive })
    setAnnouncements(prev => prev.map(x => x.id === updated.id ? updated : x))
  }

  const handleDeleteAnnouncement = async (id: string) => {
    await announcementService.delete(id)
    setAnnouncements(prev => prev.filter(a => a.id !== id))
  }

  const handleExportCsv = async () => {
    setExportingCsv(true)
    try {
      const res = await adminService.exportBookingsCsv(bookingStatus || undefined, bookingType || undefined)
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `bookings-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally { setExportingCsv(false) }
  }

  const handleToggleOperator = async (id: string, type: 'flight' | 'bus' | 'cab') => {
    setTogglingOperatorId(id)
    try {
      if (type === 'flight') {
        const updated = await adminService.toggleFlightOperator(id)
        setFlightOperators(prev => prev.map(o => o.id === updated.id ? updated : o))
      } else if (type === 'bus') {
        const updated = await adminService.toggleBusOperator(id)
        setBusOperators(prev => prev.map(o => o.id === updated.id ? updated : o))
      } else {
        const updated = await adminService.toggleCabOperator(id)
        setCabOperators(prev => prev.map(o => o.id === updated.id ? updated : o))
      }
    } finally { setTogglingOperatorId(null) }
  }

  const handleToggleHotel = async (id: string) => {
    setTogglingHotelId(id)
    try {
      const updated = await adminService.toggleHotelActive(id)
      setHotels(prev => prev.map(h => h.id === updated.id ? updated : h))
    } finally { setTogglingHotelId(null) }
  }

  const handleToggleBlock = async () => {
    if (!blockTarget) return
    setBlocking(true)
    try {
      const updated = await adminService.toggleBlock(blockTarget.id)
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
      setBlockTarget(null)
    } finally { setBlocking(false) }
  }

  const handleDeleteCoupon = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await adminService.deleteCoupon(deleteTarget.id)
      setCoupons(prev => prev.filter(c => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
    { id: 'users',         label: 'Users',         icon: Users },
    { id: 'bookings',      label: 'Bookings',      icon: BookOpen },
    { id: 'flights',       label: 'Flights',       icon: Plane },
    { id: 'coupons',       label: 'Coupons',       icon: Tag },
    { id: 'hotels',        label: 'Hotels',        icon: Hotel },
    { id: 'operators',     label: 'Operators',     icon: Bus },
    { id: 'announcements', label: 'Announcements', icon: Megaphone },
  ]

  const skeletonRows = (cols: number) =>
    Array.from({ length: 5 }).map((_, i) => (
      <tr key={i}><td colSpan={cols} className="px-5 py-3.5">
        <div className="h-4 bg-gray-100 animate-pulse rounded w-3/4" />
      </td></tr>
    ))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modals */}
      {registerHotelOpen && (
        <RegisterHotelModal
          onClose={() => setRegisterHotelOpen(false)}
          onRegistered={hotel => setHotels(prev => [hotel, ...prev])}
        />
      )}
      {couponModal !== null && (
        <CouponModal
          coupon={couponModal === 'create' ? null : couponModal}
          onClose={() => setCouponModal(null)}
          onSaved={loadCoupons}
        />
      )}
      <ConfirmDialog
        open={blockTarget !== null}
        title={blockTarget?.isActive ? 'Block User?' : 'Unblock User?'}
        message={blockTarget?.isActive
          ? `Block "${blockTarget?.name}"? They won't be able to log in.`
          : `Unblock "${blockTarget?.name}"? They can log in again.`}
        confirmLabel={blockTarget?.isActive ? 'Block User' : 'Unblock User'}
        cancelLabel="Cancel"
        variant={blockTarget?.isActive ? 'danger' : 'warning'}
        loading={blocking}
        onConfirm={handleToggleBlock}
        onCancel={() => setBlockTarget(null)}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Deactivate Coupon?"
        message={`Deactivate coupon "${deleteTarget?.code}"? It will no longer be usable by customers.`}
        confirmLabel="Deactivate"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteCoupon}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80)', filter: 'saturate(1.6) brightness(0.75) contrast(1.1)' }} />
        <div className="absolute inset-0 bg-gray-950/78" />
        <div className="relative z-10 px-6 py-8">
          <div className="mx-auto max-w-7xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 shadow-lg">
                  <ShieldCheck className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              </div>
              <p className="text-sm text-gray-400 ml-13">TravelPort Management Console</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Logged in as</p>
              <p className="text-sm font-semibold text-white">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-100 px-6 sticky top-[57px] z-10">
        <div className="mx-auto max-w-7xl flex gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
              }`}>
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">

        {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="space-y-8">
            {dashLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : dashboard && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Total Users"      value={dashboard.totalUsers}                      icon={Users}         color="bg-blue-500" />
                  <StatCard label="Total Bookings"   value={dashboard.totalBookings}                   icon={BookOpen}      color="bg-indigo-500" />
                  <StatCard label="Total Revenue"    value={formatCurrency(dashboard.totalRevenue)}    icon={TrendingUp}    color="bg-green-500" />
                  <StatCard label="Avg Booking"      value={formatCurrency(dashboard.avgBookingValue)} icon={TrendingDown}  color="bg-purple-500" />
                  <StatCard label="Active Bookings"  value={dashboard.activeBookings}                  icon={BookOpen}      color="bg-emerald-500" />
                  <StatCard label="Cancelled"        value={dashboard.cancelledBookings}               icon={Tag}           color="bg-red-500" />
                  <StatCard label="Flight Bookings"  value={dashboard.flightBookings}                  icon={Plane}         color="bg-orange-500" />
                  <StatCard label="Hotel Bookings"   value={dashboard.hotelBookings}                   icon={Hotel}         color="bg-cyan-500" />
                </div>

                {analytics && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-5">Monthly Revenue (Last 6 Months)</h3>
                      {analytics.monthlyRevenue.length === 0
                        ? <p className="text-sm text-gray-400">No revenue data yet.</p>
                        : (() => {
                            const max = Math.max(...analytics.monthlyRevenue.map(m => m.revenue), 1)
                            return (
                              <div className="space-y-3">
                                {analytics.monthlyRevenue.map(m => (
                                  <SimpleBar key={m.month} label={m.month} value={m.revenue} max={max} color="bg-blue-500" />
                                ))}
                              </div>
                            )
                          })()
                      }
                    </div>

                    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Bookings by Type</h3>
                        <div className="space-y-3">
                          {analytics.bookingsByType.map(bt => (
                            <div key={bt.type} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                              <div className="flex items-center gap-2">
                                {bt.type === 'Flight'
                                  ? <Plane className="h-4 w-4 text-orange-500" />
                                  : <Hotel className="h-4 w-4 text-blue-600" />}
                                <span className="text-sm font-semibold text-gray-700">{bt.type}</span>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{bt.count} bookings</p>
                                <p className="text-xs text-gray-400">{formatCurrency(bt.revenue)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-4">Bookings by Status</h3>
                        <div className="flex flex-wrap gap-2">
                          {analytics.bookingsByStatus.map(bs => (
                            <div key={bs.status}
                              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700">
                              {bs.status}
                              <span className="bg-white rounded-full px-1.5 py-0.5 text-gray-900">{bs.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── USERS ─────────────────────────────────────────────────────── */}
        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input value={userSearch}
                  onChange={e => { setUserSearch(e.target.value); setUserPage(1) }}
                  placeholder="Search name or email…"
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={loadUsers} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
              <span className="text-sm text-gray-400">{userTotal} total</span>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Wallet</th>
                    <th className="px-4 py-3">Bookings</th>
                    <th className="px-4 py-3">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {usersLoading ? skeletonRows(7) : users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-gray-900">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={u.role === 'Admin' ? 'info' : 'default'}>{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={u.isActive ? 'success' : 'danger'}>{u.isActive ? 'Active' : 'Blocked'}</Badge>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-700">{formatCurrency(u.walletBalance)}</td>
                      <td className="px-4 py-3.5 text-gray-600">{u.totalBookings}</td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{fmtDate(u.createdAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleViewUser(u.id)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          {u.role !== 'Admin' && (
                            <button onClick={() => setBlockTarget(u)}
                              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                                u.isActive
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}>
                              {u.isActive
                                ? <><ShieldOff className="h-3.5 w-3.5" /> Block</>
                                : <><ShieldCheck className="h-3.5 w-3.5" /> Unblock</>}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={userPage} total={userTotal} pageSize={PAGE_SIZE} onChange={setUserPage} />
          </div>
        )}

        {/* ── BOOKINGS ──────────────────────────────────────────────────── */}
        {tab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <select value={bookingStatus} onChange={e => { setBookingStatus(e.target.value); setBookingPage(1) }}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                <option>Confirmed</option><option>Pending</option>
                <option>Cancelled</option><option>Completed</option>
              </select>
              <select value={bookingType} onChange={e => { setBookingType(e.target.value); setBookingPage(1) }}
                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Types</option>
                <option>Flight</option><option>Hotel</option>
              </select>
              <button onClick={loadBookings} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
              <span className="text-sm text-gray-400">{bookingTotal} total</span>
              <button
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                {exportingCsv ? 'Exporting…' : 'Export CSV'}
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Reference</th>
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Details</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookingsLoading ? skeletonRows(7) : bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-mono text-xs font-bold text-gray-900">{b.bookingReference}</p>
                        {b.couponCode && <p className="text-xs text-green-600 mt-0.5">🏷 {b.couponCode}</p>}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-gray-800 text-xs">{b.userName ?? '—'}</p>
                        <p className="text-xs text-gray-400">{b.userEmail ?? ''}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {b.type === 'Flight'
                            ? <Plane className="h-3.5 w-3.5 text-orange-500" />
                            : <Hotel className="h-3.5 w-3.5 text-blue-600" />}
                          <span className="text-xs font-semibold text-gray-600">{b.type}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-500 max-w-[140px] truncate">
                        {b.type === 'Flight'
                          ? `${b.origin ?? ''} → ${b.destination ?? ''}`
                          : (b.hotelName ?? '—')}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={
                          b.status === 'Confirmed' ? 'success'
                            : b.status === 'Cancelled' ? 'danger'
                            : b.status === 'Pending'   ? 'warning' : 'default'
                        }>{b.status}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-gray-900">{formatCurrency(b.finalAmount)}</p>
                        {b.discountAmount > 0 && (
                          <p className="text-xs text-green-600">-{formatCurrency(b.discountAmount)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">{fmtDate(b.bookingDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={bookingPage} total={bookingTotal} pageSize={PAGE_SIZE} onChange={setBookingPage} />
          </div>
        )}

        {/* ── COUPONS ───────────────────────────────────────────────────── */}
        {tab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={loadCoupons} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                </button>
                <span className="text-sm text-gray-400">{coupons.length} coupons</span>
              </div>
              <Button onClick={() => setCouponModal('create')} className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" /> Create Coupon
              </Button>
            </div>

            <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-sm min-w-[750px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <th className="px-5 py-3">Code</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Min Order</th>
                    <th className="px-4 py-3">Usage</th>
                    <th className="px-4 py-3">Expires</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {couponsLoading ? skeletonRows(8) : coupons.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs">{c.type}</td>
                      <td className="px-4 py-3.5 font-semibold text-gray-900">
                        {c.type === 'Percentage' ? `${c.value}%` : formatCurrency(c.value)}
                        {c.maxDiscount != null && (
                          <span className="text-xs text-gray-400 ml-1">(max {formatCurrency(c.maxDiscount)})</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-gray-600">{formatCurrency(c.minAmount)}</td>
                      <td className="px-4 py-3.5 text-gray-600 text-xs">
                        {c.usedCount}{c.usageLimit != null ? `/${c.usageLimit}` : ' used'}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-gray-400">
                        {c.expiresAt ? fmtDate(c.expiresAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={c.isActive ? 'success' : 'danger'}>
                          {c.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setCouponModal(c)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {c.isActive && (
                            <button onClick={() => setDeleteTarget(c)}
                              title="Deactivate"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Coupon Analytics Chart */}
            {couponAnalytics.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Top Coupons by Usage</h3>
                <div className="space-y-3">
                  {couponAnalytics.slice(0, 5).map(ca => {
                    const maxUses = Math.max(...couponAnalytics.slice(0, 5).map(c => c.totalUses), 1)
                    return (
                      <div key={ca.id} className="flex items-center gap-3 text-sm">
                        <span className="w-24 text-right text-xs text-gray-500 shrink-0 font-mono">{ca.code}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full bg-blue-500 transition-all"
                            style={{ width: `${Math.round((ca.totalUses / maxUses) * 100)}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 w-20 shrink-0">{ca.totalUses} uses</span>
                        <span className="text-xs text-emerald-600 font-semibold w-28 shrink-0 text-right">{formatCurrency(ca.totalDiscount)} saved</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── OPERATORS ─────────────────────────────────────────────── */}
        {tab === 'operators' && (
          <div className="space-y-6">
            {/* Register modals */}
            {registerOperatorType === 'flight' && (
              <RegisterOperatorModal
                type="flight"
                onClose={() => setRegisterOperatorType(null)}
                onRegistered={(op) => { setFlightOperators(prev => [op as FlightOperatorListDto, ...prev]); setRegisterOperatorType(null) }}
              />
            )}
            {registerOperatorType === 'bus' && (
              <RegisterOperatorModal
                type="bus"
                onClose={() => setRegisterOperatorType(null)}
                onRegistered={(op) => { setBusOperators(prev => [op as BusOperatorListDto, ...prev]); setRegisterOperatorType(null) }}
              />
            )}
            {registerOperatorType === 'cab' && (
              <RegisterOperatorModal
                type="cab"
                onClose={() => setRegisterOperatorType(null)}
                onRegistered={(op) => { setCabOperators(prev => [op as CabOperatorListDto, ...prev]); setRegisterOperatorType(null) }}
              />
            )}

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Transport Operators</h2>
              <Button onClick={() => setRegisterOperatorType(operatorSubTab)}
                className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" /> Register {operatorSubTab === 'flight' ? 'Airline' : operatorSubTab === 'bus' ? 'Bus Operator' : 'Cab Operator'}
              </Button>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-2">
              {([['flight', 'Airlines', Plane], ['bus', 'Bus Operators', Bus], ['cab', 'Cab Operators', Car]] as const).map(([id, label, Icon]) => (
                <button key={id} onClick={() => setOperatorSubTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    operatorSubTab === id ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {operatorsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full"><tbody>{skeletonRows(6)}</tbody></table>
              </div>
            ) : (
              <>
                {/* Flight Operators */}
                {operatorSubTab === 'flight' && (
                  flightOperators.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                      <Plane className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No airlines registered yet.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {['Airline', 'IATA', 'City', 'Flights', 'Manager Email', 'Status', ''].map(h => (
                              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {flightOperators.map(o => (
                            <tr key={o.id} className="hover:bg-gray-50/50">
                              <td className="px-5 py-4 font-medium text-gray-900">{o.name}</td>
                              <td className="px-5 py-4 font-mono text-blue-700">{o.iataCode}</td>
                              <td className="px-5 py-4 text-gray-600">{o.headquartersCity ?? '—'}</td>
                              <td className="px-5 py-4 text-gray-700">{o.flightCount}</td>
                              <td className="px-5 py-4 text-gray-500 text-xs">{o.managerEmail ?? '—'}</td>
                              <td className="px-5 py-4">
                                <Badge variant={o.isActive ? 'success' : 'danger'}>{o.isActive ? 'Active' : 'Inactive'}</Badge>
                              </td>
                              <td className="px-5 py-4">
                                <button disabled={togglingOperatorId === o.id} onClick={() => handleToggleOperator(o.id, 'flight')}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${o.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                  {o.isActive ? <><ShieldOff className="h-3.5 w-3.5" />Deactivate</> : <><ShieldCheck className="h-3.5 w-3.5" />Activate</>}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* Bus Operators */}
                {operatorSubTab === 'bus' && (
                  busOperators.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                      <Bus className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No bus operators registered yet.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {['Company', 'City', 'Bus Types', 'Manager Email', 'Status', ''].map(h => (
                              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {busOperators.map(o => (
                            <tr key={o.id} className="hover:bg-gray-50/50">
                              <td className="px-5 py-4 font-medium text-gray-900">{o.name}</td>
                              <td className="px-5 py-4 text-gray-600">{o.headquartersCity ?? '—'}</td>
                              <td className="px-5 py-4 text-gray-500 text-xs">{o.busTypes ?? '—'}</td>
                              <td className="px-5 py-4 text-gray-500 text-xs">{o.managerEmail ?? '—'}</td>
                              <td className="px-5 py-4">
                                <Badge variant={o.isActive ? 'success' : 'danger'}>{o.isActive ? 'Active' : 'Inactive'}</Badge>
                              </td>
                              <td className="px-5 py-4">
                                <button disabled={togglingOperatorId === o.id} onClick={() => handleToggleOperator(o.id, 'bus')}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${o.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                  {o.isActive ? <><ShieldOff className="h-3.5 w-3.5" />Deactivate</> : <><ShieldCheck className="h-3.5 w-3.5" />Activate</>}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* Cab Operators */}
                {operatorSubTab === 'cab' && (
                  cabOperators.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                      <Car className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No cab operators registered yet.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-100">
                            {['Company', 'City', 'Type', 'Cab Types', 'Manager Email', 'Status', ''].map(h => (
                              <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {cabOperators.map(o => (
                            <tr key={o.id} className="hover:bg-gray-50/50">
                              <td className="px-5 py-4 font-medium text-gray-900">{o.name}</td>
                              <td className="px-5 py-4 text-gray-600">{o.city ?? '—'}</td>
                              <td className="px-5 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${o.isIndividualDriver ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                  {o.isIndividualDriver ? 'Individual' : 'Company'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-gray-500 text-xs">{o.cabTypes ?? '—'}</td>
                              <td className="px-5 py-4 text-gray-500 text-xs">{o.managerEmail ?? '—'}</td>
                              <td className="px-5 py-4">
                                <Badge variant={o.isActive ? 'success' : 'danger'}>{o.isActive ? 'Active' : 'Inactive'}</Badge>
                              </td>
                              <td className="px-5 py-4">
                                <button disabled={togglingOperatorId === o.id} onClick={() => handleToggleOperator(o.id, 'cab')}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${o.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                                  {o.isActive ? <><ShieldOff className="h-3.5 w-3.5" />Deactivate</> : <><ShieldCheck className="h-3.5 w-3.5" />Activate</>}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}

        {/* ── HOTELS ────────────────────────────────────────────────── */}
        {tab === 'hotels' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Registered Hotels</h2>
              <Button onClick={() => setRegisterHotelOpen(true)}
                className="flex items-center gap-2 text-sm">
                <Plus className="h-4 w-4" /> Register Hotel
              </Button>
            </div>

            {hotelsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full"><tbody>{skeletonRows(6)}</tbody></table>
              </div>
            ) : hotels.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <Hotel className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No hotels registered yet.</p>
                <button onClick={() => setRegisterHotelOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  <Plus className="h-4 w-4" /> Register First Hotel
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Hotel</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">City</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stars</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rooms</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Manager Email</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {hotels.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-4">
                          <p className="font-medium text-gray-900">{h.name}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px]">{h.address}</p>
                        </td>
                        <td className="px-5 py-4 text-gray-700">{h.city}</td>
                        <td className="px-5 py-4 text-center text-amber-500 font-semibold">{'★'.repeat(Math.floor(h.starRating))}</td>
                        <td className="px-5 py-4 text-center text-gray-700">{h.roomCount}</td>
                        <td className="px-5 py-4 text-gray-500 text-xs">{h.managerEmail ?? '—'}</td>
                        <td className="px-5 py-4 text-center">
                          <Badge variant={h.isActive ? 'success' : 'danger'}>
                            {h.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            disabled={togglingHotelId === h.id}
                            onClick={() => handleToggleHotel(h.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${
                              h.isActive
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {h.isActive
                              ? <><ShieldOff className="h-3.5 w-3.5" /> Deactivate</>
                              : <><ShieldCheck className="h-3.5 w-3.5" /> Activate</>}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── FLIGHTS ───────────────────────────────────────────────── */}
        {tab === 'flights' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">Flight Management</h2>
              <div className="ml-auto flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  placeholder="Search flight, airline, route…"
                  value={flightSearch}
                  onChange={e => setFlightSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadFlights()}
                  className="w-56 text-sm outline-none"
                />
              </div>
              <button onClick={loadFlights} className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                <RefreshCw className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {flightsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full"><tbody>{skeletonRows(7)}</tbody></table>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Flight</th>
                      <th className="text-left px-5 py-3">Route</th>
                      <th className="text-left px-5 py-3">Departure</th>
                      <th className="text-right px-5 py-3">Economy</th>
                      <th className="text-right px-5 py-3">Business</th>
                      <th className="text-center px-5 py-3">Seats</th>
                      <th className="text-center px-5 py-3">Status</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {adminFlights.map(f => (
                      <tr key={f.id} className="hover:bg-gray-50/50">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-gray-900">{f.flightNumber}</p>
                          <p className="text-xs text-gray-400">{f.airline}</p>
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">{f.source} → {f.destination}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {new Date(f.departureTime).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{formatCurrency(f.economyPrice)}</td>
                        <td className="px-5 py-3.5 text-right text-gray-500 text-xs">{f.businessPrice ? formatCurrency(f.businessPrice) : '—'}</td>
                        <td className="px-5 py-3.5 text-center text-gray-700">{f.availableSeats}/{f.totalSeats}</td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge variant={f.isActive ? 'success' : 'danger'}>{f.isActive ? 'Active' : 'Inactive'}</Badge>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => { setEditingFlight(f); setFlightEditForm({ economyPrice: f.economyPrice, businessPrice: f.businessPrice, totalSeats: f.totalSeats, availableSeats: f.availableSeats, isActive: f.isActive }) }}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Flight edit modal */}
            {editingFlight && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingFlight(null)} />
                <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Edit {editingFlight.flightNumber}</h3>
                      <p className="text-xs text-gray-400">{editingFlight.airline} · {editingFlight.source}→{editingFlight.destination}</p>
                    </div>
                    <button onClick={() => setEditingFlight(null)}><X className="h-5 w-5 text-gray-400" /></button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {([
                        { label: 'Economy Price (₹)', key: 'economyPrice' },
                        { label: 'Business Price (₹)', key: 'businessPrice' },
                        { label: 'Total Seats',        key: 'totalSeats' },
                        { label: 'Available Seats',    key: 'availableSeats' },
                      ] as { label: string; key: keyof AdminUpdateFlightRequest }[]).map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}</label>
                          <input
                            type="number"
                            value={(flightEditForm[f.key] as number | undefined) ?? ''}
                            onChange={e => setFlightEditForm(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input type="checkbox" checked={flightEditForm.isActive ?? true}
                        onChange={e => setFlightEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="h-4 w-4 accent-blue-600" />
                      Active (visible to customers)
                    </label>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button onClick={() => setEditingFlight(null)} className="px-4 py-2 text-sm text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
                    <Button loading={savingFlight} onClick={handleSaveFlight} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ANNOUNCEMENTS ─────────────────────────────────────────── */}
        {tab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4">Create Announcement</h3>
              <div className="grid gap-3 md:grid-cols-[1fr_140px_160px_auto]">
                <input
                  placeholder="Announcement message…"
                  value={announcementForm.message}
                  onChange={e => setAnnouncementForm(f => ({ ...f, message: e.target.value }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={announcementForm.type}
                  onChange={e => setAnnouncementForm(f => ({ ...f, type: e.target.value as 'info' | 'warning' | 'success' }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                </select>
                <input
                  type="date"
                  value={announcementForm.expiresAt ?? ''}
                  onChange={e => setAnnouncementForm(f => ({ ...f, expiresAt: e.target.value || undefined }))}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button loading={savingAnnouncement} onClick={handleCreateAnnouncement} className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap">
                  <Plus className="h-4 w-4 mr-1" /> Publish
                </Button>
              </div>
            </div>

            {announcementsLoading ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : announcements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <Megaphone className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map(a => (
                  <div key={a.id} className={`flex items-start gap-4 rounded-2xl border p-4 ${
                    a.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                    a.type === 'success' ? 'bg-emerald-50 border-emerald-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{a.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: <strong className="capitalize">{a.type}</strong>
                        {a.expiresAt && ` · Expires ${fmtDate(a.expiresAt)}`}
                        · Published {fmtDate(a.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={a.isActive ? 'success' : 'danger'}>{a.isActive ? 'Active' : 'Paused'}</Badge>
                      <button onClick={() => handleToggleAnnouncement(a)}
                        className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-300 hover:bg-white transition-colors">
                        {a.isActive ? 'Pause' : 'Resume'}
                      </button>
                      <button onClick={() => handleDeleteAnnouncement(a.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USER OVERVIEW MODAL ────────────────────────────────────── */}
        {(viewingUser || userOverviewLoading) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setViewingUser(null) }} />
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
              {userOverviewLoading ? (
                <div className="p-16 text-center text-gray-400">Loading user profile…</div>
              ) : viewingUser ? (
                <>
                  <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{viewingUser.name}</h3>
                      <p className="text-xs text-gray-400">{viewingUser.email} · {viewingUser.role}</p>
                    </div>
                    <button onClick={() => setViewingUser(null)}><X className="h-5 w-5 text-gray-400" /></button>
                  </div>
                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <p className="text-xs text-gray-400">Wallet Balance</p>
                        <p className="font-bold text-gray-900 mt-1">{formatCurrency(viewingUser.walletBalance)}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <p className="text-xs text-gray-400">Status</p>
                        <p className={`font-bold mt-1 ${viewingUser.isActive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {viewingUser.isActive ? 'Active' : 'Blocked'}
                        </p>
                      </div>
                      <div className="rounded-xl bg-gray-50 p-3 text-center">
                        <p className="text-xs text-gray-400">Member Since</p>
                        <p className="font-bold text-gray-900 mt-1">{fmtDate(viewingUser.createdAt)}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-700 mb-3">Recent Bookings ({viewingUser.recentBookings.length})</h4>
                      {viewingUser.recentBookings.length === 0 ? (
                        <p className="text-sm text-gray-400">No bookings yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {viewingUser.recentBookings.map(b => (
                            <div key={b.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                              <div>
                                <p className="font-mono text-xs font-bold text-gray-800">{b.bookingReference}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {b.type} · {b.type === 'Flight' ? `${b.originCity}→${b.destinationCity}` : (b.hotelName ?? b.type)}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">{formatCurrency(b.finalAmount)}</p>
                                <Badge variant={String(b.status) === 'Confirmed' ? 'success' : String(b.status) === 'Cancelled' ? 'danger' : 'default'}
                                  className="text-xs mt-0.5">{String(b.status)}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
