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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-red-600">Error</p>
      <h1 className="mt-4 text-3xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-3 text-foreground">
        An unexpected error occurred. Please try again.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-foreground">Error ID: {error.digest}</p>
      )}
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          className="rounded-none bg-foreground text-background border-2 border-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm hover:bg-background transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
