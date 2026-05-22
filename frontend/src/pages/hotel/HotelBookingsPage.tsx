import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Calendar, User, IndianRupee, Search, X, Plus, Trash2,
  LogIn, LogOut, FileText, Download, CheckCircle, AlertTriangle,
  Clock, Phone, Mail, BedDouble, ChevronDown, Loader2, Eye,
  Receipt, ShoppingCart,
} from 'lucide-react'
import { hotelManagerService } from '@/services/hotelManagerService'
import { formatCurrency } from '@/utils/formatters'
import type {
  HotelManagerBookingDto,
  HotelBookingDetailDto,
  HotelInvoiceDto,
  AddHotelChargeRequest,
  PaginationMeta,
} from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const CHARGE_CATEGORIES = ['Food', 'Laundry', 'Room Service', 'Mini Bar', 'Extra Bed', 'Spa', 'Other']
const PAYMENT_METHODS   = ['Cash', 'Card', 'UPI', 'Bank Transfer']

const STATUS_META: Record<string, { cls: string; label: string }> = {
  Pending:    { cls: 'bg-amber-100 text-amber-700',  label: 'Pending' },
  Confirmed:  { cls: 'bg-blue-100 text-blue-700',    label: 'Confirmed' },
  CheckedIn:  { cls: 'bg-green-100 text-green-700',  label: 'Checked In' },
  CheckedOut: { cls: 'bg-purple-100 text-purple-700', label: 'Checked Out' },
  Cancelled:  { cls: 'bg-red-100 text-red-700',      label: 'Cancelled' },
  Completed:  { cls: 'bg-gray-100 text-gray-600',    label: 'Completed' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(d: string | Date) {
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function isCheckoutToday(checkOut: string) {
  return new Date(checkOut).toDateString() === new Date().toDateString()
}
function hoursUntilCheckout(checkOut: string) {
  const diff = new Date(checkOut).getTime() - Date.now()
  return diff / 3_600_000
}
function errMsg(e: unknown) {
  return (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'An error occurred.'
}

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ n }: { n: number }) {
  return <span className="text-amber-400">{'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}</span>
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Checkout indicator ────────────────────────────────────────────────────────
function CheckoutIndicator({ checkOut, status }: { checkOut: string; status: string }) {
  if (status !== 'CheckedIn' && status !== 'Confirmed') return null
  const today = isCheckoutToday(checkOut)
  if (!today) return null
  const hrs = hoursUntilCheckout(checkOut)
  if (hrs < 0) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
      <AlertTriangle className="h-3 w-3" /> Overdue
    </span>
  )
  if (hrs <= 2) return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full animate-pulse">
      <Clock className="h-3 w-3" /> Checkout in {Math.ceil(hrs * 60)}m
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
      <Calendar className="h-3 w-3" /> Checkout Today
    </span>
  )
}

// ── Invoice PDF renderer (print) ──────────────────────────────────────────────
function printInvoice(inv: HotelInvoiceDto) {
  const chargeRows = inv.charges.map(c => `
    <tr>
      <td>${c.itemName} (${c.category}) × ${c.quantity}</td>
      <td style="text-align:right">₹${(c.price * c.quantity).toLocaleString('en-IN')}</td>
      <td style="text-align:right">₹${(c.tax * c.quantity).toLocaleString('en-IN')}</td>
      <td style="text-align:right">₹${(c.price * c.quantity + c.tax * c.quantity).toLocaleString('en-IN')}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html><head><title>Invoice ${inv.invoiceNumber}</title>
  <style>
    body{font-family:Arial,sans-serif;padding:32px;color:#111;max-width:700px;margin:0 auto}
    h1{color:#0369a1;font-size:24px;margin:0}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e5e7eb}
    .badge{background:#f0f9ff;border:1px solid #bae6fd;padding:8px 16px;border-radius:8px;font-size:14px}
    .section{margin:20px 0}
    .section h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin:0 0 8px}
    table{width:100%;border-collapse:collapse;font-size:13px}
    td,th{padding:8px 12px;border:1px solid #e5e7eb}
    th{background:#f9fafb;font-weight:700;font-size:12px}
    .total-row td{font-weight:700;background:#f0f9ff}
    .paid-row td{color:#16a34a}
    .due-row td{font-weight:700;font-size:15px;color:#dc2626}
    .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;text-align:center}
  </style></head><body>
  <div class="header">
    <div>
      <h1>${inv.hotelName}</h1>
      <p style="margin:4px 0;color:#6b7280">${inv.hotelCity}${inv.hotelAddress ? ' — ' + inv.hotelAddress : ''} · ${'★'.repeat(Math.round(inv.starRating))}</p>
    </div>
    <div class="badge">
      <div style="font-size:11px;color:#6b7280">INVOICE</div>
      <div style="font-weight:800;font-size:16px;color:#0369a1">${inv.invoiceNumber}</div>
      <div style="font-size:11px;color:#6b7280">${new Date(inv.generatedAt).toLocaleDateString('en-IN')}</div>
    </div>
  </div>

  <div style="display:flex;gap:32px">
    <div class="section" style="flex:1">
      <h3>Guest Details</h3>
      <table><tr><td style="border:none;padding:2px 0">Name</td><td style="border:none;padding:2px 0;font-weight:600">${inv.guestName}</td></tr>
      <tr><td style="border:none;padding:2px 0">Email</td><td style="border:none;padding:2px 0">${inv.guestEmail}</td></tr>
      ${inv.guestPhone ? `<tr><td style="border:none;padding:2px 0">Phone</td><td style="border:none;padding:2px 0">${inv.guestPhone}</td></tr>` : ''}
      </table>
    </div>
    <div class="section" style="flex:1">
      <h3>Stay Details</h3>
      <table><tr><td style="border:none;padding:2px 0">Room Type</td><td style="border:none;padding:2px 0;font-weight:600">${inv.roomType}</td></tr>
      <tr><td style="border:none;padding:2px 0">Room No.</td><td style="border:none;padding:2px 0">${inv.roomNumber ?? '—'}</td></tr>
      <tr><td style="border:none;padding:2px 0">Check-in</td><td style="border:none;padding:2px 0">${new Date(inv.checkIn).toLocaleDateString('en-IN')}</td></tr>
      <tr><td style="border:none;padding:2px 0">Check-out</td><td style="border:none;padding:2px 0">${new Date(inv.checkOut).toLocaleDateString('en-IN')}</td></tr>
      <tr><td style="border:none;padding:2px 0">Duration</td><td style="border:none;padding:2px 0">${inv.nights} nights · ${inv.guests} guests</td></tr>
      </table>
    </div>
  </div>

  <div class="section">
    <h3>Charges Breakdown</h3>
    <table>
      <thead><tr><th>Description</th><th style="text-align:right">Amount</th><th style="text-align:right">Tax</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>
        <tr><td>Room Charges (${inv.nights} nights × ₹${inv.pricePerNight.toLocaleString('en-IN')})</td>
            <td style="text-align:right">₹${inv.roomTotal.toLocaleString('en-IN')}</td>
            <td style="text-align:right">—</td>
            <td style="text-align:right">₹${inv.roomTotal.toLocaleString('en-IN')}</td></tr>
        ${chargeRows}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h3>Payment Summary</h3>
    <table>
      <tbody>
        <tr class="total-row"><td colspan="3">Grand Total</td><td style="text-align:right">₹${inv.grandTotal.toLocaleString('en-IN')}</td></tr>
        ${inv.isRoomPrepaid ? `<tr class="paid-row"><td colspan="3">Already Paid (Online)</td><td style="text-align:right">− ₹${inv.alreadyPaid.toLocaleString('en-IN')}</td></tr>` : ''}
        ${inv.paymentMethod ? `<tr class="paid-row"><td colspan="3">Paid at Checkout (${inv.paymentMethod})</td><td style="text-align:right">− ₹${inv.amountDue.toLocaleString('en-IN')}</td></tr>` : ''}
        <tr class="due-row"><td colspan="3">Balance Due</td><td style="text-align:right">₹${Math.max(0, inv.amountDue - (inv.paymentMethod ? inv.amountDue : 0)).toLocaleString('en-IN')}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="footer">Thank you for staying with us! We hope to welcome you again soon.<br>Powered by TravelPort</div>
  </body></html>`

  const w = window.open('', '_blank')
  if (!w) return
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 500)
}

// ── View Details Modal ────────────────────────────────────────────────────────
function ViewDetailsModal({ bookingId, onClose, onAction }: {
  bookingId: string
  onClose: () => void
  onAction: (action: 'checkin' | 'addcharge' | 'checkout' | 'invoice') => void
}) {
  const [detail, setDetail] = useState<HotelBookingDetailDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await hotelManagerService.getBookingDetail(bookingId)
      setDetail(d)
    } catch (e) { setError(errMsg(e)) }
    finally { setLoading(false) }
  }, [bookingId])

  useEffect(() => { load() }, [load])

  const removeCharge = async (chargeId: string) => {
    if (!detail) return
    setRemoving(chargeId)
    try {
      await hotelManagerService.removeCharge(bookingId, chargeId)
      await load()
    } catch (e) { alert(errMsg(e)) }
    finally { setRemoving(null) }
  }

  const s = detail?.status ?? ''
  const canCheckIn  = s === 'Confirmed' || s === 'Pending'
  const canAddCharge = s === 'CheckedIn' || s === 'Confirmed'
  const canCheckOut  = s === 'CheckedIn'
  const canInvoice   = s === 'CheckedIn' || s === 'CheckedOut' || s === 'Completed'

  return (
    <Modal title="Booking Details" onClose={onClose} wide>
      <div className="px-6 py-5 space-y-5">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-sky-500" /></div>
        ) : error ? (
          <p className="text-sm text-red-600 text-center py-6">{error}</p>
        ) : detail ? (
          <>
            {/* Guest Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Guest</p>
                <p className="font-bold text-gray-900">{detail.guestName}</p>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Mail className="h-3.5 w-3.5" />{detail.guestEmail}</p>
                {detail.guestPhone && <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><Phone className="h-3.5 w-3.5" />{detail.guestPhone}</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">Stay</p>
                <p className="text-sm font-semibold text-gray-900">{fmtDate(detail.checkIn)} → {fmtDate(detail.checkOut)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{detail.nights} nights · {detail.guests} guests</p>
                {detail.roomNumber && (
                  <p className="text-xs text-sky-600 font-semibold mt-1 flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" /> Room {detail.roomNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Status row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${STATUS_META[detail.status]?.cls ?? 'bg-gray-100 text-gray-600'}`}>
                {STATUS_META[detail.status]?.label ?? detail.status}
              </span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${detail.isPaymentPaid ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                {detail.isPaymentPaid ? '✓ Booking Paid Online' : '⏳ Payment Pending'}
              </span>
              <CheckoutIndicator checkOut={detail.checkOut} status={detail.status} />
            </div>

            {/* Check-in info */}
            {detail.checkInTime && (
              <div className="text-sm text-gray-600 bg-green-50 rounded-lg p-3">
                <span className="font-semibold">Checked In:</span> {fmtDateTime(detail.checkInTime)}
                {detail.checkInNotes && <span className="ml-2 text-gray-500">· {detail.checkInNotes}</span>}
              </div>
            )}
            {detail.actualCheckOutTime && (
              <div className="text-sm text-gray-600 bg-purple-50 rounded-lg p-3">
                <span className="font-semibold">Checked Out:</span> {fmtDateTime(detail.actualCheckOutTime)}
              </div>
            )}

            {/* Booking amount */}
            <div className="flex items-center justify-between bg-sky-50 rounded-xl p-4">
              <span className="text-sm font-semibold text-sky-700">Booking Amount</span>
              <span className="text-lg font-bold text-sky-700">{formatCurrency(detail.amount)}</span>
            </div>

            {/* Additional Charges */}
            {detail.charges.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">Additional Charges</p>
                <div className="space-y-2">
                  {detail.charges.map(c => (
                    <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{c.itemName}</p>
                        <p className="text-xs text-gray-500">{c.category} · qty {c.quantity}{c.tax > 0 ? ` · +₹${(c.tax * c.quantity).toLocaleString('en-IN')} tax` : ''}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(c.price * c.quantity + c.tax * c.quantity)}</span>
                        {(s === 'CheckedIn' || s === 'Confirmed') && (
                          <button
                            onClick={() => removeCharge(c.id)}
                            disabled={removing === c.id}
                            className="text-red-400 hover:text-red-600 disabled:opacity-40 p-1"
                          >
                            {removing === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              {canCheckIn && (
                <button onClick={() => { onClose(); onAction('checkin') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
                  <LogIn className="h-4 w-4" /> Check In
                </button>
              )}
              {canAddCharge && (
                <button onClick={() => { onClose(); onAction('addcharge') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors">
                  <Plus className="h-4 w-4" /> Add Charge
                </button>
              )}
              {canInvoice && (
                <button onClick={() => { onClose(); onAction('invoice') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold transition-colors">
                  <Receipt className="h-4 w-4" /> View Invoice
                </button>
              )}
              {canCheckOut && (
                <button onClick={() => { onClose(); onAction('checkout') }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors">
                  <LogOut className="h-4 w-4" /> Check Out
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  )
}

// ── Check-In Modal ────────────────────────────────────────────────────────────
function CheckInModal({ booking, onClose, onSuccess }: {
  booking: HotelManagerBookingDto
  onClose: () => void
  onSuccess: (updated: HotelBookingDetailDto) => void
}) {
  const [roomNumber, setRoomNumber] = useState('')
  const [notes, setNotes]           = useState('')
  const [busy, setBusy]             = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const submit = async () => {
    if (!roomNumber.trim()) { setError('Room number is required.'); return }
    setBusy(true); setError(null)
    try {
      const result = await hotelManagerService.checkIn(booking.id, { roomNumber: roomNumber.trim(), notes: notes.trim() || undefined })
      onSuccess(result)
    } catch (e) { setError(errMsg(e)) }
    finally { setBusy(false) }
  }

  return (
    <Modal title="Check In Guest" onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {/* Booking summary */}
        <div className="bg-sky-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2"><User className="h-4 w-4 text-sky-600" /><span className="font-bold text-gray-900">{booking.guestName}</span></div>
          <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-sky-600" /><span className="text-gray-600">{booking.guestEmail}</span></div>
          {booking.guestPhone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-sky-600" /><span className="text-gray-600">{booking.guestPhone}</span></div>}
          <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-sky-600" />
            <span className="text-gray-600">{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} ({booking.nights}N · {booking.guests}G)</span>
          </div>
          <div className="flex items-center gap-2"><IndianRupee className="h-4 w-4 text-sky-600" /><span className="font-semibold text-sky-700">{formatCurrency(booking.amount)}</span></div>
        </div>

        {/* Room assignment */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Room Number *</label>
          <div className="relative">
            <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={roomNumber}
              onChange={e => setRoomNumber(e.target.value)}
              placeholder="e.g. 204, 301A"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">Check-In Notes <span className="text-gray-400">(optional)</span></label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Any special requirements, notes…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      </div>
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
        <button onClick={submit} disabled={busy}
          className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
          {busy ? 'Checking In…' : 'Confirm Check-In'}
        </button>
      </div>
    </Modal>
  )
}

// ── Add Charge Modal ──────────────────────────────────────────────────────────
function AddChargeModal({ bookingId, onClose, onSuccess }: {
  bookingId: string
  onClose: () => void
  onSuccess: (updated: HotelBookingDetailDto) => void
}) {
  const [form, setForm] = useState<AddHotelChargeRequest>({
    itemName: '', category: 'Food', quantity: 1, price: 0, tax: 0, notes: undefined,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof typeof form, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.itemName.trim()) { setError('Item name is required.'); return }
    if (form.price <= 0) { setError('Price must be greater than 0.'); return }
    setBusy(true); setError(null)
    try {
      const result = await hotelManagerService.addCharge(bookingId, { ...form, itemName: form.itemName.trim() })
      onSuccess(result)
    } catch (e) { setError(errMsg(e)) }
    finally { setBusy(false) }
  }

  const total = form.price * form.quantity + form.tax * form.quantity

  return (
    <Modal title="Add Charge" onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Item Name *</label>
            <input value={form.itemName} onChange={e => set('itemName', e.target.value)}
              placeholder="e.g. Club Sandwich, Laundry Service"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Category</label>
            <div className="relative">
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none">
                {CHARGE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Quantity</label>
            <input type="number" min={1} value={form.quantity} onChange={e => set('quantity', +e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Unit Price (₹) *</label>
            <input type="number" min={0} step={0.01} value={form.price}
              onChange={e => set('price', +e.target.value)}
              onFocus={e => e.target.select()}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Tax per unit (₹)</label>
            <input type="number" min={0} step={0.01} value={form.tax}
              onChange={e => set('tax', +e.target.value)}
              onFocus={e => e.target.select()}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes <span className="text-gray-400">(optional)</span></label>
            <input value={form.notes ?? ''} onChange={e => set('notes', e.target.value)}
              placeholder="Any notes…"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between bg-sky-50 rounded-lg px-4 py-2.5">
            <span className="text-sm text-sky-700 font-semibold">Charge Total</span>
            <span className="text-base font-bold text-sky-700">{formatCurrency(total)}</span>
          </div>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}
      </div>
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
        <button onClick={submit} disabled={busy}
          className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {busy ? 'Adding…' : 'Add Charge'}
        </button>
      </div>
    </Modal>
  )
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({ bookingId, onClose, onCheckout }: {
  bookingId: string
  onClose: () => void
  onCheckout: () => void
}) {
  const [inv, setInv] = useState<HotelInvoiceDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hotelManagerService.getInvoice(bookingId)
      .then(setInv)
      .catch(e => setError(errMsg(e)))
      .finally(() => setLoading(false))
  }, [bookingId])

  return (
    <Modal title="Invoice" onClose={onClose} wide>
      <div className="px-6 py-5">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-sky-500" /></div>
        ) : error ? (
          <p className="text-sm text-red-600 text-center py-6">{error}</p>
        ) : inv ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{inv.hotelName}</h3>
                <p className="text-sm text-gray-500">{inv.hotelCity}{inv.hotelAddress ? ` — ${inv.hotelAddress}` : ''}</p>
                <Stars n={inv.starRating} />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Invoice</p>
                <p className="font-mono font-bold text-sky-700">{inv.invoiceNumber}</p>
                <p className="text-xs text-gray-500">{fmtDate(inv.generatedAt)}</p>
              </div>
            </div>

            {/* Guest + Stay */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">Guest</p>
                <p className="font-bold text-gray-900">{inv.guestName}</p>
                <p className="text-gray-500">{inv.guestEmail}</p>
                {inv.guestPhone && <p className="text-gray-500">{inv.guestPhone}</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">Stay</p>
                <p className="font-semibold text-gray-900">{inv.roomType}</p>
                {inv.roomNumber && <p className="text-gray-500">Room {inv.roomNumber}</p>}
                <p className="text-gray-500">{fmtDate(inv.checkIn)} → {fmtDate(inv.checkOut)}</p>
                <p className="text-gray-500">{inv.nights}N · {inv.guests}G</p>
              </div>
            </div>

            {/* Charges table */}
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">Charges Breakdown</p>
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500">Item</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Subtotal</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Tax</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-gray-500">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    <tr className="bg-white">
                      <td className="px-4 py-2.5 text-gray-900">Room · {inv.nights}N × {formatCurrency(inv.pricePerNight)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(inv.roomTotal)}</td>
                      <td className="px-4 py-2.5 text-right text-gray-400">—</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatCurrency(inv.roomTotal)}</td>
                    </tr>
                    {inv.charges.map((c, i) => (
                      <tr key={c.id} className={i % 2 === 0 ? 'bg-gray-50/50' : 'bg-white'}>
                        <td className="px-4 py-2.5 text-gray-700">{c.itemName} ({c.category}) × {c.quantity}</td>
                        <td className="px-4 py-2.5 text-right text-gray-600">{formatCurrency(c.price * c.quantity)}</td>
                        <td className="px-4 py-2.5 text-right text-gray-400">{c.tax > 0 ? formatCurrency(c.tax * c.quantity) : '—'}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">{formatCurrency(c.price * c.quantity + c.tax * c.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment summary */}
            <div className="bg-sky-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Grand Total</span><span className="font-bold text-gray-900">{formatCurrency(inv.grandTotal)}</span></div>
              {inv.isRoomPrepaid && <div className="flex justify-between text-sm"><span className="text-green-600">Already Paid (Online)</span><span className="font-semibold text-green-600">− {formatCurrency(inv.alreadyPaid)}</span></div>}
              <div className="border-t border-sky-200 pt-2 flex justify-between">
                <span className="text-sm font-bold text-sky-800">Amount Due</span>
                <span className="text-lg font-bold text-sky-700">{formatCurrency(inv.amountDue)}</span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {inv && (
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 shrink-0">
          <button onClick={() => printInvoice(inv)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" /> Download PDF
          </button>
          {!inv.paymentMethod && inv.amountDue > 0 && (
            <button onClick={() => { onClose(); onCheckout() }}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors">
              <LogOut className="h-4 w-4" /> Proceed to Check-Out
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}

// ── Check-Out Modal ───────────────────────────────────────────────────────────
function CheckOutModal({ booking, onClose, onSuccess }: {
  booking: HotelManagerBookingDto
  onClose: () => void
  onSuccess: (inv: HotelInvoiceDto) => void
}) {
  const [inv, setInv] = useState<HotelInvoiceDto | null>(null)
  const [loadingInv, setLoadingInv] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hotelManagerService.getInvoice(booking.id)
      .then(setInv)
      .catch(e => setError(errMsg(e)))
      .finally(() => setLoadingInv(false))
  }, [booking.id])

  const submit = async () => {
    setBusy(true); setError(null)
    try {
      const result = await hotelManagerService.checkOut(booking.id, { paymentMethod })
      onSuccess(result)
    } catch (e) { setError(errMsg(e)) }
    finally { setBusy(false) }
  }

  return (
    <Modal title="Check Out Guest" onClose={onClose}>
      <div className="px-6 py-5 space-y-4">
        {/* Guest summary */}
        <div className="bg-gray-50 rounded-xl p-4 text-sm">
          <p className="font-bold text-gray-900">{booking.guestName}</p>
          <p className="text-gray-500">{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)} · {booking.nights}N</p>
        </div>

        {loadingInv ? (
          <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-sky-500" /></div>
        ) : inv ? (
          <>
            {/* Invoice summary */}
            <div className="space-y-2 bg-sky-50 rounded-xl p-4">
              {/* Room Charges row */}
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Room Charges</span>
                {inv.isRoomPrepaid ? (
                  <span className="flex items-center gap-1.5 text-green-600 font-semibold">
                    <CheckCircle className="h-3.5 w-3.5" /> Paid Online
                  </span>
                ) : (
                  <span className="font-semibold">{formatCurrency(inv.roomTotal)}</span>
                )}
              </div>

              {/* Additional charges */}
              {inv.charges.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Additional Charges</span>
                  <span className="font-semibold">{formatCurrency(inv.chargesSubTotal + inv.chargesTax)}</span>
                </div>
              )}

              <div className="border-t border-sky-200 pt-2 flex justify-between text-base font-bold text-sky-700">
                <span>Amount Due Now</span>
                <span>{formatCurrency(inv.amountDue)}</span>
              </div>
            </div>

            {/* Payment method */}
            {inv.amountDue > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button key={m}
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${paymentMethod === m ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-gray-700 border-gray-200 hover:border-sky-300'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

        <p className="text-xs text-gray-400 text-center">Checkout will update the booking status, generate an invoice PDF, and send a thank-you email to the guest.</p>
      </div>
      <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
        <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
        <button onClick={submit} disabled={busy || loadingInv}
          className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-2.5 text-sm font-bold disabled:opacity-60 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {busy ? 'Processing…' : 'Confirm Check-Out'}
        </button>
      </div>
    </Modal>
  )
}

// ── Checkout Success Modal ────────────────────────────────────────────────────
function CheckoutSuccessModal({ inv, onClose }: { inv: HotelInvoiceDto; onClose: () => void }) {
  return (
    <Modal title="Checkout Complete" onClose={onClose}>
      <div className="px-6 py-8 text-center space-y-4">
        <div className="h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Guest Checked Out Successfully</h3>
        <p className="text-sm text-gray-500">Invoice {inv.invoiceNumber} has been generated. A thank-you email with the invoice has been sent to the guest.</p>
        <div className="bg-sky-50 rounded-xl p-4 space-y-1 text-sm text-left">
          <div className="flex justify-between"><span className="text-gray-600">Grand Total</span><span className="font-bold">{formatCurrency(inv.grandTotal)}</span></div>
          {inv.alreadyPaid > 0 && <div className="flex justify-between text-green-600"><span>Paid Online</span><span>{formatCurrency(inv.alreadyPaid)}</span></div>}
          {inv.paymentMethod && <div className="flex justify-between text-purple-600"><span>Paid ({inv.paymentMethod})</span><span>{formatCurrency(inv.amountDue)}</span></div>}
        </div>
        <button onClick={() => printInvoice(inv)}
          className="flex items-center gap-2 mx-auto px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
          <Download className="h-4 w-4" /> Download Invoice PDF
        </button>
        <button onClick={onClose} className="w-full rounded-xl bg-purple-600 hover:bg-purple-700 text-white py-2.5 text-sm font-bold">
          Done
        </button>
      </div>
    </Modal>
  )
}

// ── Booking Row ───────────────────────────────────────────────────────────────
type ModalType = 'view' | 'checkin' | 'addcharge' | 'invoice' | 'checkout' | null

function BookingRow({ booking, onOpenModal }: {
  booking: HotelManagerBookingDto
  onOpenModal: (type: ModalType, booking: HotelManagerBookingDto) => void
}) {
  const s = booking.status
  const meta = STATUS_META[s] ?? { cls: 'bg-gray-100 text-gray-600', label: s }
  const isToday = s !== 'CheckedOut' && s !== 'Cancelled' && isCheckoutToday(booking.checkOut)
  const isUrgent = isToday && s === 'CheckedIn' && hoursUntilCheckout(booking.checkOut) <= 2

  return (
    <tr className={`hover:bg-gray-50/50 transition-colors ${isUrgent ? 'bg-orange-50/40' : isToday ? 'bg-amber-50/30' : ''}`}>
      <td className="px-5 py-3.5">
        <p className="font-mono text-xs font-bold text-gray-900">{booking.bookingRef}</p>
        <p className="text-xs text-gray-400 mt-0.5">{fmtDate(booking.bookedAt)}</p>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <User className="h-4 w-4 text-sky-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{booking.guestName}</p>
            <p className="text-xs text-gray-400">{booking.guestEmail}</p>
            {booking.guestPhone && <p className="text-xs text-gray-400">{booking.guestPhone}</p>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-gray-900">{fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}</p>
        <p className="text-xs text-gray-400">{booking.nights}N · {booking.guests}G</p>
        <CheckoutIndicator checkOut={booking.checkOut} status={booking.status} />
      </td>
      <td className="px-5 py-3.5 text-right">
        <p className="text-sm font-bold text-gray-900">{formatCurrency(booking.amount)}</p>
      </td>
      <td className="px-5 py-3.5 text-center">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${meta.cls}`}>
          {meta.label}
        </span>
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={() => onOpenModal('view', booking)}
            title="View Details"
            className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
            <Eye className="h-4 w-4" />
          </button>
          {(s === 'Confirmed' || s === 'Pending') && (
            <button onClick={() => onOpenModal('checkin', booking)}
              title="Check In"
              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors">
              <LogIn className="h-4 w-4" />
            </button>
          )}
          {(s === 'CheckedIn' || s === 'Confirmed') && (
            <button onClick={() => onOpenModal('addcharge', booking)}
              title="Add Charge"
              className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
          {(s === 'CheckedIn' || s === 'CheckedOut' || s === 'Completed') && (
            <button onClick={() => onOpenModal('invoice', booking)}
              title="Invoice"
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <FileText className="h-4 w-4" />
            </button>
          )}
          {s === 'CheckedIn' && (
            <button onClick={() => onOpenModal('checkout', booking)}
              title="Check Out"
              className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HotelBookingsPage() {
  const [bookings, setBookings]       = useState<HotelManagerBookingDto[]>([])
  const [meta, setMeta]               = useState<PaginationMeta | null>(null)
  const [page, setPage]               = useState(1)
  const [status, setStatus]           = useState('')
  const [query, setQuery]             = useState('')
  const [debouncedQuery, setDQ]       = useState('')
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)

  // Modal state
  const [modal, setModal]             = useState<ModalType>(null)
  const [selectedBooking, setSel]     = useState<HotelManagerBookingDto | null>(null)
  const [checkoutInv, setCheckoutInv] = useState<HotelInvoiceDto | null>(null)

  // Debounce search query
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const handleQuery = (v: string) => {
    setQuery(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setDQ(v); setPage(1) }, 350)
  }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const { items, meta } = await hotelManagerService.getBookings(page, 20, status || undefined, debouncedQuery || undefined)
      setBookings(items); setMeta(meta)
    } catch { setError('Failed to load bookings.') }
    finally { setLoading(false) }
  }, [page, status, debouncedQuery])

  useEffect(() => { load() }, [load])

  const openModal = (type: ModalType, booking: HotelManagerBookingDto) => {
    setSel(booking); setModal(type)
  }
  const closeModal = () => { setModal(null); setSel(null) }

  const handleCheckedIn = (updated: HotelBookingDetailDto) => {
    setBookings(prev => prev.map(b =>
      b.id === updated.id ? { ...b, status: updated.status, roomNumber: updated.roomNumber } as HotelManagerBookingDto : b
    ))
    closeModal()
  }

  const handleChargeAdded = () => {
    closeModal()
  }

  const handleCheckedOut = (inv: HotelInvoiceDto) => {
    setBookings(prev => prev.map(b =>
      b.id === inv.bookingId ? { ...b, status: 'CheckedOut' } as HotelManagerBookingDto : b
    ))
    setCheckoutInv(inv)
    setModal(null)
    setSel(null)
  }

  const STATUS_TABS = ['', 'Confirmed', 'CheckedIn', 'Pending', 'CheckedOut', 'Cancelled']

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage guest check-ins, charges, and check-outs</p>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={query}
            onChange={e => handleQuery(e.target.value)}
            placeholder="Search by guest name, email, phone or booking ref…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          {query && (
            <button onClick={() => handleQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_TABS.map(s => (
            <button key={s}
              onClick={() => { setStatus(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                status === s
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {s === '' ? 'All' : STATUS_META[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No bookings found.</p>
          {(query || status) && (
            <button onClick={() => { handleQuery(''); setStatus('') }} className="mt-3 text-sm text-sky-600 hover:underline">Clear filters</button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stay</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map(b => (
                <BookingRow key={b.id} booking={b} onOpenModal={openModal} />
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total} bookings
              </p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  Previous
                </button>
                <button disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> View Details</span>
        <span className="flex items-center gap-1.5"><LogIn className="h-3.5 w-3.5" /> Check In</span>
        <span className="flex items-center gap-1.5"><ShoppingCart className="h-3.5 w-3.5" /> Add Charge</span>
        <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Invoice</span>
        <span className="flex items-center gap-1.5"><LogOut className="h-3.5 w-3.5" /> Check Out</span>
      </div>

      {/* Modals */}
      {modal === 'view' && selectedBooking && (
        <ViewDetailsModal
          bookingId={selectedBooking.id}
          onClose={closeModal}
          onAction={action => {
            const b = selectedBooking
            closeModal()
            setTimeout(() => openModal(action as ModalType, b), 50)
          }}
        />
      )}

      {modal === 'checkin' && selectedBooking && (
        <CheckInModal booking={selectedBooking} onClose={closeModal} onSuccess={handleCheckedIn} />
      )}

      {modal === 'addcharge' && selectedBooking && (
        <AddChargeModal bookingId={selectedBooking.id} onClose={closeModal} onSuccess={handleChargeAdded} />
      )}

      {modal === 'invoice' && selectedBooking && (
        <InvoiceModal
          bookingId={selectedBooking.id}
          onClose={closeModal}
          onCheckout={() => setTimeout(() => openModal('checkout', selectedBooking), 50)}
        />
      )}

      {modal === 'checkout' && selectedBooking && (
        <CheckOutModal booking={selectedBooking} onClose={closeModal} onSuccess={handleCheckedOut} />
      )}

      {checkoutInv && (
        <CheckoutSuccessModal inv={checkoutInv} onClose={() => { setCheckoutInv(null); load() }} />
      )}
    </div>
  )
}
