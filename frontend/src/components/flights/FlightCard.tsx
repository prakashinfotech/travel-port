import { useNavigate } from 'react-router-dom'
import { ArrowRight, Clock, Users } from 'lucide-react'
import type { FlightDto } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDuration } from '@/utils/formatters'

interface FlightCardProps {
  flight: FlightDto
}

export function FlightCard({ flight }: FlightCardProps) {
  const navigate = useNavigate()

  const dep = new Date(flight.departureTime)
  const arr = new Date(flight.arrivalTime)
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Airline */}
      <div className="min-w-[120px]">
        <p className="text-xs text-gray-400 uppercase tracking-wide">{flight.airline}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{flight.flightNumber}</p>
        <p className="text-xs text-gray-400 mt-0.5">{flight.cabinClass}</p>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 flex-1 justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{fmt(dep)}</p>
          <p className="text-sm font-medium text-gray-600">{flight.origin}</p>
        </div>

        <div className="flex flex-col items-center gap-1 px-2">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDuration(flight.durationMinutes)}
          </p>
          <div className="flex items-center gap-1">
            <div className="h-px w-14 bg-gray-300" />
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="h-px w-14 bg-gray-300" />
          </div>
          <p className="text-xs text-gray-400">Non-stop</p>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{fmt(arr)}</p>
          <p className="text-sm font-medium text-gray-600">{flight.destination}</p>
        </div>
      </div>

      {/* Price + Book */}
      <div className="flex flex-col items-end gap-2 min-w-[130px]">
        <p className="text-2xl font-bold text-primary-700">{formatCurrency(flight.price)}</p>
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Users className="h-3 w-3" /> {flight.availableSeats} seats left
        </p>
        <Button
          size="sm"
          onClick={() => navigate(`/flights/${flight.id}/book`)}
          disabled={flight.availableSeats === 0}
        >
          {flight.availableSeats === 0 ? 'Sold Out' : 'Book Now'}
        </Button>
      </div>
    </div>
  )
}
