import { useEffect, useState } from 'react'
import { CreditCard, Star, Trash2 } from 'lucide-react'
import { userService } from '@/services/userService'
import type { SavedCardDto } from '@/types'
import { AddCardModal } from '@/components/common/AddCardModal'

function cardBrandBg(type: string) {
  if (type === 'Visa') return 'from-blue-700 to-blue-500'
  if (type === 'Mastercard') return 'from-red-600 to-orange-500'
  if (type === 'Amex') return 'from-green-700 to-teal-500'
  return 'from-indigo-700 to-purple-500'
}

export function SavedCards() {
  const [cards, setCards] = useState<SavedCardDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCard, setShowAddCard] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)

  const fetchCards = () => {
    setLoading(true)
    userService.getSavedCards()
      .then(r => setCards(r.data ?? []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCards() }, [])

  const handleDelete = async (cardId: string) => {
    if (!confirm('Remove this saved card?')) return
    setDeletingId(cardId)
    try {
      await userService.deleteSavedCard(cardId)
      setCards(prev => prev.filter(c => c.cardId !== cardId))
    } catch {
      alert('Failed to remove card.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (cardId: string) => {
    setSettingDefaultId(cardId)
    try {
      const res = await userService.setDefaultCard(cardId)
      setCards(prev => prev.map(c => ({ ...c, isDefault: c.cardId === cardId })))
      void res
    } catch {
      alert('Failed to update default card.')
    } finally {
      setSettingDefaultId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">Saved Cards</h2>
        </div>
        <button
          onClick={() => setShowAddCard(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          + Add New Card
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No saved cards yet</p>
          <p className="text-sm text-gray-400 mt-1">Add a card to speed up future bookings</p>
          <button
            onClick={() => setShowAddCard(true)}
            className="mt-4 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Add Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map(card => (
            <div key={card.cardId} className="relative group">
              {/* Card visual */}
              <div className={`relative rounded-2xl p-5 text-white bg-gradient-to-br ${cardBrandBg(card.cardType)} overflow-hidden shadow-md`}>
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
                <div className="absolute -bottom-8 -left-4 w-32 h-32 rounded-full bg-white/10" />

                {card.isDefault && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/20 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-sm">
                    <Star className="h-3 w-3 fill-white" /> Default
                  </div>
                )}

                <div className="relative">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-4">{card.cardType}</p>
                  <p className="font-mono text-lg tracking-widest mb-4">
                    •••• •••• •••• {card.lastFourDigits}
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/60 text-[10px] uppercase tracking-wide">Card Holder</p>
                      <p className="text-sm font-semibold truncate max-w-[120px]">{card.cardHolderName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/60 text-[10px] uppercase tracking-wide">Expires</p>
                      <p className="text-sm font-semibold">
                        {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear.toString().slice(-2)}
                      </p>
                    </div>
                  </div>
                  {card.nickName && (
                    <p className="text-white/60 text-xs mt-2 italic">"{card.nickName}"</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2.5 px-1">
                {!card.isDefault && (
                  <button
                    onClick={() => handleSetDefault(card.cardId)}
                    disabled={settingDefaultId === card.cardId}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    <Star className="h-3.5 w-3.5" />
                    {settingDefaultId === card.cardId ? 'Setting…' : 'Set as Default'}
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => handleDelete(card.cardId)}
                  disabled={deletingId === card.cardId}
                  className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
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
              const updated = card.isDefault
                ? prev.map(c => ({ ...c, isDefault: false }))
                : prev
              return [...updated, card]
            })
          }}
        />
      )}
    </div>
  )
}
