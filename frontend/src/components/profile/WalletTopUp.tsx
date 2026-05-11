import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { api } from '@/api/axios'

interface WalletTopUpProps {
  onTopUp: (newBalance: number) => void
}

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]

export function WalletTopUp({ onTopUp }: WalletTopUpProps) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleTopUp = async () => {
    const num = Number(amount)
    if (!num || num <= 0 || num > 100000) {
      setError('Enter amount between ₹1 and ₹1,00,000')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const res = await api.post<{ data: { balance: number } }>('/users/wallet/topup', { amount: num })
      onTopUp(res.data.data.balance)
      setSuccess(`₹${num.toLocaleString('en-IN')} added to your wallet!`)
      setAmount('')
      setTimeout(() => { setSuccess(''); setOpen(false) }, 2000)
    } catch {
      setError('Top-up failed. Please try again.')
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
    <div className="mt-3 rounded-xl bg-blue-50 border border-blue-100 p-4">
      <p className="text-sm font-semibold text-gray-800 mb-3">Add Money to Wallet</p>

      {/* Quick amounts */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {QUICK_AMOUNTS.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => setAmount(String(a))}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              amount === String(a)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300',
            ].join(' ')}
          >
            ₹{a.toLocaleString('en-IN')}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
          <input
            type="number"
            min={1}
            max={100000}
            value={amount}
            onChange={e => { setAmount(e.target.value); setError('') }}
            placeholder="Enter amount"
            className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button onClick={handleTopUp} loading={loading} size="sm">Add</Button>
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setError(''); setAmount('') }}>Cancel</Button>
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      {success && <p className="mt-2 text-xs text-green-600 font-medium">{success}</p>}
    </div>
  )
}
