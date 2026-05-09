import { Plane } from 'lucide-react'
import { RegisterForm } from '@/features/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <Plane className="h-6 w-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="mt-1 text-sm text-gray-500">Start booking flights & hotels today</p>
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
