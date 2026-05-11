import { useState, useEffect } from 'react'
import { X, Plane } from 'lucide-react'
import { LoginForm } from '@/features/auth/LoginForm'
import { RegisterForm } from '@/features/auth/RegisterForm'
import { useAuth } from '@/hooks/useAuth'

const SEEN_KEY = 'tp_auth_modal_seen'

export function AuthModal() {
  const { isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'login' | 'register'>('login')

  useEffect(() => {
    if (!isAuthenticated && !sessionStorage.getItem(SEEN_KEY)) {
      const timer = setTimeout(() => {
        setOpen(true)
        sessionStorage.setItem(SEEN_KEY, '1')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isAuthenticated])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-blue-700 px-6 py-4">
          <div className="flex items-center gap-2 text-white">
            <Plane className="h-5 w-5" />
            <span className="font-bold text-lg">TravelPort</span>
          </div>
          <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['login', 'register'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                'flex-1 py-3 text-sm font-semibold transition-colors capitalize',
                tab === t
                  ? 'text-blue-700 border-b-2 border-blue-700'
                  : 'text-gray-400 hover:text-gray-600',
              ].join(' ')}
            >
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'login' ? (
            <LoginForm onSuccess={() => setOpen(false)} />
          ) : (
            <RegisterForm onSuccess={() => { setTab('login') }} />
          )}
        </div>
      </div>
    </div>
  )
}
