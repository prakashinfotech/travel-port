import { useState, useEffect } from 'react'
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

// Deterministic booked seat generator
function getBookedSeats(busId: string, _total: number): Set<string> {
  let hash = 0
  for (let i = 0; i < busId.length; i++) hash = (hash * 31 + busId.charCodeAt(i)) & 0x7fffffff
  const rng = (n: number) => { hash = (hash * 1664525 + 1013904223) & 0x7fffffff; return hash % n }
  const booked = new Set<string>()
  const count  = 8 + rng(10)
  const rows   = 10
  const cols   = ['A', 'B', 'C', 'D']
  while (booked.size < count) {
    const r = 1 + rng(rows)
    const c = cols[rng(4)]
    booked.add(`${r}${c}`)
  }
  return booked
}

const STEP_LABELS = ['Seats', 'Points', 'Info', 'Traveller', 'Payment']

interface SeatLayoutProps {
  bus: BusDto
  seats: number
  selected: string[]
  onSelect: (seats: string[]) => void
}

function SeatLayout({ bus, seats, selected, onSelect }: SeatLayoutProps) {
  const booked = getBookedSeats(bus.id, bus.totalSeats ?? 40)
  const rows   = 10
  const isWindow = (col: string) => col === 'A' || col === 'D'

  const toggle = (id: string) => {
    if (booked.has(id)) return
    if (selected.includes(id)) {
      onSelect(selected.filter(s => s !== id))
    } else {
      if (selected.length < seats) onSelect([...selected, id])
    }
  }

  return (
    <div>
      <div className="flex items-center gap-6 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-gray-100 border border-gray-300 inline-block" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-green-100 border border-green-500 inline-block" /> Selected</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-red-100 border border-red-300 inline-block" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="w-5 h-5 rounded bg-yellow-50 border border-yellow-400 inline-block" /> Window +₹50</span>
      </div>

      {/* Bus front indicator */}
      <div className="text-center mb-3">
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Driver / Front</span>
      </div>

      {/* Seat grid: 2 seats | aisle | 2 seats */}
      <div className="max-w-xs mx-auto space-y-1.5">
        {Array.from({ length: rows }, (_, ri) => {
          const row = ri + 1
          return (
            <div key={row} className="flex items-center gap-1">
              <span className="text-xs text-gray-400 w-5 text-right">{row}</span>
              {['A', 'B'].map(col => {
                const id      = `${row}${col}`
                const isBook  = booked.has(id)
                const isSel   = selected.includes(id)
                const isWin   = isWindow(col)
                return (
                  <button
                    key={col}
                    title={isBook ? 'Booked' : isWin ? `${id} (Window +₹50)` : id}
                    onClick={() => toggle(id)}
                    disabled={isBook}
                    className={`w-8 h-7 rounded text-xs font-semibold border transition-colors ${
                      isBook  ? 'bg-red-100 border-red-200 text-red-300 cursor-not-allowed' :
                      isSel   ? 'bg-green-500 border-green-600 text-white' :
                      isWin   ? 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100' :
                                'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {col}
                  </button>
                )
              })}
              <div className="w-5" /> {/* aisle */}
              {['C', 'D'].map(col => {
                const id      = `${row}${col}`
                const isBook  = booked.has(id)
                const isSel   = selected.includes(id)
                const isWin   = isWindow(col)
                return (
                  <button
                    key={col}
                    title={isBook ? 'Booked' : isWin ? `${id} (Window +₹50)` : id}
                    onClick={() => toggle(id)}
                    disabled={isBook}
                    className={`w-8 h-7 rounded text-xs font-semibold border transition-colors ${
                      isBook  ? 'bg-red-100 border-red-200 text-red-300 cursor-not-allowed' :
                      isSel   ? 'bg-green-500 border-green-600 text-white' :
                      isWin   ? 'bg-yellow-50 border-yellow-400 text-yellow-700 hover:bg-yellow-100' :
                                'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {col}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      <p className="text-center text-xs text-gray-500 mt-3">
        Select {seats} seat{seats > 1 ? 's' : ''} · {selected.length}/{seats} selected
        {selected.some(s => s.endsWith('A') || s.endsWith('D')) && <span className="text-yellow-600"> · Window premium applied</span>}
      </p>
    </div>
  )
}

export default function BookBusPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const bus      = location.state?.bus as BusDto | undefined
  const seats    = (location.state?.seats as number) ?? 1

  const authUser   = useAppSelector(s => s.auth.user)
  const isLoggedIn = !!authUser

  const [step, setStep]               = useState(1)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [boardingPoint, setBoardingPoint] = useState('')
  const [droppingPoint, setDroppingPoint] = useState('')
  const [submitting, setSubmitting]     = useState(false)
  const [apiError, setApiError]         = useState<string | null>(null)
  const [discount, setDiscount]         = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError]   = useState('')
  const [appliedCode, setAppliedCode]   = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>({ type: 'new_card' })
  const [showAddCard, setShowAddCard]   = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: authUser?.email ?? '', firstName: authUser?.name?.split(' ')[0] ?? '' },
  })

  useEffect(() => {
    if (isLoggedIn) userService.getWallet().then(r => setWalletBalance(r.data?.balance ?? 0)).catch(() => {})
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

  const windowSeats     = selectedSeats.filter(s => s.endsWith('A') || s.endsWith('D')).length
  const windowSurcharge = windowSeats * 50
  const basePrice       = bus.price * seats + windowSurcharge
  const finalPrice      = basePrice - discount

  const boardingOptions  = (bus.boardingPoints  ?? bus.origin).split(',').map(s => s.trim()).filter(Boolean)
  const droppingOptions  = (bus.droppingPoints ?? bus.destination).split(',').map(s => s.trim()).filter(Boolean)

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
        navigate(`/payment?bookingId=${bookingId}&amount=${finalPrice}`)
        return
      }
      navigate('/bookings', { state: { bookingRef: data.data?.bookingReference } })
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { errors?: string[] } } })?.response?.data?.errors?.[0]
      setApiError(msg ?? 'Booking failed. Please try again.')
    } finally { setSubmitting(false) }
  }

  const canProceedStep1 = selectedSeats.length === seats
  const canProceedStep2 = !!boardingPoint && !!droppingPoint

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-700 text-white py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-1 rounded hover:bg-green-600 transition-colors">
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
            const s = idx + 1
            const done   = s < step
            const active = s === step
            return (
              <div key={s} className="flex items-center gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  active ? 'bg-green-600 text-white' :
                  done   ? 'bg-green-100 text-green-700' :
                           'bg-gray-100 text-gray-400'
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

          {/* Step 1: Seat Selection */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">1</span>
                Select Your Seat{seats > 1 ? 's' : ''} ({seats} required)
              </h3>
              <SeatLayout bus={bus} seats={seats} selected={selectedSeats} onSelect={setSelectedSeats} />
              <button
                onClick={() => { if (canProceedStep1) setStep(2) }}
                disabled={!canProceedStep1}
                className="mt-5 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue to Boarding Points
              </button>
            </div>
          )}

          {/* Step 2: Boarding & Dropping */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">2</span>
                Boarding & Dropping Points
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <MapPin size={14} className="text-green-600" /> Boarding Point
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {boardingOptions.map(pt => (
                      <label key={pt} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${boardingPoint === pt ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="boarding" value={pt} checked={boardingPoint === pt} onChange={() => setBoardingPoint(pt)} className="accent-green-600" />
                        <span className="text-sm text-gray-700">{pt}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                    <MapPin size={14} className="text-red-500" /> Dropping Point
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {droppingOptions.map(pt => (
                      <label key={pt} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${droppingPoint === pt ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="dropping" value={pt} checked={droppingPoint === pt} onChange={() => setDroppingPoint(pt)} className="accent-green-600" />
                        <span className="text-sm text-gray-700">{pt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => { if (canProceedStep2) setStep(3) }}
                disabled={!canProceedStep2}
                className="mt-5 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Additional Info */}
          {step === 3 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold">3</span>
                Additional Information (Optional)
              </h3>
              <textarea
                {...register('additionalInfo')}
                rows={4}
                placeholder="Any special requirements, accessibility needs, or notes for the operator..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              />
              <button
                onClick={() => setStep(4)}
                className="mt-4 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Continue to Traveller Details
              </button>
            </div>
          )}

          {/* Step 4: Traveller Details */}
          {step === 4 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Users size={18} className="text-green-600" />
                Traveller Details
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
                  <input {...register('firstName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="First name" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                  <input {...register('lastName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Last name" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email *</label>
                  <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="email@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone *</label>
                  <input {...register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="+91 9999999999" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
              <button
                onClick={handleSubmit(() => setStep(5))}
                className="mt-5 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {/* Step 5: Coupon + Payment */}
          {step === 5 && (
            <>
              {/* Coupon */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Tag size={18} className="text-green-600" />
                  Apply Coupon
                </h3>
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <span className="text-green-700 font-semibold text-sm">{appliedCode} — Saved {formatCurrency(discount)}</span>
                    <button onClick={removeCoupon} className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      {...register('couponCode')}
                      placeholder="Enter coupon code"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      type="button"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
                {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
              </div>

              {/* Payment */}
              {isLoggedIn && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                      <CreditCard size={18} className="text-green-600" />
                      Payment Method
                    </h3>
                    <button type="button" onClick={() => setShowAddCard(true)} className="text-xs text-green-600 font-semibold hover:underline">+ Add Card</button>
                  </div>
                  <PaymentMethodSelector
                    walletBalance={walletBalance}
                    requiredAmount={finalPrice}
                    selected={paymentChoice}
                    onSelect={setPaymentChoice}
                  />
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

        {/* Right — booking summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-green-500" />
              Booking Summary
            </h3>

            {/* Selected seats */}
            {selectedSeats.length > 0 && (
              <div className="mb-3 p-2.5 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Seats</p>
                <div className="flex flex-wrap gap-1">
                  {selectedSeats.map(s => (
                    <span key={s} className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-semibold">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Boarding/dropping */}
            {(boardingPoint || droppingPoint) && (
              <div className="mb-3 text-xs text-gray-600 space-y-1">
                {boardingPoint && <p className="flex items-center gap-1"><MapPin size={10} className="text-green-600" /><span className="font-medium">Boarding:</span> {boardingPoint}</p>}
                {droppingPoint && <p className="flex items-center gap-1"><MapPin size={10} className="text-red-500" /><span className="font-medium">Dropping:</span> {droppingPoint}</p>}
              </div>
            )}

            <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
              <div className="flex justify-between text-gray-600">
                <span>Fare × {seats}</span>
                <span>{formatCurrency(bus.price * seats)}</span>
              </div>
              {windowSurcharge > 0 && (
                <div className="flex justify-between text-yellow-700">
                  <span>Window seats ({windowSeats}×₹50)</span>
                  <span>+{formatCurrency(windowSurcharge)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({appliedCode})</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span className="text-green-700">{formatCurrency(finalPrice)}</span>
              </div>
            </div>

            {apiError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {apiError}
              </div>
            )}

            {step === 5 && (
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={submitting}
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {submitting ? 'Processing...' : `Confirm & Pay ${formatCurrency(finalPrice)}`}
              </button>
            )}

            {!isLoggedIn && step === 5 && (
              <p className="mt-2 text-center text-xs text-gray-500">
                <Link to="/login" className="text-green-600 font-semibold">Login</Link> to complete booking
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <Shield size={12} className="text-green-400" />
              <span>Secure payment · 90% refund on cancellation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
