import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Star, Users, Calendar,
  CheckCircle, Shield, Tag, Info, ChevronRight, Home, BriefcaseBusiness, X,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { HotelDto, HotelRoomDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import { formatCurrency } from '@/utils/formatters'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Schema ────────────────────────────────────────────────────────────────────

const schema = z.object({
  firstName:  z.string().min(1, 'First name required'),
  lastName:   z.string().min(1, 'Last name required'),
  email:      z.string().email('Valid email required'),
  phone:      z.string().min(10, 'Valid phone required'),
  couponCode: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

// ── Helpers ───────────────────────────────────────────────────────────────────

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80'

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function parseAmenities(raw: string): string[] {
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BookHotelPage() {
  const { id, roomId }  = useParams<{ id: string; roomId: string }>()
  const [searchParams]  = useSearchParams()
  const navigate        = useNavigate()

  const checkIn  = searchParams.get('checkIn')  ?? ''
  const checkOut = searchParams.get('checkOut') ?? ''
  const guests   = Number(searchParams.get('guests') ?? 1)
  const nights   = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1

  const [hotel,      setHotel]      = useState<HotelDto | null>(null)
  const [room,       setRoom]       = useState<HotelRoomDto | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [apiError,   setApiError]   = useState<string | null>(null)
  const [discount,      setDiscount]      = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError,   setCouponError]   = useState('')
  const [appliedCode,   setAppliedCode]   = useState('')

  const [includeContribution, setIncludeContribution] = useState(false)
  const [showFareRules, setShowFareRules] = useState(false)
  const [showContributionInfo, setShowContributionInfo] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!id) return
    hotelService.getById(id)
      .then(r => {
        setHotel(r.data)
        setRoom(r.data.rooms.find(rm => rm.id === roomId) ?? null)
      })
      .catch(() => setApiError('Hotel not found.'))
      .finally(() => setLoading(false))
  }, [id, roomId])

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-52 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    </div>
  )

  if (!hotel || !room) return (
    <div className="flex items-center justify-center min-h-[50vh] text-gray-400 text-sm">
      {apiError ?? 'Room not found'}
    </div>
  )

  const amenities   = parseAmenities(room.amenities)
  const basePrice   = room.pricePerNight * nights
  const taxes       = Math.round(basePrice * 0.12)
  const contributionAmount = includeContribution ? 10 : 0
  const discountedBookingAmount = Math.max(0, basePrice + taxes - discount)
  const cancellationPenaltyAmount = discountedBookingAmount
  const total       = discountedBookingAmount + contributionAmount

  const removeCoupon = () => {
    setValue('couponCode', '')
    setDiscount(0)
    setCouponApplied(false)
    setCouponError('')
    setAppliedCode('')
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    setApiError(null)
    try {
      const guestName = `${values.firstName} ${values.lastName}`
      const res = await hotelService.book({
        hotelId:    id!,
        roomId:     room.id,
        checkIn,
        checkOut,
        guests,
        couponCode: values.couponCode || undefined,
        guestName,
        guestEmail: values.email,
        guestPhone: values.phone,
      })

      // Save UI snapshot so HotelBookingConfirmPage can render hotel info
      sessionStorage.setItem(`booking-ui:${res.data.id}`, JSON.stringify({
        bookingId:    res.data.id,
        bookingType:  'Hotel',
        guestName,
        email:        values.email,
        phone:        values.phone,
        hotelName:    hotel.name,
        hotelAddress: hotel.address,
        hotelCity:    hotel.city,
        hotelStars:   hotel.starRating,
        roomType:     room.roomType,
        checkIn,
        checkOut,
        nights,
        guests,
        pricePerNight: room.pricePerNight,
        taxes,
        totalAmount:  res.data.totalAmount,
      }))

      navigate(`/hotels/booking/${res.data.id}/confirm?new=true`)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg ?? 'Booking failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 h-12 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-gray-200">|</span>
          <nav className="flex items-center gap-1 text-xs text-gray-400">
            <Link to="/" className="hover:text-orange-600 flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/hotels" className="hover:text-orange-600">Hotels</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to={`/hotels/${id}`} className="hover:text-orange-600 truncate max-w-[120px]">{hotel.name}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-600 font-medium">Review & Book</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-5">Complete your booking</h1>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column ── */}
            <div className="lg:col-span-2 space-y-4">

              {/* Hotel & Room card */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  {/* Hotel image */}
                  <div className="sm:w-52 h-44 sm:h-auto flex-shrink-0 overflow-hidden">
                    <img
                      src={hotel.imageUrl || FALLBACK_IMG}
                      alt={hotel.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                    />
                  </div>

                  {/* Hotel details */}
                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-bold text-gray-900 text-lg leading-tight">{hotel.name}</h2>
                        <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {hotel.address}
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {Array.from({ length: hotel.starRating }).map((_, i) => (
                          <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-800 mb-2">{room.roomType}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {fmtDate(checkIn)} → {fmtDate(checkOut)}</span>
                        <span className="font-medium text-orange-600">{nights} night{nights > 1 ? 's' : ''}</span>
                        <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {guests} Guest{guests > 1 ? 's' : ''}</span>
                      </div>
                      {amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {amenities.slice(0, 4).map(a => (
                            <span key={a} className="text-[11px] bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {room.cancellationPolicy && (
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3.5 w-3.5" /> {room.cancellationPolicy}
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowFareRules(true)}
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          View Fare Rules
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Cancellation Penalty</h3>
                    <p className="mt-1 text-sm text-gray-500">{room.cancellationPolicy || 'Penalty and refund depend on room policy and cancellation timing.'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFareRules(true)}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View Policy
                  </button>
                </div>
                <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-center">
                  <p className="text-4xl font-black text-gray-900">{formatCurrency(cancellationPenaltyAmount)}</p>
                  <div className="mt-4 h-1 rounded-full bg-rose-400" />
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Cancel Between: Now</span>
                    <span>{fmtDate(checkIn)}</span>
                  </div>
                </div>
              </div>

              {/* Guest details */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">1</span>
                  Primary Guest Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">First Name</label>
                    <input
                      {...register('firstName')}
                      placeholder="As on ID proof"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200"
                    />
                    {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Last Name</label>
                    <input
                      {...register('lastName')}
                      placeholder="As on ID proof"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200"
                    />
                    {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="Confirmation sent here"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200"
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mobile Number</label>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="+91 99999 99999"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200"
                    />
                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                  </div>
                </div>
              </div>

              {/* Coupon */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">2</span>
                  Coupon / Promo Code
                </h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      {...register('couponCode')}
                      placeholder="e.g. HOTELOFF15"
                      className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-200 uppercase"
                      onChange={e => {
                        setValue('couponCode', e.target.value.toUpperCase())
                        setCouponApplied(false); setDiscount(0); setCouponError(''); setAppliedCode('')
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    disabled={couponLoading}
                    onClick={async () => {
                      const code = watch('couponCode')?.trim().toUpperCase()
                      if (!code) return
                      setCouponLoading(true); setCouponError('')
                      try {
                        const res = await api.get<{ success: boolean; data: { discountAmount: number } }>(
                          endpoints.coupons.validate, { params: { code, amount: basePrice + taxes } }
                        )
                        if (res.data.success) {
                          setDiscount(res.data.data.discountAmount)
                          setCouponApplied(true)
                          setCouponError('')
                          setAppliedCode(code)
                        } else {
                          setDiscount(0); setCouponApplied(false); setCouponError('Invalid or expired coupon.'); setAppliedCode('')
                        }
                      } catch {
                        setDiscount(0); setCouponApplied(false); setCouponError('Could not validate coupon.'); setAppliedCode('')
                      } finally {
                        setCouponLoading(false)
                      }
                    }}
                    className="px-4 py-2.5 rounded-lg border border-orange-300 text-orange-600 text-sm font-semibold hover:bg-orange-50 transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {couponApplied && discount > 0 && (
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-green-600">
                    <p className="flex items-center gap-1">
                      <CheckCircle className="h-3.5 w-3.5" /> {appliedCode} applied! You save {formatCurrency(discount)}
                    </p>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="rounded-full p-0.5 text-green-700 transition hover:bg-green-100"
                      aria-label="Remove coupon"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                {couponError && <p className="text-xs text-red-500 mt-2">{couponError}</p>}

                {/* Hotel coupon offers */}
                <div className="mt-4 space-y-2">
                  {[
                    { code: 'HOTELOFF15', label: '15% off hotel stays', desc: '15% off on bookings above Rs.3000. Max Rs.1500 discount.' },
                    { code: 'STAYMORE',   label: 'Rs.750 flat off',      desc: 'Flat Rs.750 off on bookings above Rs.5000.' },
                    { code: 'HOTELDEAL',  label: '12% off on hotels',    desc: '12% instant discount on bookings above Rs.2000. Max Rs.1000.' },
                  ].map(offer => (
                    <div key={offer.code} className="flex items-center justify-between rounded-xl border border-dashed border-orange-200 bg-orange-50 px-4 py-2.5">
                      <div>
                        <p className="font-bold text-gray-900 text-xs">{offer.code}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{offer.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setValue('couponCode', offer.code)
                          setCouponApplied(false); setDiscount(0); setCouponError(''); setAppliedCode('')
                        }}
                        className="ml-2 flex-shrink-0 text-xs font-bold text-orange-600 hover:underline"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="flex items-center gap-2 font-semibold text-amber-800 text-sm mb-3">
                  <Info className="h-4 w-4" /> Important Information
                </h3>
                <ul className="space-y-1.5 text-xs text-amber-700 list-disc list-inside">
                  <li>Check-in from 2:00 PM · Check-out by 12:00 PM (noon)</li>
                  <li>Valid government-issued photo ID required at check-in</li>
                  <li>Prices include all applicable taxes</li>
                  <li>Extra charges may apply for additional guests</li>
                </ul>
              </div>
            </div>

            {/* ── Right sidebar ── */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-4">

                {/* Price summary */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-orange-500 px-5 py-3">
                    <p className="text-sm font-semibold text-white">Price Breakdown</p>
                  </div>
                  <div className="p-5 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Room Rate</span>
                      <span className="font-medium text-gray-800">{formatCurrency(room.pricePerNight)} × {nights} night{nights > 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Amount</span>
                      <span className="font-medium text-gray-800">{formatCurrency(basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxes & Fees (12%)</span>
                      <span className="font-medium text-gray-800">{formatCurrency(taxes)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Coupon {appliedCode ? `(${appliedCode})` : 'Discount'}</span>
                        <span className="flex items-center gap-2 font-medium">
                          <span>− {formatCurrency(discount)}</span>
                          <button
                            type="button"
                            onClick={removeCoupon}
                            className="rounded-full p-0.5 text-green-700 transition hover:bg-green-100"
                            aria-label="Remove coupon"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      </div>
                    )}
                    {includeContribution && (
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-600">
                          <BriefcaseBusiness className="h-4 w-4 text-emerald-700" />
                          Green Contribution
                        </span>
                        <span className="font-medium text-gray-800">{formatCurrency(contributionAmount)}</span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between">
                      <span className="font-bold text-gray-900">Total Amount</span>
                      <span className="font-bold text-orange-600 text-lg">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={includeContribution}
                      onChange={e => setIncludeContribution(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 accent-emerald-600"
                    />
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                      <BriefcaseBusiness className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Tap to contribute ₹ 10</p>
                      <p className="text-sm text-gray-500">towards plantation of 4 million trees</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowContributionInfo(true)
                        }}
                        className="mt-2 text-sm font-semibold text-blue-600 hover:underline"
                      >
                        Know More
                      </button>
                    </div>
                  </label>
                </div>

                {/* Trust badges */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-2.5">
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Shield className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Secure & encrypted payment</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Instant booking confirmation</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>Free cancellation (24 hrs)</span>
                  </div>
                </div>

                {/* Error */}
                {apiError && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{apiError}</div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>
                  ) : (
                    <>Confirm Booking · {formatCurrency(total)}</>
                  )}
                </button>
                <p className="text-xs text-center text-gray-400">
                  By confirming, you agree to our Terms & Conditions
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>

      {showFareRules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">View Fare Rules</h3>
                <p className="mt-1 text-sm text-gray-500">{room.roomType} at {hotel.name}</p>
              </div>
              <button type="button" onClick={() => setShowFareRules(false)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4 text-sm text-gray-600">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Cancellation</p>
                <p className="mt-1">{room.cancellationPolicy || 'Cancellation charges depend on the hotel policy and the time of cancellation.'}</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Check-in Requirements</p>
                <p className="mt-1">Valid government-issued photo identification is required at check-in for all guests.</p>
              </div>
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="font-semibold text-gray-900">Stay Details</p>
                <p className="mt-1">Room availability, inclusions, and hotel-specific restrictions are confirmed as per the selected stay dates and occupancy.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showContributionInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-extrabold text-gray-900">About This Contribution</h3>
                <p className="mt-1 text-sm text-gray-500">Optional green contribution</p>
              </div>
              <button type="button" onClick={() => setShowContributionInfo(false)} className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-3 text-sm text-gray-600">
              <p>Your optional ₹ 10 contribution is added to the booking total and is shown separately in the fare summary.</p>
              <p>This amount is intended for sustainability initiatives such as tree plantation and related environmental programs.</p>
              <p>The contribution is optional and can be turned on or off before booking.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
