import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Car, Clock, MapPin, Users, Tag, CreditCard, Shield, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CabDto, BookCabRequest } from '@/types'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import { formatCurrency } from '@/utils/formatters'
import { PaymentMethodSelector } from '@/components/common/PaymentMethodSelector'
import { AddCardModal } from '@/components/common/AddCardModal'
import type { PaymentChoice } from '@/components/common/PaymentMethodSelector'
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

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}
function fmtDur(mins: number) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function BookCabPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const cab         = location.state?.cab as CabDto | undefined
  const pickupTime  = location.state?.pickupTime as string | undefined

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

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: authUser?.email ?? '', firstName: authUser?.name?.split(' ')[0] ?? '' },
  })

  useEffect(() => {
    if (isLoggedIn) userService.getWallet().then(r => setWalletBalance(r.data?.balance ?? 0)).catch(() => {})
  }, [isLoggedIn])

  if (!cab || !pickupTime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No cab selected. Please search for cabs first.</p>
          <Link to="/cabs" className="text-yellow-600 hover:underline">Search Cabs</Link>
        </div>
      </div>
    )
  }

  const basePrice  = cab.price
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
      const payload: BookCabRequest = {
        cabId:           cab.id,
        provider:        cab.provider,
        cabType:         cab.cabType,
        carModel:        cab.carModel,
        origin:          location.state?.origin ?? '',
        destination:     location.state?.destination ?? '',
        pickupDateTime:  pickupTime,
        durationMinutes: cab.estimatedDurationMinutes,
        distanceKm:      cab.estimatedDistanceKm,
        price:           cab.price,
        couponCode:      couponApplied ? appliedCode : undefined,
        useWallet:       paymentChoice.type === 'wallet',
        savedCardId:     paymentChoice.type === 'saved_card' ? paymentChoice.cardId : undefined,
        guestName:       `${values.firstName} ${values.lastName}`,
        guestEmail:      values.email,
        guestPhone:      values.phone,
      }

      const { data } = await api.post(endpoints.cabs.book, payload)
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
      <div className="bg-yellow-600 text-white py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 rounded hover:bg-yellow-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <Car size={22} />
          <span className="font-bold text-lg">Complete Cab Booking</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — form */}
        <div className="lg:col-span-2 space-y-4">

          {/* Ride summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-14 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Car size={20} className="text-gray-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{cab.provider}</span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{cab.cabType}</span>
                  {cab.acAvailable && <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">AC</span>}
                </div>
                <p className="text-sm text-gray-500">{cab.carModel}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><MapPin size={10} />Pickup</p>
                <p className="font-semibold text-gray-800 text-sm">{location.state?.origin}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(pickupTime)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><MapPin size={10} />Drop</p>
                <p className="font-semibold text-gray-800 text-sm">{location.state?.destination}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><Clock size={14} />{fmtDur(cab.estimatedDurationMinutes)}</span>
              <span className="flex items-center gap-1"><MapPin size={14} />{cab.estimatedDistanceKm} km</span>
              <span className="flex items-center gap-1"><Users size={14} />{cab.capacity} seats</span>
              <span className="text-xs text-gray-400">{cab.cancellationPolicy}</span>
            </div>
          </div>

          {/* Passenger form */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={18} className="text-yellow-600" />
              Passenger Details
            </h3>
            <form id="book-form" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">First Name *</label>
                  <input {...register('firstName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="First name" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Last Name *</label>
                  <input {...register('lastName')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Last name" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Email *</label>
                  <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="email@example.com" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Phone *</label>
                  <input {...register('phone')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="+91 9999999999" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>
            </form>
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Tag size={18} className="text-yellow-600" />
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
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-600 disabled:opacity-50"
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
                  <CreditCard size={18} className="text-yellow-600" />
                  Payment Method
                </h3>
                <button type="button" onClick={() => setShowAddCard(true)} className="text-xs text-yellow-600 font-semibold hover:underline">+ Add Card</button>
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
                <span>Cab fare</span>
                <span>{formatCurrency(basePrice)}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-xs">
                <span>₹{cab.pricePerKm}/km × {cab.estimatedDistanceKm} km</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Coupon ({appliedCode})</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-gray-900 text-base">
                <span>Total</span>
                <span className="text-yellow-600">{formatCurrency(finalPrice)}</span>
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
              className="mt-4 w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing...' : `Confirm & Pay ${formatCurrency(finalPrice)}`}
            </button>

            {!isLoggedIn && (
              <p className="mt-2 text-center text-xs text-gray-500">
                <Link to="/login" className="text-yellow-600 font-semibold">Login</Link> to complete booking
              </p>
            )}

            <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
              <Shield size={12} className="text-green-400" />
              <span>Secure payment · {cab.cancellationPolicy}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
