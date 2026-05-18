import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Bus, Calendar, Car, CheckCircle, Download, Luggage, Mail, MapPin, Phone, Plane, ShieldCheck, TicketPercent, Train, UserRound } from 'lucide-react'
import type { BookingDto, BookingStatus } from '@/types'
import { bookingService } from '@/services/bookingService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatCurrency, formatDateTime, formatDuration } from '@/utils/formatters'

const statusVariant: Record<BookingStatus, 'info' | 'success' | 'danger' | 'warning' | 'default'> = {
  Pending: 'warning',
  Confirmed: 'success',
  Cancelled: 'danger',
  Completed: 'default',
}

interface BookingUiSnapshot {
  bookingId: string
  bookingType?: 'Flight' | 'Hotel'
  // Flight fields
  email?: string
  mobile?: string
  countryCode?: string
  userName?: string
  origin?: string
  originCity?: string
  destination?: string
  destinationCity?: string
  airline?: string
  flightNumber?: string
  departureTime?: string
  arrivalTime?: string
  durationMinutes?: number
  passengers?: number
  // Hotel fields
  guestName?: string
  phone?: string
  hotelName?: string
  hotelAddress?: string
  hotelCity?: string
  hotelStars?: number
  roomType?: string
  checkIn?: string
  checkOut?: string
  nights?: number
  guests?: number
  pricePerNight?: number
  taxes?: number
  totalAmount?: number
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function buildPdfBlob(lines: string[]) {
  const content = lines
    .map((line, index) =>
      `BT /F1 12 Tf 50 ${790 - index * 24} Td (${line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj ET`)
    .join('\n')

  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach(object => {
    offsets.push(pdf.length)
    pdf += object
  })

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.slice(1).forEach(offset => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`

  return new Blob([pdf], { type: 'application/pdf' })
}

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const isNew = searchParams.get('new') === 'true'

  const [booking, setBooking] = useState<BookingDto | null>(null)
  const [bookingUi, setBookingUi] = useState<BookingUiSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [refundAmount, setRefundAmount] = useState<number | null>(null)

  useEffect(() => {
    if (!id) return

    const rawSnapshot = sessionStorage.getItem(`booking-ui:${id}`)
    if (rawSnapshot) {
      try {
        setBookingUi(JSON.parse(rawSnapshot) as BookingUiSnapshot)
      } catch {
        setBookingUi(null)
      }
    }

    bookingService.getById(id)
      .then(response => {
        const b = response.data
        // Redirect hotel bookings to the hotel confirm page
        if (b.type === 'Hotel') {
          navigate(`/hotels/booking/${id}/confirm`, { replace: true })
          return
        }
        setBooking(b)
      })
      .catch(() => setError('Booking not found.'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const mergedBooking = useMemo(() => {
    if (!booking) return null
    return {
      ...booking,
      userName: bookingUi?.userName ?? bookingUi?.guestName ?? booking.userName,
      userEmail: bookingUi?.email ?? booking.userEmail,
      userPhone: bookingUi?.mobile ?? bookingUi?.phone ?? booking.userPhone,
      airline: booking.airline ?? bookingUi?.airline,
      flightNumber: booking.flightNumber ?? bookingUi?.flightNumber,
      origin: booking.origin ?? bookingUi?.origin,
      originCity: booking.originCity ?? bookingUi?.originCity,
      destination: booking.destination ?? bookingUi?.destination,
      destinationCity: booking.destinationCity ?? bookingUi?.destinationCity,
      departureTime: booking.departureTime ?? bookingUi?.departureTime,
      arrivalTime: booking.arrivalTime ?? bookingUi?.arrivalTime,
      durationMinutes: booking.durationMinutes ?? bookingUi?.durationMinutes,
      passengers: booking.passengers ?? bookingUi?.passengers,
      checkIn: booking.checkIn ?? bookingUi?.checkIn,
      checkOut: booking.checkOut ?? bookingUi?.checkOut,
    }
  }, [booking, bookingUi])

  const canCancel = mergedBooking?.status === 'Pending' || mergedBooking?.status === 'Confirmed'

  const handleConfirmCancel = async () => {
    if (!mergedBooking) return
    setCancelling(true)
    try {
      const res = await bookingService.cancel(mergedBooking.id)
      const refund = res.data?.refundAmount ?? Math.round(mergedBooking.finalAmount * 0.9)
      setRefundAmount(refund)
      setBooking(prev => prev ? { ...prev, status: 'Cancelled' } : prev)
      setShowCancelDialog(false)
    } catch {
      setShowCancelDialog(false)
    } finally {
      setCancelling(false)
    }
  }

  const handleDownload = async () => {
    if (!mergedBooking) return
    setDownloading(true)
    try {
      const blob = await bookingService.downloadInvoice(mergedBooking.id)
      downloadBlob(blob, `${mergedBooking.bookingReference}-invoice.pdf`)
    } catch {
      const isTransport = mergedBooking.type === 'Bus' || mergedBooking.type === 'Train' || mergedBooking.type === 'Cab'
      const isHotel = bookingUi?.bookingType === 'Hotel' || mergedBooking.type === 'Hotel'
      if (isTransport) {
        const transportLines = [
          `TravelPort ${mergedBooking.type} Ticket`,
          '--------------------------------------------',
          `Booking Reference: ${mergedBooking.bookingReference}`,
          `Status: ${mergedBooking.status}`,
          '',
          'JOURNEY DETAILS',
          `Operator: ${mergedBooking.transportOperator ?? '-'}`,
          `Vehicle Type: ${mergedBooking.transportVehicleType ?? '-'}`,
          `From: ${mergedBooking.origin ?? '-'}`,
          `To: ${mergedBooking.destination ?? '-'}`,
          `Departure: ${mergedBooking.departureTime ? formatDateTime(mergedBooking.departureTime) : '-'}`,
          `Arrival: ${mergedBooking.arrivalTime ? formatDateTime(mergedBooking.arrivalTime) : '-'}`,
          `Duration: ${mergedBooking.durationMinutes ? formatDuration(mergedBooking.durationMinutes) : '-'}`,
          '',
          'PASSENGER DETAILS',
          `Name:  ${mergedBooking.userName ?? '-'}`,
          `Email: ${mergedBooking.userEmail ?? '-'}`,
          `Phone: ${mergedBooking.userPhone ?? '-'}`,
          '',
          'FARE SUMMARY',
          `Total Paid: ${formatCurrency(mergedBooking.finalAmount || mergedBooking.totalAmount)}`,
          '',
          'Thank you for booking with TravelPort!',
        ]
        downloadBlob(buildPdfBlob(transportLines), `${mergedBooking.bookingReference}-ticket.pdf`)
        return
      }
      const fallbackLines = isHotel ? [
        'TravelPort Hotel Invoice',
        '--------------------------------------------',
        `Booking Reference: ${mergedBooking.bookingReference}`,
        `Status: ${mergedBooking.status}`,
        '',
        'PROPERTY DETAILS',
        `Hotel: ${bookingUi?.hotelName ?? 'Hotel'}`,
        `Address: ${bookingUi?.hotelAddress ?? '-'}`,
        `Room: ${bookingUi?.roomType ?? '-'}`,
        '',
        'STAY DETAILS',
        `Check-in:  ${bookingUi?.checkIn  ?? mergedBooking.checkIn  ?? '-'}`,
        `Check-out: ${bookingUi?.checkOut ?? mergedBooking.checkOut ?? '-'}`,
        `Duration:  ${bookingUi?.nights ?? '-'} night(s)`,
        `Guests:    ${bookingUi?.guests  ?? '-'}`,
        '',
        'GUEST DETAILS',
        `Name:  ${bookingUi?.guestName ?? '-'}`,
        `Email: ${bookingUi?.email ?? '-'}`,
        `Phone: ${bookingUi?.phone ?? '-'}`,
        '',
        'PRICE SUMMARY',
        `Room Rate × Nights: ${formatCurrency(mergedBooking.totalAmount)}`,
        `Total Paid: ${formatCurrency(mergedBooking.finalAmount || mergedBooking.totalAmount)}`,
        '',
        'Thank you for booking with TravelPort!',
      ] : [
        'TravelPort Flight E-Ticket',
        '--------------------------------------------',
        `Booking Reference: ${mergedBooking.bookingReference}`,
        `Traveller: ${mergedBooking.userName ?? 'Primary Traveller'}`,
        `Email: ${mergedBooking.userEmail ?? '-'}`,
        `Phone: ${mergedBooking.userPhone ? `${bookingUi?.countryCode ? `${bookingUi.countryCode} ` : ''}${mergedBooking.userPhone}` : '-'}`,
        `Flight: ${mergedBooking.airline ?? 'TravelPort Flight'} ${mergedBooking.flightNumber ?? ''}`.trim(),
        `Route: ${mergedBooking.originCity ?? mergedBooking.origin ?? '-'} -> ${mergedBooking.destinationCity ?? mergedBooking.destination ?? '-'}`,
        `Departure: ${mergedBooking.departureTime ? formatDateTime(mergedBooking.departureTime) : '-'}`,
        `Arrival: ${mergedBooking.arrivalTime ? formatDateTime(mergedBooking.arrivalTime) : '-'}`,
        `Passengers: ${mergedBooking.passengers ?? 1}`,
        `Total Amount: ${formatCurrency(mergedBooking.finalAmount || mergedBooking.totalAmount)}`,
      ]
      downloadBlob(buildPdfBlob(fallbackLines), `${mergedBooking.bookingReference}-invoice.pdf`)
    } finally {
      setDownloading(false)
    }
  }

  const fareBreakup = useMemo(() => {
    if (!mergedBooking) return { baseFare: 0, surcharges: 0 }
    const finalAmount = mergedBooking.finalAmount || mergedBooking.totalAmount
    const baseFare = Math.round(finalAmount * 0.6)
    return {
      baseFare,
      surcharges: finalAmount - baseFare,
    }
  }, [mergedBooking])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-80 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
          </div>
          <Skeleton className="h-[32rem] w-full rounded-3xl" />
        </div>
      </div>
    )
  }

  if (!mergedBooking) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">{error ?? 'Booking not found'}</div>
    )
  }

  return (
    <div className="min-h-screen bg-[#eef4fa]">
      <ConfirmDialog
        open={showCancelDialog}
        title="Cancel Booking?"
        message="Are you sure you want to cancel this booking? 90% of the fare will be refunded to your wallet."
        confirmLabel="Yes, Cancel Booking"
        cancelLabel="Keep Booking"
        variant="danger"
        loading={cancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelDialog(false)}
      />
      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-400 pb-24" />

      <div className="mx-auto -mt-20 max-w-7xl px-4 pb-10 sm:px-6">
        {/* Wallet refund banner — shown immediately after cancellation */}
        {refundAmount !== null && (
          <div className="mb-5 flex items-center gap-3 rounded-3xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <span className="text-3xl">👛</span>
            <div>
              <p className="font-bold text-green-800">Booking Cancelled — Refund Processed!</p>
              <p className="text-sm text-green-700">
                <strong>₹{refundAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> (90% of fare) has been credited to your TravelPort Wallet. Check your wallet balance in your profile.
              </p>
            </div>
          </div>
        )}

        {!isNew && (
          <button onClick={() => navigate(-1)} className="mb-5 flex items-center gap-1 text-sm font-medium text-white/90 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back to bookings
          </button>
        )}

        {isNew && (
          <div className="mb-6 flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <CheckCircle className="h-8 w-8 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold text-emerald-800">Booking Confirmed!</p>
              <p className="text-sm text-emerald-700">Your booking reference is <strong>{mergedBooking.bookingReference}</strong>. Your e-ticket is ready to download.</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-900">
                    {mergedBooking.type === 'Flight'
                      ? `${mergedBooking.originCity ?? mergedBooking.origin ?? 'Flight'} → ${mergedBooking.destinationCity ?? mergedBooking.destination ?? 'Trip'}`
                      : `${mergedBooking.origin ?? '-'} → ${mergedBooking.destination ?? '-'}`
                    }
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    {mergedBooking.departureTime && (
                      <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                        {new Date(mergedBooking.departureTime).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {mergedBooking.durationMinutes && <span>{formatDuration(mergedBooking.durationMinutes)}</span>}
                    {mergedBooking.passengers && <span>{mergedBooking.passengers} passenger{mergedBooking.passengers > 1 ? 's' : ''}</span>}
                    {mergedBooking.transportVehicleType && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-gray-600">{mergedBooking.transportVehicleType}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={statusVariant[mergedBooking.status]} className="px-3 py-1 text-xs font-bold">
                    {mergedBooking.status}
                  </Badge>
                  <p className="mt-3 text-sm font-medium text-blue-600">{mergedBooking.bookingReference}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      mergedBooking.type === 'Bus' ? 'bg-green-50 text-green-700' :
                      mergedBooking.type === 'Train' ? 'bg-blue-50 text-blue-700' :
                      mergedBooking.type === 'Cab' ? 'bg-yellow-50 text-yellow-600' :
                      'bg-orange-50 text-orange-600'
                    }`}>
                      {mergedBooking.type === 'Bus' ? <Bus className="h-5 w-5" /> :
                       mergedBooking.type === 'Train' ? <Train className="h-5 w-5" /> :
                       mergedBooking.type === 'Cab' ? <Car className="h-5 w-5" /> :
                       <Plane className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {mergedBooking.type === 'Flight'
                          ? (mergedBooking.airline ?? 'TravelPort Flight')
                          : (mergedBooking.transportOperator ?? mergedBooking.type)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        {mergedBooking.type === 'Flight' && (
                          <>
                            <span>{mergedBooking.flightNumber ?? mergedBooking.bookingReference}</span>
                            <span className="rounded-full border border-gray-300 px-2 py-0.5">Economy</span>
                          </>
                        )}
                        {mergedBooking.type !== 'Flight' && mergedBooking.transportVehicleType && (
                          <span className="rounded-full border border-gray-300 px-2 py-0.5">{mergedBooking.transportVehicleType}</span>
                        )}
                        {mergedBooking.type === 'Cab' && mergedBooking.transportDistanceKm && (
                          <span>{mergedBooking.transportDistanceKm} km</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {mergedBooking.status !== 'Cancelled' && (
                    <button type="button" onClick={handleDownload} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                      <Download className="h-4 w-4" />
                      Download E-Ticket
                    </button>
                  )}
                </div>

                <div className="grid gap-5 pt-5 md:grid-cols-[110px_minmax(0,1fr)]">
                  <div className="space-y-7 text-right">
                    <div>
                      <p className="text-3xl font-black text-gray-900">{mergedBooking.departureTime ? new Date(mergedBooking.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</p>
                      <p className="text-sm text-gray-500">Departure</p>
                    </div>
                    <div>
                      <p className="text-3xl font-black text-gray-900">{mergedBooking.arrivalTime ? new Date(mergedBooking.arrivalTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}</p>
                      <p className="text-sm text-gray-500">Arrival</p>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute bottom-6 left-0 top-4 border-l-2 border-dashed border-gray-300" />
                    <div className="space-y-8 pl-8">
                      <div className="relative">
                        <div className="absolute -left-[2.15rem] top-2 h-3 w-3 rounded-full border-2 border-gray-400 bg-white" />
                        <p className="text-2xl font-bold text-gray-900">{mergedBooking.originCity ?? mergedBooking.origin ?? '-'}</p>
                        {mergedBooking.type === 'Flight'
                          ? <p className="mt-1 text-sm text-gray-600">{mergedBooking.origin ?? '-'} Airport, Terminal 1</p>
                          : <p className="mt-1 text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" />{mergedBooking.origin ?? '-'}</p>
                        }
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[2.15rem] top-2 h-3 w-3 rounded-full border-2 border-gray-400 bg-white" />
                        <p className="text-2xl font-bold text-gray-900">{mergedBooking.destinationCity ?? mergedBooking.destination ?? '-'}</p>
                        {mergedBooking.type === 'Flight'
                          ? <p className="mt-1 text-sm text-gray-600">{mergedBooking.destination ?? '-'} Airport, Terminal 1</p>
                          : <p className="mt-1 text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" />{mergedBooking.destination ?? '-'}</p>
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {mergedBooking.type === 'Flight' && (
                  <div className="mt-5 grid gap-3 border-t border-gray-200 pt-4 md:grid-cols-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Luggage className="h-4 w-4 text-amber-500" />
                      <span>Cabin Baggage: 7 Kgs (1 piece only) / Adult</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Luggage className="h-4 w-4 text-amber-500" />
                      <span>Check-In Baggage: 15 Kgs (1 piece only) / Adult</span>
                    </div>
                  </div>
                )}

                {mergedBooking.type !== 'Flight' && mergedBooking.transportAmenities && (
                  <div className="mt-5 border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-700">Amenities: <span className="text-gray-500 font-normal">{mergedBooking.transportAmenities}</span></p>
                  </div>
                )}

                {mergedBooking.status !== 'Cancelled' && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                    <span className="font-medium text-emerald-800">Your e-ticket is ready and can be downloaded anytime from this page.</span>
                    <button type="button" onClick={handleDownload} className="font-bold text-blue-600 hover:underline">Download now</button>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-900">Passenger & Contact Details</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-cyan-700" />
                    <p className="font-bold text-gray-900">{mergedBooking.userName ?? 'Primary Passenger'}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{mergedBooking.passengers ?? 1} passenger{(mergedBooking.passengers ?? 1) > 1 ? 's' : ''} on this booking</p>
                </div>

                <div className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{mergedBooking.userEmail ?? 'No email available'}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{mergedBooking.userPhone ? `${bookingUi?.countryCode ? `${bookingUi.countryCode} ` : ''}${mergedBooking.userPhone}` : 'No phone available'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm text-green-900">
                A confirmation email has been sent to <strong>{mergedBooking.userEmail}</strong>. Please check your inbox.
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Cancellation & Date Change Policy</h2>
                  <p className="mt-1 text-sm text-gray-500">Cancellation terms are based on the current booking status and fare type.</p>
                </div>
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{mergedBooking.origin ?? '-'}-{mergedBooking.destination ?? '-'}</p>
                    <p className="text-sm text-gray-500">Cancellation Penalty</p>
                  </div>
                  <p className="text-3xl font-black text-gray-900">{formatCurrency(mergedBooking.finalAmount || mergedBooking.totalAmount)}</p>
                </div>
                <div className="mt-4 h-1 rounded-full bg-rose-400" />
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>Cancel Between (IST): Now</span>
                  <span>{mergedBooking.departureTime ? formatDateTime(mergedBooking.departureTime) : formatDateTime(mergedBooking.bookingDate)}</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-900">Fare Summary</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Base Fare</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(fareBreakup.baseFare)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span>Taxes and Surcharges</span>
                  </div>
                  <span className="font-semibold text-gray-900">{formatCurrency(fareBreakup.surcharges)}</span>
                </div>
                {mergedBooking.discountAmount > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <TicketPercent className="h-4 w-4" />
                      <span>Coupon {mergedBooking.couponCode ? `(${mergedBooking.couponCode})` : 'Discount'}</span>
                    </div>
                    <span className="font-semibold text-emerald-700">- {formatCurrency(mergedBooking.discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-2xl font-extrabold text-gray-900">Total Amount</span>
                    <span className="text-3xl font-black text-gray-900">{formatCurrency(mergedBooking.finalAmount || mergedBooking.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-extrabold text-gray-900">Booking Actions</h2>
              <div className="mt-4 space-y-3">
                {mergedBooking.status !== 'Cancelled' && (
                  <Button type="button" size="lg" loading={downloading} className="w-full bg-blue-600 font-bold hover:bg-blue-700" onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Download E-Ticket
                  </Button>
                )}
                {canCancel && (
                  <Button type="button" variant="danger" size="lg" className="w-full" onClick={() => setShowCancelDialog(true)}>
                    Cancel Booking
                  </Button>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Booked on</p>
              <p className="mt-1 text-lg font-bold text-gray-900">{formatDateTime(mergedBooking.bookingDate)}</p>
              <p className="mt-4 text-sm text-gray-500">Booking Reference</p>
              <p className="mt-1 text-lg font-bold text-blue-700">{mergedBooking.bookingReference}</p>
            </section>

            <div className="text-center">
              <Link to="/bookings" className="text-sm font-medium text-primary-600 hover:underline">
                View all bookings →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
