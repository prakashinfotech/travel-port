import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { CreditCard, Wallet, CheckCircle, Lock, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'
import { useAppSelector } from '@/hooks/useAppDispatch'
import type { ApiResponse, CreateOrderResponse } from '@/types'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

export default function PaymentPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const user = useAppSelector(s => s.auth.user)
  const bookingId = params.get('bookingId') ?? ''
  const amount = Number(params.get('amount') ?? 0)

  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)
  const [error, setError] = useState('')

  if (!bookingId) return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-gray-600 mb-3">No booking found.</p>
        <Link to="/" className="text-blue-600 hover:underline">Go to Home</Link>
      </div>
    </div>
  )

  const handleRazorpayPayment = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post<ApiResponse<CreateOrderResponse>>(
        endpoints.payments.initiate, { bookingId }
      )
      const order = data.data

      if (order.orderId.startsWith('order_mock_')) {
        const verifyRes = await api.post(endpoints.payments.verify, {
          bookingId,
          razorpayOrderId: order.orderId,
          razorpayPaymentId: `pay_mock_${Date.now()}`,
          razorpaySignature: 'mock_signature',
        })
        if (verifyRes.data.success) {
          setPaid(true)
          setTimeout(() => navigate(`/bookings/${bookingId}`), 3000)
        }
        return
      }

      if (!window.Razorpay) {
        setError('Payment gateway failed to load. Please refresh and try again.')
        return
      }

      const rzp = new window.Razorpay({
        key: order.keyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency,
        name: 'TravelPort',
        description: `Booking #${bookingId.slice(0, 8).toUpperCase()}`,
        order_id: order.orderId,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#1d4ed8' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await api.post(endpoints.payments.verify, {
              bookingId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            })
            if (verifyRes.data.success) {
              setPaid(true)
              setTimeout(() => navigate(`/bookings/${bookingId}`), 3000)
            } else {
              setError('Payment verification failed. Contact support.')
            }
          } catch {
            setError('Payment verification failed. Contact support.')
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })
      rzp.open()
    } catch {
      setError('Failed to initiate payment. Please try again.')
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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-500 text-sm mt-1">Booking #{bookingId.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="rounded-xl bg-blue-700 text-white p-5 mb-6">
          <p className="text-blue-200 text-sm">Amount to Pay</p>
          <p className="text-3xl font-bold mt-1">₹{amount.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-1 mt-2 text-blue-200 text-xs">
            <Lock className="h-3 w-3" /> 256-bit SSL Secured Payment
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Supported Payment Methods</p>
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <CreditCard className="h-4 w-4" /> Cards
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <Wallet className="h-4 w-4" /> UPI
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-600">
                <Wallet className="h-4 w-4" /> Net Banking
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Powered by Razorpay. You'll be redirected to a secure checkout window.
            </p>
          </div>

          <Button
            onClick={handleRazorpayPayment}
            loading={loading}
            disabled={loading}
            className="w-full py-3 text-base"
          >
            Pay ₹{amount.toLocaleString('en-IN')} Securely
          </Button>

          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
            <Lock className="h-3 w-3" /> Your payment info is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  )
}
