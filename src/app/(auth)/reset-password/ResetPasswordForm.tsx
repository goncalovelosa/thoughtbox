'use client'

import { useActionState } from 'react'
import { resetPasswordAction, type AuthFormState } from '../actions'

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    resetPasswordAction,
    null,
  )

  return (
    <form action={formAction} className="mt-6 space-y-4" aria-label="Set new password form">
      {state?.error && (
        <div className="rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
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
          className="mt-1.5 block w-full rounded-none border border-foreground bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-slate-400 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
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
          className="mt-1.5 block w-full rounded-none border border-foreground bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-slate-400 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-none bg-foreground text-background border-2 border-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
