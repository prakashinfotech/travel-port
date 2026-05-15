import { useEffect, useState } from 'react'
import {
  BookOpen, TrendingUp, BedDouble, Star,
  CheckCircle, XCircle, IndianRupee, Users,
} from 'lucide-react'
import { hotelManagerService } from '@/services/hotelManagerService'
import type { HotelManagerDashboardDto } from '@/types'

function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string
  value: string | number
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

export default function HotelDashboardPage() {
  const [data, setData] = useState<HotelManagerDashboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    hotelManagerService.getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your hotel's performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Bookings"    value={data.totalBookings}   icon={BookOpen}     color="bg-sky-500" />
        <StatCard label="Active Bookings"   value={data.activeBookings}  icon={CheckCircle}  color="bg-green-500" />
        <StatCard label="Cancelled"         value={data.cancelledBookings} icon={XCircle}    color="bg-red-500" />
        <StatCard label="Total Revenue"     value={`₹${data.totalRevenue.toLocaleString('en-IN')}`} icon={IndianRupee} color="bg-emerald-600" />
        <StatCard label="Total Rooms"       value={data.totalRooms}      icon={BedDouble}    color="bg-violet-500" />
        <StatCard label="Active Rooms"      value={data.activeRooms}     icon={Users}        color="bg-indigo-500" />
        <StatCard label="Review Score"      value={data.avgReviewScore.toFixed(1)} icon={Star} color="bg-amber-500" />
        <StatCard label="Total Reviews"     value={data.reviewCount}     icon={TrendingUp}   color="bg-orange-500" />
      </div>

      {/* Quick summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Occupancy Rate</span>
            <span className="font-semibold text-gray-900">
              {data.totalRooms > 0
                ? `${Math.round((data.activeBookings / data.totalRooms) * 100)}%`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Avg. Revenue / Booking</span>
            <span className="font-semibold text-gray-900">
              {data.totalBookings > 0
                ? `₹${Math.round(data.totalRevenue / data.totalBookings).toLocaleString('en-IN')}`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Cancellation Rate</span>
            <span className="font-semibold text-gray-900">
              {data.totalBookings > 0
                ? `${Math.round((data.cancelledBookings / data.totalBookings) * 100)}%`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Review Score</span>
            <span className="font-semibold text-amber-600">{data.avgReviewScore.toFixed(1)} / 5.0</span>
          </div>
        </div>
      </div>
    </div>
  )
}
