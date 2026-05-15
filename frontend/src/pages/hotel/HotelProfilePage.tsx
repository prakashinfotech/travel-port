import { useEffect, useState } from 'react'
import { Building2, Star, MapPin, Save } from 'lucide-react'
import { hotelManagerService } from '@/services/hotelManagerService'
import type { HotelProfileDto, UpdateHotelDetailsRequest } from '@/types'

export default function HotelProfilePage() {
  const [profile, setProfile] = useState<HotelProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<UpdateHotelDetailsRequest>({})

  useEffect(() => {
    hotelManagerService.getProfile()
      .then(p => {
        setProfile(p)
        setForm({
          name: p.name,
          city: p.city,
          address: p.address ?? '',
          starRating: p.starRating,
          description: p.description ?? '',
          amenities: p.amenities ?? '',
          imageUrl: p.imageUrl ?? '',
          images: p.images ?? '',
        })
      })
      .catch(() => setError('Failed to load hotel profile.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSuccess(false)
    setError(null)
    try {
      const updated = await hotelManagerService.updateProfile(form)
      setProfile(updated)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">{error}</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Hotel</h1>
          <p className="text-sm text-gray-500 mt-1">Update your hotel information visible to guests</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-gray-700">{profile.reviewScore.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({profile.reviewCount} reviews)</span>
          </div>
        </div>
      </div>

      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-700 text-sm mb-6">
          Hotel details saved successfully.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm mb-6">{error}</div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        {/* Hotel image preview */}
        {(form.imageUrl || form.images) && (() => {
          let src = form.imageUrl
          if (!src && form.images) {
            try { src = JSON.parse(form.images)[0] } catch { /* no-op */ }
          }
          if (src) return (
            <img
              src={src}
              alt={form.name}
              className="w-full h-48 object-cover rounded-lg bg-gray-100"
            />
          )
          return null
        })()}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Hotel Name</label>
            <input
              value={form.name ?? ''}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
            <input
              value={form.city ?? ''}
              onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <MapPin className="inline h-3 w-3 mr-1" />
            Address
          </label>
          <input
            value={form.address ?? ''}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            <Star className="inline h-3 w-3 mr-1" />
            Star Rating
          </label>
          <select
            value={form.starRating ?? ''}
            onChange={e => setForm(f => ({ ...f, starRating: parseFloat(e.target.value) }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
          >
            {[1, 2, 3, 4, 5].map(s => (
              <option key={s} value={s}>{s} Star{s > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows={4}
            value={form.description ?? ''}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe your hotel to attract guests..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Hotel Amenities <span className="text-gray-400">(JSON array)</span>
          </label>
          <input
            value={form.amenities ?? ''}
            onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))}
            placeholder='["WiFi","Pool","Spa","Restaurant","Gym","Parking"]'
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Main Image URL</label>
          <input
            value={form.imageUrl ?? ''}
            onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://example.com/hotel.jpg"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Gallery Image URLs <span className="text-gray-400">(JSON array)</span>
          </label>
          <input
            value={form.images ?? ''}
            onChange={e => setForm(f => ({ ...f, images: e.target.value }))}
            placeholder='["https://example.com/lobby.jpg","https://example.com/pool.jpg"]'
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
          />
        </div>

        <div className="pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Read-only stats */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Hotel Stats
        </h2>
        <div className="grid grid-cols-3 gap-4 text-sm text-center">
          <div>
            <p className="text-xl font-bold text-gray-900">{profile.rooms.length}</p>
            <p className="text-gray-500 text-xs">Total Rooms</p>
          </div>
          <div>
            <p className="text-xl font-bold text-amber-600">{profile.reviewScore.toFixed(1)}</p>
            <p className="text-gray-500 text-xs">Review Score</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{profile.reviewCount}</p>
            <p className="text-gray-500 text-xs">Total Reviews</p>
          </div>
        </div>
      </div>
    </div>
  )
}
