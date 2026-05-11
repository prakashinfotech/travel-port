import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAuth } from '@/hooks/useAuth'
import { login, clearError } from './authSlice'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormValues = z.infer<typeof schema>

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, loading, error } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) onSuccess()
      else navigate('/', { replace: true })
    }
    return () => { dispatch(clearError()) }
  }, [isAuthenticated, navigate, dispatch, onSuccess])

  const onSubmit = (data: FormValues) => {
    dispatch(login(data))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="text-right">
        <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" loading={loading} className="w-full mt-1">
        Log In
      </Button>
      <p className="text-center text-sm text-gray-500">
        Don't have an account?{' '}
        <Link to="/register" className="text-blue-600 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </form>
  )
}
