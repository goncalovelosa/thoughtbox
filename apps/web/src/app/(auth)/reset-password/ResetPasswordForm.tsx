'use client'

import { useActionState, useEffect, useState } from 'react'
import { resetPasswordAction, type AuthFormState } from '../actions'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/supabase/database.types'

type RecoveryProof =
  | { status: 'preparing'; accessToken?: never; userId?: never; error?: never }
  | { status: 'ready'; accessToken: string; userId: string; error?: never }
  | { status: 'error'; accessToken?: never; userId?: never; error: string }

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resetPasswordAction,
    null,
  )
  const [recoveryProof, setRecoveryProof] = useState<RecoveryProof>({ status: 'preparing' })

  // Supabase recovery emails deliver the access/refresh tokens in the URL hash
  // fragment (implicit flow). The hash is invisible to server code, so the
  // session has to be established client-side before the server action runs,
  // and the recovery access token has to be submitted as server-verifiable proof.
  useEffect(() => {
    let cancelled = false

    async function installRecoverySession() {
      const supabase = createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { detectSessionInUrl: false } },
      )

      await supabase.auth.signOut({ scope: 'local' })

      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      if (!accessToken || !refreshToken || type !== 'recovery') {
        throw new Error('Invalid or expired password reset link.')
      }

      const { data: tokenUser, error: tokenError } = await supabase.auth.getUser(accessToken)
      if (tokenError || !tokenUser.user) {
        throw new Error('Invalid or expired password reset link.')
      }

      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (sessionError) {
        throw new Error(sessionError.message)
      }

      if (!cancelled) {
        setRecoveryProof({
          status: 'ready',
          accessToken,
          userId: tokenUser.user.id,
        })
      }
    }

    installRecoverySession().catch((error: unknown) => {
      if (!cancelled) {
        setRecoveryProof({
          status: 'error',
          error: error instanceof Error ? error.message : 'Unable to prepare password reset.',
        })
      }
    }).finally(() => {
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (recoveryProof.status === 'preparing') {
    return (
      <div className="mt-6 text-center text-sm text-foreground/60" aria-live="polite">
        Preparing…
      </div>
    )
  }

  if (recoveryProof.status === 'error') {
    return (
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
        {recoveryProof.error}
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-6 space-y-4" aria-label="Set new password form">
      <input type="hidden" name="recoveryToken" value={recoveryProof.accessToken} />
      <input type="hidden" name="recoveryUserId" value={recoveryProof.userId} />

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
