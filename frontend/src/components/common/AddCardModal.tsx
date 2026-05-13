import { useState } from 'react'
import { userService } from '@/services/userService'
import type { SavedCardDto } from '@/types'
import { useToast } from '@/components/ui/ToastProvider'

interface Props {
  onClose: () => void
  onSaved: (card: SavedCardDto) => void
}

const CARD_TYPES = ['Visa', 'Mastercard', 'Amex', 'RuPay']

function detectCardType(num: string): string {
  const n = num.replace(/\s/g, '')
  if (n.startsWith('4')) return 'Visa'
  if (n.startsWith('5') || n.startsWith('2')) return 'Mastercard'
  if (n.startsWith('3')) return 'Amex'
  return 'RuPay'
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

export function AddCardModal({ onClose, onSaved }: Props) {
  const toast = useToast()
  const [form, setForm] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiry: '',
    cvv: '',
    nickName: '',
    setAsDefault: false,
  })
  const [cardType, setCardType] = useState('Visa')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCardNumberChange = (val: string) => {
    const formatted = formatCardNumber(val)
    setForm(f => ({ ...f, cardNumber: formatted }))
    setCardType(detectCardType(formatted))
  }

  const handleExpiryChange = (val: string) => {
    setForm(f => ({ ...f, expiry: formatExpiry(val) }))
  }

  const validate = () => {
    const digits = form.cardNumber.replace(/\s/g, '')
    if (digits.length < 15) return 'Enter a valid card number'
    if (!form.cardHolderName.trim()) return 'Card holder name is required'
    const parts = form.expiry.split('/')
    if (parts.length !== 2 || parts[0].length !== 2 || parts[1].length !== 2)
      return 'Enter expiry as MM/YY'
    const month = parseInt(parts[0])
    const year = parseInt('20' + parts[1])
    const now = new Date()
    if (month < 1 || month > 12) return 'Invalid expiry month'
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1))
      return 'Card has expired'
    if (form.cvv.length < 3) return 'Enter a valid CVV'
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }

    const parts = form.expiry.split('/')
    setSaving(true)
    setError('')
    try {
      const res = await userService.addSavedCard({
        cardNumber: form.cardNumber,
        cardHolderName: form.cardHolderName.trim(),
        expiryMonth: parseInt(parts[0]),
        expiryYear: parseInt('20' + parts[1]),
        cardType,
        nickName: form.nickName.trim() || undefined,
        setAsDefault: form.setAsDefault,
      })
      toast.success('Card saved', 'Your payment card is now available for future bookings.')
      onSaved(res.data)
    } catch {
      toast.error('Card not saved', 'We could not save this card. Please verify the details and try again.')
      setError('Failed to save card. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Add New Card</h2>
            <p className="text-xs text-gray-500 mt-0.5">Only last 4 digits are stored securely</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Card visual */}
          <div className="rounded-xl p-4 text-white text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #1a56db, #e91e8c)' }}>
            <div className="flex justify-between items-start mb-6">
              <span className="text-white/70 text-xs uppercase tracking-widest">TravelPort Card</span>
              <span className="text-lg font-bold">{cardType}</span>
            </div>
            <div className="text-xl tracking-widest mb-4 font-mono">
              {form.cardNumber || '•••• •••• •••• ••••'}
            </div>
            <div className="flex justify-between text-xs text-white/80">
              <span>{form.cardHolderName.toUpperCase() || 'CARD HOLDER NAME'}</span>
              <span>{form.expiry || 'MM/YY'}</span>
            </div>
          </div>

          {/* Card Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Card Number
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="1234 5678 9012 3456"
              value={form.cardNumber}
              onChange={e => handleCardNumberChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={19}
            />
          </div>

          {/* Card Holder */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Card Holder Name
            </label>
            <input
              type="text"
              placeholder="As printed on card"
              value={form.cardHolderName}
              onChange={e => setForm(f => ({ ...f, cardHolderName: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Expiry (MM/YY)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="MM/YY"
                value={form.expiry}
                onChange={e => handleExpiryChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={5}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                CVV
              </label>
              <input
                type="password"
                inputMode="numeric"
                placeholder="•••"
                value={form.cvv}
                onChange={e => setForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Card Type override */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Card Network
            </label>
            <div className="flex gap-2">
              {CARD_TYPES.map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setCardType(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    cardType === t
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Nickname (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. My HDFC card"
              value={form.nickName}
              onChange={e => setForm(f => ({ ...f, nickName: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Set as default */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.setAsDefault}
              onChange={e => setForm(f => ({ ...f, setAsDefault: e.target.checked }))}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Set as default payment card</span>
          </label>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Security note */}
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span>🔒</span>
            Card details are encrypted. Only the last 4 digits are stored on our servers.
          </p>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Card'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
