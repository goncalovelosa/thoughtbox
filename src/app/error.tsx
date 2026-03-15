'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service when integrated
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-red-600">Error</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-slate-500">
        An unexpected error occurred. Please try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-slate-400">Error ID: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
