import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, CheckCircle, Download, Luggage, Mail, Phone, Plane, ShieldCheck, TicketPercent, UserRound } from 'lucide-react'
import type { BookingDto, BookingStatus } from '@/types'
import { bookingService } from '@/services/bookingService'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatDateTime, formatDuration } from '@/utils/formatters'

const statusVariant: Record<BookingStatus, 'info' | 'success' | 'danger' | 'warning' | 'default'> = {
  Pending: 'warning',
  Confirmed: 'success',
  Cancelled: 'danger',
  Completed: 'default',
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
  const [downloading, setDownloading] = useState(false)

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
      .then(response => setBooking(response.data))
      .catch(() => setError('Booking not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const mergedBooking = useMemo(() => {
    if (!booking) return null
    return {
      ...booking,
      userName: booking.userName ?? bookingUi?.userName,
      userEmail: booking.userEmail ?? bookingUi?.email,
      userPhone: booking.userPhone ?? bookingUi?.mobile,
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
    }
  }, [booking, bookingUi])

  const canCancel = mergedBooking?.status === 'Pending' || mergedBooking?.status === 'Confirmed'

  const handleCancel = async () => {
    if (!mergedBooking || !confirm('Cancel this booking? 90% will be refunded to your wallet.')) return
    setCancelling(true)
    try {
      await bookingService.cancel(mergedBooking.id)
      setBooking(prev => prev ? { ...prev, status: 'Cancelled' } : prev)
    } catch {
      alert('Cancellation failed. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  const handleDownload = async () => {
    if (!mergedBooking) return
    setDownloading(true)
    try {
      const blob = await bookingService.downloadInvoice(mergedBooking.id)
      downloadBlob(blob, `${mergedBooking.bookingReference}-e-ticket.pdf`)
    } catch {
      const fallbackLines = [
        'TravelPort Flight E-Ticket',
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
      downloadBlob(buildPdfBlob(fallbackLines), `${mergedBooking.bookingReference}-e-ticket.pdf`)
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
      <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-orange-400 pb-24" />

      <div className="mx-auto -mt-20 max-w-7xl px-4 pb-10 sm:px-6">
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
                    {mergedBooking.originCity ?? mergedBooking.origin ?? 'Flight'} → {mergedBooking.destinationCity ?? mergedBooking.destination ?? 'Trip'}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    {mergedBooking.departureTime && (
                      <span className="rounded-md bg-amber-50 px-2 py-1 font-semibold text-amber-700">
                        {new Date(mergedBooking.departureTime).toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    )}
                    {mergedBooking.durationMinutes && <span>{formatDuration(mergedBooking.durationMinutes)}</span>}
                    {mergedBooking.passengers && <span>{mergedBooking.passengers} traveller{mergedBooking.passengers > 1 ? 's' : ''}</span>}
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
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <Plane className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{mergedBooking.airline ?? 'TravelPort Flight'}</p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{mergedBooking.flightNumber ?? mergedBooking.bookingReference}</span>
                        <span className="rounded-full border border-gray-300 px-2 py-0.5">Economy</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={handleDownload} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100">
                    <Download className="h-4 w-4" />
                    Download E-Ticket
                  </button>
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
                        <p className="mt-1 text-sm text-gray-600">{mergedBooking.origin ?? '-'} Airport, Terminal 1</p>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[2.15rem] top-2 h-3 w-3 rounded-full border-2 border-gray-400 bg-white" />
                        <p className="text-2xl font-bold text-gray-900">{mergedBooking.destinationCity ?? mergedBooking.destination ?? '-'}</p>
                        <p className="mt-1 text-sm text-gray-600">{mergedBooking.destination ?? '-'} Airport, Terminal 1</p>
                      </div>
                    </div>
                  </div>
                </div>

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

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
                  <span className="font-medium text-emerald-800">Your e-ticket is valid for airport check-in and can be downloaded anytime from this page.</span>
                  <button type="button" onClick={handleDownload} className="font-bold text-blue-600 hover:underline">Download now</button>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-2xl font-extrabold text-gray-900">Traveller & Contact Details</h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 p-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-cyan-700" />
                    <p className="font-bold text-gray-900">{mergedBooking.userName ?? 'Primary Traveller'}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{mergedBooking.passengers ?? 1} traveller{(mergedBooking.passengers ?? 1) > 1 ? 's' : ''} booked on this itinerary</p>
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

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
                Booking details were saved in the database successfully. Confirmation email support is wired through SMTP and will start sending once SMTP configuration is added.
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
                      <span>Discount Applied</span>
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
                <Button type="button" size="lg" loading={downloading} className="w-full bg-blue-600 font-bold hover:bg-blue-700" onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  Download E-Ticket
                </Button>
                {canCancel && (
                  <Button type="button" variant="danger" size="lg" loading={cancelling} className="w-full" onClick={handleCancel}>
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
