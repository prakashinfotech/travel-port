import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowRight, Bus, Calendar, CheckCircle, Clock, Download, Home, Info, Mail,
  MapPin, Phone, ShieldCheck, Ticket, UserRound,
} from 'lucide-react'
import { bookingService } from '@/services/bookingService'
import type { BookingDto } from '@/types'
import { formatCurrency } from '@/utils/formatters'
import { Skeleton } from '@/components/ui/Skeleton'

function formatJourneyDateTime(value?: string) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(minutes?: number) {
  if (!minutes && minutes !== 0) return '—'
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export default function BusBookingConfirmPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isNew = searchParams.get('new') === 'true'

  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!id) return
    bookingService.getById(id)
      .then((response) => setBooking(response.data))
      .catch(() => setError('Booking not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    if (!booking) return
    setDownloading(true)
    try {
      const blob = await bookingService.downloadInvoice(booking.id)
      downloadBlob(blob, `${booking.bookingReference}-bus-ticket.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray-400">
        {error ?? 'Booking not found'}
      </div>
    )
  }

  const total = booking.finalAmount || booking.totalAmount

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-100 bg-white shadow-sm">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-3 px-4 text-xs text-gray-400">
          <Link to="/" className="flex items-center gap-1 hover:text-green-600">
            <Home className="h-3 w-3" /> Home
          </Link>
          <ArrowRight className="h-3 w-3" />
          <Link to="/bookings" className="hover:text-green-600">My Bookings</Link>
          <ArrowRight className="h-3 w-3" />
          <span className="font-medium text-gray-700">Bus Booking</span>
        </div>
      </div>

      {isNew && (
        <div className="bg-green-600 px-4 py-3">
          <div className="mx-auto flex max-w-6xl items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-5 py-4">
            <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-green-600" />
            <div>
              <p className="text-base font-bold text-green-800">Booking Confirmed!</p>
              <p className="mt-0.5 text-sm text-green-700">
                Your bus ticket is confirmed with reference <strong>{booking.bookingReference}</strong>.
                Your e-ticket and confirmation email include seat, boarding and dropping details.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-100">
                    <Bus className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{booking.transportOperator ?? 'Bus Booking'}</h1>
                    <p className="text-sm text-gray-500">{booking.transportVehicleType ?? 'Bus Service'}</p>
                  </div>
                </div>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  {booking.bookingReference}
                </span>
              </div>

              <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">From</p>
                    <p className="mt-1 text-base font-bold text-gray-900">{booking.origin ?? '—'}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatJourneyDateTime(booking.departureTime)}</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="mx-auto h-5 w-5 text-green-600" />
                      <p className="mt-1 text-sm font-semibold text-green-700">{formatDuration(booking.durationMinutes)}</p>
                    </div>
                  </div>
                  <div className="md:text-right">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">To</p>
                    <p className="mt-1 text-base font-bold text-gray-900">{booking.destination ?? '—'}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatJourneyDateTime(booking.arrivalTime)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Seat Number</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{booking.transportSeatNumbers ?? '—'}</p>
                  <p className="mt-1 text-[11px] text-gray-400">(L) Lower Deck · (U) Upper Deck</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Bus Number</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{booking.transportBusNumber ?? '—'}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Boarding Point</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{booking.transportBoardingPoint ?? '—'}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Dropping Point</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{booking.transportDroppingPoint ?? '—'}</p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                <p className="text-sm text-blue-700">
                  Your downloadable e-ticket includes seat number, boarding point and dropping point for easy travel reference.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-gray-900">Passenger & Contact Details</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <UserRound className="h-5 w-5 shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{booking.userName ?? '—'}</p>
                    <p className="text-xs text-gray-400">Passenger Name</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <Mail className="h-5 w-5 shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{booking.userEmail ?? '—'}</p>
                    <p className="text-xs text-gray-400">Confirmation Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <Phone className="h-5 w-5 shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{booking.userPhone ?? '—'}</p>
                    <p className="text-xs text-gray-400">Mobile Number</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
                  <Calendar className="h-5 w-5 shrink-0 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{formatJourneyDateTime(booking.bookingDate)}</p>
                    <p className="text-xs text-gray-400">Booking Date</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="bg-green-600 px-5 py-3">
                  <h3 className="font-bold text-white">Ticket Actions</h3>
                </div>
                <div className="space-y-3 p-5">
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? 'Downloading…' : 'Download E-Ticket'}
                  </button>
                  <Link
                    to="/bookings"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 py-3 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
                  >
                    <Ticket className="h-4 w-4" />
                    View My Bookings
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 font-bold text-gray-900">Fare Summary</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Passengers</span>
                    <span className="text-gray-800">{booking.passengers ?? 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Paid</span>
                    <span className="text-lg font-extrabold text-green-700">{formatCurrency(total)}</span>
                  </div>
                  {booking.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Coupon Discount</span>
                      <span>- {formatCurrency(booking.discountAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <div className="text-sm text-gray-600">
                    <p className="font-semibold text-gray-900">Travel Tip</p>
                    <p className="mt-1">
                      Reach your boarding point a little early and keep this e-ticket handy for verification.
                    </p>
                  </div>
                </div>
                {booking.transportDriverPhone && (
                  <div className="mt-4 flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                    <div className="text-sm text-gray-600">
                      <p className="font-semibold text-gray-900">Driver Contact</p>
                      <p className="mt-1">{booking.transportDriverPhone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
