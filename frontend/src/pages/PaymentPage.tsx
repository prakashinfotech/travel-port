import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  CreditCard, Smartphone, Building2, CheckCircle, Lock, AlertCircle, ShieldCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import type { ApiResponse, CreateOrderResponse } from '@/types'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

type PayMethod = 'card' | 'upi' | 'netbanking'

const METHODS: { id: PayMethod; label: string; sub: string; Icon: typeof CreditCard }[] = [
  { id: 'card',       label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Amex, RuPay', Icon: CreditCard  },
  { id: 'upi',        label: 'UPI',                  sub: 'GPay, PhonePe, Paytm, BHIM',    Icon: Smartphone  },
  { id: 'netbanking', label: 'Net Banking',          sub: '100+ banks supported',           Icon: Building2   },
]

export default function PaymentPage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const bookingId  = params.get('bookingId') ?? ''
  const amount     = Number(params.get('amount') ?? 0)
  const bookingType = params.get('bookingType') ?? ''

  const [method, setMethod]   = useState<PayMethod>('card')
  const [loading, setLoading] = useState(false)
  const [paid, setPaid]       = useState(false)
  const [error, setError]     = useState('')

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

  const openRazorpay = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<ApiResponse<CreateOrderResponse>>(
        endpoints.payments.initiate, { bookingId }
      )
      const order = data.data

      if (!window.Razorpay) {
        setError('Payment gateway failed to load. Please disable any ad-blockers, refresh the page, and try again.')
        setLoading(false)
        return
      }

      const rzp = new window.Razorpay({
        key:      order.keyId,
        amount:   order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name:        'TravelPort',
        description: 'Booking Payment',
        image:       '/vite.svg',
        theme:       { color: '#2563eb' },
        method: {
          card:       method === 'card',
          upi:        method === 'upi',
          netbanking: method === 'netbanking',
          wallet:     false,
          emi:        false,
        },
        handler: async (response: {
          razorpay_order_id:   string
          razorpay_payment_id: string
          razorpay_signature:  string
        }) => {
          try {
            const res = await api.post(endpoints.payments.verify, {
              bookingId,
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (res.data.success) {
              setPaid(true)
              const redirectTo = bookingType.toLowerCase() === 'bus'
                ? `/buses/booking/${bookingId}/confirm?new=true`
                : `/bookings/${bookingId}`
              setTimeout(() => navigate(redirectTo), 2500)
            } else {
              setError('Payment verification failed. Please contact support.')
            }
          } catch {
            setError('Payment verification failed. Please contact support.')
          } finally {
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
            setError('Payment cancelled. Please try again.')
          },
        },
      })

      rzp.open()
    } catch {
      setError('Unable to initiate payment. Please try again.')
      setLoading(false)
    }
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

  const selected = METHODS.find(m => m.id === method)!

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-lg space-y-4">

        {/* Amount bar */}
        <div className="rounded-2xl bg-blue-700 text-white p-5">
          <p className="text-blue-200 text-sm">Amount to Pay</p>
          <p className="text-3xl font-bold mt-1">₹{amount.toLocaleString('en-IN')}</p>
          <p className="text-blue-200 text-xs mt-1">Booking #{bookingId.slice(0, 8).toUpperCase()}</p>
          <div className="flex items-center gap-1 mt-2 text-blue-200 text-xs">
            <Lock className="h-3 w-3" /> 256-bit SSL Secured Payment
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {/* Method selector */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <p className="px-5 pt-5 pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Choose Payment Method
          </p>
          {METHODS.map(({ id, label, sub, Icon }) => (
            <button
              key={id}
              onClick={() => { setMethod(id); setError('') }}
              className={`w-full flex items-center gap-4 px-5 py-4 border-t border-gray-100 transition-colors text-left
                ${method === id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl
                ${method === id ? 'bg-blue-600' : 'bg-gray-100'}`}>
                <Icon className={`h-5 w-5 ${method === id ? 'text-white' : 'text-gray-500'}`} />
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${method === id ? 'text-blue-700' : 'text-gray-800'}`}>
                  {label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              {method === id && (
                <span className="text-[10px] font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pay panel */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <selected.Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-900">Pay via {selected.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selected.sub}</p>
            </div>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Clicking the button below will open the <strong>Razorpay secure checkout</strong>.
              Your payment details are collected and encrypted by Razorpay — never by TravelPort.
            </p>
          </div>

          <Button
            onClick={openRazorpay}
            loading={loading}
            disabled={loading}
            className="w-full py-3 text-base"
          >
            Pay ₹{amount.toLocaleString('en-IN')} via Razorpay
          </Button>

          <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Secured by Razorpay · PCI DSS Compliant
          </p>
        </div>

      </div>
    </div>
  )
}
