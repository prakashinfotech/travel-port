import { useState } from 'react'
import {
  Calendar, Users, Search, CheckCircle,
  XCircle, AlertCircle, ShoppingCart, X,
} from 'lucide-react'
import { hotelManagerService } from '@/services/hotelManagerService'
import { hotelService } from '@/services/hotelService'
import { useAuth } from '@/hooks/useAuth'
import { formatCurrency } from '@/utils/formatters'
import type { HotelRoomManagerDto } from '@/types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface RoomAvailability {
  room: HotelRoomManagerDto
  available: number
  booked: number
  totalRooms: number
}

interface BulkBookingItem {
  roomId: string
  roomType: string
  pricePerNight: number
  count: number
  maxAvailable: number
}

interface GuestInfo {
  name: string
  email: string
  phone: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseImages(raw: string | undefined): string {
  if (!raw) return ''
  try {
    const arr = JSON.parse(raw) as string[]
    return arr[0] ?? ''
  } catch { return '' }
}

const ROOM_FALLBACK = 'https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=400&q=70'

function fmtDate(d: string) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Availability badge ────────────────────────────────────────────────────────

function AvailBadge({ available, total }: { available: number; total: number }) {
  if (available === 0) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
      <XCircle className="h-3 w-3" /> Sold Out
    </span>
  )
  if (available <= 2) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
      <AlertCircle className="h-3 w-3" /> Only {available} left
    </span>
  )
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
      <CheckCircle className="h-3 w-3" /> {available} of {total} available
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function HotelAvailabilityPage() {
  const { user } = useAuth()

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]

  const [checkIn,  setCheckIn]  = useState(today)
  const [checkOut, setCheckOut] = useState(tomorrow)
  const [searched, setSearched] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const [availability, setAvailability] = useState<RoomAvailability[]>([])

  // Bulk booking state
  const [cart,         setCart]         = useState<BulkBookingItem[]>([])
  const [showBooking,  setShowBooking]  = useState(false)
  const [guestInfo,    setGuestInfo]    = useState<GuestInfo>({ name: '', email: '', phone: '' })
  const [bookingBusy,  setBookingBusy]  = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingDone,  setBookingDone]  = useState(false)
  const [bookedRefs,   setBookedRefs]   = useState<string[]>([])


  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000))
    : 1

  const handleSearch = async () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setError('Check-out must be after check-in.'); return
    }
    setLoading(true); setError(null); setSearched(false)
    try {
      const hotelId = user?.hotelId
      if (!hotelId) { setError('Hotel not linked to your account.'); return }

      const hotel = await hotelService.getById(hotelId, checkIn, checkOut)
      const rooms = hotel.data?.rooms ?? []

      // Get manager rooms for totalRooms info
      let managerRoomsMap: Record<string, HotelRoomManagerDto> = {}
      try {
        const mgr = await hotelManagerService.getRooms?.()
        if (mgr) mgr.forEach(r => { managerRoomsMap[r.id] = r })
      } catch { /* ignore */ }

      setAvailability(rooms.map(r => {
        const mgr = managerRoomsMap[r.id]
        const total = mgr?.totalRooms ?? r.availableRooms
        return {
          room: (mgr ?? { ...r, totalRooms: total, isActive: true, images: undefined }) as HotelRoomManagerDto,
          available: r.availableRooms,
          booked: total - r.availableRooms,
          totalRooms: total,
        }
      }))
      setSearched(true)
    } catch (e: unknown) {
      setError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to load availability.')
    } finally { setLoading(false) }
  }

  // Cart helpers
  const cartItem = (roomId: string) => cart.find(c => c.roomId === roomId)

  const setRoomCount = (av: RoomAvailability, count: number) => {
    const safe = Math.max(0, Math.min(count, av.available))
    if (safe === 0) {
      setCart(prev => prev.filter(c => c.roomId !== av.room.id))
    } else {
      setCart(prev => {
        const exists = prev.find(c => c.roomId === av.room.id)
        if (exists) return prev.map(c => c.roomId === av.room.id ? { ...c, count: safe } : c)
        return [...prev, {
          roomId: av.room.id,
          roomType: av.room.roomType,
          pricePerNight: av.room.pricePerNight,
          count: safe,
          maxAvailable: av.available,
        }]
      })
    }
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.pricePerNight * c.count * nights, 0)
  const cartRooms = cart.reduce((sum, c) => sum + c.count, 0)

  const handleBulkBook = async () => {
    if (!guestInfo.name || !guestInfo.email || !/^\d{10}$/.test(guestInfo.phone)) {
      setBookingError('Please fill in valid guest name, email, and 10-digit phone.'); return
    }
    if (cart.length === 0) { setBookingError('Add at least one room to the booking.'); return }
    setBookingBusy(true); setBookingError(null)
    try {
      const refs: string[] = []
      for (const item of cart) {
        for (let i = 0; i < item.count; i++) {
          const res = await hotelService.book({
            hotelId:   user!.hotelId!,
            roomId:    item.roomId,
            checkIn,
            checkOut,
            guests:    2,
            guestName: guestInfo.name,
            guestEmail: guestInfo.email,
            guestPhone: guestInfo.phone,
          })
          refs.push(res.data.bookingRef ?? res.data.id)
        }
      }
      setBookedRefs(refs)
      setBookingDone(true)
      setCart([])
    } catch (e: unknown) {
      setBookingError((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Booking failed.')
    } finally { setBookingBusy(false) }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Room Availability</h1>
        <p className="text-sm text-gray-500 mt-1">Check room availability for any date range and make bulk bookings.</p>
      </div>

      {/* Date picker */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Check-in Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={e => setCheckIn(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Check-out Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={e => setCheckOut(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? 'Checking…' : 'Check Availability'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Results */}
      {searched && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing availability for <strong>{fmtDate(checkIn)} → {fmtDate(checkOut)}</strong> ({nights} night{nights > 1 ? 's' : ''})
            </p>
            {cartRooms > 0 && (
              <button
                onClick={() => setShowBooking(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold transition-colors"
              >
                <ShoppingCart className="h-4 w-4" />
                Book {cartRooms} room{cartRooms !== 1 ? 's' : ''} · {formatCurrency(cartTotal)}
              </button>
            )}
          </div>

          {availability.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-10 text-center text-gray-400">
              No rooms found for this hotel.
            </div>
          ) : (
            <div className="space-y-3">
              {availability.map(av => {
                const item = cartItem(av.room.id)
                const img = parseImages(av.room.images) || ROOM_FALLBACK
                return (
                  <div key={av.room.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                    av.available === 0 ? 'opacity-60 border-gray-100' : 'border-gray-200 hover:border-sky-300'
                  }`}>
                    <div className="flex flex-col sm:flex-row">
                      {/* Room image */}
                      <div className="sm:w-40 h-36 sm:h-auto flex-shrink-0 overflow-hidden">
                        <img src={img} alt={av.room.roomType}
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).src = ROOM_FALLBACK }} />
                      </div>

                      <div className="flex flex-1 flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-gray-900">{av.room.roomType}</h3>
                            <AvailBadge available={av.available} total={av.totalRooms} />
                          </div>
                          <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                            <Users className="h-4 w-4" /> Up to {av.room.maxGuests ?? 2} guests per room
                          </div>

                          {/* Occupancy bar */}
                          <div className="mt-2 max-w-xs">
                            <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                              <span>{av.booked} booked</span>
                              <span>{av.available} available</span>
                            </div>
                            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${av.available === 0 ? 'bg-red-400' : av.available <= 2 ? 'bg-amber-400' : 'bg-green-400'}`}
                                style={{ width: `${av.totalRooms > 0 ? (av.booked / av.totalRooms) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Price + quantity */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-xl font-bold text-sky-700">{formatCurrency(av.room.pricePerNight)}</p>
                            <p className="text-xs text-gray-400">per night</p>
                            {nights > 1 && <p className="text-xs text-gray-500">{formatCurrency(av.room.pricePerNight * nights)} / {nights} nights</p>}
                          </div>

                          {av.available > 0 && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setRoomCount(av, (item?.count ?? 0) - 1)}
                                disabled={!item}
                                className="h-8 w-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30"
                              >−</button>
                              <span className="w-6 text-center text-sm font-bold text-gray-800">{item?.count ?? 0}</span>
                              <button
                                onClick={() => setRoomCount(av, (item?.count ?? 0) + 1)}
                                disabled={(item?.count ?? 0) >= av.available}
                                className="h-8 w-8 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 flex items-center justify-center hover:bg-sky-100 disabled:opacity-30"
                              >+</button>
                            </div>
                          )}

                          {item && (
                            <p className="text-xs text-orange-600 font-semibold">
                              {item.count} room{item.count > 1 ? 's' : ''} · {formatCurrency(item.pricePerNight * item.count * nights)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Bulk booking modal */}
      {showBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !bookingBusy && setShowBooking(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Bulk Booking</h2>
              <button onClick={() => setShowBooking(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            {bookingDone ? (
              <div className="px-6 py-8 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Booking Confirmed!</h3>
                <p className="text-sm text-gray-500 mb-4">{bookedRefs.length} room{bookedRefs.length > 1 ? 's' : ''} booked for {fmtDate(checkIn)} → {fmtDate(checkOut)}</p>
                <div className="space-y-1 mb-5">
                  {bookedRefs.map((ref, i) => (
                    <p key={i} className="text-xs text-gray-600 font-mono bg-gray-50 rounded px-2 py-1">Ref: {ref}</p>
                  ))}
                </div>
                <button
                  onClick={() => { setShowBooking(false); setBookingDone(false); setBookedRefs([]); handleSearch() }}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 text-white text-sm font-bold hover:bg-sky-700"
                >
                  Refresh Availability
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 space-y-4">
                {/* Cart summary */}
                <div className="rounded-xl bg-sky-50 border border-sky-100 p-4 space-y-2">
                  <p className="text-xs font-semibold text-sky-700 mb-2">Selected Rooms</p>
                  {cart.map(item => (
                    <div key={item.roomId} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.roomType} × {item.count}</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.pricePerNight * item.count * nights)}</span>
                    </div>
                  ))}
                  <div className="border-t border-sky-200 pt-2 flex justify-between text-sm font-bold">
                    <span>{cartRooms} room{cartRooms > 1 ? 's' : ''} × {nights} night{nights > 1 ? 's' : ''}</span>
                    <span className="text-sky-700">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>

                {/* Date summary */}
                <div className="flex gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {fmtDate(checkIn)}</span>
                  <span>→</span>
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {fmtDate(checkOut)}</span>
                </div>

                {/* Guest info */}
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500">Primary Guest / Contact</p>
                  <input
                    placeholder="Full Name *"
                    value={guestInfo.name}
                    onChange={e => setGuestInfo(g => ({ ...g, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="email"
                    placeholder="Email *"
                    value={guestInfo.email}
                    onChange={e => setGuestInfo(g => ({ ...g, email: e.target.value }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    placeholder="Mobile (10 digits) *"
                    inputMode="numeric"
                    maxLength={10}
                    value={guestInfo.phone}
                    onChange={e => setGuestInfo(g => ({ ...g, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  {guestInfo.phone && guestInfo.phone.length !== 10 && (
                    <p className="text-xs text-red-500">Mobile must be 10 digits</p>
                  )}
                </div>

                {bookingError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">{bookingError}</div>
                )}
              </div>
            )}

            {!bookingDone && (
              <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
                <button onClick={() => setShowBooking(false)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  onClick={handleBulkBook}
                  disabled={bookingBusy}
                  className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white py-2.5 text-sm font-bold transition-colors disabled:opacity-60"
                >
                  {bookingBusy ? 'Booking…' : `Confirm ${cartRooms} Room${cartRooms > 1 ? 's' : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
