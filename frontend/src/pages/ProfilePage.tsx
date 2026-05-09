import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Wallet, Users, Trash2, Plus } from 'lucide-react'
import type { UserProfileDto, WalletDto, SavedTravellerDto } from '@/types'
import { userService } from '@/services/userService'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency } from '@/utils/formatters'

const profileSchema = z.object({
  name:  z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number'),
})
type ProfileValues = z.infer<typeof profileSchema>

const travellerSchema = z.object({
  name:           z.string().min(2, 'Required'),
  email:          z.string().email('Enter a valid email'),
  phone:          z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone'),
  passportNumber: z.string().optional(),
})
type TravellerValues = z.infer<typeof travellerSchema>

export default function ProfilePage() {
  const [profile,    setProfile]    = useState<UserProfileDto | null>(null)
  const [wallet,     setWallet]     = useState<WalletDto | null>(null)
  const [travellers, setTravellers] = useState<SavedTravellerDto[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [saveMsg,    setSaveMsg]    = useState('')
  const [addingTraveller, setAddingTraveller] = useState(false)
  const [showAddForm,     setShowAddForm]     = useState(false)

  const profileForm = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) })
  const travellerForm = useForm<TravellerValues>({ resolver: zodResolver(travellerSchema) })

  useEffect(() => {
    Promise.all([userService.getProfile(), userService.getWallet(), userService.getTravellers()])
      .then(([p, w, t]) => {
        setProfile(p.data)
        setWallet(w.data)
        setTravellers(t.data ?? [])
        profileForm.reset({ name: p.data.name, phone: p.data.phone })
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onSaveProfile = async (values: ProfileValues) => {
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await userService.updateProfile(values)
      setProfile(res.data)
      setSaveMsg('Profile updated successfully.')
    } catch {
      setSaveMsg('Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const onAddTraveller = async (values: TravellerValues) => {
    setAddingTraveller(true)
    try {
      const res = await userService.addTraveller(values)
      setTravellers(prev => [...prev, res.data])
      setShowAddForm(false)
      travellerForm.reset()
    } catch {
      alert('Failed to add traveller.')
    } finally {
      setAddingTraveller(false)
    }
  }

  const onDeleteTraveller = async (id: string) => {
    if (!confirm('Remove this saved traveller?')) return
    await userService.deleteTraveller(id)
    setTravellers(prev => prev.filter(t => t.id !== id))
  }

  if (loading) return (
    <div className="mx-auto max-w-2xl px-4 py-10 flex flex-col gap-4">
      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
    </div>
  )

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      {/* Profile card */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-4">
          <User className="h-5 w-5 text-primary-600" /> Personal Details
        </h2>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-4">
          <Input label="Full Name" error={profileForm.formState.errors.name?.message} {...profileForm.register('name')} />
          <Input label="Email" value={profile?.email ?? ''} disabled />
          <Input label="Phone" error={profileForm.formState.errors.phone?.message} {...profileForm.register('phone')} />
          {saveMsg && <p className={`text-sm ${saveMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{saveMsg}</p>}
          <Button type="submit" loading={saving} className="self-start">Save Changes</Button>
        </form>
      </section>

      {/* Wallet */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
          <Wallet className="h-5 w-5 text-primary-600" /> Wallet Balance
        </h2>
        <p className="text-3xl font-bold text-primary-700">{formatCurrency(wallet?.balance ?? 0)}</p>
        <p className="text-sm text-gray-400 mt-1">Refunds from cancelled bookings are credited here.</p>
      </section>

      {/* Saved Travellers */}
      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <Users className="h-5 w-5 text-primary-600" /> Saved Travellers
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {showAddForm && (
          <form onSubmit={travellerForm.handleSubmit(onAddTraveller)} className="mb-5 p-4 bg-gray-50 rounded-xl flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-700">Add New Traveller</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name"  error={travellerForm.formState.errors.name?.message}  {...travellerForm.register('name')} />
              <Input label="Email" type="email" error={travellerForm.formState.errors.email?.message} {...travellerForm.register('email')} />
              <Input label="Phone" error={travellerForm.formState.errors.phone?.message} {...travellerForm.register('phone')} />
              <Input label="Passport No. (optional)" {...travellerForm.register('passportNumber')} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={addingTraveller}>Save Traveller</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {travellers.length === 0 ? (
          <p className="text-sm text-gray-400">No saved travellers yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {travellers.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-medium text-gray-800">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.email} · {t.phone}</p>
                  {t.passportNumber && <p className="text-xs text-gray-400">Passport: {t.passportNumber}</p>}
                </div>
                <button
                  onClick={() => onDeleteTraveller(t.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
