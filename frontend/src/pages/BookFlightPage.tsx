import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, BriefcaseBusiness, ChevronRight, Luggage, Mail, Phone, Plane, ShieldAlert, TicketPercent, UserRound } from 'lucide-react'
import type { FlightDto } from '@/types'
import { flightService } from '@/services/flightService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDuration } from '@/utils/formatters'

type FarePlanId = 'saver' | 'flex' | 'max'
type TravellerGender = 'Male' | 'Female' | 'Other'

interface TravellerForm {
  fullName: string
  age: string
  gender: TravellerGender
  passportNumber: string
}

interface BookingUiSnapshot {
  bookingId: string
  email: string
  mobile: string
  countryCode: string
  userName: string
  origin: string
  originCity: string
  destination: string
  destinationCity: string
  airline: string
  flightNumber: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  passengers: number
}

const FARE_PLANS = {
  saver: {
    id: 'saver' as FarePlanId,
    name: 'TRAVELSAVER',
    multiplier: 1,
    refundableLabel: 'NON-REFUNDABLE',
    fareClassLabel: 'Economy > TRAVELSAVER',
    baggage: ['Cabin Baggage: 7 Kgs (1 piece only) / Adult', 'Check-In Baggage: 15 Kgs (1 piece only) / Adult'],
    policyTitle: 'Cancellation Penalty',
    policyDescription: 'Full fare is charged if cancelled close to departure.',
  },
  flex: {
    id: 'flex' as FarePlanId,
    name: 'TRAVELFLEX',
    multiplier: 1.12,
    refundableLabel: 'PARTIALLY FLEXIBLE',
    fareClassLabel: 'Economy > TRAVELFLEX',
    baggage: ['Cabin Baggage: 7 Kgs (1 piece only) / Adult', 'Check-In Baggage: 15 Kgs (1 piece only) / Adult'],
    policyTitle: 'Cancellation & Date Change Policy',
    policyDescription: 'Date change fee applies. Refund as per airline policy.',
  },
  max: {
    id: 'max' as FarePlanId,
    name: 'TRAVELMAX',
    multiplier: 1.22,
    refundableLabel: 'FLEXIBLE',
    fareClassLabel: 'Economy > TRAVELMAX',
    baggage: ['Cabin Baggage: 7 Kgs (1 piece only) / Adult', 'Check-In Baggage: 15 Kgs (1 piece only) / Adult'],
    policyTitle: 'Cancellation & Date Change Policy',
    policyDescription: 'Best flexibility on this flight with meal and seat benefits included.',
  },
}

function createTravellers(count: number): TravellerForm[] {
  return Array.from({ length: Math.max(1, count) }, () => ({
    fullName: '',
    age: '',
    gender: 'Male',
    passportNumber: '',
  }))
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {options.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  )
}

export default function BookFlightPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const selectedFareId = (searchParams.get('fare') as FarePlanId | null) ?? 'saver'
  const requestedPassengers = Number(searchParams.get('passengers') ?? 1)

  const [flight, setFlight] = useState<FlightDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [couponCode, setCouponCode] = useState('')
  const [mobile, setMobile] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('India (+91)')
  const [gstNumber, setGstNumber] = useState('')
  const [hasGst, setHasGst] = useState(false)
  const [travellers, setTravellers] = useState<TravellerForm[]>(createTravellers(requestedPassengers))

  useEffect(() => {
    if (!id) return
    flightService.getById(id)
      .then(response => setFlight(response.data))
      .catch(() => setError('Flight not found.'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setTravellers(current => {
      if (current.length === Math.max(1, requestedPassengers)) return current
      const next = createTravellers(requestedPassengers)
      return next.map((traveller, index) => current[index] ?? traveller)
    })
  }, [requestedPassengers])

  const selectedFare = FARE_PLANS[selectedFareId] ?? FARE_PLANS.saver

  const seatCount = travellers.length
  const farePerAdult = flight ? Math.round(flight.price * selectedFare.multiplier) : 0
  const baseFare = flight ? Math.round(flight.price * 0.61) : 0
  const taxesAndSurcharges = Math.max(0, farePerAdult - baseFare)
  const totalAmount = farePerAdult * seatCount

  const dep = flight ? new Date(flight.departureTime) : null
  const arr = flight ? new Date(flight.arrivalTime) : null
  const fmtTime = (date: Date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const fmtLongDate = (date: Date) => date.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })

  const routeCode = useMemo(() => {
    if (!flight) return ''
    return `${flight.origin}-${flight.destination}`
  }, [flight])

  const updateTraveller = (index: number, patch: Partial<TravellerForm>) => {
    setTravellers(current => current.map((traveller, currentIndex) => (
      currentIndex === index ? { ...traveller, ...patch } : traveller
    )))
  }

  const validateForm = () => {
    if (travellers.some(traveller => !traveller.fullName.trim() || !traveller.age.trim() || !traveller.passportNumber.trim())) {
      return 'Please complete details for every traveller.'
    }
    if (!mobile.trim() || !email.trim()) {
      return 'Please add your mobile number and email.'
    }
    return null
  }

  const onSubmit = async () => {
    if (!flight) return
    const validationMessage = validateForm()
    if (validationMessage) {
      setError(validationMessage)
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const response = await flightService.book({
        flightId: flight.id,
        passengers: seatCount,
        cabinClass: flight.cabinClass,
        couponCode: couponCode || undefined,
      })

      const snapshot: BookingUiSnapshot = {
        bookingId: response.data.id,
        email,
        mobile,
        countryCode,
        userName: travellers[0]?.fullName || 'Primary Traveller',
        origin: flight.origin,
        originCity: flight.originCity,
        destination: flight.destination,
        destinationCity: flight.destinationCity,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        durationMinutes: flight.durationMinutes,
        passengers: seatCount,
      }
      sessionStorage.setItem(`booking-ui:${response.data.id}`, JSON.stringify(snapshot))

      navigate(`/bookings/${response.data.id}?new=true`)
    } catch (caughtError: unknown) {
      const message = (caughtError as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(message ?? 'Booking failed. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-[34rem] w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!flight || !dep || !arr) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">{error ?? 'Flight not found'}</div>
    )
  }

  return (
    <div className="min-h-screen bg-[#eef4fa]">
      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-400 pb-28" />

      <div className="mx-auto -mt-24 max-w-7xl px-4 pb-10 sm:px-6">
        <button onClick={() => navigate(-1)} className="mb-5 flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to flights
        </button>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">{flight.originCity} → {flight.destinationCity}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">{fmtLongDate(dep)}</span>
                    <span>{flight.stops === 0 ? 'Non Stop' : `${flight.stops} Stop`}</span>
                    <span>{formatDuration(flight.durationMinutes)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${selectedFare.id === 'max' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {selectedFare.refundableLabel}
                  </span>
                  <button className="mt-3 block text-sm font-medium text-blue-600 hover:underline">View Fare Rules</button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <Plane className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{flight.airline}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{flight.flightNumber}</span>
                        <span className="rounded-full border border-gray-300 px-2 py-0.5">{flight.aircraft ?? 'Boeing 737'}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-cyan-600">{selectedFare.fareClassLabel}</p>
                </div>

                <div className="grid gap-5 pt-5 md:grid-cols-[110px_minmax(0,1fr)]">
                  <div className="space-y-7 text-right">
                    <div>
                      <p className="text-3xl font-black text-gray-900">{fmtTime(dep)}</p>
                      <p className="text-sm text-gray-500">Departure</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-gray-900">{fmtTime(arr)}</p>
                      <p className="text-sm text-gray-500">Arrival</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute bottom-6 left-0 top-4 border-l-2 border-dashed border-gray-300" />
                    <div className="space-y-8 pl-8">
                      <div className="relative">
                        <div className="absolute -left-[2.15rem] top-2 h-3 w-3 rounded-full border-2 border-gray-400 bg-white" />
                        <p className="text-2xl font-bold text-gray-900">{flight.originCity}</p>
                        <p className="mt-1 text-sm text-gray-600">{flight.origin} Airport, Terminal 1</p>
                        <p className="mt-3 text-sm font-semibold text-gray-500">{formatDuration(flight.durationMinutes)}</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[2.15rem] top-2 h-3 w-3 rounded-full border-2 border-gray-400 bg-white" />
                        <p className="text-2xl font-bold text-gray-900">{flight.destinationCity}</p>
                        <p className="mt-1 text-sm text-gray-600">{flight.destination} Airport, Terminal 1</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 border-t border-gray-200 pt-4 md:grid-cols-2">
                  {selectedFare.baggage.map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Luggage className="h-4 w-4 text-amber-500" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                  <span className="font-medium text-emerald-800">Got excess baggage? Add check-in baggage allowance for {routeCode} at fab rates!</span>
                  <button className="font-bold text-blue-600 hover:underline">+ ADD BAGGAGE</button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">{selectedFare.policyTitle}</h2>
                  <p className="mt-1 text-sm text-gray-500">{selectedFare.policyDescription}</p>
                </div>
                <button className="text-sm font-medium text-blue-600 hover:underline">View Policy</button>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                    <Plane className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{routeCode}</p>
                    <p className="text-sm text-gray-500">Cancellation Penalty</p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-4xl font-black text-gray-900">{formatCurrency(farePerAdult)}</p>
                  <div className="mt-4 h-1 rounded-full bg-rose-400" />
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>Cancel Between (IST): Now</span>
                    <span>{dep.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} {fmtTime(dep)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-900">Traveller Details</h2>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-sky-50 px-4 py-3">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <UserRound className="h-5 w-5 text-sky-700" />
                  <span>Log in to view your saved traveller list, unlock amazing deals & more!</span>
                </div>
                <button className="text-sm font-bold text-blue-600 hover:underline">LOGIN NOW</button>
              </div>

              <div className="mt-5 space-y-5">
                {travellers.map((traveller, index) => (
                  <div key={`traveller-${index}`} className="overflow-hidden rounded-2xl border border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                          <UserRound className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">ADULT {index + 1} (12 yrs+)</p>
                          <p className="text-sm text-gray-500">Traveller {index + 1} of {seatCount}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-500">{traveller.fullName.trim() ? 'Details added' : 'Pending details'}</span>
                    </div>

                    <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm font-medium text-amber-800">
                      Important: Enter name as mentioned on your passport or Government approved IDs.
                    </div>

                    <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
                      <Input label="Full Name" placeholder="Enter traveller name" value={traveller.fullName} onChange={e => updateTraveller(index, { fullName: e.target.value })} />
                      <Input label="Age" type="number" min={12} placeholder="Age" value={traveller.age} onChange={e => updateTraveller(index, { age: e.target.value })} />
                      <SelectField label="Gender" value={traveller.gender} onChange={value => updateTraveller(index, { gender: value as TravellerGender })} options={['Male', 'Female', 'Other']} />
                      <Input label="Passport / Govt ID" placeholder="ID number" value={traveller.passportNumber} onChange={e => updateTraveller(index, { passportNumber: e.target.value })} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="text-xl font-bold text-gray-900">Booking details will be sent to</h3>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <SelectField label="Country Code" value={countryCode} onChange={setCountryCode} options={['India (+91)', 'UAE (+971)', 'USA (+1)']} />
                  <Input label="Mobile No" placeholder="Mobile number" value={mobile} onChange={e => setMobile(e.target.value)} />
                  <Input label="Email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 p-4">
                  <label className="flex items-center gap-3 text-sm font-semibold text-gray-800">
                    <input type="checkbox" checked={hasGst} onChange={e => setHasGst(e.target.checked)} className="h-4 w-4 rounded border-gray-300 accent-blue-600" />
                    I have a GST number <span className="font-normal text-gray-400">(Optional)</span>
                  </label>
                  {hasGst && (
                    <div className="mt-4">
                      <Input label="GST Number" placeholder="Enter GST number" value={gstNumber} onChange={e => setGstNumber(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-900">Fare Summary</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span>Base Fare</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(baseFare * seatCount)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                    <span>Taxes and Surcharges</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(taxesAndSurcharges * seatCount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl font-extrabold text-gray-900">Total Amount</span>
                    <span className="text-3xl font-black text-gray-900">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Tap to contribute ₹ 10</p>
                  <p className="text-sm text-gray-500">towards plantation of 4 million trees</p>
                  <button className="mt-2 text-sm font-semibold text-blue-600 hover:underline">Know More</button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <TicketPercent className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">Offers & Discounts</h2>
              </div>

              <div className="mt-5">
                <Input placeholder="Enter coupon code" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                <button className="rounded-lg border border-blue-500 bg-blue-50 px-3 py-2 font-semibold text-blue-600">All</button>
                <button className="rounded-lg border border-gray-200 px-3 py-2 text-gray-600">Bank</button>
                <button className="rounded-lg border border-gray-200 px-3 py-2 text-gray-600">Add-ons</button>
              </div>

              <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900">DEALPANTI</p>
                    <p className="mt-1 text-sm text-gray-500">Get ₹ 484 Instant Discount on your flight booking</p>
                  </div>
                  <span className="font-bold text-emerald-600">₹ 484 off</span>
                </div>
                <button type="button" onClick={() => setCouponCode('DEALPANTI')} className="mt-4 text-sm font-bold text-blue-600 hover:underline">
                  Apply
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <p>Traveller details are collected here for a richer booking UX. The current backend still confirms the booking using total passenger count only.</p>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span>{mobile || 'Mobile number will appear here'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{email || 'Email will appear here'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-gray-400" />
                  <span>{countryCode}</span>
                </div>
              </div>

              <Button type="button" size="lg" loading={submitting} className="mt-5 w-full bg-orange-500 font-bold hover:bg-orange-600" onClick={onSubmit}>
                Continue To Book
              </Button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
