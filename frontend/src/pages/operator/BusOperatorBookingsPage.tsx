import { useEffect, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import { busOperatorService } from '@/services/operatorService'
import type { OperatorBookingDto } from '@/types'

export default function BusOperatorBookingsPage() {
  const [bookings, setBookings] = useState<OperatorBookingDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    busOperatorService.getBookings()
      .then(setBookings)
      .catch(() => setError('Failed to load bookings.'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = bookings.filter(b =>
    b.bookingRef.toLowerCase().includes(search.toLowerCase()) ||
    b.passengerName.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (s: string) => {
    if (s === 'Confirmed') return 'bg-green-50 text-green-700'
    if (s === 'Cancelled') return 'bg-red-50 text-red-600'
    return 'bg-yellow-50 text-yellow-700'
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Passenger Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">{bookings.length} total bookings</p>
      </div>
      {error && <div className="mb-4 bg-red-50 text-red-600 rounded-xl p-3 text-sm">{error}</div>}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by ref or passenger name…"
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
      </div>
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No bookings found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Booking Ref', 'Passenger', 'Passengers', 'Amount', 'Status', 'Booked'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono font-semibold text-green-700">{b.bookingRef}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{b.passengerName}</p>
                    <p className="text-gray-400 text-xs">{b.passengerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{b.passengers}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">₹{b.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(b.status)}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(b.bookedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
