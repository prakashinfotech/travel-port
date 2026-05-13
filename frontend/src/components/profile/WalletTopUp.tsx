import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { api } from '@/api/axios'
import { useToast } from '@/components/ui/ToastProvider'

interface WalletTopUpProps {
  onTopUp: (newBalance: number) => void
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

export function WalletTopUp({ onTopUp }: WalletTopUpProps) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTopUp = async () => {
    const num = Number(amount)
    if (!num || num <= 0 || num > 100000) {
      setError('Enter amount between Rs.1 and Rs.1,00,000')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await api.post<{ data: { balance: number } }>('/users/wallet/topup', { amount: num })
      onTopUp(res.data.data.balance)
      toast.success('Wallet updated', `Rs.${num.toLocaleString('en-IN')} was added to your wallet.`)
      setAmount('')
      setOpen(false)
    } catch {
      setError('Top-up failed. Please try again.')
      toast.error('Top-up failed', 'We could not add money to your wallet. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <PlusCircle className="h-4 w-4" /> Add Money
      </Button>
    )
  }

  return (
    <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
      <p className="mb-3 text-sm font-semibold text-gray-800">Add Money to Wallet</p>

      <div className="mb-3 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map(value => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(String(value))}
            className={[
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              amount === String(value)
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300',
            ].join(' ')}
          >
            Rs.{value.toLocaleString('en-IN')}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">Rs.</span>
          <input
            type="number"
            min={1}
            max={100000}
            value={amount}
            onChange={e => { setAmount(e.target.value); setError('') }}
            placeholder="Enter amount"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button onClick={handleTopUp} loading={loading} size="sm">Add</Button>
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setError(''); setAmount('') }}>Cancel</Button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
