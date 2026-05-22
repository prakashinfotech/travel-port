import { useEffect, useRef, useState } from 'react'
import { Building2, Star, MapPin, Save, Upload, X, Plus, Lock } from 'lucide-react'
import { hotelManagerService } from '@/services/hotelManagerService'
import type { HotelProfileDto, UpdateHotelDetailsRequest } from '@/types'

// ── Amenities catalogue ───────────────────────────────────────────────────────
const AMENITY_OPTIONS = [
  'WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Bar', 'Parking',
  'AC', 'Room Service', 'Laundry', 'Pet Friendly', 'Airport Shuttle',
  'Beach Access', 'Business Center', 'Conference Room', 'EV Charging',
  'Rooftop', 'Kids Play Area', 'Disco', 'Casino',
]

// ── helpers ───────────────────────────────────────────────────────────────────
function parseJsonArray(raw: string | undefined | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}

function toJsonArray(arr: string[]): string {
  return arr.length ? JSON.stringify(arr) : ''
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── Image input (URL + local upload) ─────────────────────────────────────────
interface ImageInputProps {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}
function ImageInput({ label, value, onChange, placeholder }: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    onChange(dataUrl)
    e.target.value = ''
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? 'https://example.com/image.jpg'}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap"
          title="Upload from device"
        >
          <Upload className="h-3.5 w-3.5" />
          Upload
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value && (
        <img
          src={value}
          alt="preview"
          className="mt-2 h-32 w-full object-cover rounded-lg bg-gray-100"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          onLoad={e => { (e.currentTarget as HTMLImageElement).style.display = 'block' }}
        />
      )}
    </div>
  )
}

// ── Gallery input (multiple uploads + comma-separated URLs) ───────────────────
interface GalleryInputProps {
  urls: string[]
  onChange: (urls: string[]) => void
}
function GalleryInput({ urls, onChange }: GalleryInputProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [urlInput, setUrlInput] = useState('')

  const addUrl = () => {
    const val = urlInput.trim()
    if (!val) return
    // support comma-separated pasting
    const parts = val.split(',').map(s => s.trim()).filter(Boolean)
    onChange([...urls, ...parts.filter(u => !urls.includes(u))])
    setUrlInput('')
  }

  const removeUrl = (idx: number) => onChange(urls.filter((_, i) => i !== idx))

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const dataUrls = await Promise.all(files.map(fileToDataUrl))
    onChange([...urls, ...dataUrls])
    e.target.value = ''
  }

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">Gallery Images</label>

      {/* Add by URL */}
      <div className="flex gap-2 mb-2">
        <input
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
          placeholder="Paste URL or comma-separated URLs, then press Enter"
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200"
        />
        <button
          type="button"
          onClick={addUrl}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          <Plus className="h-3.5 w-3.5" /> Add URL
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 whitespace-nowrap"
        >
          <Upload className="h-3.5 w-3.5" /> Upload
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />

      {/* Preview grid */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-2">
          {urls.map((url, i) => (
            <div key={i} className="relative group rounded-lg overflow-hidden bg-gray-100 h-24">
              <img
                src={url}
                alt={`gallery-${i}`}
                className="h-full w-full object-cover"
                onError={e => { (e.currentTarget.parentElement!).style.opacity = '0.4' }}
              />
              <button
                type="button"
                onClick={() => removeUrl(i)}
                className="absolute top-1 right-1 bg-white/90 hover:bg-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3 text-gray-700" />
              </button>
              <span className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-1 rounded">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
      {urls.length === 0 && (
        <p className="text-xs text-gray-400 mt-1">No gallery images yet. Add URLs or upload files above.</p>
      )}
    </div>
  )
}

// ── Amenities multi-select ────────────────────────────────────────────────────
interface AmenitiesSelectProps {
  selected: string[]
  onChange: (selected: string[]) => void
}
function AmenitiesSelect({ selected, onChange }: AmenitiesSelectProps) {
  const toggle = (a: string) =>
    onChange(selected.includes(a) ? selected.filter(s => s !== a) : [...selected, a])

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-2">Hotel Amenities</label>
      <div className="flex flex-wrap gap-2">
        {AMENITY_OPTIONS.map(a => {
          const active = selected.includes(a)
          return (
            <button
              key={a}
              type="button"
              onClick={() => toggle(a)}
              className={[
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all select-none',
                active
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-sky-400 hover:text-sky-600',
              ].join(' ')}
            >
              {active && <span className="mr-1">✓</span>}
              {a}
            </button>
          )
        })}
      </div>
      {selected.length > 0 && (
        <p className="mt-2 text-xs text-gray-400">
          {selected.length} selected: {selected.join(', ')}
        </p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HotelProfilePage() {
  const [profile, setProfile] = useState<HotelProfileDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState<UpdateHotelDetailsRequest>({})
  const [amenities, setAmenities] = useState<string[]>([])
  const [galleryUrls, setGalleryUrls] = useState<string[]>([])

  useEffect(() => {
    hotelManagerService.getProfile()
      .then(p => {
        setProfile(p)
        const parsedAmenities = parseJsonArray(p.amenities)
        const parsedGallery   = parseJsonArray(p.images)
        setAmenities(parsedAmenities)
        setGalleryUrls(parsedGallery)
        setForm({
          name:        p.name,
          city:        p.city,
          address:     p.address ?? '',
          starRating:  p.starRating,
          description: p.description ?? '',
          amenities:   p.amenities ?? '',
          imageUrl:    p.imageUrl ?? '',
          images:      p.images ?? '',
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
      const payload: UpdateHotelDetailsRequest = {
        ...form,
        amenities: toJsonArray(amenities),
        images:    toJsonArray(galleryUrls),
      }
      const updated = await hotelManagerService.updateProfile(payload)
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
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-semibold text-gray-700">{profile.reviewScore.toFixed(1)}</span>
          <span className="text-xs text-gray-400">({profile.reviewCount} reviews)</span>
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

        {/* Name + City (city disabled) */}
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
            <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
              City
              <Lock className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400 font-normal">(contact admin to change)</span>
            </label>
            <input
              value={form.city ?? ''}
              disabled
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Address */}
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

        {/* Star Rating */}
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

        {/* Description */}
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

        {/* Amenities multi-select */}
        <AmenitiesSelect selected={amenities} onChange={setAmenities} />

        {/* Main image */}
        <ImageInput
          label="Main Image"
          value={form.imageUrl ?? ''}
          onChange={v => setForm(f => ({ ...f, imageUrl: v }))}
          placeholder="https://example.com/hotel-main.jpg"
        />

        {/* Gallery images */}
        <GalleryInput urls={galleryUrls} onChange={setGalleryUrls} />

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
