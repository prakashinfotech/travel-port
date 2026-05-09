import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Plane, Hotel, ArrowLeft, Calendar, Tag } from 'lucide-react'
import type { BookingDto, BookingStatus } from '@/types'
import { bookingService } from '@/services/bookingService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters'

const statusVariant: Record<BookingStatus, 'info' | 'success' | 'danger' | 'warning' | 'default'> = {
  Pending:   'warning',
  Confirmed: 'success',
  Cancelled: 'danger',
  Completed: 'default',
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNew = searchParams.get('new') === 'true'

  const [booking,  setBooking]  = useState<BookingDto | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!id) return
    bookingService.getById(id)
      .then(r => setBooking(r.data))
      .catch(() => setError('Booking not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    if (!booking || !confirm('Cancel this booking? 90% will be refunded to your wallet.')) return
    setCancelling(true)
    try {
      await bookingService.cancel(booking.id)
      setBooking(prev => prev ? { ...prev, status: 'Cancelled' } : prev)
    } catch {
      alert('Cancellation failed. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return (
    <div className="mx-auto max-w-2xl px-4 py-10 flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )

  if (!booking) return (
    <div className="flex items-center justify-center min-h-[50vh] text-gray-400">{error ?? 'Not found'}</div>
  )

  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {!isNew && (
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to bookings
        </button>
      )}

      {/* Success banner for new bookings */}
      {isNew && (
        <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 p-5 mb-6">
          <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-800">Booking Confirmed!</p>
            <p className="text-sm text-green-600">Your booking reference is <strong>{booking.bookingReference}</strong></p>
          </div>
        </div>
      )}

      {/* Booking details */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {booking.type === 'Flight'
                ? <Plane className="h-5 w-5 text-primary-600" />
                : <Hotel className="h-5 w-5 text-primary-600" />}
              <h1 className="text-xl font-bold text-gray-900">{booking.bookingReference}</h1>
            </div>
            <p className="text-sm text-gray-500">{booking.type} Booking</p>
          </div>
          <Badge variant={statusVariant[booking.status]} className="text-sm px-3 py-1">
            {booking.status}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Booking Date</p>
            <p className="font-medium text-gray-800 mt-0.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {formatDateTime(booking.bookingDate)}
            </p>
          </div>
          {booking.passengers && (
            <div>
              <p className="text-gray-400">Passengers</p>
              <p className="font-medium text-gray-800 mt-0.5">{booking.passengers}</p>
            </div>
          )}
          {booking.checkIn && (
            <div>
              <p className="text-gray-400">Check-in</p>
              <p className="font-medium text-gray-800 mt-0.5">{formatDate(booking.checkIn)}</p>
            </div>
          )}
          {booking.checkOut && (
            <div>
              <p className="text-gray-400">Check-out</p>
              <p className="font-medium text-gray-800 mt-0.5">{formatDate(booking.checkOut)}</p>
            </div>
          )}
          {booking.couponCode && (
            <div>
              <p className="text-gray-400">Coupon Applied</p>
              <p className="font-medium text-gray-800 mt-0.5 flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> {booking.couponCode}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
          <div>
            {booking.discountAmount > 0 && (
              <p className="text-sm text-green-600">Saved {formatCurrency(booking.discountAmount)}</p>
            )}
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
          </div>
          <div className="flex gap-3">
            {canCancel && (
              <Button variant="danger" size="sm" loading={cancelling} onClick={handleCancel}>
                Cancel Booking
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to="/bookings" className="text-sm text-primary-600 hover:underline">
          View all bookings →
        </Link>
      </div>
    </div>
  )
}
