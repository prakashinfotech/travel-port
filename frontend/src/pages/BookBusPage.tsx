import { useState, useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Bus, Clock, MapPin, Users, Tag, CreditCard, Shield, X, CheckCircle, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { BusDto, BookBusRequest } from '@/types'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import { formatCurrency } from '@/utils/formatters'
import { PaymentMethodSelector } from '@/components/common/PaymentMethodSelector'
import { AddCardModal } from '@/components/common/AddCardModal'
import type { PaymentChoice } from '@/components/common/PaymentMethodSelector'
import { SavedTravellerPicker } from '@/components/common/SavedTravellerPicker'
import { useAppSelector } from '@/hooks/useAppDispatch'
import { userService } from '@/services/userService'

const schema = z.object({
  firstName:      z.string().min(1, 'First name required'),
  lastName:       z.string().min(1, 'Last name required'),
  email:          z.string().email('Valid email required'),
  phone:          z.string().min(10, 'Valid phone required'),
  additionalInfo: z.string().optional(),
  couponCode:     z.string().optional(),
})
type FormValues = z.infer<typeof schema>

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDur(mins: number) {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

const STEP_LABELS = ['Seats', 'Points', 'Traveller', 'Payment']

// ─── Seat Layout ────────────────────────────────────────────────────────────

interface SeatLayoutProps {
  bus: BusDto
  seats: number
  selected: number[]
  lockedByOthers: number[]
  onSelect: (seats: number[]) => void
}

function SeatLayout({ bus, seats, selected, lockedByOthers, onSelect }: SeatLayoutProps) {
  const totalSeats   = bus.totalSeats ?? 40
  const seatsPerDeck = Math.floor(totalSeats / 2)    // 20
  const rowsPerDeck  = Math.ceil(seatsPerDeck / 4)   // 5

  // Deterministic booked seats — same algorithm as preview
  const bookedSet = useMemo(() => {
    const bookedCount = totalSeats - bus.availableSeats
    let hash = 0
    for (let i = 0; i < bus.id.length; i++) hash = (hash * 31 + bus.id.charCodeAt(i)) & 0x7fffffff
    const rng = () => { hash = (hash * 1664525 + 1013904223) & 0x7fffffff; return hash }
    const set = new Set<number>()
    while (set.size < Math.min(bookedCount, totalSeats)) {
      set.add((rng() % totalSeats) + 1)
    }
    return set
  }, [bus.id, bus.availableSeats, totalSeats])

  // Right-window column is female-reserved (same as preview)
  const femaleSeats = useMemo(() => {
    const set = new Set<number>()
    for (let r = 0; r < rowsPerDeck; r++) {
      set.add(r * 4 + 4)                  // lower deck right-window
      set.add(seatsPerDeck + r * 4 + 4)  // upper deck right-window
    }
    return set
  }, [seatsPerDeck, rowsPerDeck])

  const isWindow = (n: number) => { const p = (n - 1) % 4; return p === 0 || p === 3 }

  const toggle = (n: number) => {
    if (bookedSet.has(n) || lockedByOthers.includes(n)) return
    if (selected.includes(n)) {
      onSelect(selected.filter(s => s !== n))
    } else if (selected.length < seats) {
      onSelect([...selected, n])
    }
  }

  const seatCls = (n: number) => {
    if (selected.includes(n))        return 'bg-green-600 border-green-700 text-white shadow-sm'
    if (bookedSet.has(n))            return 'bg-red-100 border-red-200 text-red-400 cursor-not-allowed'
    if (lockedByOthers.includes(n))  return 'bg-amber-100 border-amber-400 text-amber-700 cursor-not-allowed'
    if (femaleSeats.has(n))          return 'bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200 cursor-pointer'
    if (isWindow(n))                 return 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100 cursor-pointer'
    return 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer'
  }

  const DeckRows = ({ label, start }: { label: string; start: number }) => (
    <div className="mb-5">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex items-center gap-1 mb-1 pl-5 text-xs text-gray-400">
        <span className="w-9 text-center">Win</span>
        <span className="w-9 text-center">Aisle</span>
        <div className="w-6" />
        <span className="w-9 text-center">Aisle</span>
        <span className="w-9 text-center">Win</span>
      </div>
      {Array.from({ length: rowsPerDeck }, (_, row) => {
        const s = start + row * 4
        return (
          <div key={row} className="flex items-center gap-1 mb-1.5">
            <span className="text-xs text-gray-400 w-4 text-right shrink-0">{row + 1}</span>
            {[s, s + 1].map(n => (
              <button key={n} onClick={() => toggle(n)} disabled={bookedSet.has(n) || lockedByOthers.includes(n)}
                title={bookedSet.has(n) ? 'Booked' : lockedByOthers.includes(n) ? 'Locked by another user' : femaleSeats.has(n) ? `Seat ${n} · Female` : isWindow(n) ? `Seat ${n} · Window (+₹50)` : `Seat ${n}`}
                className={`w-9 h-8 rounded border text-xs font-bold transition-colors ${seatCls(n)}`}>{n}</button>
            ))}
            <div className="w-6 flex items-center justify-center text-gray-200 select-none">|</div>
            {[s + 2, s + 3].map(n => (
              <button key={n} onClick={() => toggle(n)} disabled={bookedSet.has(n) || lockedByOthers.includes(n)}
                title={bookedSet.has(n) ? 'Booked' : lockedByOthers.includes(n) ? 'Locked by another user' : femaleSeats.has(n) ? `Seat ${n} · Female` : isWindow(n) ? `Seat ${n} · Window (+₹50)` : `Seat ${n}`}
                className={`w-9 h-8 rounded border text-xs font-bold transition-colors ${seatCls(n)}`}>{n}</button>
            ))}
          </div>
        )
      })}
    </div>
  )

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-gray-50 border border-gray-300 shrink-0" />Available</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-600 border border-green-700 shrink-0" />Selected</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-100 border border-red-200 shrink-0" />Booked</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-amber-100 border border-amber-400 shrink-0" />Locked</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-50 border border-yellow-400 shrink-0" />Window (+₹50)</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-pink-100 border border-pink-300 shrink-0" />Female</span>
      </div>

      <div className="text-center mb-3">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">← Front of Bus (Driver)</span>
      </div>

      <DeckRows label="Lower Deck" start={1} />
      <DeckRows label="Upper Deck" start={seatsPerDeck + 1} />

      <p className="text-center text-xs text-gray-500 mt-2">
        {selected.length}/{seats} seat{seats > 1 ? 's' : ''} selected
        {selected.some(n => isWindow(n)) && <span className="text-yellow-600 ml-2">· Window premium included</span>}
        {selected.some(n => femaleSeats.has(n)) && <span className="text-pink-600 ml-2">· Female seat selected</span>}
      </p>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BookBusPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const bus      = location.state?.bus as BusDto | undefined
  const seats    = (location.state?.seats as number) ?? 1

  const authUser   = useAppSelector(s => s.auth.user)
  const isLoggedIn = !!authUser

  const [step, setStep]                       = useState(1)
  const [selectedSeats, setSelectedSeats]     = useState<number[]>([])
  const [lockedByOthers, setLockedByOthers]   = useState<number[]>([])
  const [boardingPoint, setBoardingPoint]     = useState('')
  const [droppingPoint, setDroppingPoint]     = useState('')
  const [submitting, setSubmitting]           = useState(false)
  const [apiError, setApiError]               = useState<string | null>(null)

  // Refs for the unmount cleanup (avoids stale closures)
  const selectedSeatsRef = useRef<number[]>([])
  const busIdRef = useRef<string | undefined>(bus?.id)
  const isLoggedInRef = useRef(isLoggedIn)
  useEffect(() => { selectedSeatsRef.current = selectedSeats }, [selectedSeats])
  useEffect(() => { isLoggedInRef.current = isLoggedIn }, [isLoggedIn])

  // Poll locked seats every 4 s while on the seat-selection step
  useEffect(() => {
    if (!bus || !isLoggedIn) return
    const fetchLocked = async () => {
      try {
        const { data } = await api.get(endpoints.buses.lockedSeats(bus.id))
        setLockedByOthers((data.data ?? []).map(Number))
      } catch {}
    }
    fetchLocked()
    const id = setInterval(fetchLocked, 4000)
    return () => clearInterval(id)
  }, [bus?.id, isLoggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  // Release all selected seat locks when navigating away
  useEffect(() => {
    return () => {
      const seats = selectedSeatsRef.current
      const bid   = busIdRef.current
      if (seats.length > 0 && bid && isLoggedInRef.current) {
        api.delete(endpoints.buses.lockSeats(bid), { data: { seatNumbers: seats.map(String) } }).catch(() => {})
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [discount, setDiscount]             = useState(0)
  const [couponApplied, setCouponApplied]   = useState(false)
  const [couponLoading, setCouponLoading]   = useState(false)
  const [couponError, setCouponError]       = useState('')
  const [appliedCode, setAppliedCode]       = useState('')
  const [walletBalance, setWalletBalance]   = useState(0)
  const [paymentChoice, setPaymentChoice]   = useState<PaymentChoice>({ type: 'new_card' })
  const [showAddCard, setShowAddCard]       = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: authUser?.email ?? '', firstName: authUser?.name?.split(' ')[0] ?? '' },
  })

  useEffect(() => {
    if (isLoggedIn) {
      userService.getWallet().then(r => setWalletBalance(r.data?.balance ?? 0)).catch(() => {})
    }
  }, [isLoggedIn])

  if (!bus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No bus selected. Please search for buses first.</p>
          <Link to="/buses" className="text-green-600 hover:underline">Search Buses</Link>
        </div>
      </div>
    )
  }

  // Derived fare values
  const totalSeats    = bus.totalSeats ?? 40
  const seatsPerDeck  = Math.floor(totalSeats / 2)
  const isWindowSeat  = (n: number) => { const p = (n - 1) % 4; return p === 0 || p === 3 }
  const windowSeats   = selectedSeats.filter(isWindowSeat).length
  const windowSurcharge = windowSeats * 50
  const basePrice     = bus.price * seats + windowSurcharge
  const finalPrice    = basePrice - discount

  // Boarding / dropping options
  const boardingOptions = (bus.boardingPoints  ?? bus.origin).split(',').map(s => s.trim()).filter(Boolean)
  const droppingOptions = (bus.droppingPoints  ?? bus.destination).split(',').map(s => s.trim()).filter(Boolean)

  const applyCoupon = async () => {
    const code = watch('couponCode')?.trim()
    if (!code) return
    setCouponLoading(true)
    setCouponError('')
    try {
      const { data } = await api.post(endpoints.coupons.validate, { code, amount: basePrice })
      setDiscount(data.data?.discountAmount ?? 0)
      setCouponApplied(true)
      setAppliedCode(code)
    } catch {
      setCouponError('Invalid or expired coupon')
      setDiscount(0)
      setCouponApplied(false)
    } finally { setCouponLoading(false) }
  }

  const removeCoupon = () => {
    setDiscount(0)
    setCouponApplied(false)
    setAppliedCode('')
    setCouponError('')
  }

  const onSubmit = async (values: FormValues) => {
    if (!isLoggedIn) { navigate('/login', { state: { from: location } }); return }
    setSubmitting(true)
    setApiError(null)
    try {
      const payload: BookBusRequest = {
        busId:           bus.id,
        operator:        bus.operator,
        busType:         bus.busType,
        origin:          bus.origin,
        destination:     bus.destination,
        departureTime:   bus.departureTime,
        arrivalTime:     bus.arrivalTime,
        durationMinutes: bus.durationMinutes,
        price:           bus.price + windowSurcharge / seats,
        amenities:       bus.amenities,
        seats,
        selectedSeats:   selectedSeats.length > 0 ? selectedSeats.join(', ') : undefined,
        boardingPoint:   boardingPoint || undefined,
        droppingPoint:   droppingPoint || undefined,
        additionalInfo:  values.additionalInfo || undefined,
        busNumber:       bus.busNumber,
        driverPhone:     bus.driverPhone,
        couponCode:      couponApplied ? appliedCode : undefined,
        useWallet:       paymentChoice.type === 'wallet',
        savedCardId:     paymentChoice.type === 'saved_card' ? paymentChoice.cardId : undefined,
        guestName:       `${values.firstName} ${values.lastName}`,
        guestEmail:      values.email,
        guestPhone:      values.phone,
      }

      const { data } = await api.post(endpoints.buses.book, payload)
      const bookingId = data.data?.id
      if (paymentChoice.type === 'new_card' && bookingId) {
        navigate(`/payment?bookingId=${bookingId}&amount=${finalPrice}&bookingType=bus`)
        return
      }
      if (bookingId) {
        navigate(`/buses/booking/${bookingId}/confirm?new=true`)
        return
      }
      navigate('/bookings', { state: { bookingRef: data.data?.bookingReference } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors?.[0]
      setApiError(msg ?? 'Booking failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  const handleSeatSelect = async (newSeats: number[]) => {
    const added   = newSeats.filter(s => !selectedSeats.includes(s))
    const removed = selectedSeats.filter(s => !newSeats.includes(s))
    setSelectedSeats(newSeats)
    if (!isLoggedIn || !bus) return
    try {
      if (added.length > 0)
        await api.post(endpoints.buses.lockSeats(bus.id), { seatNumbers: added.map(String) })
      if (removed.length > 0)
        await api.delete(endpoints.buses.lockSeats(bus.id), { data: { seatNumbers: removed.map(String) } })
    } catch {}
  }

  const canProceedStep1 = selectedSeats.length === seats
  const canProceedStep2 = !!boardingPoint && !!droppingPoint

  // Female seat set for display in summary
  const femaleSet = useMemo(() => {
    const rowsPerDeck = Math.ceil(seatsPerDeck / 4)
    const set = new Set<number>()
    for (let r = 0; r < rowsPerDeck; r++) {
      set.add(r * 4 + 4)
      set.add(seatsPerDeck + r * 4 + 4)
    }
    return set
  }, [seatsPerDeck])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-700 text-white py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="p-1 rounded hover:bg-green-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Bus size={22} />
          <span className="font-bold text-lg">Complete Bus Booking</span>
        </div>
      </div>

      {/* Step progress */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-1 overflow-x-auto">
          {STEP_LABELS.map((label, idx) => {
            const s    = idx + 1
            const done = s < step
            const active = s === step
            return (
              <div key={s} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  active ? 'bg-green-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}>
                  {done ? <CheckCircle size={12} /> : <span>{s}</span>}
                  {label}
                </div>
                {idx < STEP_LABELS.length - 1 && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — steps */}
        <div className="lg:col-span-2 space-y-4">

          {/* Journey summary (always visible) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bus size={16} className="text-green-600" />
              <span className="font-semibold text-gray-800 text-sm">{bus.operator}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{bus.busType}</span>
              {bus.busNumber && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-auto">{bus.busNumber}</span>}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">{fmt(bus.departureTime)}</p>
                <p className="text-xs text-gray-500 flex items-center gap-0.5"><MapPin size={10} />{bus.origin}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{fmtDur(bus.durationMinutes)}</p>
                <div className="flex items-center gap-1 my-1">
                  <div className="h-px w-6 bg-gray-300" />
                  <Bus size={12} className="text-green-600" />
                  <div className="h-px w-6 bg-gray-300" />
                </div>
                <p className="text-xs text-gray-400">{fmtDate(bus.departureTime)}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{fmt(bus.arrivalTime)}</p>
                <p className="text-xs text-gray-500 flex items-center gap-0.5 justify-end"><MapPin size={10} />{bus.destination}</p>
              </div>
            </div>
          </div>

          {/* ── Step 1: Seat Selection ── */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Select Your Seat{seats > 1 ? 's' : ''} ({seats} required)
              </h3>
              <SeatLayout bus={bus} seats={seats} selected={selectedSeats} lockedByOthers={lockedByOthers} onSelect={handleSeatSelect} />
              <button
                onClick={() => canProceedStep1 && setStep(2)}
                disabled={!canProceedStep1}
                className="mt-5 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Boarding Points
              </button>
            </div>
          )}

          {/* ── Step 2: Boarding & Dropping ── */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Boarding & Dropping Points
              </h3>
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <MapPin size={14} className="text-green-600" /> Boarding Point
                  </p>
                  <div className="space-y-2">
                    {boardingOptions.map(pt => (
                      <label key={pt} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${boardingPoint === pt ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="boarding" value={pt} checked={boardingPoint === pt}
                          onChange={() => setBoardingPoint(pt)} className="accent-green-600" />
                        <span className="text-sm text-gray-700">{pt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <MapPin size={14} className="text-red-500" /> Dropping Point
                  </p>
                  <div className="space-y-2">
                    {droppingOptions.map(pt => (
                      <label key={pt} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${droppingPoint === pt ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="dropping" value={pt} checked={droppingPoint === pt}
                          onChange={() => setDroppingPoint(pt)} className="accent-green-600" />
                        <span className="text-sm text-gray-700">{pt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => canProceedStep2 && setStep(3)}
                disabled={!canProceedStep2}
                className="mt-5 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Traveller Details
              </button>
            </div>
          )}

          {/* ── Step 3: Traveller Details ── */}
          {step === 3 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={18} className="text-green-600" /> Traveller Details
              </h3>
              {isLoggedIn && (
                <SavedTravellerPicker
                  accentColor="green"
                  onFill={d => {
                    setValue('firstName', d.firstName)
                    setValue('lastName', d.lastName)
                    setValue('email', d.email)
                    setValue('phone', d.phone)
                  }}
                />
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                  <input {...register('firstName')} placeholder="First name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                  <input {...register('lastName')} placeholder="Last name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email *</label>
                  <input {...register('email')} type="email" placeholder="email@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone *</label>
                  <input {...register('phone')} placeholder="+91 9999999999"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Special Requirements (optional)</label>
                <textarea {...register('additionalInfo')} rows={3}
                  placeholder="Accessibility needs, dietary requirements, or notes for the operator…"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <button
                onClick={handleSubmit(() => setStep(4))}
                className="mt-5 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* ── Step 4: Coupon + Payment ── */}
          {step === 4 && (
            <>
              {/* Coupon */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Tag size={18} className="text-green-600" /> Apply Coupon
                </h3>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <span className="text-green-700 font-semibold text-sm">{appliedCode} — Saved {formatCurrency(discount)}</span>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input {...register('couponCode')} placeholder="Enter coupon code"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-green-500" />
                    <button type="button" onClick={applyCoupon} disabled={couponLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              </div>

              {/* Payment */}
              {isLoggedIn ? (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <CreditCard size={18} className="text-green-600" /> Payment Method
                    </h3>
                    <button type="button" onClick={() => setShowAddCard(true)}
                      className="text-xs text-green-600 font-semibold hover:underline">+ Add Card</button>
                  </div>
                  <PaymentMethodSelector
                    walletBalance={walletBalance}
                    requiredAmount={finalPrice}
                    selected={paymentChoice}
                    onSelect={setPaymentChoice}
                  />
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                  <Link to="/login" className="font-semibold underline">Login</Link> to use saved cards or wallet for payment.
                </div>
              )}

              {showAddCard && (
                <AddCardModal
                  onClose={() => setShowAddCard(false)}
                  onSaved={card => { setShowAddCard(false); setPaymentChoice({ type: 'saved_card', cardId: card.cardId }) }}
                />
              )}
            </>
          )}
        </div>

        {/* Right — booking summary (sticky) */}
        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4 space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Shield size={18} className="text-green-500" /> Booking Summary
            </h3>

            {/* Selected seats */}
            {selectedSeats.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1.5">Selected Seats</p>
                <div className="flex flex-wrap gap-1">
                  {selectedSeats.sort((a, b) => a - b).map(n => (
                    <span key={n}
                      className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        femaleSet.has(n) ? 'bg-pink-500 text-white' :
                        isWindowSeat(n) ? 'bg-yellow-500 text-white' :
                        n > seatsPerDeck ? 'bg-blue-600 text-white' :
                        'bg-green-600 text-white'
                      }`}>
                      {n}{n > seatsPerDeck ? ' (U)' : ' (L)'}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">(L) Lower · (U) Upper</p>
              </div>
            )}

            {/* Boarding/dropping */}
            {(boardingPoint || droppingPoint) && (
              <div className="text-xs text-gray-600 space-y-1 border-t border-gray-100 pt-3">
                {boardingPoint && <p className="flex items-center gap-1.5"><MapPin size={10} className="text-green-600 shrink-0" /><span className="font-medium">Boarding:</span> {boardingPoint}</p>}
                {droppingPoint && <p className="flex items-center gap-1.5"><MapPin size={10} className="text-red-500 shrink-0" /><span className="font-medium">Dropping:</span> {droppingPoint}</p>}
              </div>
            )}

            {/* Fare breakdown */}
            <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Base fare × {seats}</span>
                <span>{formatCurrency(bus.price * seats)}</span>
              </div>
              {windowSurcharge > 0 && (
                <div className="flex justify-between text-yellow-700">
                  <span>Window ({windowSeats} × ₹50)</span>
                  <span>+{formatCurrency(windowSurcharge)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({appliedCode})</span>
                  <span>− {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span className="text-green-700">{formatCurrency(finalPrice)}</span>
              </div>
            </div>

            {apiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {apiError}
              </div>
            )}

            {step === 4 && (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing…' : `Confirm & Pay ${formatCurrency(finalPrice)}`}
              </button>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Shield size={12} className="text-green-400 shrink-0" />
              <span>Secure payment · 90% refund on cancellation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
