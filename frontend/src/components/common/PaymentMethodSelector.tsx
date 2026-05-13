import { useEffect, useState } from 'react'
import { userService } from '@/services/userService'
import type { SavedCardDto } from '@/types'

export type PaymentChoice =
  | { type: 'wallet' }
  | { type: 'saved_card'; cardId: string }
  | { type: 'new_card' }

interface Props {
  walletBalance: number
  requiredAmount: number
  onSelect: (choice: PaymentChoice) => void
  selected: PaymentChoice
}

const CARD_ICONS: Record<string, string> = {
  Visa: '💳',
  Mastercard: '💳',
  Amex: '💳',
  RuPay: '💳',
}

function cardBrandColor(type: string) {
  if (type === 'Visa') return 'text-blue-700'
  if (type === 'Mastercard') return 'text-red-600'
  if (type === 'Amex') return 'text-green-700'
  return 'text-indigo-600'
}

export function PaymentMethodSelector({ walletBalance, requiredAmount, onSelect, selected }: Props) {
  const [cards, setCards] = useState<SavedCardDto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    userService.getSavedCards()
      .then(r => setCards(r.data ?? []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }, [])

  const walletSufficient = walletBalance >= requiredAmount
  const isSelected = (choice: PaymentChoice) => {
    if (choice.type !== selected.type) return false
    if (choice.type === 'saved_card' && selected.type === 'saved_card')
      return choice.cardId === selected.cardId
    return true
  }

  const tile = (active: boolean) =>
    `flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
      active
        ? 'border-blue-600 bg-blue-50'
        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/40'
    }`

  const radio = (active: boolean) =>
    `w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${
      active ? 'border-blue-600 bg-blue-600' : 'border-gray-300 bg-white'
    }`

  return (
    <div className="space-y-3">
      {/* Wallet */}
      <div
        className={tile(isSelected({ type: 'wallet' }))}
        onClick={() => walletSufficient && onSelect({ type: 'wallet' })}
        style={{ opacity: walletSufficient ? 1 : 0.5, cursor: walletSufficient ? 'pointer' : 'not-allowed' }}
      >
        <div className={radio(isSelected({ type: 'wallet' }))}>
          {isSelected({ type: 'wallet' }) && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">👛</span>
            <span className="font-semibold text-gray-800">TravelPort Wallet</span>
            {!walletSufficient && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                Insufficient balance
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">Available:</span>
            <span className={`text-sm font-bold ${walletSufficient ? 'text-green-600' : 'text-red-500'}`}>
              ₹{walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {!walletSufficient && (
            <p className="text-xs text-amber-600 mt-1">
              Need ₹{(requiredAmount - walletBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })} more. Top up from your profile.
            </p>
          )}
        </div>
      </div>

      {/* Saved Cards */}
      {!loading && cards.map(card => {
        const choice: PaymentChoice = { type: 'saved_card', cardId: card.cardId }
        return (
          <div
            key={card.cardId}
            className={tile(isSelected(choice))}
            onClick={() => onSelect(choice)}
          >
            <div className={radio(isSelected(choice))}>
              {isSelected(choice) && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">{CARD_ICONS[card.cardType] ?? '💳'}</span>
                <span className={`font-semibold text-sm ${cardBrandColor(card.cardType)}`}>
                  {card.cardType}
                </span>
                <span className="font-semibold text-gray-800">•••• {card.lastFourDigits}</span>
                {card.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    Default
                  </span>
                )}
                {card.nickName && (
                  <span className="text-xs text-gray-400">({card.nickName})</span>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 ml-7">
                {card.cardHolderName} · Expires {card.expiryMonth.toString().padStart(2, '0')}/{card.expiryYear}
              </div>
            </div>
          </div>
        )
      })}

      {/* New Card */}
      <div
        className={tile(isSelected({ type: 'new_card' }))}
        onClick={() => onSelect({ type: 'new_card' })}
      >
        <div className={radio(isSelected({ type: 'new_card' }))}>
          {isSelected({ type: 'new_card' }) && <div className="w-2 h-2 bg-white rounded-full m-auto mt-0.5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">➕</span>
            <span className="font-semibold text-gray-800">Pay with New Card / UPI / Net Banking</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 ml-7">
            Razorpay secure checkout — Visa, Mastercard, RuPay, UPI, Net Banking
          </p>
        </div>
      </div>
    </div>
  )
}
