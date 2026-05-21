import { useEffect, useState, useCallback, useRef } from 'react'
import { BedDouble, Plus, Pencil, Trash2, Check, X, IndianRupee, Users, Upload, Link, ChevronDown } from 'lucide-react'
import { hotelManagerService } from '@/services/hotelManagerService'
import type { HotelRoomManagerDto, CreateRoomRequest, UpdateRoomRequest } from '@/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  'Standard Room', 'Deluxe Room', 'Suite', 'Junior Suite',
  'Executive Room', 'Family Room', 'Twin Room', 'Single Room',
  'Double Room', 'Studio', 'Dormitory Bed', 'Private Double',
  'Sea View Room', 'Pool View Room', 'Penthouse', 'Villa',
]

const AMENITY_OPTIONS = [
  'AC', 'WiFi', 'TV', 'Hot Water', 'Room Service', 'Mini Bar',
  'Balcony', 'Safe', 'Hairdryer', 'Bathtub', 'Shower',
  'Kitchenette', 'Coffee Maker', 'Iron', 'Telephone',
  'Work Desk', 'Parking', 'Pool Access', 'Gym Access', 'Breakfast Included',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseJsonArray(raw: string): string[] {
  try { return JSON.parse(raw) } catch { return [] }
}

function compressImage(file: File, maxPx = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = ev.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Amenities multi-select ────────────────────────────────────────────────────

function AmenitiesSelect({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  function toggle(a: string) {
    onChange(selected.includes(a) ? selected.filter(x => x !== a) : [...selected, a])
  }

  return (
    <div ref={ref} className="relative">
      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-left focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 bg-white"
      >
        <span className="text-gray-500">
          {selected.length === 0 ? 'Select amenities…' : `${selected.length} selected`}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* tags */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map(a => (
            <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-xs font-medium">
              {a}
              <button type="button" onClick={() => toggle(a)} className="hover:text-sky-900">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-52 overflow-y-auto">
          {AMENITY_OPTIONS.map(a => (
            <label key={a} className="flex items-center gap-2 px-3 py-2 hover:bg-sky-50 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={selected.includes(a)}
                onChange={() => toggle(a)}
                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500"
              />
              {a}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Image manager ─────────────────────────────────────────────────────────────

function ImageManager({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    setUploading(true)
    try {
      const dataUrls = await Promise.all(Array.from(files).map(f => compressImage(f)))
      onChange([...images, ...dataUrls])
    } finally {
      setUploading(false)
    }
  }

  function addUrl() {
    const url = urlInput.trim()
    if (!url) return
    onChange([...images, url])
    setUrlInput('')
  }

  return (
    <div className="space-y-3">
      {/* thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* upload buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2.5 text-sm text-gray-500 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50 transition-colors disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Uploading…' : 'Upload from device'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* URL input row */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-200">
          <Link className="h-3.5 w-3.5 text-gray-400 shrink-0" />
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
            placeholder="Paste image URL and press Add"
            className="flex-1 text-sm outline-none bg-transparent"
          />
        </div>
        <button
          type="button"
          onClick={addUrl}
          className="px-3 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ── Room modal ────────────────────────────────────────────────────────────────

interface RoomFormState {
  roomType: string
  customRoomType: string
  pricePerNight: string
  maxGuests: string
  totalRooms: string
  amenities: string[]
  images: string[]
  isActive: boolean
}

function emptyForm(): RoomFormState {
  return { roomType: '', customRoomType: '', pricePerNight: '', maxGuests: '', totalRooms: '', amenities: [], images: [], isActive: true }
}

function RoomModal({
  room,
  onClose,
  onSave,
}: {
  room: HotelRoomManagerDto | null
  onClose: () => void
  onSave: (data: CreateRoomRequest | UpdateRoomRequest) => Promise<void>
}) {
  const [form, setForm] = useState<RoomFormState>(() => {
    if (!room) return emptyForm()
    const knownType = ROOM_TYPES.includes(room.roomType)
    return {
      roomType: knownType ? room.roomType : 'custom',
      customRoomType: knownType ? '' : room.roomType,
      pricePerNight: String(room.pricePerNight),
      maxGuests: String(room.maxGuests),
      totalRooms: String(room.totalRooms),
      amenities: parseJsonArray(room.amenities ?? '[]'),
      images: parseJsonArray(room.images ?? '[]'),
      isActive: room.isActive,
    }
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveRoomType = form.roomType === 'custom' ? form.customRoomType : form.roomType

  const handleSave = async () => {
    if (!effectiveRoomType.trim() || !form.pricePerNight || !form.maxGuests || !form.totalRooms) {
      setError('Room type, price, max guests, and total rooms are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave({
        roomType: effectiveRoomType.trim(),
        pricePerNight: parseFloat(form.pricePerNight),
        maxGuests: parseInt(form.maxGuests),
        totalRooms: parseInt(form.totalRooms),
        amenities: form.amenities.length ? JSON.stringify(form.amenities) : undefined,
        images: form.images.length ? JSON.stringify(form.images) : undefined,
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
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{room ? 'Edit Room' : 'Add New Room'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Room Type */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Room Type *</label>
            <select
              value={form.roomType}
              onChange={e => setForm(f => ({ ...f, roomType: e.target.value, customRoomType: '' }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 bg-white"
            >
              <option value="">Select room type…</option>
              {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              <option value="custom">Other (custom type)</option>
            </select>
            {form.roomType === 'custom' && (
              <input
                autoFocus
                value={form.customRoomType}
                onChange={e => setForm(f => ({ ...f, customRoomType: e.target.value }))}
                placeholder="Enter custom room type"
                className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
              />
            )}
          </div>

          {/* Price / Guests / Total */}
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

          {/* Amenities */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amenities</label>
            <AmenitiesSelect
              selected={form.amenities}
              onChange={v => setForm(f => ({ ...f, amenities: v }))}
            />
          </div>

          {/* Images */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Room Images</label>
            <ImageManager
              images={form.images}
              onChange={v => setForm(f => ({ ...f, images: v }))}
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

        <div className="flex gap-3 justify-end px-6 py-5 border-t border-gray-100 shrink-0">
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

// ── Page ──────────────────────────────────────────────────────────────────────

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
      await hotelManagerService.updateRoom((modal as HotelRoomManagerDto).id, data as UpdateRoomRequest)
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
                {room.amenities && ` · ${parseJsonArray(room.amenities).slice(0, 3).join(', ')}`}
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
