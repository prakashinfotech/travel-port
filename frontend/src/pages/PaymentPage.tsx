import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CreditCard, Wallet, CheckCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { api } from '@/api/axios'

export default function PaymentPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = params.get('bookingId') ?? ''
  const amount = Number(params.get('amount') ?? 0)

  const [method, setMethod] = useState<'card' | 'upi' | 'wallet'>('card')
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  // Card fields
  const [cardNum, setCardNum] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [name, setName] = useState('')
  const [upi, setUpi] = useState('')

  if (!bookingId) return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-600 mb-3">No booking found.</p>
        <Link to="/" className="text-blue-600 hover:underline">Go to Home</Link>
      </div>
    </div>
  )

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/payments/initiate', { bookingId, paymentMethod: method })
      setPaid(true)
      setTimeout(() => navigate(`/bookings/${bookingId}`), 3000)
    } catch {
      setError('Payment failed. Please try again or use a different payment method.')
    } finally {
      setLoading(false)
    }
  }

  if (paid) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-500 mb-2">₹{amount.toLocaleString('en-IN')} paid successfully.</p>
          <p className="text-sm text-gray-400">Redirecting to your booking...</p>
        </div>
      </div>
    )
  }

  const PayMethodBtn = ({ id, icon: Icon, label }: { id: typeof method; icon: React.ElementType; label: string }) => (
    <button
      type="button"
      onClick={() => setMethod(id)}
      className={[
        'flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-colors',
        method === id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300',
      ].join(' ')}
    >
      <Icon className="h-5 w-5" /> {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-500 text-sm mt-1">Booking #{bookingId.slice(0, 8).toUpperCase()}</p>
        </div>

        {/* Amount card */}
        <div className="rounded-xl bg-blue-700 text-white p-5 mb-6">
          <p className="text-blue-200 text-sm">Amount to Pay</p>
          <p className="text-3xl font-bold mt-1">₹{amount.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 mt-2 text-blue-200 text-xs">
            <Lock className="h-3 w-3" /> 256-bit SSL Secured Payment
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {/* Payment method selector */}
          <p className="text-sm font-semibold text-gray-700 mb-3">Select Payment Method</p>
          <div className="flex gap-3 mb-6 flex-wrap">
            <PayMethodBtn id="card" icon={CreditCard} label="Credit/Debit Card" />
            <PayMethodBtn id="upi" icon={Wallet} label="UPI" />
            <PayMethodBtn id="wallet" icon={Wallet} label="TravelPort Wallet" />
          </div>

          <form onSubmit={handlePay} className="flex flex-col gap-4">
            {method === 'card' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Card Number</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1234 5678 9012 3456"
                    value={cardNum}
                    onChange={e => setCardNum(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())}
                    maxLength={19}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Expiry</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={e => setExpiry(e.target.value)}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">CVV</label>
                    <input
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="•••"
                      type="password"
                      value={cvv}
                      onChange={e => setCvv(e.target.value)}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Name on Card</label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </>
            )}
            {method === 'upi' && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">UPI ID</label>
                <input
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="yourname@upi"
                  value={upi}
                  onChange={e => setUpi(e.target.value)}
                  required
                />
              </div>
            )}
            {method === 'wallet' && (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 text-sm text-blue-700">
                Your TravelPort wallet balance will be debited for ₹{amount.toLocaleString('en-IN')}.
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full py-3 text-base">
              Pay ₹{amount.toLocaleString('en-IN')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
