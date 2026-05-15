import { useEffect, useState, useCallback } from 'react'
import { BedDouble, Plus, Pencil, Trash2, Check, X, IndianRupee, Users } from 'lucide-react'
import { hotelManagerService } from '@/services/hotelManagerService'
import type { HotelRoomManagerDto, CreateRoomRequest, UpdateRoomRequest } from '@/types'

interface RoomFormState {
  roomType: string
  pricePerNight: string
  maxGuests: string
  totalRooms: string
  amenities: string
  images: string
  isActive: boolean
}

const emptyForm = (): RoomFormState => ({
  roomType: '',
  pricePerNight: '',
  maxGuests: '',
  totalRooms: '',
  amenities: '',
  images: '',
  isActive: true,
})

function RoomModal({
  room,
  onClose,
  onSave,
}: {
  room: HotelRoomManagerDto | null
  onClose: () => void
  onSave: (data: CreateRoomRequest | UpdateRoomRequest) => Promise<void>
}) {
  const [form, setForm] = useState<RoomFormState>(
    room
      ? {
          roomType: room.roomType,
          pricePerNight: String(room.pricePerNight),
          maxGuests: String(room.maxGuests),
          totalRooms: String(room.totalRooms),
          amenities: room.amenities ?? '',
          images: room.images ?? '',
          isActive: room.isActive,
        }
      : emptyForm()
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!form.roomType.trim() || !form.pricePerNight || !form.maxGuests || !form.totalRooms) {
      setError('Room type, price, max guests, and total rooms are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        roomType: form.roomType.trim(),
        pricePerNight: parseFloat(form.pricePerNight),
        maxGuests: parseInt(form.maxGuests),
        totalRooms: parseInt(form.totalRooms),
        amenities: form.amenities.trim() || undefined,
        images: form.images.trim() || undefined,
        ...(room ? { isActive: form.isActive } : {}),
      })
      onClose()
    } catch {
      setError('Failed to save room.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{room ? 'Edit Room' : 'Add New Room'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Room Type *</label>
            <input
              value={form.roomType}
              onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}
              placeholder="e.g. Deluxe, Suite, Standard"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price / Night (₹) *</label>
              <input
                type="number"
                value={form.pricePerNight}
                onChange={e => setForm(f => ({ ...f, pricePerNight: e.target.value }))}
                placeholder="2500"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Max Guests *</label>
              <input
                type="number"
                value={form.maxGuests}
                onChange={e => setForm(f => ({ ...f, maxGuests: e.target.value }))}
                placeholder="2"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Total Rooms *</label>
              <input
                type="number"
                value={form.totalRooms}
                onChange={e => setForm(f => ({ ...f, totalRooms: e.target.value }))}
                placeholder="10"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Amenities <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              value={form.amenities}
              onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))}
              placeholder='["AC","WiFi","TV","Hot Water"]'
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Room Image URL(s) <span className="text-gray-400">(JSON array)</span>
            </label>
            <input
              value={form.images}
              onChange={e => setForm(f => ({ ...f, images: e.target.value }))}
              placeholder='["https://example.com/room1.jpg"]'
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
            />
          </div>
          {room && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-gray-700">Room is active (visible to guests)</span>
            </label>
          )}
        </div>

        <div className="flex gap-3 justify-end px-6 py-5 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? 'Saving…' : room ? 'Update Room' : 'Add Room'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HotelRoomsPage() {
  const [rooms, setRooms] = useState<HotelRoomManagerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modal, setModal] = useState<'add' | HotelRoomManagerDto | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    hotelManagerService.getProfile()
      .then(profile => setRooms(profile.rooms))
      .catch(() => setError('Failed to load rooms.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async (data: CreateRoomRequest | UpdateRoomRequest) => {
    if (modal === 'add') {
      await hotelManagerService.addRoom(data as CreateRoomRequest)
    } else if (modal !== null) {
      await hotelManagerService.updateRoom(modal.id, data as UpdateRoomRequest)
    }
    load()
  }

  const handleDelete = async (roomId: string) => {
    if (!window.confirm('Remove this room? It will no longer be visible to guests.')) return
    setDeletingId(roomId)
    try {
      await hotelManagerService.deleteRoom(roomId)
      setRooms(r => r.filter(x => x.id !== roomId))
    } catch {
      setError('Failed to remove room.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your room inventory, pricing, and amenities</p>
        </div>
        <button
          onClick={() => setModal('add')}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <BedDouble className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">No rooms added yet.</p>
          <button
            onClick={() => setModal('add')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" /> Add First Room
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-xl border border-gray-100 p-5">
              {/* Room image preview */}
              {room.images && (() => {
                try {
                  const imgs: string[] = JSON.parse(room.images)
                  if (imgs[0]) return (
                    <img
                      src={imgs[0]}
                      alt={room.roomType}
                      className="w-full h-36 object-cover rounded-lg mb-4 bg-gray-100"
                    />
                  )
                } catch { /* no-op */ }
                return null
              })()}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{room.roomType}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {room.pricePerNight.toLocaleString('en-IN')}/night
                    </span>
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-3.5 w-3.5" />
                      Max {room.maxGuests}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${room.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {room.isActive ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {room.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                {room.totalRooms} room{room.totalRooms !== 1 ? 's' : ''}
                {room.amenities && ` · ${room.amenities.replace(/[\[\]"]/g, '').split(',').slice(0, 3).join(', ')}`}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setModal(room)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  disabled={deletingId === room.id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== null && (
        <RoomModal
          room={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
