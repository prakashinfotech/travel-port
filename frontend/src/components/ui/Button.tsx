import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'bg-gradient-to-r from-brand-orange to-brand-orange-dark text-white hover:shadow-glow-orange hover:brightness-110 active:scale-[0.98]',
  secondary: 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-glow-blue hover:brightness-110 active:scale-[0.98]',
  outline:   'border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white active:scale-[0.98]',
  ghost:     'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-[0.98]',
  danger:    'bg-gradient-to-r from-red-500 to-red-600 text-white hover:brightness-110 active:scale-[0.98]',
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm:  'px-3.5 py-1.5 text-sm',
  md:  'px-5 py-2.5 text-sm',
  lg:  'px-7 py-3.5 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, className = '', children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-orange/50',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
