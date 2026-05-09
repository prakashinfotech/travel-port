import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { MapPin, Star, Wifi, ArrowLeft, Users } from 'lucide-react'
import type { HotelDto, HotelRoomDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/utils/formatters'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const checkIn  = searchParams.get('checkIn')  ?? ''
  const checkOut = searchParams.get('checkOut') ?? ''

  const [hotel,   setHotel]   = useState<HotelDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    hotelService.getById(id)
      .then(r => setHotel(r.data))
      .catch(() => setError('Hotel not found.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="mx-auto max-w-4xl px-4 py-10 flex flex-col gap-4">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-40" />
    </div>
  )

  if (error || !hotel) return (
    <div className="flex items-center justify-center min-h-[50vh] text-gray-400">{error ?? 'Hotel not found'}</div>
  )

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to results
      </button>

      {/* Hero image */}
      <img
        src={hotel.imageUrl || FALLBACK_IMG}
        alt={hotel.name}
        className="w-full h-64 object-cover rounded-2xl"
        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
      />

      {/* Header */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{hotel.name}</h1>
          <p className="flex items-center gap-1 text-gray-500 mt-1">
            <MapPin className="h-4 w-4" /> {hotel.city}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < hotel.starRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
              ))}
            </div>
            <Badge variant="success">{hotel.reviewScore.toFixed(1)} / 5</Badge>
            <span className="text-sm text-gray-400">({hotel.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      <p className="mt-4 text-gray-600 leading-relaxed">{hotel.description}</p>

      {/* Amenities */}
      {hotel.amenities && (
        <div className="mt-4 flex flex-wrap gap-2">
          {hotel.amenities.split(',').map(a => (
            <span key={a} className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              <Wifi className="h-3 w-3" /> {a.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Rooms */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Rooms</h2>
        {hotel.rooms.length === 0 ? (
          <p className="text-gray-400">No rooms available for selected dates.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {hotel.rooms.map(room => (
              <RoomRow
                key={room.id}
                room={room}
                nights={nights}
                checkIn={checkIn}
                checkOut={checkOut}
                hotelId={hotel.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function RoomRow({
  room, nights, checkIn, checkOut, hotelId
}: { room: HotelRoomDto; nights: number; checkIn: string; checkOut: string; hotelId: string }) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div>
        <p className="font-semibold text-gray-900">{room.roomType}</p>
        <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
          <Users className="h-3.5 w-3.5" /> Up to {room.maxOccupancy} guests
        </p>
        {room.amenities && (
          <p className="text-xs text-gray-400 mt-1">{room.amenities}</p>
        )}
        <Badge variant={room.availableRooms > 0 ? 'success' : 'danger'} className="mt-2">
          {room.availableRooms > 0 ? `${room.availableRooms} rooms left` : 'Sold Out'}
        </Badge>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p className="text-xl font-bold text-primary-700">{formatCurrency(room.pricePerNight)}<span className="text-sm font-normal text-gray-400">/night</span></p>
        <p className="text-sm text-gray-500">Total: {formatCurrency(room.pricePerNight * nights)} for {nights} night{nights > 1 ? 's' : ''}</p>
        <Button
          size="sm"
          disabled={room.availableRooms === 0}
          onClick={() => navigate(`/hotels/${hotelId}/book/${room.id}?checkIn=${checkIn}&checkOut=${checkOut}`)}
        >
          Book Room
        </Button>
      </div>
    </div>
  )
}
