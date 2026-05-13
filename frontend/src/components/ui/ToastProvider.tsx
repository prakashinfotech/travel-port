import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toastStyles: Record<ToastVariant, { icon: typeof CheckCircle2; ring: string; iconColor: string }> = {
  success: { icon: CheckCircle2, ring: 'ring-emerald-200', iconColor: 'text-emerald-600' },
  error: { icon: AlertCircle, ring: 'ring-red-200', iconColor: 'text-red-600' },
  info: { icon: Info, ring: 'ring-blue-200', iconColor: 'text-blue-600' },
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const showToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = nextId.current++
    setToasts(prev => [...prev, { ...toast, id }])
    window.setTimeout(() => dismissToast(id), 3600)
  }, [dismissToast])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3">
        {toasts.map(toast => {
          const style = toastStyles[toast.variant]
          const Icon = style.icon

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl bg-white px-4 py-3 shadow-xl ring-1 ${style.ring}`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${style.iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{toast.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }

  return {
    success: (title: string, description?: string) => context.showToast({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => context.showToast({ title, description, variant: 'error' }),
    info: (title: string, description?: string) => context.showToast({ title, description, variant: 'info' }),
  }
}
