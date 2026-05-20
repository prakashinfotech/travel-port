import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, Luggage, ShieldCheck, Star, X, Bell, Check as CheckIcon } from 'lucide-react'
import type { FlightDto } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDuration } from '@/utils/formatters'
import { api } from '@/api/axios'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

interface FlightCardProps {
  flight: FlightDto
  passengerCount?: number
  isCompared?: boolean
  compareDisabled?: boolean
  onCompare?: (checked: boolean) => void
}

type FarePlanId = 'saver' | 'flex' | 'max'

interface FarePlan {
  id: FarePlanId
  name: string
  multiplier: number
  baggage: string[]
  flexibility: string[]
  extras: string[]
  refundable: boolean
  highlight?: string
}

const AIRLINE_COLORS: Record<string, string> = {
  IndiGo: '#0056a2',
  SpiceJet: '#e31837',
  'Air India': '#c8102e',
  Vistara: '#6f2c91',
  'Akasa Air': '#ff6600',
  'Air India Express': '#007ba7',
  'Go First': '#003580',
}

const FARE_PLANS: FarePlan[] = [
  {
    id: 'saver',
    name: 'TRAVELSAVER',
    multiplier: 1,
    baggage: ['7 Kgs Cabin Baggage', '15 Kgs Check-in Baggage'],
    flexibility: ['No refund on cancellation', 'No free date change'],
    extras: ['Chargeable seats', 'Meals info not available'],
    refundable: false,
  },
  {
    id: 'flex',
    name: 'TRAVELFLEX',
    multiplier: 1.12,
    baggage: ['7 Kgs Cabin Baggage', '15 Kgs Check-in Baggage'],
    flexibility: ['No refund on cancellation', 'Date change fee starts up to 4 hrs before departure'],
    extras: ['Free seats', 'Complimentary meal'],
    refundable: false,
  },
  {
    id: 'max',
    name: 'TRAVELMAX',
    multiplier: 1.22,
    baggage: ['7 Kgs Cabin Baggage', '15 Kgs Check-in Baggage'],
    flexibility: ['Free cancellation up to 24 hrs before departure', 'Unlimited date changes with fare difference'],
    extras: ['Free seats', 'Complimentary meal', 'Priority check-in'],
    refundable: true,
    highlight: 'Free Seats + Free Meal in best price',
  },
]

function PriceWatchButton({ flight }: { flight: FlightDto }) {
  const isAuthenticated = useSelector((s: RootState) => s.auth.accessToken !== null)
  const [watching, setWatching] = useState(false)
  const [done,     setDone]     = useState(false)

  if (!isAuthenticated) return null

  const handleWatch = async () => {
    if (watching || done) return
    setWatching(true)
    try {
      const travelDate = flight.departureTime.slice(0, 10)
      await api.post('/users/price-alerts', {
        origin:       flight.origin,
        destination:  flight.destination,
        travelDate,
        currentPrice: flight.price,
      })
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch { /* ignore */ } finally {
      setWatching(false)
    }
  }

  return (
    <button
      onClick={handleWatch}
      disabled={watching}
      title="Watch this price"
      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
        done
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200'
      }`}
    >
      {done
        ? <><CheckIcon className="h-3 w-3" /> Watching</>
        : <><Bell className="h-3 w-3" /> Watch price</>
      }
    </button>
  )
}

function AirlineLogo({ airline }: { airline: string }) {
  const color = AIRLINE_COLORS[airline] ?? '#555'
  const initials = airline.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      style={{ backgroundColor: color }}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
    >
      {initials}
    </div>
  )
}

function FareRow({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${included ? 'text-emerald-500' : 'text-rose-300'}`} />
      <span className={included ? 'text-gray-700' : 'text-gray-400'}>{label}</span>
    </div>
  )
}

export function FlightCard({ flight, passengerCount = 1, isCompared = false, compareDisabled = false, onCompare }: FlightCardProps) {
  const navigate = useNavigate()
  const [showFareModal, setShowFareModal] = useState(false)

  const dep = new Date(flight.departureTime)
  const arr = new Date(flight.arrivalTime)
  const fmt = (date: Date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const isNextDay = arr.getDate() !== dep.getDate() || arr.getMonth() !== dep.getMonth()
  const stopsLabel = flight.stops === 0 ? 'Non stop' : flight.stops === 1 ? '1 Stop' : `${flight.stops} Stops`
  const effectivePassengerCount = Math.max(1, passengerCount)

  const farePlans = useMemo(() => (
    FARE_PLANS.map(plan => ({
      ...plan,
      total: Math.round(flight.price * plan.multiplier),
    }))
  ), [flight.price])

  useEffect(() => {
    if (!showFareModal) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [showFareModal])

  const handleBookNow = (fare: FarePlanId) => {
    const params = new URLSearchParams({
      fare,
      passengers: String(effectivePassengerCount),
      cabinClass: flight.cabinClass,
    })
    navigate(`/flights/${flight.id}/book?${params.toString()}`)
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center gap-4 px-5 py-4">
          <div className="flex w-20 flex-shrink-0 flex-col items-center gap-1.5">
            <AirlineLogo airline={flight.airline} />
            <p className="text-center text-xs font-semibold leading-tight text-gray-700 dark:text-gray-200">{flight.airline}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{flight.flightNumber}</p>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            <div className="text-center">
              <p className="tabular-nums text-2xl font-bold text-gray-900 dark:text-gray-100">{fmt(dep)}</p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{flight.origin}</p>
            </div>

            <div className="flex max-w-[140px] min-w-[80px] flex-1 flex-col items-center gap-0.5">
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {formatDuration(flight.durationMinutes)}
              </p>
              <div className="flex w-full items-center gap-1">
                <div className="h-px flex-1 bg-gray-300" />
                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400" />
              </div>
              <p className={`text-xs font-semibold ${flight.stops === 0 ? 'text-green-600' : 'text-orange-500'}`}>
                {stopsLabel}
              </p>
            </div>

            <div className="text-center">
              <p className="tabular-nums text-2xl font-bold text-gray-900 dark:text-gray-100">
                {fmt(arr)}
                {isNextDay && <sup className="ml-0.5 text-base text-orange-500">+1</sup>}
              </p>
              <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{flight.destination}</p>
            </div>
          </div>

          <div className="flex min-w-[120px] flex-shrink-0 flex-col items-end gap-2">
            <div className="text-right">
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(flight.price)}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">per adult</p>
            </div>
            <button
              onClick={() => setShowFareModal(true)}
              disabled={flight.availableSeats === 0}
              className={`rounded-lg px-4 py-2 text-sm font-bold tracking-wide transition-colors ${
                flight.availableSeats === 0
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {flight.availableSeats === 0 ? 'SOLD OUT' : 'VIEW FARES'}
            </button>
            {flight.availableSeats > 0 && flight.availableSeats <= 9 && (
              <p className="text-xs font-semibold text-red-500">{flight.availableSeats} seats left!</p>
            )}
            <PriceWatchButton flight={flight} />
          </div>
        </div>

        {(flight.isRefundable || flight.baggageIncluded) && (
          <div className="flex items-center gap-4 border-t border-green-100 bg-green-50 px-5 py-1.5">
            {flight.isRefundable && (
              <span className="text-xs font-medium text-green-700">Refundable</span>
            )}
            {flight.baggageIncluded && (
              <span className="text-xs font-medium text-green-700">
                {flight.checkedBags ? `${flight.checkedBags} Checked Bag` : 'Baggage Included'}
              </span>
            )}
          </div>
        )}

        {onCompare && (
          <label className={`flex cursor-pointer items-center gap-2 border-t border-gray-100 px-5 py-2 transition-colors select-none ${isCompared ? 'bg-blue-50' : 'hover:bg-gray-50'} ${compareDisabled && !isCompared ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="checkbox"
              checked={isCompared}
              disabled={compareDisabled && !isCompared}
              onChange={e => onCompare(e.target.checked)}
              className="h-3.5 w-3.5 accent-blue-600"
            />
            <span className={`text-xs font-semibold ${isCompared ? 'text-blue-700' : 'text-gray-500'}`}>
              {isCompared ? 'Added to compare' : 'Compare'}
            </span>
          </label>
        )}
      </div>

      {showFareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/55 px-3 py-6 backdrop-blur-[1px] sm:px-6">
          <div className="mx-auto flex h-full max-w-6xl items-start justify-center">
            <div className="max-h-full w-full overflow-hidden rounded-[28px] bg-white dark:bg-gray-900 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-5">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Flight Details and Fare Options available for you!</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {flight.originCity} to {flight.destinationCity} · {effectivePassengerCount} traveller{effectivePassengerCount > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFareModal(false)}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <X className="h-7 w-7" />
                </button>
              </div>

              <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-5">
                <div className="mb-5 rounded-2xl bg-gray-50 dark:bg-gray-800 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-gray-600">
                    <span>{flight.originCity} → {flight.destinationCity}</span>
                    <span className="flex items-center gap-2">
                      <AirlineLogo airline={flight.airline} />
                      <span>{flight.airline}</span>
                    </span>
                    <span>{dep.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <span>Departure at {fmt(dep)} - Arrival at {fmt(arr)}{isNextDay ? ' (+1 day)' : ''}</span>
                  </div>
                </div>

                <div className="grid gap-5 lg:grid-cols-3">
                  {farePlans.map(plan => (
                    <div
                      key={plan.id}
                      className={`overflow-hidden rounded-3xl border ${plan.id === 'max' ? 'border-blue-400 shadow-md shadow-blue-100 dark:shadow-blue-900/30' : 'border-gray-200 dark:border-gray-700'}`}
                    >
                      <div className="border-b border-gray-200 dark:border-gray-700 px-5 py-5">
                        <p className="text-4xl font-black tracking-tight text-gray-900 dark:text-gray-100">{formatCurrency(plan.total)}</p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">per adult</p>
                        <p className="mt-3 text-sm font-bold tracking-[0.24em] text-gray-500 dark:text-gray-400">{plan.name}</p>
                      </div>

                      <div className="flex min-h-[25rem] flex-col px-5 py-4">
                        <div className="space-y-5">
                          <div>
                            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                              <Luggage className="h-4 w-4 text-sky-600" />
                              Baggage
                            </p>
                            <div className="space-y-2">
                              {plan.baggage.map(item => (
                                <FareRow key={item} label={item} included />
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                              <ShieldCheck className="h-4 w-4 text-sky-600" />
                              Flexibility
                            </p>
                            <div className="space-y-2">
                              {plan.flexibility.map(item => (
                                <FareRow key={item} label={item} included={plan.refundable || item.includes('Date change')} />
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-gray-900">
                              <Star className="h-4 w-4 text-sky-600" />
                              Seats, Meals & More
                            </p>
                            <div className="space-y-2">
                              {plan.extras.map(item => (
                                <FareRow key={item} label={item} included={!item.startsWith('Chargeable') && !item.includes('not available')} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-auto pt-5">
                          {plan.highlight && (
                            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                              {plan.highlight}
                            </div>
                          )}
                          <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            FLAT ₹ 484 OFF with DEALPANTI
                          </div>
                          <Button
                            type="button"
                            className={`w-full font-bold ${plan.id === 'max' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-500 hover:bg-orange-600'}`}
                            onClick={() => handleBookNow(plan.id)}
                          >
                            BOOK NOW
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
