import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  CheckCircle, Download, MapPin, Star, Calendar,
  Users, Home, ChevronRight, Bed, Mail, Phone, UserRound,
  Clock, Info,
} from 'lucide-react'
import type { BookingDto } from '@/types'
import { bookingService } from '@/services/bookingService'
import { formatCurrency } from '@/utils/formatters'
import { Skeleton } from '@/components/ui/Skeleton'

// ── Types ──────────────────────────────────────────────────────────────────────

interface HotelUiSnapshot {
  bookingId:    string
  bookingType:  'Hotel'
  guestName:    string
  email:        string
  phone:        string
  hotelName:    string
  hotelAddress: string
  hotelCity:    string
  hotelStars:   number
  roomType:     string
  checkIn:      string
  checkOut:     string
  nights:       number
  guests:       number
  pricePerNight: number
  taxes:        number
  totalAmount:  number
}

// ── PDF builder ────────────────────────────────────────────────────────────────

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = fileName; a.click()
  URL.revokeObjectURL(url)
}

function buildHotelPdf(snap: HotelUiSnapshot, ref: string, status: string): Blob {
  const lines = [
    'TravelPort  —  Hotel Booking Invoice',
    '================================================',
    '',
    `Booking Reference : ${ref}`,
    `Status            : ${status}`,
    '',
    'PROPERTY DETAILS',
    `Hotel   : ${snap.hotelName}`,
    `Address : ${snap.hotelAddress}`,
    `City    : ${snap.hotelCity}`,
    `Room    : ${snap.roomType}`,
    '',
    'STAY DETAILS',
    `Check-in  : ${snap.checkIn}`,
    `Check-out : ${snap.checkOut}`,
    `Duration  : ${snap.nights} night${snap.nights !== 1 ? 's' : ''}`,
    `Guests    : ${snap.guests}`,
    '',
    'GUEST DETAILS',
    `Name  : ${snap.guestName}`,
    `Email : ${snap.email}`,
    `Phone : ${snap.phone}`,
    '',
    'PRICE SUMMARY',
    `Room Rate  : ${formatCurrency(snap.pricePerNight)} x ${snap.nights} night${snap.nights !== 1 ? 's' : ''}`,
    `Base Amount: ${formatCurrency(snap.pricePerNight * snap.nights)}`,
    `Taxes      : ${formatCurrency(snap.taxes)}`,
    `Total Paid : ${formatCurrency(snap.totalAmount)}`,
    '',
    '================================================',
    'Thank you for booking with TravelPort!',
    'For support: support@travelport.com',
  ]

  const content = lines
    .map((line, i) =>
      `BT /F1 11 Tf 50 ${800 - i * 22} Td (${line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj ET`)
    .join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach(o => { offsets.push(pdf.length); pdf += o })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach(off => { pdf += `${String(off).padStart(10, '0')} 00000 n \n` })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return new Blob([pdf], { type: 'application/pdf' })
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
}

function fmtBookingDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function HotelBookingConfirmPage() {
  const { id }         = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const isNew          = searchParams.get('new') === 'true'

  const [booking,     setBooking]     = useState<BookingDto | null>(null)
  const [snap,        setSnap]        = useState<HotelUiSnapshot | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [cancelling,  setCancelling]  = useState(false)
  const [refundAmount, setRefundAmount] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return
    // Load UI snapshot from sessionStorage
    const raw = sessionStorage.getItem(`booking-ui:${id}`)
    if (raw) {
      try { setSnap(JSON.parse(raw) as HotelUiSnapshot) } catch { /* ignore */ }
    }
    bookingService.getById(id)
      .then(r => setBooking(r.data))
      .catch(() => setError('Booking not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    if (!booking) return
    setDownloading(true)
    try {
      const blob = await bookingService.downloadInvoice(booking.id)
      downloadBlob(blob, `${booking.bookingReference}-hotel-invoice.pdf`)
    } catch {
      if (snap) {
        downloadBlob(buildHotelPdf(snap, booking.bookingReference, booking.status), `${booking.bookingReference}-hotel-invoice.pdf`)
      }
    } finally {
      setDownloading(false)
    }
  }

  const handleCancel = async () => {
    if (!booking || !confirm('Cancel this booking? 90% will be refunded to your wallet.')) return
    setCancelling(true)
    try {
      const res = await bookingService.cancel(booking.id)
      const refund = res.data?.refundAmount ?? Math.round((booking.finalAmount ?? booking.totalAmount) * 0.9)
      setRefundAmount(refund)
      setBooking(prev => prev ? { ...prev, status: 'Cancelled' } : prev)
    } catch {
      alert('Cancellation failed. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    </div>
  )

  if (error || !booking) return (
    <div className="flex items-center justify-center min-h-[50vh] text-gray-400 text-sm">
      {error ?? 'Booking not found'}
    </div>
  )

  const isCancelled  = booking.status === 'Cancelled'
  const canCancel    = booking.status === 'Pending' || booking.status === 'Confirmed'
  const total        = booking.finalAmount || booking.totalAmount

  // Derive nights from snapshot first, then booking API data, then date math
  const nights = snap?.nights ?? booking.nightsCount ?? (
    booking.checkIn && booking.checkOut
      ? Math.max(1, Math.round((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / 86400000))
      : 1
  )
  const pricePerNight = snap?.pricePerNight ?? booking.pricePerNight
  const baseAmount   = pricePerNight ? pricePerNight * nights : (total / 1.12)
  const taxes        = snap?.taxes ?? Math.round(total * 0.107)

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 h-12 flex items-center gap-3">
          <nav className="flex items-center gap-1 text-xs text-gray-400">
            <Link to="/" className="hover:text-orange-600 flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/bookings" className="hover:text-orange-600">My Bookings</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-medium">Hotel Booking</span>
          </nav>
        </div>
      </div>

      {/* Success / status banner */}
      {isNew && !isCancelled && (
        <div className="bg-orange-500 px-4 py-3">
          <div className="mx-auto max-w-6xl">
            <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-green-800 text-base">Booking Confirmed!</p>
                <p className="text-sm text-green-700 mt-0.5">
                  Your booking reference is{' '}
                  <strong className="font-bold text-green-900">{booking.bookingReference}</strong>.
                  {' '}Your hotel invoice is ready to download.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCancelled && refundAmount !== null && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-4">
          <div className="mx-auto max-w-6xl flex items-center gap-3 text-green-800 text-sm">
            <span className="text-2xl">👛</span>
            <div>
              <p className="font-bold">Booking Cancelled — Refund Processed!</p>
              <p>
                <strong>₹{refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> (90% of fare) has been credited to your TravelPort Wallet.
              </p>
            </div>
          </div>
        </div>
      )}

      {isCancelled && refundAmount === null && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="mx-auto max-w-6xl flex items-center gap-2 text-red-700 text-sm">
            <Info className="h-4 w-4" /> This booking has been cancelled.
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Hotel & Room summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Hotel Stay</h2>
                <span className="text-sm font-semibold text-orange-600">{booking.bookingReference}</span>
              </div>

              <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
                {/* Hotel name & stars */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{snap?.hotelName ?? 'Hotel'}</h3>
                    {snap?.hotelAddress && (
                      <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {snap.hotelAddress}
                      </p>
                    )}
                  </div>
                  {snap?.hotelStars && (
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {Array.from({ length: snap.hotelStars }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                  )}
                </div>

                {/* Room type */}
                <div className="flex items-center gap-2 mb-4 p-3 bg-white rounded-lg border border-gray-100">
                  <Bed className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  <span className="text-sm font-semibold text-gray-800">{snap?.roomType ?? 'Room'}</span>
                </div>

                {/* Check-in / Check-out */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Check-in</p>
                    <p className="font-bold text-gray-900 text-sm">{fmtDate(snap?.checkIn ?? booking.checkIn ?? '')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">From 2:00 PM</p>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-orange-500 mb-1">
                        <div className="h-px w-6 bg-orange-300" />
                        <Calendar className="h-4 w-4" />
                        <div className="h-px w-6 bg-orange-300" />
                      </div>
                      <p className="text-xs font-bold text-orange-600">{nights} Night{nights !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Check-out</p>
                    <p className="font-bold text-gray-900 text-sm">{fmtDate(snap?.checkOut ?? booking.checkOut ?? '')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">By 12:00 PM</p>
                  </div>
                </div>

                {/* Guests */}
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  <span>{snap?.guests ?? 1} Guest{(snap?.guests ?? 1) > 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Download inline CTA */}
              {!isCancelled && (
                <div className="mt-4 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-green-700 font-medium">Your invoice is ready to download.</p>
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:underline disabled:opacity-50"
                  >
                    {downloading ? 'Downloading…' : 'Download now'}
                  </button>
                </div>
              )}
            </div>

            {/* Guest details */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Guest & Contact Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <UserRound className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{snap?.guestName ?? booking.userName ?? '—'}</p>
                    <p className="text-xs text-gray-400">Primary Guest</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <Mail className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{snap?.email ?? booking.userEmail ?? '—'}</p>
                    <p className="text-xs text-gray-400">Email Address</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <Phone className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{snap?.phone ?? booking.userPhone ?? '—'}</p>
                    <p className="text-xs text-gray-400">Mobile Number</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                  <Clock className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{fmtBookingDate(booking.bookingDate)}</p>
                    <p className="text-xs text-gray-400">Booking Date</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="h-5 w-5 text-orange-400" /> Hotel Policies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Check-in from 2:00 PM, Check-out by 12:00 PM</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Government-issued photo ID required at check-in</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Free cancellation up to 24 hours before check-in</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>Extra charges may apply for additional guests</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right sidebar ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">

              {/* Fare summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-orange-500 px-5 py-3">
                  <h3 className="font-bold text-white">Price Summary</h3>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Room Rate × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span className="text-gray-800">{formatCurrency(baseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Taxes & Fees (12% GST)</span>
                    <span className="text-gray-800">{formatCurrency(taxes)}</span>
                  </div>
                  {booking.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Coupon {booking.couponCode ? `(${booking.couponCode})` : 'Discount'}</span>
                      <span>− {formatCurrency(booking.discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-900 text-sm">Total Amount</span>
                      <span className="font-extrabold text-orange-600 text-xl">{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-gray-900">Booking Actions</h3>

                {!isCancelled && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm transition-colors disabled:opacity-60"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? 'Downloading…' : 'Download Invoice'}
                  </button>
                )}

                {canCancel && (
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-semibold py-2.5 text-sm transition-colors disabled:opacity-60"
                  >
                    {cancelling ? 'Cancelling…' : 'Cancel Booking'}
                  </button>
                )}

                {isCancelled && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-center font-medium">
                    This booking is cancelled
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Booked on</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{fmtBookingDate(booking.bookingDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Booking Reference</p>
                  <p className="font-bold text-orange-600 text-base mt-0.5">{booking.bookingReference}</p>
                </div>
                <Link to="/bookings" className="block text-center text-sm font-semibold text-orange-600 hover:underline pt-1">
                  View all bookings →
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
