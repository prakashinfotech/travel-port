import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  CreditCard, Smartphone, Building2, CheckCircle, Lock, AlertCircle, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { ApiResponse, CreateOrderResponse } from '@/types'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

type PayMethod = 'card' | 'upi' | 'netbanking'

const BANKS = [
  'State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank',
  'Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda',
  'Canara Bank', 'Union Bank of India', 'Yes Bank',
]

function autoFormatCard(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function autoFormatExpiry(v: string) {
  const digits = v.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export default function PaymentPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const bookingId = params.get('bookingId') ?? ''
  const amount    = Number(params.get('amount') ?? 0)

  const [method, setMethod]         = useState<PayMethod>('card')
  const [loading, setLoading]       = useState(false)
  const [paid, setPaid]             = useState(false)
  const [error, setError]           = useState('')
  const [countdown, setCountdown]   = useState(0)
  const timerRef                    = useRef<ReturnType<typeof setInterval> | null>(null)

  // Card fields
  const [cardNum,  setCardNum]  = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry,   setExpiry]   = useState('')
  const [cvv,      setCvv]      = useState('')

  // UPI
  const [upiId, setUpiId] = useState('')

  // Net Banking
  const [bank,      setBank]      = useState('')
  const [netBankId, setNetBankId] = useState('')

  // Processing overlay (UPI / NetBanking timer)
  const [processing, setProcessing] = useState(false)

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  if (!bookingId) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-3">No booking found.</p>
          <Link to="/" className="text-blue-600 hover:underline">Go to Home</Link>
        </div>
      </div>
    )
  }

  const startTimer = (onDone: () => void) => {
    setCountdown(20)
    setProcessing(true)
    let secs = 20
    timerRef.current = setInterval(() => {
      secs -= 1
      setCountdown(secs)
      if (secs <= 5) {
        clearInterval(timerRef.current!)
        setProcessing(false)
        onDone()
      }
    }, 1000)
  }

  const completeBooking = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<ApiResponse<CreateOrderResponse>>(
        endpoints.payments.initiate, { bookingId }
      )
      const order = data.data
      const verifyRes = await api.post(endpoints.payments.verify, {
        bookingId,
        razorpayOrderId:    order.orderId,
        razorpayPaymentId:  `pay_mock_${Date.now()}`,
        razorpaySignature:  'mock_signature',
      })
      if (verifyRes.data.success) {
        setPaid(true)
        setTimeout(() => navigate(`/bookings/${bookingId}`), 2500)
      } else {
        setError('Payment verification failed. Contact support.')
      }
    } catch {
      setError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Card submit ──
  const handleCardPay = async () => {
    if (!cardName.trim()) { setError('Enter card holder name.'); return }
    if (cardNum.replace(/\s/g, '').length < 16) { setError('Enter a valid 16-digit card number.'); return }
    if (expiry.length < 5) { setError('Enter a valid expiry (MM/YY).'); return }
    if (cvv.length < 3) { setError('Enter a valid CVV.'); return }
    setError('')
    await completeBooking()
  }

  // ── UPI submit ──
  const handleUpiPay = () => {
    if (!upiId.trim() || !upiId.includes('@')) { setError('Enter a valid UPI ID (e.g. name@upi).'); return }
    setError('')
    startTimer(completeBooking)
  }

  // ── Net Banking submit ──
  const handleNetBankingPay = () => {
    if (!bank) { setError('Select your bank.'); return }
    if (!netBankId.trim()) { setError('Enter your Net Banking Customer ID.'); return }
    setError('')
    startTimer(completeBooking)
  }

  // ── Success screen ──
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
          <p className="text-sm text-gray-400">Redirecting to your booking…</p>
        </div>
      </div>
    )
  }

  // ── Processing overlay (UPI / NetBanking) ──
  if (processing) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <svg className="absolute inset-0 h-24 w-24 -rotate-90" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="44" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="48" cy="48" r="44" fill="none" stroke="#2563eb" strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - countdown / 20)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            <span className="text-2xl font-bold text-blue-600">{countdown}</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {method === 'upi' ? 'Waiting for UPI payment…' : 'Processing Net Banking…'}
          </h2>
          <p className="text-sm text-gray-500">
            {method === 'upi'
              ? 'Open your UPI app and approve the payment request.'
              : 'Connecting to your bank. Please do not close this page.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3" /> Secured with 256-bit SSL
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-lg">

        {/* Amount bar */}
        <div className="rounded-2xl bg-blue-700 text-white p-5 mb-6">
          <p className="text-blue-200 text-sm">Amount to Pay</p>
          <p className="text-3xl font-bold mt-1">₹{amount.toLocaleString('en-IN')}</p>
          <p className="text-blue-200 text-xs mt-1">Booking #{bookingId.slice(0, 8).toUpperCase()}</p>
          <div className="flex items-center gap-1 mt-2 text-blue-200 text-xs">
            <Lock className="h-3 w-3" /> 256-bit SSL Secured Payment
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Method selector */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden mb-4">
          <p className="px-5 pt-5 pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Choose Payment Method</p>

          {([
            { id: 'card',       label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Amex, RuPay', Icon: CreditCard },
            { id: 'upi',        label: 'UPI',                  sub: 'GPay, PhonePe, Paytm, BHIM',    Icon: Smartphone },
            { id: 'netbanking', label: 'Net Banking',          sub: '100+ banks supported',           Icon: Building2  },
          ] as { id: PayMethod; label: string; sub: string; Icon: typeof CreditCard }[]).map(({ id, label, sub, Icon }) => (
            <button
              key={id}
              onClick={() => { setMethod(id); setError('') }}
              className={`w-full flex items-center gap-4 px-5 py-4 border-t border-gray-100 transition-colors text-left
                ${method === id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${method === id ? 'bg-blue-600' : 'bg-gray-100'}`}>
                <Icon className={`h-5 w-5 ${method === id ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${method === id ? 'text-blue-700' : 'text-gray-800'}`}>{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <ChevronRight className={`h-4 w-4 ${method === id ? 'text-blue-600' : 'text-gray-300'}`} />
            </button>
          ))}
        </div>

        {/* ── Card form ── */}
        {method === 'card' && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Card Details</h2>

            {/* Card preview */}
            <div className="rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 p-5 text-white mb-2">
              <p className="font-mono text-lg tracking-widest mb-4">
                {cardNum || '•••• •••• •••• ••••'}
              </p>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-white/60 text-[10px] uppercase tracking-wide">Card Holder</p>
                  <p className="text-sm font-semibold">{cardName || 'YOUR NAME'}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-[10px] uppercase tracking-wide">Expires</p>
                  <p className="text-sm font-semibold">{expiry || 'MM/YY'}</p>
                </div>
              </div>
            </div>

            <Input
              label="Card Number"
              placeholder="1234 5678 9012 3456"
              value={cardNum}
              onChange={e => setCardNum(autoFormatCard(e.target.value))}
              maxLength={19}
            />
            <Input
              label="Card Holder Name"
              placeholder="Name as on card"
              value={cardName}
              onChange={e => setCardName(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Expiry (MM/YY)"
                placeholder="MM/YY"
                value={expiry}
                onChange={e => setExpiry(autoFormatExpiry(e.target.value))}
                maxLength={5}
              />
              <Input
                label="CVV"
                placeholder="•••"
                type="password"
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
              />
            </div>

            <Button onClick={handleCardPay} loading={loading} disabled={loading} className="w-full py-3 text-base">
              Pay ₹{amount.toLocaleString('en-IN')} Now
            </Button>
            <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
              <Lock className="h-3 w-3" /> Your card details are encrypted and never stored
            </p>
          </div>
        )}

        {/* ── UPI form ── */}
        {method === 'upi' && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <h2 className="font-bold text-gray-900">Pay via UPI</h2>

            {/* QR code (static illustrative) */}
            <div className="flex flex-col items-center gap-3 py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
                  {/* QR-style pixel art */}
                  {[
                    [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],
                    [0,1],[6,1],[0,2],[2,2],[3,2],[4,2],[6,2],
                    [0,3],[2,3],[4,3],[6,3],[0,4],[2,4],[3,4],[4,4],[6,4],
                    [0,5],[6,5],[0,6],[1,6],[2,6],[3,6],[4,6],[5,6],[6,6],
                    [8,0],[9,0],[8,2],[10,2],[11,2],[8,4],[11,4],[9,6],[10,6],[11,6],
                    [0,8],[2,8],[3,8],[1,9],[3,9],[0,10],[3,10],[4,10],[2,11],[4,11],
                    [8,8],[10,8],[11,8],[8,9],[9,9],[10,9],[8,10],[9,11],[11,11],
                  ].map(([col, row], i) => (
                    <rect key={i} x={col * 9 + 6} y={row * 9 + 6} width={8} height={8} fill="#1e293b" />
                  ))}
                  <text x="60" y="114" textAnchor="middle" fontSize="8" fill="#64748b">TravelPort</text>
                </svg>
              </div>
              <p className="text-xs text-gray-500 text-center">Scan with any UPI app<br />GPay · PhonePe · Paytm · BHIM</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">or enter UPI ID</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <Input
              label="UPI ID"
              placeholder="yourname@upi"
              value={upiId}
              onChange={e => setUpiId(e.target.value)}
            />

            <Button onClick={handleUpiPay} loading={loading} disabled={loading} className="w-full py-3 text-base">
              Pay ₹{amount.toLocaleString('en-IN')} via UPI
            </Button>
          </div>
        )}

        {/* ── Net Banking form ── */}
        {method === 'netbanking' && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-gray-900">Net Banking</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Bank</label>
              <select
                value={bank}
                onChange={e => setBank(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Choose your bank --</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <Input
              label="Customer / User ID"
              placeholder="Enter your Net Banking Customer ID"
              value={netBankId}
              onChange={e => setNetBankId(e.target.value)}
            />

            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700">
              You will be connected to your bank's secure portal. Do not share your password with anyone.
            </div>

            <Button onClick={handleNetBankingPay} loading={loading} disabled={loading} className="w-full py-3 text-base">
              Pay ₹{amount.toLocaleString('en-IN')} via Net Banking
            </Button>
          </div>
        )}

      </div>
    </div>
  )
}
