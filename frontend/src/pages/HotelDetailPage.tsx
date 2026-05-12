import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Star, MapPin, Wifi, Dumbbell, Waves, Car, Coffee, ArrowLeft,
  Users, CheckCircle, ChevronRight, Home, Info,
} from 'lucide-react'
import type { HotelDto, HotelRoomDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { formatCurrency } from '@/utils/formatters'

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'

const ROOM_IMAGES: { keywords: string[]; url: string }[] = [
  { keywords: ['suite', 'presidential', 'penthouse'], url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&q=70' },
  { keywords: ['deluxe', 'superior', 'premium'],      url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=70' },
  { keywords: ['twin', 'double'],                     url: 'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=400&q=70' },
  { keywords: ['family', 'connecting'],               url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=400&q=70' },
  { keywords: ['studio', 'apartment'],                url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=70' },
]
const ROOM_FALLBACK = 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=400&q=70'

function getRoomImage(roomType: string): string {
  const t = roomType.toLowerCase()
  return ROOM_IMAGES.find(r => r.keywords.some(k => t.includes(k)))?.url ?? ROOM_FALLBACK
}

function galleryImg(base: string, n: number): string {
  try {
    const url = new URL(base)
    url.searchParams.set('w', '300')
    url.searchParams.set('q', '60')
    url.searchParams.set('ar', ['1:1', '4:3', '16:9', '3:4', '2:3'][n % 5])
    return url.toString()
  } catch { return base }
}

function parseAmenities(raw: string): string[] {
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

const AMENITY_ICON: Record<string, React.ReactNode> = {
  wifi:     <Wifi      className="h-5 w-5" />,
  pool:     <Waves     className="h-5 w-5" />,
  gym:      <Dumbbell  className="h-5 w-5" />,
  parking:  <Car       className="h-5 w-5" />,
  coffee:   <Coffee    className="h-5 w-5" />,
  breakfast:<Coffee    className="h-5 w-5" />,
}

function amenityIcon(label: string) {
  const k = label.toLowerCase()
  for (const [key, icon] of Object.entries(AMENITY_ICON)) {
    if (k.includes(key)) return icon
  }
  return <CheckCircle className="h-5 w-5" />
}

function scoreColor(s: number) {
  return s >= 4.5 ? 'bg-green-600' : s >= 4 ? 'bg-green-500' : s >= 3.5 ? 'bg-yellow-500' : 'bg-orange-400'
}

function scoreLabel(s: number) {
  return s >= 4.5 ? 'Exceptional' : s >= 4 ? 'Very Good' : s >= 3.5 ? 'Good' : 'Pleasant'
}

function fmtDate(d: string): string {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Room Card ─────────────────────────────────────────────────────────────────

function RoomCard({ room, hotelId, checkIn, checkOut, guests }: {
  room: HotelRoomDto; hotelId: string; checkIn: string; checkOut: string; guests: number
}) {
  const navigate = useNavigate()
  const nights   = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1
  const total    = room.pricePerNight * nights

  const params = new URLSearchParams()
  if (checkIn)  params.set('checkIn',  checkIn)
  if (checkOut) params.set('checkOut', checkOut)
  params.set('guests', String(guests))

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-orange-300 hover:shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row">
        {/* Room image */}
        <div className="sm:w-44 h-40 sm:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={getRoomImage(room.roomType)}
            alt={room.roomType}
            className="w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).src = ROOM_FALLBACK }}
          />
        </div>

        <div className="flex flex-1 flex-col sm:flex-row sm:items-start justify-between gap-4 p-5">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-base">{room.roomType}</h3>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
            <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Up to {room.maxOccupancy} guests</span>
            {room.availableRooms > 0 && (
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <CheckCircle className="h-4 w-4" /> {room.availableRooms} rooms left
              </span>
            )}
          </div>
          {room.amenities && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {parseAmenities(room.amenities).slice(0, 4).map(a => (
                <span key={a} className="text-[11px] bg-gray-50 border border-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{a}</span>
              ))}
            </div>
          )}
          {room.cancellationPolicy && (
            <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> {room.cancellationPolicy}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(room.pricePerNight)}</p>
          <p className="text-xs text-gray-400">per night</p>
          {nights > 1 && (
            <p className="text-sm text-gray-500 mt-0.5">{formatCurrency(total)} total · {nights} nights</p>
          )}
          <button
            onClick={() => navigate(`/hotels/${hotelId}/book/${room.id}?${params}`)}
            className="mt-3 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-lg transition-colors"
          >
            Book Now
          </button>
        </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HotelDetailPage() {
  const { id }           = useParams<{ id: string }>()
  const [searchParams]   = useSearchParams()
  const navigate         = useNavigate()

  const checkIn  = searchParams.get('checkIn')  ?? ''
  const checkOut = searchParams.get('checkOut') ?? ''
  const guests   = Number(searchParams.get('guests') ?? 2)

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
    <div className="min-h-screen bg-gray-50">
      <div className="h-72 bg-gray-200 animate-pulse" />
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  if (error || !hotel) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
      <p className="text-gray-500">{error ?? 'Hotel not found'}</p>
      <button onClick={() => navigate(-1)} className="text-orange-500 underline text-sm">Go back</button>
    </div>
  )

  const amenities = parseAmenities(hotel.amenities)
  const nights    = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero image */}
      <div className="relative h-72 sm:h-96 bg-gray-900 overflow-hidden">
        <img
          src={hotel.imageUrl || FALLBACK_IMG}
          alt={hotel.name}
          className="w-full h-full object-cover opacity-80"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow">{hotel.name}</h1>
          <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
            <MapPin className="h-4 w-4 flex-shrink-0" /> {hotel.address}
          </p>
        </div>
      </div>

      {/* Gallery strip */}
      <div className="bg-gray-900 px-4 pb-3">
        <div className="mx-auto max-w-6xl flex gap-2 overflow-x-auto scrollbar-hide">
          {[0, 1, 2, 3, 4].map(n => (
            <div key={n} className="h-16 w-24 flex-shrink-0 rounded-md overflow-hidden opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
              <img
                src={galleryImg(hotel.imageUrl || FALLBACK_IMG, n)}
                alt=""
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col lg:flex-row gap-6">

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-xs text-gray-400">
            <Link to="/" className="hover:text-orange-600 flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/hotels" className="hover:text-orange-600">Hotels</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-700 font-medium truncate">{hotel.name}</span>
          </nav>

          {/* Rating card */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className={`flex items-baseline gap-1 ${scoreColor(hotel.reviewScore)} text-white px-3 py-2 rounded-xl`}>
                <span className="text-2xl font-extrabold">{hotel.reviewScore.toFixed(1)}</span>
                <span className="text-sm opacity-80">/ 5</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{scoreLabel(hotel.reviewScore)}</p>
                <p className="text-sm text-gray-500">{hotel.reviewCount.toLocaleString()} guest reviews</p>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-5 w-5 ${i < hotel.starRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} />
                ))}
                <span className="text-sm text-gray-500 ml-1">{hotel.starRating}-star hotel</span>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">Amenities &amp; Facilities</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {amenities.map(a => (
                <div key={a} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <span className="text-orange-500 flex-shrink-0">{amenityIcon(a)}</span>
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">About the Property</h2>
            <p className="text-sm text-gray-600 leading-relaxed">{hotel.description}</p>
          </div>

          {/* Rooms */}
          <div>
            <h2 className="font-bold text-gray-900 text-lg mb-3">Available Rooms</h2>
            {hotel.rooms.length === 0 ? (
              <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-100 p-6 text-center">No rooms available.</p>
            ) : (
              <div className="space-y-3">
                {hotel.rooms.map(room => (
                  <RoomCard
                    key={room.id}
                    room={room}
                    hotelId={hotel.id}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    guests={guests}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Important info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h2 className="flex items-center gap-2 font-bold text-amber-800 mb-3">
              <Info className="h-4 w-4" /> Important Information
            </h2>
            <ul className="space-y-1.5 text-sm text-amber-700 list-disc list-inside">
              <li>Check-in: 2:00 PM · Check-out: 12:00 PM (noon)</li>
              <li>Valid government-issued photo ID required at check-in</li>
              <li>Cancellation policy varies by room type — see room details</li>
              <li>Extra charges may apply for additional guests</li>
            </ul>
          </div>

        </div>

        {/* Sticky sidebar — stay summary */}
        {(checkIn || checkOut) && (
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm sticky top-20">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wide text-orange-600">Your Stay</h3>
              <div className="space-y-3 text-sm">
                {checkIn && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-in</span>
                    <span className="font-semibold text-gray-800">{fmtDate(checkIn)}</span>
                  </div>
                )}
                {checkOut && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Check-out</span>
                    <span className="font-semibold text-gray-800">{fmtDate(checkOut)}</span>
                  </div>
                )}
                {nights > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration</span>
                    <span className="font-semibold text-gray-800">{nights} night{nights > 1 ? 's' : ''}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Guests</span>
                  <span className="font-semibold text-gray-800">{guests} adult{guests > 1 ? 's' : ''}</span>
                </div>
              </div>
              <hr className="my-4 border-gray-100" />
              <p className="text-xs text-gray-400 text-center">Select a room to complete booking</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
