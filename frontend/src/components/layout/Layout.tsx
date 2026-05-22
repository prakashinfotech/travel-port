import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X, Info, AlertTriangle, CheckCircle } from 'lucide-react'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { AiChatWidget } from '@/components/ai/AiChatWidget'
import { announcementService } from '@/services/announcementService'
import type { AnnouncementDto } from '@/types'

const bannerStyles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    icon: <Info className="h-4 w-4 shrink-0" />,
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-950',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-200',
    icon: <CheckCircle className="h-4 w-4 shrink-0" />,
  },
}

export function Layout() {
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    announcementService.getActive()
      .then(setAnnouncements)
      .catch(() => {/* silently ignore — banner is non-critical */})
  }, [])

  const visible = announcements.filter(a => !dismissed.has(a.id))

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {visible.map(a => {
        const style = bannerStyles[a.type] ?? bannerStyles.info
        return (
          <div
            key={a.id}
            className={`border-b px-4 py-2.5 ${style.bg} ${style.border}`}
          >
            <div className="mx-auto flex max-w-7xl items-center gap-3">
              <span className={style.text}>{style.icon}</span>
              <p className={`flex-1 text-sm font-medium ${style.text}`}>{a.message}</p>
              <button
                onClick={() => setDismissed(prev => new Set(prev).add(a.id))}
                className={`rounded p-0.5 transition-colors hover:bg-black/10 dark:hover:bg-white/10 ${style.text}`}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )
      })}
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <AiChatWidget />
    </div>
  )
}
