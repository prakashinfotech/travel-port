import { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Star, MapPin, Wifi, Dumbbell, Waves, Car, Coffee, ArrowLeft,
  Users, CheckCircle, ChevronRight, Home, Info, Trash2,
  ChevronLeft, ChevronRight as ChevronRightIcon, X, Images as ImagesIcon,
} from 'lucide-react'
import type { HotelDto, HotelRoomDto, HotelReviewDto } from '@/types'
import { hotelService } from '@/services/hotelService'
import { adminService } from '@/services/adminService'
import { useAuth } from '@/hooks/useAuth'
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

function parseImages(raw: string | undefined, fallback: string): string[] {
  if (!raw) return [fallback]
  try {
    const arr = JSON.parse(raw) as string[]
    return arr.length > 0 ? arr : [fallback]
  } catch { return [fallback] }
}

// ── Lightbox ──────────────────────────────────────────────────────────────────

function Lightbox({ images, index, onClose, onPrev, onNext, onSelect }: {
  images: string[]; index: number; onClose: () => void
  onPrev: () => void; onNext: () => void; onSelect: (i: number) => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, onPrev, onNext])

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Counter */}
      <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
        {index + 1} / {images.length}
      </p>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onPrev() }}
          className="absolute left-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
        >
          <ChevronLeft className="h-7 w-7" />
        </button>
      )}

      {/* Image */}
      <img
        src={images[index]}
        alt={`Photo ${index + 1}`}
        onClick={e => e.stopPropagation()}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
        onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
      />

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={e => { e.stopPropagation(); onNext() }}
          className="absolute right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"
        >
          <ChevronRightIcon className="h-7 w-7" />
        </button>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-2 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={e => { e.stopPropagation(); onSelect(i) }}
              className={`h-14 w-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
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
  const { isAuthenticated, isAdmin, user } = useAuth()

  const checkIn  = searchParams.get('checkIn')  ?? ''
  const checkOut = searchParams.get('checkOut') ?? ''
  const guests   = Number(searchParams.get('guests') ?? 2)

  const [hotel,   setHotel]   = useState<HotelDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null)
  const [carouselIdx, setCarouselIdx]   = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    hotelService.getById(id)
      .then(r => {
        if (!r.data) { setError('Hotel not found.'); return }
        setHotel(r.data)
      })
      .catch((err: any) => {
        const msg = err?.response?.data?.message ?? 'Hotel not found.'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [id])

  // Derived values — computed unconditionally so hooks order is preserved
  const galleryImgs = parseImages(hotel?.images, hotel?.imageUrl || FALLBACK_IMG)

  // Hooks must be called unconditionally (before any early return)
  const prevImg = useCallback(() => setCarouselIdx(i => (i - 1 + galleryImgs.length) % galleryImgs.length), [galleryImgs.length])
  const nextImg = useCallback(() => setCarouselIdx(i => (i + 1) % galleryImgs.length), [galleryImgs.length])

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
  const reviews   = hotel.reviews ?? []
  const nights    = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 0
  const userReview = user ? reviews.find(review => review.userId === user.id) : undefined

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setReviewBusy(true)
    setReviewError(null)
    setReviewSuccess(null)
    try {
      const res = await hotelService.createReview(id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      })
      const created = res.data
      setHotel(prev => prev ? {
        ...prev,
        reviewScore: Number(((prev.reviewScore * prev.reviewCount + created.rating) / (prev.reviewCount + 1)).toFixed(1)),
        reviewCount: prev.reviewCount + 1,
        reviews: [created, ...(prev.reviews ?? [])],
      } : prev)
      setReviewComment('')
      setReviewRating(5)
      setReviewSuccess('Review submitted successfully.')
    } catch (err: any) {
      setReviewError(err?.response?.data?.message ?? 'Failed to submit review.')
    } finally {
      setReviewBusy(false)
    }
  }

  const handleDeleteReview = async (review: HotelReviewDto) => {
    if (!window.confirm('Delete this review?')) return
    setReviewError(null)
    setReviewSuccess(null)
    try {
      await adminService.deleteHotelReview(review.id)
      setHotel(prev => {
        if (!prev) return prev
        const nextReviews = (prev.reviews ?? []).filter(r => r.id !== review.id)
        const nextCount = nextReviews.length
        const nextScore = nextCount === 0
          ? 0
          : Number((nextReviews.reduce((sum, r) => sum + r.rating, 0) / nextCount).toFixed(1))
        return {
          ...prev,
          reviewCount: nextCount,
          reviewScore: nextScore,
          reviews: nextReviews,
        }
      })
      setReviewSuccess('Review deleted.')
    } catch (err: any) {
      setReviewError(err?.response?.data?.message ?? 'Failed to delete review.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero carousel */}
      <div className="relative h-72 sm:h-96 bg-gray-900 overflow-hidden group">
        <img
          src={galleryImgs[carouselIdx]}
          alt={hotel.name}
          className="w-full h-full object-cover opacity-80 transition-all duration-500 cursor-pointer"
          onClick={() => setLightboxOpen(true)}
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* View all photos */}
        {galleryImgs.length > 1 && (
          <button
            onClick={() => setLightboxOpen(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
          >
            <ImagesIcon className="h-3.5 w-3.5" /> View all {galleryImgs.length} photos
          </button>
        )}

        {/* Prev / Next arrows */}
        {galleryImgs.length > 1 && (
          <>
            <button
              onClick={prevImg}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImg}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {galleryImgs.length > 1 && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1.5">
            {galleryImgs.map((_, i) => (
              <button key={i} onClick={() => setCarouselIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === carouselIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}

        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow">{hotel.name}</h1>
          <p className="flex items-center gap-1 text-white/80 text-sm mt-1">
            <MapPin className="h-4 w-4 flex-shrink-0" /> {hotel.address}
          </p>
        </div>
      </div>

      {/* Thumbnail strip */}
      <div className="bg-gray-900 px-4 pb-3">
        <div className="mx-auto max-w-6xl flex gap-2 overflow-x-auto scrollbar-hide">
          {galleryImgs.map((img, n) => (
            <button
              key={n}
              onClick={() => { setCarouselIdx(n); setLightboxOpen(true) }}
              className={`h-16 w-24 flex-shrink-0 rounded-md overflow-hidden transition-all ${n === carouselIdx ? 'ring-2 ring-orange-400 opacity-100' : 'opacity-50 hover:opacity-90'}`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={galleryImgs}
          index={carouselIdx}
          onClose={() => setLightboxOpen(false)}
          onPrev={prevImg}
          onNext={nextImg}
          onSelect={setCarouselIdx}
        />
      )}

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
              <div className={`flex items-baseline gap-1 ${hotel.reviewCount > 0 ? scoreColor(hotel.reviewScore) : 'bg-gray-400'} text-white px-3 py-2 rounded-xl`}>
                <span className="text-2xl font-extrabold">{hotel.reviewScore.toFixed(1)}</span>
                <span className="text-sm opacity-80">/ 5</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">{hotel.reviewCount > 0 ? scoreLabel(hotel.reviewScore) : 'No reviews yet'}</p>
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

          {/* Reviews */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-bold text-gray-900">Guest Reviews</h2>
                <p className="text-sm text-gray-500">
                  {hotel.reviewCount > 0 ? `${hotel.reviewCount} review${hotel.reviewCount !== 1 ? 's' : ''} · average ${hotel.reviewScore.toFixed(1)} / 5` : 'Be the first guest to leave a review.'}
                </p>
              </div>
            </div>

            {isAuthenticated ? (
              userReview ? (
                <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  You have already reviewed this hotel.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-semibold text-gray-700">Your rating</label>
                    <select
                      value={reviewRating}
                      onChange={e => setReviewRating(Number(e.target.value))}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {[5, 4, 3, 2, 1].map(rating => (
                        <option key={rating} value={rating}>{rating} Star{rating > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    rows={4}
                    placeholder="Share your stay experience"
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {reviewError && <p className="mt-2 text-sm text-red-600">{reviewError}</p>}
                  {reviewSuccess && <p className="mt-2 text-sm text-green-600">{reviewSuccess}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">Only guests who completed a stay can submit a review.</p>
                    <button
                      type="submit"
                      disabled={reviewBusy || !reviewComment.trim()}
                      className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reviewBusy ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
              )
            ) : (
              <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                Log in after your stay to leave a review.
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
                No reviews yet for this hotel.
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <div key={review.id} className="rounded-xl border border-gray-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{review.userName}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-bold text-white ${scoreColor(review.rating)}`}>
                            {review.rating}.0
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                        />
                      ))}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
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
