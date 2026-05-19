import { useEffect, useState } from 'react'
import { Plane, BookOpen, CheckCircle, XCircle, IndianRupee, Users, TrendingUp } from 'lucide-react'
import { flightOperatorService } from '@/services/operatorService'
import type { FlightOperatorDashboardDto } from '@/types'

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string
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

export default function FlightOperatorDashboardPage() {
  const [data, setData] = useState<FlightOperatorDashboardDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    flightOperatorService.getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 7 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  )

  if (error || !data) return (
    <div className="p-8"><div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div></div>
  )

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Flight Operator Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your airline's performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Flights"       value={data.totalFlights}       icon={Plane}         color="bg-blue-600" />
        <StatCard label="Active Flights"      value={data.activeFlights}      icon={TrendingUp}    color="bg-green-500" />
        <StatCard label="Total Bookings"      value={data.totalBookings}      icon={BookOpen}      color="bg-indigo-500" />
        <StatCard label="Confirmed Bookings"  value={data.confirmedBookings}  icon={CheckCircle}   color="bg-emerald-500" />
        <StatCard label="Cancelled"           value={data.cancelledBookings}  icon={XCircle}       color="bg-red-500" />
        <StatCard label="Total Revenue"       value={`₹${data.totalRevenue.toLocaleString('en-IN')}`} icon={IndianRupee} color="bg-emerald-600" />
        <StatCard label="Total Passengers"    value={data.totalPassengers}    icon={Users}         color="bg-violet-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Quick Summary</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Avg. Passengers / Flight</span>
            <span className="font-semibold text-gray-900">
              {data.confirmedBookings > 0
                ? `${(data.totalPassengers / data.confirmedBookings).toFixed(1)}`
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
            <span className="text-gray-500">Avg. Revenue / Booking</span>
            <span className="font-semibold text-gray-900">
              {data.confirmedBookings > 0
                ? `₹${Math.round(data.totalRevenue / data.confirmedBookings).toLocaleString('en-IN')}`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Fleet Utilization</span>
            <span className="font-semibold text-gray-900">
              {data.totalFlights > 0
                ? `${Math.round((data.activeFlights / data.totalFlights) * 100)}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
