import { useEffect, useState } from 'react'
import type { BookingDto } from '@/types'
import { bookingService } from '@/services/bookingService'
import { BookingCard } from '@/components/bookings/BookingCard'
import { BookingCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Plane } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDto[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(false)
  const PAGE_SIZE = 10

  const fetchBookings = async (p: number) => {
    setLoading(true)
    try {
      const res = await bookingService.list(p, PAGE_SIZE)
      if (p === 1) {
        setBookings(res.data ?? [])
      } else {
        setBookings(prev => [...prev, ...(res.data ?? [])])
      }
      const meta = res.meta
      setHasMore(meta ? meta.page < meta.totalPages : false)
    } catch {
      setError('Failed to load bookings.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBookings(1) }, [])

  const handleCancelled = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'Cancelled' as const } : b))
  }

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    fetchBookings(next)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Bookings</h1>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>
      )}

      <div className="flex flex-col gap-4">
        {loading && bookings.length === 0
          ? Array.from({ length: 3 }).map((_, i) => <BookingCardSkeleton key={i} />)
          : bookings.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <Plane className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No bookings yet</p>
                <p className="text-sm mt-1">Start by searching for flights or hotels</p>
                <div className="flex gap-3 mt-6">
                  <Link to="/flights"><Button variant="outline" size="sm">Search Flights</Button></Link>
                  <Link to="/hotels"><Button size="sm">Search Hotels</Button></Link>
                </div>
              </div>
            )
            : bookings.map(b => <BookingCard key={b.id} booking={b} onCancelled={handleCancelled} />)
        }
      </div>

      {hasMore && (
        <div className="mt-6 text-center">
          <Button variant="outline" loading={loading} onClick={loadMore}>Load More</Button>
        </div>
      )}
    </div>
  )
}
