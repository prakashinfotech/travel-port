import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAuth } from '@/hooks/useAuth'
import { register as registerUser, clearError } from './authSlice'

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Enter a valid email'),
  phone:    z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type FormValues = z.infer<typeof schema>

export function RegisterForm() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, loading, error } = useAuth()

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
    return () => { dispatch(clearError()) }
  }, [isAuthenticated, navigate, dispatch])

  const onSubmit = ({ name, email, phone, password }: FormValues) => {
    dispatch(registerUser({ name, email, phone, password }))
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Input label="Full Name" placeholder="John Doe" error={errors.name?.message} {...register('name')} />
      <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
      <Input label="Phone" type="tel" placeholder="+919876543210" error={errors.phone?.message} {...register('phone')} />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        hint="Min 8 chars, one uppercase, one number"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button type="submit" loading={loading} className="w-full mt-1">
        Create Account
      </Button>
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:underline font-medium">
          Log in
        </Link>
      </p>
    </form>
  )
}
