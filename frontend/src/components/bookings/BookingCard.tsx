import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plane, Hotel, Calendar } from 'lucide-react'
import type { BookingDto, BookingStatus } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/utils/formatters'
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

export function BookingCard({ booking, onCancelled }: BookingCardProps) {
  const navigate = useNavigate()
  const [cancelling, setCancelling] = useState(false)

  const handleCancel = async () => {
    if (!confirm('Cancel this booking? A 90% refund will be credited to your wallet.')) return
    setCancelling(true)
    try {
      await bookingService.cancel(booking.id)
      onCancelled(booking.id)
    } catch {
      alert('Failed to cancel booking. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const canCancel = booking.status === 'Pending' || booking.status === 'Confirmed'

  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/bookings/${booking.id}`)}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 flex-shrink-0">
          {booking.type === 'Flight'
            ? <Plane className="h-5 w-5 text-primary-600" />
            : <Hotel className="h-5 w-5 text-primary-600" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{booking.bookingReference}</p>
            <Badge variant={statusVariant[booking.status]}>{booking.status}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{booking.type} Booking</p>
          <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
            <Calendar className="h-3 w-3" /> {formatDate(booking.bookingDate)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto sm:ml-0">
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{formatCurrency(booking.totalAmount)}</p>
          {booking.discountAmount > 0 && (
            <p className="text-xs text-green-600">Saved {formatCurrency(booking.discountAmount)}</p>
          )}
        </div>
        {canCancel && (
          <Button
            variant="danger"
            size="sm"
            loading={cancelling}
            onClick={(e) => { e.stopPropagation(); handleCancel() }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}
