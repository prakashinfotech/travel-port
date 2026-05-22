import { useState, useEffect } from 'react'
import { TrendingDown, Sparkles } from 'lucide-react'
import { api } from '@/api/axios'
import { endpoints } from '@/api/endpoints'

interface Props {
  origin: string
  destination: string
}

export function PriceTrendInsight({ origin, destination }: Props) {
  const [insight, setInsight] = useState<string | null>(null)

  useEffect(() => {
    if (!origin || !destination) return
    let cancelled = false

    api.get<{ insight: string | null }>(endpoints.ai.priceInsight, {
      params: { origin, destination },
    })
      .then(res => {
        if (!cancelled) {
          const raw = res.data as unknown as { insight: string | null }
          setInsight(raw.insight ?? null)
        }
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [origin, destination])

  if (!insight) return null

  return (
    <div className="flex items-start gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-2.5 text-sm dark:border-purple-900 dark:bg-purple-950">
      <span className="flex items-center gap-1 shrink-0 text-purple-600 dark:text-purple-400 font-semibold text-xs mt-0.5">
        <Sparkles className="h-3.5 w-3.5" />
        AI Insight
      </span>
      <span className="text-purple-700 dark:text-purple-300">
        <TrendingDown className="inline h-3.5 w-3.5 mr-1 text-purple-400" />
        {insight}
      </span>
    </div>
  )
}
