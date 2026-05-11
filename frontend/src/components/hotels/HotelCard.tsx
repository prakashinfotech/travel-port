import { useNavigate } from 'react-router-dom'
import { Star, MapPin, Wifi, Dumbbell, Waves, Car, Coffee } from 'lucide-react'
import type { HotelDto } from '@/types'
import { formatCurrency } from '@/utils/formatters'

interface HotelCardProps {
  hotel: HotelDto
  checkIn?:  string
  checkOut?: string
  guests?:   number
}

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi:     <Wifi      className="h-3.5 w-3.5" />,
  pool:     <Waves     className="h-3.5 w-3.5" />,
  gym:      <Dumbbell  className="h-3.5 w-3.5" />,
  parking:  <Car       className="h-3.5 w-3.5" />,
  breakfast:<Coffee    className="h-3.5 w-3.5" />,
}

function amenityIcon(label: string) {
  const key = label.toLowerCase()
  for (const [k, icon] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return icon
  }
  return null
}

export function HotelCard({ hotel, checkIn = '', checkOut = '', guests = 2 }: HotelCardProps) {
  const navigate  = useNavigate()
  const minPrice  = hotel.rooms.length ? Math.min(...hotel.rooms.map(r => r.pricePerNight)) : 0
  const amenities = (() => { try { return JSON.parse(hotel.amenities) as string[] } catch { return [] } })()

  const scoreColor = hotel.reviewScore >= 4.5 ? 'bg-green-600' : hotel.reviewScore >= 4 ? 'bg-green-500' : hotel.reviewScore >= 3.5 ? 'bg-yellow-500' : 'bg-orange-400'

  const params = new URLSearchParams()
  if (checkIn)  params.set('checkIn',  checkIn)
  if (checkOut) params.set('checkOut', checkOut)
  if (guests)   params.set('guests',   String(guests))
  const detailUrl = `/hotels/${hotel.id}?${params}`

  return (
    <div className="flex flex-col sm:flex-row rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">

      {/* Image */}
      <div className="sm:w-56 h-48 sm:h-auto flex-shrink-0 overflow-hidden relative">
        <img
          src={hotel.imageUrl || FALLBACK_IMG}
          alt={hotel.name}
          className="h-full w-full object-cover"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
        />
        {hotel.starRating >= 5 && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
            LUXURY
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between p-5 gap-3">
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">{hotel.name}</h3>
              <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" /> {hotel.address}
              </p>
            </div>
            <div className={`flex items-center gap-1 ${scoreColor} text-white text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0`}>
              {hotel.reviewScore.toFixed(1)}
              <span className="font-normal text-[10px] opacity-80">/ 5</span>
            </div>
          </div>

          {/* Stars */}
          <div className="flex items-center gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-3.5 w-3.5 ${i < hotel.starRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
            ))}
            <span className="text-xs text-gray-400 ml-1">({hotel.reviewCount.toLocaleString()} reviews)</span>
          </div>

          {/* Amenity chips */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {amenities.slice(0, 5).map(a => (
              <span key={a} className="flex items-center gap-1 text-[11px] text-gray-600 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
                {amenityIcon(a)} {a}
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{hotel.description}</p>
        </div>

        <div className="flex items-end justify-between">
          {minPrice > 0 ? (
            <div>
              <p className="text-xs text-gray-400">Starting from</p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(minPrice)}
                <span className="text-sm font-normal text-gray-400"> /night</span>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No rooms available</p>
          )}
          <button
            onClick={() => navigate(detailUrl)}
            className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
          >
            View Rooms
          </button>
        </div>
      </div>
    </div>
  )
}
