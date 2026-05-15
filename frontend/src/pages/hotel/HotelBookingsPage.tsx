import { useEffect, useState, useCallback } from 'react'
import { Calendar, User, IndianRupee, Search } from 'lucide-react'
import { hotelManagerService } from '@/services/hotelManagerService'
import type { HotelManagerBookingDto, PaginationMeta } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  Confirmed: 'bg-green-100 text-green-700',
  Pending:   'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-700',
}

export default function HotelBookingsPage() {
  const [bookings, setBookings] = useState<HotelManagerBookingDto[]>([])
  const [meta, setMeta] = useState<PaginationMeta | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    hotelManagerService.getBookings(page, 20, status || undefined)
      .then(({ items, meta }) => { setBookings(items); setMeta(meta) })
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false))
  }, [page, status])

  useEffect(() => { load() }, [load])

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">All guest reservations for your hotel</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 flex gap-3 items-center">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="text-sm border-0 outline-none text-gray-700 bg-transparent"
        >
          <option value="">All Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No bookings found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ref</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Guest</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stay</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-bold text-gray-900">{b.bookingRef}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(b.bookedAt).toLocaleDateString('en-IN')}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{b.guestName}</p>
                        <p className="text-xs text-gray-400">{b.guestEmail}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-900">
                      {new Date(b.checkIn).toLocaleDateString('en-IN')} →{' '}
                      {new Date(b.checkOut).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {b.nights} night{b.nights !== 1 ? 's' : ''} · {b.guests} guest{b.guests !== 1 ? 's' : ''}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IndianRupee className="h-3.5 w-3.5 text-gray-500" />
                      <span className="font-semibold text-gray-900">
                        {b.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, meta.total)} of {meta.total}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
