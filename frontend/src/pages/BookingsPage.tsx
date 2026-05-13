import { useEffect, useMemo, useState } from 'react'
import type { BookingDto } from '@/types'
import { bookingService } from '@/services/bookingService'
import { BookingCard } from '@/components/bookings/BookingCard'
import { BookingCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Plane, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const PAGE_SIZE = 10

type StatusFilter = 'All' | 'Confirmed' | 'Cancelled'
type TypeFilter   = 'All' | 'Flight' | 'Hotel'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [page,     setPage]     = useState(1)
  const [total,    setTotal]    = useState(0)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All')
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('All')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fetchBookings = async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await bookingService.list(p, PAGE_SIZE)
      setBookings(res.data ?? [])
      const meta = res.meta
      if (meta) setTotal(meta.total ?? meta.totalPages * PAGE_SIZE)
    } catch {
      setError('Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings(page) }, [page])

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'All' && b.status !== statusFilter) return false
      if (typeFilter   !== 'All' && b.type   !== typeFilter)   return false
      return true
    })
  }, [bookings, statusFilter, typeFilter])

  const handleCancelled = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' as const } : b))
  }

  const goTo = (p: number) => {
    if (p < 1 || p > totalPages || p === page) return
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pageNumbers = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 4) pages.push('...')
      for (let i = Math.max(2, page - 2); i <= Math.min(totalPages - 1, page + 2); i++) pages.push(i)
      if (page < totalPages - 3) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        {total > 0 && (
          <span className="text-sm text-gray-500">{total} booking{total !== 1 ? 's' : ''}</span>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-4">Click any booking to view full details or download your invoice.</p>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['All', 'Confirmed', 'Cancelled'] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {(['All', 'Flight', 'Hotel'] as TypeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                typeFilter === t
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {(statusFilter !== 'All' || typeFilter !== 'All') && (
          <button
            onClick={() => { setStatusFilter('All'); setTypeFilter('All') }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      <div className="flex flex-col gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)
          : filteredBookings.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Plane className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">
                  {bookings.length === 0 ? 'No bookings yet' : 'No bookings match the selected filters'}
                </p>
                {bookings.length === 0 && (
                  <>
                    <p className="text-sm mt-1">Start by searching for flights or hotels</p>
                    <div className="flex gap-3 mt-6">
                      <Link to="/flights"><Button variant="outline" size="sm">Search Flights</Button></Link>
                      <Link to="/hotels"><Button size="sm">Search Hotels</Button></Link>
                    </div>
                  </>
                )}
              </div>
            )
            : filteredBookings.map(b => <BookingCard key={b.id} booking={b} onCancelled={handleCancelled} />)
        }
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-1">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 1 || loading}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200
              text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>

          {pageNumbers().map((p, idx) =>
            p === '...'
              ? <span key={`ellipsis-${idx}`} className="px-2 py-2 text-gray-400 text-sm select-none">…</span>
              : (
                <button
                  key={p}
                  onClick={() => goTo(p)}
                  disabled={loading}
                  className={`min-w-[38px] px-3 py-2 rounded-lg text-sm font-medium border transition-colors
                    ${page === p
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    } disabled:cursor-not-allowed`}
                >
                  {p}
                </button>
              )
          )}

          <button
            onClick={() => goTo(page + 1)}
            disabled={page === totalPages || loading}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200
              text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {totalPages > 1 && (
        <p className="text-center text-xs text-gray-400 mt-3">
          Page {page} of {totalPages}
        </p>
      )}
    </div>
  )
}
