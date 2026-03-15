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
      <body className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center font-sans">
        <p className="text-sm font-semibold uppercase tracking-widest text-red-600">
          Critical Error
        </p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-3 text-slate-500">
          A critical error has occurred. Our team has been notified.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-slate-400">Error ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="mt-8 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </body>
    </html>
  )
}
