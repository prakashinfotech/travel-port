import { useState, useRef, useEffect } from 'react'
import { X, Search, Plane, Users, Mail, Phone, XCircle, CheckCircle2 } from 'lucide-react'
import { flightOperatorService } from '@/services/operatorService'
import type { SeatLayoutDto, SeatDto, FlightDateRouteDto } from '@/types'

interface Props {
  onClose: () => void
}

type Step = 'date' | 'routes' | 'map'

function parseSections(config: string): number[] {
  return config.split('-').map(Number)
}

function seatLetter(colIdx: number): string {
  return String.fromCharCode(65 + colIdx)
}

interface TooltipState {
  seat: SeatDto
  x: number
  y: number
}

export function FlightSeatMapModal({ onClose }: Props) {
  const [step, setStep] = useState<Step>('date')
  const [date, setDate] = useState('')
  const [routes, setRoutes] = useState<FlightDateRouteDto[]>([])
  const [loadingRoutes, setLoadingRoutes] = useState(false)
  const [routeError, setRouteError] = useState('')
  const [selectedFlight, setSelectedFlight] = useState<FlightDateRouteDto | null>(null)
  const [layout, setLayout] = useState<SeatLayoutDto | null>(null)
  const [loadingLayout, setLoadingLayout] = useState(false)
  const [layoutError, setLayoutError] = useState('')

  // Seat selection
  const [selected, setSelected] = useState<string[]>([])
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Booking form
  const [bookingForm, setBookingForm] = useState({ name: '', email: '', phone: '', cabin: 'Economy' })
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState('')

  // Cancel
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node))
        setTooltip(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fetchRoutes = async () => {
    if (!date) return
    setLoadingRoutes(true)
    setRouteError('')
    try {
      const data = await flightOperatorService.getFlightsByDate(date)
      setRoutes(data)
      if (data.length === 1) {
        await openSeatMap(data[0])
      } else if (data.length === 0) {
        setRouteError('No flights found for this date.')
        setStep('date')
      } else {
        setStep('routes')
      }
    } catch {
      setRouteError('Failed to fetch flights for this date.')
    } finally {
      setLoadingRoutes(false)
    }
  }

  const openSeatMap = async (flight: FlightDateRouteDto) => {
    setSelectedFlight(flight)
    setLoadingLayout(true)
    setLayoutError('')
    setStep('map')
    try {
      const data = await flightOperatorService.getSeatLayout(flight.flightId)
      setLayout(data)
    } catch {
      setLayoutError('Failed to load seat layout. Make sure the flight has a seat layout configured.')
    } finally {
      setLoadingLayout(false)
    }
  }

  const toggleSeat = (seatId: string, seat: SeatDto) => {
    if (seat.isBooked) return
    setSelected(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    )
    setTooltip(null)
  }

  const handleSeatClick = (e: React.MouseEvent, seat: SeatDto) => {
    if (seat.isBooked) {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setTooltip({ seat, x: rect.left, y: rect.bottom + 6 })
    } else {
      toggleSeat(seat.seatNumber, seat)
    }
  }

  const handleBook = async () => {
    if (!selectedFlight || selected.length === 0) return
    if (!bookingForm.name || !bookingForm.email) {
      setBookingError('Passenger name and email are required.')
      return
    }
    setBooking(true)
    setBookingError('')
    try {
      await flightOperatorService.bulkBookSeats(selectedFlight.flightId, {
        passengerName: bookingForm.name,
        passengerEmail: bookingForm.email,
        passengerPhone: bookingForm.phone || undefined,
        seatNumbers: selected,
        cabinClass: bookingForm.cabin,
      })
      setBookingSuccess(`Seats ${selected.join(', ')} booked for ${bookingForm.name}. Confirmation email sent.`)
      setSelected([])
      setBookingForm({ name: '', email: '', phone: '', cabin: 'Economy' })
      // Refresh layout
      const fresh = await flightOperatorService.getSeatLayout(selectedFlight.flightId)
      setLayout(fresh)
    } catch (err: any) {
      setBookingError(err?.response?.data?.message ?? 'Failed to book seats.')
    } finally {
      setBooking(false)
    }
  }

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Cancel this booking and issue 90% refund to passenger wallet?')) return
    setCancelling(bookingId)
    setTooltip(null)
    try {
      await flightOperatorService.cancelBooking(bookingId)
      if (selectedFlight) {
        const fresh = await flightOperatorService.getSeatLayout(selectedFlight.flightId)
        setLayout(fresh)
      }
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to cancel booking.')
    } finally {
      setCancelling(null)
    }
  }

  const getSeatColor = (seat: SeatDto, isSelected: boolean): string => {
    if (seat.isBooked) return 'bg-red-400 text-white cursor-pointer hover:bg-red-500'
    if (isSelected) return 'bg-blue-600 text-white cursor-pointer hover:bg-blue-700 ring-2 ring-blue-300'
    if (seat.isLadiesOnly) return 'bg-purple-100 text-purple-700 border border-purple-300 cursor-pointer hover:bg-purple-200'
    return 'bg-gray-100 text-gray-700 border border-gray-200 cursor-pointer hover:bg-green-100 hover:border-green-400'
  }

  const renderSeatMap = () => {
    if (!layout) return null
    const config = layout.layoutConfig || '3-3'
    const sections = parseSections(config)
    const seatMap = new Map(layout.seats.map(s => [s.seatNumber, s]))

    return (
      <div className="overflow-auto max-h-[420px] pr-2">
        {/* Column labels */}
        <div className="flex items-center gap-1 mb-2 pl-8">
          {sections.map((count, si) => (
            <div key={si} className="flex gap-1">
              {Array.from({ length: count }, (_, ci) => {
                const letterIdx = sections.slice(0, si).reduce((a, b) => a + b, 0) + ci
                return (
                  <div key={ci} className="w-8 text-center text-xs font-bold text-gray-400">
                    {seatLetter(letterIdx)}
                  </div>
                )
              })}
              {si < sections.length - 1 && <div className="w-4" />}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          {Array.from({ length: layout.seatRows }, (_, ri) => {
            const row = ri + 1
            let letterIdx = 0
            return (
              <div key={row} className="flex items-center gap-1">
                <span className="w-7 text-right text-xs text-gray-400 mr-1 shrink-0">{row}</span>
                {sections.map((count, si) => (
                  <div key={si} className="flex gap-1">
                    {Array.from({ length: count }, (_, ci) => {
                      const letter = seatLetter(letterIdx)
                      letterIdx++
                      const seatId = `${row}${letter}`
                      const seat = seatMap.get(seatId) ?? {
                        seatNumber: seatId,
                        isBooked: false,
                        isLadiesOnly: false,
                      } as SeatDto
                      const isSelected = selected.includes(seatId)
                      return (
                        <button
                          key={seatId}
                          title={seat.isBooked ? `${seat.passengerName} — ${seat.bookingRef}` : seat.isLadiesOnly ? 'Ladies only' : seatId}
                          onClick={e => handleSeatClick(e, seat)}
                          className={`w-8 h-7 rounded text-xs font-semibold transition-all ${getSeatColor(seat, isSelected)}`}
                        >
                          {isSelected ? '✓' : ci + 1 === Math.ceil(count / 2) ? '' : ''}
                        </button>
                      )
                    })}
                    {si < sections.length - 1 && <div className="w-4" />}
                  </div>
                ))}
                {/* middle aisle label for readability */}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Seat Map</h2>
              {selectedFlight && (
                <p className="text-sm text-gray-500">
                  {selectedFlight.flightNumber} · {selectedFlight.source} → {selectedFlight.destination} ·{' '}
                  {new Date(selectedFlight.departureTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Step 1: Date Picker */}
          {step === 'date' && (
            <div className="max-w-md mx-auto mt-8">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Select Travel Date</h3>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              {routeError && <p className="text-red-600 text-sm mb-3">{routeError}</p>}
              <button
                onClick={fetchRoutes}
                disabled={!date || loadingRoutes}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                {loadingRoutes ? 'Searching...' : 'Find Flights'}
              </button>
            </div>
          )}

          {/* Step 2: Route Selection */}
          {step === 'routes' && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setStep('date')}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ← Change date
                </button>
                <h3 className="text-base font-semibold text-gray-800">
                  {routes.length} flights on {new Date(date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </h3>
              </div>
              <div className="space-y-2">
                {routes.map(r => (
                  <button
                    key={r.flightId}
                    onClick={() => openSeatMap(r)}
                    className="w-full text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-sm transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-800">{r.flightNumber}</span>
                        <span className="ml-3 text-gray-600 text-sm">{r.source} → {r.destination}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-800">
                          {new Date(r.departureTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                        </div>
                        <div className="text-xs text-gray-400">{r.availableSeats}/{r.totalSeats} seats</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Seat Map */}
          {step === 'map' && (
            <div className="flex gap-6">
              {/* Left: seat map */}
              <div className="flex-1 min-w-0">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {[
                    { color: 'bg-gray-100 border border-gray-200', label: 'Available' },
                    { color: 'bg-purple-100 border border-purple-300', label: 'Ladies Only' },
                    { color: 'bg-blue-600', label: 'Selected' },
                    { color: 'bg-red-400', label: 'Booked' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <div className={`w-5 h-4 rounded text-xs ${item.color}`} />
                      <span className="text-xs text-gray-500">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Plane nose */}
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-6 bg-blue-100 rounded-t-full flex items-center justify-center">
                    <Plane className="w-4 h-4 text-blue-500 rotate-90" />
                  </div>
                </div>

                {loadingLayout ? (
                  <div className="space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="h-7 bg-gray-100 rounded animate-pulse" />
                    ))}
                  </div>
                ) : layoutError ? (
                  <div className="text-red-600 text-sm bg-red-50 rounded-xl p-4">{layoutError}</div>
                ) : (
                  renderSeatMap()
                )}

                {/* Plane tail */}
                <div className="flex justify-center mt-3">
                  <div className="w-16 h-6 bg-blue-100 rounded-b-full" />
                </div>
              </div>

              {/* Right: booking panel */}
              <div className="w-72 shrink-0">
                {/* Summary */}
                <div className="bg-blue-50 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-800">
                      {selected.length > 0 ? `${selected.length} seat(s) selected` : 'No seats selected'}
                    </span>
                  </div>
                  {selected.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selected.map(s => (
                        <span
                          key={s}
                          onClick={() => setSelected(prev => prev.filter(x => x !== s))}
                          className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full cursor-pointer hover:bg-red-500 transition"
                          title="Click to deselect"
                        >
                          {s} ×
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {bookingSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-green-700">{bookingSuccess}</p>
                  </div>
                )}

                {/* Passenger form */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Passenger Details</h3>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Name *</label>
                    <input
                      type="text"
                      value={bookingForm.name}
                      onChange={e => setBookingForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Full name"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="email"
                        value={bookingForm.email}
                        onChange={e => setBookingForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="passenger@email.com"
                        className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="tel"
                        value={bookingForm.phone}
                        onChange={e => setBookingForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+91 9876543210"
                        className="w-full pl-9 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Cabin Class</label>
                    <select
                      value={bookingForm.cabin}
                      onChange={e => setBookingForm(f => ({ ...f, cabin: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Economy">Economy</option>
                      <option value="Business">Business</option>
                    </select>
                  </div>

                  {bookingError && (
                    <p className="text-red-600 text-xs">{bookingError}</p>
                  )}

                  <button
                    onClick={handleBook}
                    disabled={selected.length === 0 || booking}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {booking ? 'Booking...' : `Book ${selected.length > 0 ? selected.length : ''} Seat${selected.length !== 1 ? 's' : ''}`}
                  </button>
                </div>

                {/* Instructions */}
                <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Click available seats to select. Click booked seats to view passenger details and cancel if needed.
                    Cancellation issues a 90% wallet refund automatically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booked seat tooltip */}
      {tooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-[60] bg-white border border-gray-200 rounded-xl shadow-xl p-4 w-64"
          style={{ top: tooltip.y, left: Math.min(tooltip.x, window.innerWidth - 280) }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-gray-800 text-sm">Seat {tooltip.seat.seatNumber}</span>
            <button onClick={() => setTooltip(null)} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1 text-sm text-gray-600 mb-3">
            <p className="font-medium text-gray-800">{tooltip.seat.passengerName}</p>
            {tooltip.seat.passengerEmail && <p className="text-xs text-gray-500">{tooltip.seat.passengerEmail}</p>}
            {tooltip.seat.passengerPhone && <p className="text-xs text-gray-500">{tooltip.seat.passengerPhone}</p>}
            {tooltip.seat.bookingRef && (
              <p className="text-xs font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{tooltip.seat.bookingRef}</p>
            )}
          </div>
          {tooltip.seat.bookingId && (
            <button
              onClick={() => handleCancel(tooltip.seat.bookingId!)}
              disabled={cancelling === tooltip.seat.bookingId}
              className="w-full flex items-center justify-center gap-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition"
            >
              <XCircle className="w-3.5 h-3.5" />
              {cancelling === tooltip.seat.bookingId ? 'Cancelling...' : 'Cancel & Refund 90%'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
