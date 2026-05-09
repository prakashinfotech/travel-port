import { useNavigate } from 'react-router-dom'
import { Star, MapPin } from 'lucide-react'
import type { HotelDto } from '@/types'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/utils/formatters'

interface HotelCardProps {
  hotel: HotelDto
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'

export function HotelCard({ hotel }: HotelCardProps) {
  const navigate = useNavigate()
  const minPrice = hotel.rooms.length > 0
    ? Math.min(...hotel.rooms.map(r => r.pricePerNight))
    : 0

  return (
    <div className="flex flex-col sm:flex-row rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Image */}
      <div className="sm:w-52 h-44 sm:h-auto flex-shrink-0 overflow-hidden">
        <img
          src={hotel.imageUrl || FALLBACK_IMG}
          alt={hotel.name}
          className="h-full w-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between p-5 gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-gray-900 leading-tight">{hotel.name}</h3>
            <div className="flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-md flex-shrink-0">
              {hotel.reviewScore.toFixed(1)}
            </div>
          </div>
          <p className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="h-3.5 w-3.5" /> {hotel.city}
          </p>
          <div className="flex gap-0.5 mt-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < hotel.starRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gray-400 ml-1">({hotel.reviewCount} reviews)</span>
          </div>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{hotel.description}</p>
        </div>

        <div className="flex items-center justify-between">
          {minPrice > 0 ? (
            <div>
              <p className="text-xs text-gray-400">Starting from</p>
              <p className="text-xl font-bold text-primary-700">
                {formatCurrency(minPrice)}
                <span className="text-sm font-normal text-gray-400"> /night</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No rooms available</p>
          )}
          <Button size="sm" onClick={() => navigate(`/hotels/${hotel.id}`)}>
            View Rooms
          </Button>
        </div>
      </div>
    </div>
  )
}
