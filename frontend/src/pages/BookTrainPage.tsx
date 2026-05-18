import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Train, Clock, MapPin, Users, Tag, CreditCard, Shield, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { TrainDto, TrainClassDto, BookTrainRequest } from '@/types'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import { formatCurrency } from '@/utils/formatters'
import { PaymentMethodSelector } from '@/components/common/PaymentMethodSelector'
import { AddCardModal } from '@/components/common/AddCardModal'
import type { PaymentChoice } from '@/components/common/PaymentMethodSelector'
import { SavedTravellerPicker } from '@/components/common/SavedTravellerPicker'
import { useAppSelector } from '@/hooks/useAppDispatch'
import { userService } from '@/services/userService'
import { useEffect } from 'react'

const schema = z.object({
  firstName:  z.string().min(1, 'First name required'),
  lastName:   z.string().min(1, 'Last name required'),
  email:      z.string().email('Valid email required'),
  phone:      z.string().min(10, 'Valid phone required'),
  couponCode: z.string().optional(),
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

export default function BookTrainPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const train      = location.state?.train as TrainDto | undefined
  const classInfo  = location.state?.classInfo as TrainClassDto | undefined
  const className  = location.state?.className as string | undefined
  const passengers = (location.state?.passengers as number) ?? 1

  const authUser   = useAppSelector(s => s.auth.user)
  const isLoggedIn = !!authUser

  const [submitting, setSubmitting]       = useState(false)
  const [apiError, setApiError]           = useState<string | null>(null)
  const [discount, setDiscount]           = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError]     = useState('')
  const [appliedCode, setAppliedCode]     = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>({ type: 'new_card' })
  const [showAddCard, setShowAddCard]     = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: authUser?.email ?? '', firstName: authUser?.name?.split(' ')[0] ?? '' },
  })

  useEffect(() => {
    if (isLoggedIn) userService.getWallet().then(r => setWalletBalance(r.data?.balance ?? 0)).catch(() => {})
  }, [isLoggedIn])

  if (!train || !classInfo || !className) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No train selected. Please search for trains first.</p>
          <Link to="/trains" className="text-blue-700 hover:underline">Search Trains</Link>
        </div>
      </div>
    )
  }

  const basePrice  = classInfo.price * passengers
  const finalPrice = basePrice - discount

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
      const payload: BookTrainRequest = {
        trainId:         train.id,
        trainNumber:     train.trainNumber,
        trainName:       train.trainName,
        class:           className,
        origin:          train.origin,
        destination:     train.destination,
        departureTime:   train.departureTime,
        arrivalTime:     train.arrivalTime,
        durationMinutes: train.durationMinutes,
        price:           classInfo.price,
        passengers,
        couponCode:      couponApplied ? appliedCode : undefined,
        useWallet:       paymentChoice.type === 'wallet',
        savedCardId:     paymentChoice.type === 'saved_card' ? paymentChoice.cardId : undefined,
        guestName:       `${values.firstName} ${values.lastName}`,
        guestEmail:      values.email,
        guestPhone:      values.phone,
      }

      const { data } = await api.post(endpoints.trains.book, payload)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-800 text-white py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-blue-700 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Train size={22} />
          <span className="font-bold text-lg">Complete Train Booking</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Journey summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Train size={18} className="text-blue-700" />
              <span className="font-semibold text-gray-800">{train.trainNumber}</span>
              <span className="text-sm text-gray-500">·</span>
              <span className="text-sm text-gray-700">{train.trainName}</span>
              {train.isTatkal && (
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">Tatkal</span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold text-gray-900">{fmt(train.departureTime)}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin size={12} />{train.origin}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{fmtDur(train.durationMinutes)}</p>
                <div className="flex items-center gap-1 my-1">
                  <div className="h-px w-8 bg-gray-300" />
                  <Train size={14} className="text-blue-700" />
                  <div className="h-px w-8 bg-gray-300" />
                </div>
                <p className="text-xs text-gray-400">{fmtDate(train.departureTime)}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">{fmt(train.arrivalTime)}</p>
                <p className="text-sm text-gray-600 flex items-center gap-1 justify-end"><MapPin size={12} />{train.destination}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Users size={14} />{passengers} passenger{passengers > 1 ? 's' : ''}</span>
              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">{className}</span>
              <span className="text-xs text-gray-400">{train.runningDays}</span>
            </div>
          </div>

          {/* Passenger form */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={18} className="text-blue-700" />
              Passenger Details
            </h3>
            {isLoggedIn && (
              <SavedTravellerPicker
                accentColor="blue"
                onFill={d => {
                  setValue('firstName', d.firstName)
                  setValue('lastName', d.lastName)
                  setValue('email', d.email)
                  setValue('phone', d.phone)
                }}
              />
            )}
            <form id="book-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                  <input {...register('firstName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="First name" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                  <input {...register('lastName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Last name" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email *</label>
                  <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone *</label>
                  <input {...register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+91 9999999999" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
            </form>
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Tag size={18} className="text-blue-700" />
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50"
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
                  <CreditCard size={18} className="text-blue-700" />
                  Payment Method
                </h3>
                <button type="button" onClick={() => setShowAddCard(true)} className="text-xs text-blue-700 font-semibold hover:underline">+ Add Card</button>
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
        </div>

        {/* Right — price summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Shield size={18} className="text-green-500" />
              Fare Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>{className} × {passengers}</span>
                <span>{formatCurrency(basePrice)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({appliedCode})</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span className="text-blue-700">{formatCurrency(finalPrice)}</span>
              </div>
            </div>

            {apiError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {apiError}
              </div>
            )}

            <button
              form="book-form"
              type="submit"
              disabled={submitting}
              className="mt-4 w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing...' : `Confirm & Pay ${formatCurrency(finalPrice)}`}
            </button>

            {!isLoggedIn && (
              <p className="mt-2 text-center text-xs text-gray-500">
                <Link to="/login" className="text-blue-700 font-semibold">Login</Link> to complete booking
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
