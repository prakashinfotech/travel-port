import { useState } from 'react'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useNavigate } from 'react-router-dom'
import {
  Plane, Hotel, Calendar, ArrowRight,
  MapPin, Bed, Users, Clock, Star, Bus, Train, Car,
} from 'lucide-react'
import type { BookingDto, BookingStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/formatters'
import { bookingService } from '@/services/bookingService'

interface BookingCardProps {
  booking: BookingDto
  onCancelled: (id: string) => void
}

const statusVariant: Record<BookingStatus, 'info' | 'success' | 'danger' | 'warning' | 'default'> = {
  Pending:   'warning',
  Confirmed: 'success',
  Cancelled: 'danger',
  Completed: 'default',
}

function fmtDate(d?: string) {
  if (!d) return '—'
  return new Date(d + (d.includes('T') ? '' : 'T00:00:00')).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function fmtTime(iso?: string) {
  if (!iso) return '--:--'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function BookingCard({ booking, onCancelled }: BookingCardProps) {
  const navigate   = useNavigate()
  const [cancelling, setCancelling]   = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isHotel   = booking.type === 'Hotel'
  const isBus     = booking.type === 'Bus'
  const isTrain   = booking.type === 'Train'
  const isCab     = booking.type === 'Cab'
  const isTransport = isBus || isTrain || isCab
  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed'
  const nights    = booking.nightsCount ?? (
    booking.checkIn && booking.checkOut
      ? Math.max(1, Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000))
      : null
  )

  const handleClick = () => {
    if (isHotel) navigate(`/hotels/booking/${booking.id}/confirm`)
    else navigate(`/bookings/${booking.id}`)
  }

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowConfirm(true)
  }

  const handleConfirmCancel = async () => {
    setCancelling(true)
    try {
      await bookingService.cancel(booking.id)
      setShowConfirm(false)
      onCancelled(booking.id)
    } catch {
      setShowConfirm(false)
      alert('Failed to cancel booking. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <>
    <ConfirmDialog
      open={showConfirm}
      title="Cancel Booking?"
      message="Are you sure you want to cancel this booking? A 90% refund will be credited to your wallet within 5–7 business days."
      confirmLabel="Yes, Cancel Booking"
      cancelLabel="Keep Booking"
      variant="danger"
      loading={cancelling}
      onConfirm={handleConfirmCancel}
      onCancel={() => setShowConfirm(false)}
    />
    <div
      onClick={handleClick}
      className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
    >
      {/* ── Top bar: type icon + ref + status + amount ── */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
            isHotel ? 'bg-blue-50'
            : isBus  ? 'bg-green-50'
            : isTrain? 'bg-blue-50'
            : isCab  ? 'bg-yellow-50'
            : 'bg-orange-50'
          }`}>
            {isHotel  ? <Hotel className="h-5 w-5 text-blue-600" />
            : isBus   ? <Bus   className="h-5 w-5 text-green-600" />
            : isTrain ? <Train className="h-5 w-5 text-blue-700" />
            : isCab   ? <Car   className="h-5 w-5 text-yellow-600" />
            : <Plane className="h-5 w-5 text-orange-500" />}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">{booking.bookingReference}</p>
            <p className="text-xs text-gray-400">
              {isHotel ? 'Hotel Stay' : isBus ? 'Bus Ticket' : isTrain ? 'Train Ticket' : isCab ? 'Cab Booking' : 'Flight'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[booking.status]}>{booking.status}</Badge>
          <p className="font-extrabold text-gray-900 text-lg">{formatCurrency(booking.finalAmount || booking.totalAmount)}</p>
        </div>
      </div>

      {/* ── Details: flight / hotel / transport ── */}
      <div className="px-5 py-4">
        {isHotel ? (
          /* Hotel details */
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold text-gray-900 text-base leading-tight">
                  {booking.hotelName ?? 'Hotel Booking'}
                </p>
                {booking.hotelCity && (
                  <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                    <MapPin className="h-3 w-3" /> {booking.hotelCity}
                  </p>
                )}
                {booking.hotelStars && (
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: booking.hotelStars }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                )}
              </div>
              {booking.roomType && (
                <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-lg flex-shrink-0">
                  <Bed className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">{booking.roomType}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              {booking.checkIn && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">{fmtDate(booking.checkIn)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">{fmtDate(booking.checkOut)}</span>
                  {nights && (
                    <span className="ml-1 bg-orange-50 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      {nights} night{nights > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
              {booking.passengers && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3.5 w-3.5" />
                  <span>{booking.passengers} guest{booking.passengers > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        ) : isTransport ? (
          /* Bus / Train / Cab details */
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-xl">
                {booking.origin ?? '—'}
              </span>
              <ArrowRight className={`h-5 w-5 flex-shrink-0 ${
                isBus ? 'text-green-500' : isTrain ? 'text-blue-500' : 'text-yellow-500'
              }`} />
              <span className="font-bold text-gray-900 text-xl">
                {booking.destination ?? '—'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {booking.transportOperator && (
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                  isBus ? 'bg-green-50' : isTrain ? 'bg-blue-50' : 'bg-yellow-50'
                }`}>
                  {isBus   ? <Bus   className="h-3.5 w-3.5 text-green-600" />
                  : isTrain? <Train className="h-3.5 w-3.5 text-blue-700" />
                  : <Car className="h-3.5 w-3.5 text-yellow-600" />}
                  <span className={`text-xs font-semibold ${
                    isBus ? 'text-green-700' : isTrain ? 'text-blue-700' : 'text-yellow-700'
                  }`}>{booking.transportOperator}</span>
                </div>
              )}
              {booking.departureTime && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">{fmtDate(booking.departureTime)}</span>
                  <span className="text-gray-400">·</span>
                  <span className="font-bold">{fmtTime(booking.departureTime)}</span>
                </div>
              )}
              {booking.passengers && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3.5 w-3.5" />
                  <span>{booking.passengers} pax</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Flight details */
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-xl">
                {booking.originCity ?? booking.origin ?? '—'}
              </span>
              <ArrowRight className="h-5 w-5 text-orange-400 flex-shrink-0" />
              <span className="font-bold text-gray-900 text-xl">
                {booking.destinationCity ?? booking.destination ?? '—'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {booking.airline && (
                <div className="flex items-center gap-1.5 bg-orange-50 px-2.5 py-1 rounded-lg">
                  <Plane className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-xs font-semibold text-orange-700">
                    {booking.airline} {booking.flightNumber ? `· ${booking.flightNumber}` : ''}
                  </span>
                </div>
              )}
              {booking.departureTime && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="font-medium">{fmtDate(booking.departureTime)}</span>
                  <span className="text-gray-400">·</span>
                  <span className="font-bold">{fmtTime(booking.departureTime)}</span>
                </div>
              )}
              {booking.passengers && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Users className="h-3.5 w-3.5" />
                  <span>{booking.passengers} pax</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer: booking date + cancel button ── */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="h-3.5 w-3.5" />
          Booked {fmtDate(booking.bookingDate)}
          {booking.discountAmount > 0 && (
            <span className="ml-2 text-green-600 font-semibold">
              · Saved {formatCurrency(booking.discountAmount)}
            </span>
          )}
        </div>

        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            onClick={handleCancelClick}
            className="text-xs"
          >
            Cancel Booking
          </Button>
        )}
      </div>
    </div>
    </>
  )
}
