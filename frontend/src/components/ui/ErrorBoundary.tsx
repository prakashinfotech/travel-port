import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error', error, errorInfo)
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-slate-200">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-center text-2xl font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
            A page component crashed unexpectedly. Refresh the app to try again, or go back to the home page.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <RefreshCw className="h-4 w-4" />
              Reload App
            </button>
            <Link
              to="/"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }
}

/**
 * Wraps ErrorBoundary with a location key so it remounts (and resets hasError)
 * on every route change — prevents stale error state after logout/login transitions.
 */
export function LocationAwareErrorBoundary({ children }: { children: ReactNode }) {
  const { key } = useLocation()
  return <ErrorBoundary key={key}>{children}</ErrorBoundary>
}
