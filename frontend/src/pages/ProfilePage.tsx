import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CreditCard, Mail, Phone, Plus, Trash2, User, Users, Wallet } from 'lucide-react'
import type { SavedTravellerDto, UserProfileDto, WalletDto } from '@/types'
import { userService } from '@/services/userService'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/ToastProvider'
import { WalletTopUp } from '@/components/profile/WalletTopUp'
import { SavedCards } from '@/components/profile/SavedCards'
import { formatCurrency } from '@/utils/formatters'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number'),
})

type ProfileValues = z.infer<typeof profileSchema>

const travellerSchema = z.object({
  name: z.string().min(2, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone'),
  passportNumber: z.string().optional(),
})

type TravellerValues = z.infer<typeof travellerSchema>

export default function ProfilePage() {
  const toast = useToast()
  const [profile, setProfile] = useState<UserProfileDto | null>(null)
  const [wallet, setWallet] = useState<WalletDto | null>(null)
  const [travellers, setTravellers] = useState<SavedTravellerDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [addingTraveller, setAddingTraveller] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [travellerToDelete, setTravellerToDelete] = useState<SavedTravellerDto | null>(null)
  const [deletingTravellerId, setDeletingTravellerId] = useState<string | null>(null)

  const profileForm = useForm<ProfileValues>({ resolver: zodResolver(profileSchema) })
  const travellerForm = useForm<TravellerValues>({ resolver: zodResolver(travellerSchema) })

  useEffect(() => {
    Promise.all([userService.getProfile(), userService.getWallet(), userService.getTravellers()])
      .then(([profileRes, walletRes, travellersRes]) => {
        setProfile(profileRes.data)
        setWallet(walletRes.data)
        setTravellers(travellersRes.data ?? [])
        profileForm.reset({ name: profileRes.data.name, phone: profileRes.data.phone })
      })
      .catch(() => {
        toast.error('Unable to load your profile', 'Please refresh the page and try again.')
      })
      .finally(() => setLoading(false))
  }, [profileForm, toast])

  const onSaveProfile = async (values: ProfileValues) => {
    setSaving(true)
    try {
      const response = await userService.updateProfile(values)
      setProfile(response.data)
      toast.success('Profile updated', 'Your personal details were saved successfully.')
    } catch {
      toast.error('Profile update failed', 'We could not save your profile right now.')
    } finally {
      setSaving(false)
    }
  }

  const onAddTraveller = async (values: TravellerValues) => {
    setAddingTraveller(true)
    try {
      const response = await userService.addTraveller(values)
      setTravellers(prev => [...prev, response.data])
      setShowAddForm(false)
      travellerForm.reset()
      toast.success('Traveller saved', `${response.data.name} is ready for future bookings.`)
    } catch {
      toast.error('Unable to save traveller', 'Please review the details and try again.')
    } finally {
      setAddingTraveller(false)
    }
  }

  const onDeleteTraveller = async (traveller: SavedTravellerDto) => {
    setDeletingTravellerId(traveller.id)
    try {
      await userService.deleteTraveller(traveller.id)
      setTravellers(prev => prev.filter(item => item.id !== traveller.id))
      setTravellerToDelete(null)
      toast.success('Traveller removed', 'The saved traveller has been deleted.')
    } catch {
      toast.error('Unable to remove traveller', 'Please try again in a moment.')
    } finally {
      setDeletingTravellerId(null)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-10">
        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>

      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-100">Account Overview</p>
            <h2 className="mt-2 text-3xl font-bold">{profile?.name ?? 'Traveller'}</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm text-blue-50">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {profile?.email ?? 'No email available'}</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> {profile?.phone ?? 'No phone available'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-blue-100">Wallet</p>
              <p className="mt-2 text-xl font-bold">{formatCurrency(wallet?.balance ?? 0)}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-blue-100">Saved Travellers</p>
              <p className="mt-2 text-xl font-bold">{travellers.length}</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-wide text-blue-100">Payments Ready</p>
              <p className="mt-2 text-xl font-bold">Cards & Wallet</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-800">
          <User className="h-5 w-5 text-primary-600" /> Personal Details
        </h2>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="flex flex-col gap-4">
          <Input label="Full Name" error={profileForm.formState.errors.name?.message} {...profileForm.register('name')} />
          <Input label="Email" value={profile?.email ?? ''} disabled />
          <Input label="Phone" error={profileForm.formState.errors.phone?.message} {...profileForm.register('phone')} />
          <Button type="submit" loading={saving} className="self-start">Save Changes</Button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
          <Wallet className="h-5 w-5 text-primary-600" /> Wallet Balance
        </h2>
        <p className="text-3xl font-bold text-primary-700">{formatCurrency(wallet?.balance ?? 0)}</p>
        <p className="mb-4 mt-1 text-sm text-gray-400">Refunds from cancelled bookings are credited here.</p>
        {wallet?.recentTransactions && wallet.recentTransactions.length > 0 && (
          <div className="mb-4 mt-3 space-y-1.5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Recent Transactions</p>
            {wallet.recentTransactions.slice(0, 5).map((transaction, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-50 py-1 text-sm">
                <span className="max-w-[200px] truncate text-gray-600">{transaction.description ?? transaction.type}</span>
                <span className={`ml-2 font-semibold ${transaction.type === 'Credit' ? 'text-green-600' : 'text-red-500'}`}>
                  {transaction.type === 'Credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
        <WalletTopUp onTopUp={newBalance => setWallet(prev => prev ? { ...prev, balance: newBalance } : prev)} />
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-gray-800">
            <Users className="h-5 w-5 text-primary-600" /> Saved Travellers
          </h2>
          <Button size="sm" variant="outline" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {showAddForm && (
          <form onSubmit={travellerForm.handleSubmit(onAddTraveller)} className="mb-5 flex flex-col gap-3 rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">Add New Traveller</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Name" error={travellerForm.formState.errors.name?.message} {...travellerForm.register('name')} />
              <Input label="Email" type="email" error={travellerForm.formState.errors.email?.message} {...travellerForm.register('email')} />
              <Input label="Phone" error={travellerForm.formState.errors.phone?.message} {...travellerForm.register('phone')} />
              <Input label="Passport No. (optional)" {...travellerForm.register('passportNumber')} />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={addingTraveller}>Save Traveller</Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAddForm(false)
                  travellerForm.reset()
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {travellers.length === 0 ? (
          <p className="text-sm text-gray-400">No saved travellers yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {travellers.map(traveller => (
              <div key={traveller.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div>
                  <p className="font-medium text-gray-800">{traveller.name}</p>
                  <p className="text-xs text-gray-400">{traveller.email} | {traveller.phone}</p>
                  {traveller.passportNumber && <p className="text-xs text-gray-400">Passport: {traveller.passportNumber}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setTravellerToDelete(traveller)}
                  className="p-1 text-gray-400 transition-colors hover:text-red-500"
                  aria-label={`Delete traveller ${traveller.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-gray-800">
          <CreditCard className="h-5 w-5 text-primary-600" />
          <h2 className="font-semibold">Saved Cards</h2>
        </div>
        <SavedCards />
      </section>

      <ConfirmDialog
        open={Boolean(travellerToDelete)}
        title="Delete saved traveller?"
        message={travellerToDelete ? `Remove ${travellerToDelete.name} from your saved traveller list?` : ''}
        confirmLabel="Delete Traveller"
        loading={deletingTravellerId !== null}
        onConfirm={() => travellerToDelete && onDeleteTraveller(travellerToDelete)}
        onCancel={() => {
          if (deletingTravellerId) return
          setTravellerToDelete(null)
        }}
      />
    </div>
  )
}
