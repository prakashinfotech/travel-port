import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { KeyRound, CheckCircle } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { api } from '@/api/axios'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, newPassword: password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message
      setError(msg && !msg.toLowerCase().includes('invalid or expired')
        ? msg
        : 'Reset link is invalid or expired. Please request a new one.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Invalid reset link.</p>
          <Link to="/forgot-password" className="text-blue-600 hover:underline">Request a new one</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
          <p className="text-gray-500">Redirecting you to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <KeyRound className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
          <p className="mt-1 text-sm text-gray-500">Choose a strong password for your account.</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              hint="Min 8 chars, uppercase, number & special character (e.g. @#$!)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
