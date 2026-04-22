'use client'

import { useActionState, useEffect, useState } from 'react'
import { resetPasswordAction, type AuthFormState } from '../actions'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resetPasswordAction,
    null,
  )
  const [ready, setReady] = useState(false)

  // Supabase recovery emails deliver the access/refresh tokens in the URL hash
  // fragment (implicit flow). The hash is invisible to server code, so the
  // session has to be established client-side before the server action runs.
  // Instantiating the browser client triggers detectSessionInUrl, which reads
  // the hash and writes session cookies. We clear the hash once processed so
  // a refresh doesn't re-replay tokens.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().finally(() => {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
      setReady(true)
    })
  }, [])

  if (!ready) {
    return (
      <div className="mt-6 text-center text-sm text-foreground/60" aria-live="polite">
        Preparing…
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-6 space-y-4" aria-label="Set new password form">
      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Min. 12 characters"
          className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Repeat password"
          className="mt-1.5 block w-full rounded-xl border border-foreground/10 bg-foreground/5 px-3.5 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:border-foreground/20 focus:outline-none focus:ring-2 focus:ring-foreground/10"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-foreground text-background px-4 py-2.5 text-sm font-semibold transition-all hover:bg-foreground/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
