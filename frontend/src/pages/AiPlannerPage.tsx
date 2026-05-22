import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles, Send, Loader2, Plane, Hotel,
  MapPin, Calendar, RefreshCw, ChevronRight
} from 'lucide-react'
import { endpoints } from '@/api/endpoints'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'
const PLAN_URL = `${BASE_URL}/api/v1${endpoints.ai.tripPlan}`

const TRIP_IDEAS = [
  '5-day Goa beach trip for a couple, budget ₹30,000',
  'Weekend getaway from Mumbai — nature and hills',
  '7-day Rajasthan tour covering Jaipur and Jodhpur',
  '3-day Bangalore city trip with tech and food focus',
  'Backpacker Kerala trip for 10 days on a tight budget',
]

// Parse [BOOK_FLIGHT:...] and [BOOK_HOTEL:...] markers into clickable buttons
function parseItinerary(text: string, onBook: (url: string) => void): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const regex = /\[BOOK_(FLIGHT|HOTEL):([^\]]+)\]/g
  let last = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(<span key={last}>{text.slice(last, match.index)}</span>)
    }

    const type  = match[1]
    const query = match[2]
    const url   = `/${type === 'FLIGHT' ? 'flights' : 'hotels'}?${query}`

    nodes.push(
      <button
        key={match.index}
        onClick={() => onBook(url)}
        className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-bold ml-1 transition-colors ${
          type === 'FLIGHT'
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
        }`}
      >
        {type === 'FLIGHT' ? <Plane className="h-3 w-3" /> : <Hotel className="h-3 w-3" />}
        Book {type === 'FLIGHT' ? 'Flight' : 'Hotel'}
        <ChevronRight className="h-3 w-3" />
      </button>
    )

    last = match.index + match[0].length
  }

  if (last < text.length) {
    nodes.push(<span key={last}>{text.slice(last)}</span>)
  }

  return nodes
}

// Render markdown-ish text into JSX (headings, bold, bullets)
function ItineraryDisplay({ text, onBook }: { text: string; onBook: (url: string) => void }) {
  const lines = text.split('\n')

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) {
          return (
            <h2 key={i} className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2 flex items-center gap-2">
              <span className="h-1 w-4 rounded bg-blue-500 inline-block" />
              {line.slice(3)}
            </h2>
          )
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-semibold text-gray-800 dark:text-gray-200 mt-4 mb-1">{line.slice(4)}</h3>
        }
        if (line.startsWith('- **') || line.startsWith('* **')) {
          const content = line.replace(/^[-*]\s+/, '')
          const boldMatch = content.match(/^\*\*([^*]+)\*\*:?\s*(.*)$/)
          if (boldMatch) {
            return (
              <div key={i} className="flex gap-2 py-0.5">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="font-semibold">{boldMatch[1]}</strong>
                  {boldMatch[2] ? ': ' : ''}{parseItinerary(boldMatch[2], onBook)}
                </p>
              </div>
            )
          }
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 py-0.5">
              <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
              <p className="text-sm text-gray-700 dark:text-gray-300">{parseItinerary(line.slice(2), onBook)}</p>
            </div>
          )
        }
        if (line.trim() === '') return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {parseItinerary(line, onBook)}
          </p>
        )
      })}
    </div>
  )
}

export default function AiPlannerPage() {
  const [brief, setBrief] = useState('')
  const [plan, setPlan]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const planRef  = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (plan) planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [plan])

  const generate = useCallback(async (tripBrief: string) => {
    if (!tripBrief.trim() || loading) return

    setPlan('')
    setError('')
    setLoading(true)
    abortRef.current = new AbortController()

    try {
      const res = await fetch(PLAN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: tripBrief }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) throw new Error('Stream failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6)
          if (payload === '[DONE]') break

          try {
            const chunk: string = JSON.parse(payload)
            accumulated += chunk
            setPlan(accumulated)
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Failed to generate trip plan. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [loading])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    generate(brief)
  }

  const handleStop = () => {
    abortRef.current?.abort()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 py-12 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-3 flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-300" />
            <span className="text-sm font-semibold tracking-widest text-blue-200 uppercase">Powered by Claude AI</span>
          </div>
          <h1 className="text-3xl font-extrabold sm:text-4xl">AI Trip Planner</h1>
          <p className="mt-3 text-base text-blue-100">
            Describe your dream trip and get a personalised day-by-day itinerary with flight and hotel booking links.
          </p>

          {/* Input */}
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={brief}
                onChange={e => setBrief(e.target.value)}
                placeholder="e.g. 5-day Goa beach trip for 2, budget ₹30,000"
                disabled={loading}
                className="flex-1 rounded-xl border-0 bg-white/20 px-4 py-3 text-sm text-white placeholder-white/50 outline-none ring-1 ring-white/30 focus:ring-white/70 backdrop-blur-sm disabled:opacity-60"
              />
              {loading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex items-center gap-2 rounded-xl bg-red-400 px-6 py-3 text-sm font-bold text-white hover:bg-red-500 transition-colors"
                >
                  <Loader2 className="h-4 w-4 animate-spin" /> Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!brief.trim()}
                  className="flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-bold text-gray-900 hover:bg-yellow-300 transition-colors disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Plan My Trip
                </button>
              )}
            </div>
          </form>

          {/* Ideas */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TRIP_IDEAS.map(idea => (
              <button
                key={idea}
                onClick={() => { setBrief(idea); generate(idea) }}
                disabled={loading}
                className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                {idea}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Plan output */}
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 dark:bg-red-950 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        {!plan && !loading && (
          <div className="text-center py-16 text-gray-400">
            <div className="mb-4 flex justify-center gap-3">
              <MapPin className="h-8 w-8 text-blue-200" />
              <Calendar className="h-8 w-8 text-indigo-200" />
              <Plane className="h-8 w-8 text-blue-200" />
            </div>
            <p className="text-base font-medium text-gray-500">Describe your trip above to generate a personalised itinerary</p>
            <p className="mt-1 text-sm">Day-by-day plan + flight & hotel booking links — all in seconds</p>
          </div>
        )}

        {loading && !plan && (
          <div className="flex items-center justify-center gap-3 py-16 text-blue-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-medium">Planning your perfect trip…</span>
          </div>
        )}

        {plan && (
          <div ref={planRef} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your AI-Generated Itinerary</span>
              </div>
              {!loading && (
                <button
                  onClick={() => generate(brief)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate
                </button>
              )}
            </div>
            <ItineraryDisplay text={plan} onBook={url => navigate(url)} />
            {loading && (
              <span className="mt-2 inline-block h-4 w-0.5 bg-blue-400 animate-pulse align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
