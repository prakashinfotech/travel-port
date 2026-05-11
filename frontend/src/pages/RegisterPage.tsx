import { useState } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { Plane, CheckCircle } from 'lucide-react'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { useAuth } from '@/hooks/useAuth'

export default function RegisterPage() {
  const { isAuthenticated } = useAuth()
  const [registered, setRegistered] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  if (registered) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h1>
          <p className="text-gray-500 mb-6">
            Registration successful. Please check your email to verify your account, then log in.
          </p>
          <Link
            to="/login"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600">
              <Plane className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start booking flights & hotels today</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <RegisterForm onSuccess={() => setRegistered(true)} />
        </div>
      </div>
    </div>
  )
}
