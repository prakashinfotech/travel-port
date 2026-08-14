import { useEffect, useState } from 'react'
import { CreditCard, Star, Trash2 } from 'lucide-react'
import { userService } from '@/services/userService'
import type { SavedCardDto } from '@/types'
import { AddCardModal } from '@/components/common/AddCardModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/components/ui/ToastProvider'

function cardBrandBg(type: string) {
  if (type === 'Visa') return 'from-blue-700 to-blue-500'
  if (type === 'Mastercard') return 'from-red-600 to-orange-500'
  if (type === 'Amex') return 'from-green-700 to-teal-500'
  return 'from-indigo-700 to-purple-500'
}

export function SavedCards() {
  const toast = useToast()
  const [cards, setCards] = useState<SavedCardDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [cardToDelete, setCardToDelete] = useState<SavedCardDto | null>(null)

  const fetchCards = () => {
    setLoading(true)
    userService.getSavedCards()
      .then(r => setCards(r.data ?? []))
      .catch(() => {
        toast.error('Cards unavailable', 'Saved cards could not be loaded right now.')
        setCards([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCards() }, [])

  const handleDelete = async () => {
    if (!cardToDelete) return

    setDeletingId(cardToDelete.cardId)
    try {
      await userService.deleteSavedCard(cardToDelete.cardId)
      setCards(prev => prev.filter(c => c.cardId !== cardToDelete.cardId))
      toast.success('Card removed', `Saved card ending in ${cardToDelete.lastFourDigits} was removed.`)
      setCardToDelete(null)
    } catch {
      toast.error('Card not removed', 'We could not remove this saved card. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (cardId: string) => {
    setSettingDefaultId(cardId)
    try {
      await userService.setDefaultCard(cardId)
      setCards(prev => prev.map(c => ({ ...c, isDefault: c.cardId === cardId })))
      const card = cards.find(item => item.cardId === cardId)
      toast.success(
        'Default card updated',
        card ? `Card ending in ${card.lastFourDigits} is now your default.` : 'Your default payment card was updated.',
      )
    } catch {
      toast.error('Default card not updated', 'We could not change the default card. Please try again.')
    } finally {
      setSettingDefaultId(null)
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">Saved Cards</h2>
        </div>
        <button
          onClick={() => setShowAddCard(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          + Add New Card
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-12 text-center">
          <CreditCard className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">No saved cards yet</p>
          <p className="mt-1 text-sm text-gray-400">Add a card to speed up future bookings</p>
          <button
            onClick={() => setShowAddCard(true)}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Add Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {cards.map(card => (
            <div key={card.cardId} className="group relative">
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-md ${cardBrandBg(card.cardType)}`}>
                <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-4 h-32 w-32 rounded-full bg-white/10" />

                {card.isDefault && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-white" /> Default
                  </div>
                )}

                <div className="relative">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/70">{card.cardType}</p>
                  <p className="mb-4 font-mono text-lg tracking-widest">•••• •••• •••• {card.lastFourDigits}</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/60">Card Holder</p>
                      <p className="max-w-[120px] truncate text-sm font-semibold">{card.cardHolderName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-white/60">Expires</p>
                      <p className="text-sm font-semibold">
                        {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
                      </p>
                    </div>
                  </div>
                  {card.nickName && <p className="mt-2 text-xs italic text-white/60">"{card.nickName}"</p>}
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 px-1">
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.cardId)}
                    disabled={settingDefaultId === card.cardId}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 disabled:opacity-50 hover:text-blue-700"
                  >
                    <Star className="h-3.5 w-3.5" />
                    {settingDefaultId === card.cardId ? 'Setting…' : 'Set as Default'}
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => setCardToDelete(card)}
                  disabled={deletingId === card.cardId}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 disabled:opacity-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deletingId === card.cardId ? 'Removing…' : 'Remove'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddCard && (
        <AddCardModal
          onClose={() => setShowAddCard(false)}
          onSaved={card => {
            setShowAddCard(false)
            setCards(prev => {
              const updated = card.isDefault ? prev.map(c => ({ ...c, isDefault: false })) : prev
              return [...updated, card]
            })
          }}
        />
      )}

      <ConfirmDialog
        open={cardToDelete !== null}
        title="Remove saved card?"
        message={cardToDelete
          ? `Card ending in ${cardToDelete.lastFourDigits} will be removed from your saved payment methods.`
          : ''}
        confirmLabel="Remove Card"
        cancelLabel="Keep Card"
        loading={deletingId !== null}
        onConfirm={handleDelete}
        onCancel={() => setCardToDelete(null)}
      />
    </div>
  )
}
