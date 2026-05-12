import { useEffect, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (open) confirmRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  const iconBg   = variant === 'danger' ? 'bg-red-100' : 'bg-orange-100'
  const iconColor = variant === 'danger' ? 'text-red-600' : 'text-orange-500'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 animate-fade-in">
        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${iconBg}`}>
            <AlertTriangle className={`h-7 w-7 ${iconColor}`} />
          </div>

          {/* Text */}
          <h2 id="confirm-title" className="text-center text-lg font-bold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold
              text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <Button
            ref={confirmRef}
            variant={variant}
            loading={loading}
            onClick={onConfirm}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
