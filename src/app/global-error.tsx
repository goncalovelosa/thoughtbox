'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center font-sans">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-600">
          Critical Error
        </p>
        <h1 className="mt-4 text-3xl font-bold text-foreground">Something went wrong</h1>
        <p className="mt-3 text-foreground">
          A critical error has occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-foreground">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-8 rounded-none bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-background shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
