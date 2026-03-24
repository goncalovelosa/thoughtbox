'use client'

import { useActionState } from 'react'
import { forgotPasswordAction, type AuthFormState } from '../actions'

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    forgotPasswordAction,
    null,
  )

  if (state?.success) {
    return (
      <div className="mt-6 rounded-none border border-green-200 bg-green-50 px-6 py-5 text-center">
        <p className="text-sm font-medium text-green-800">Check your inbox</p>
        <p className="mt-1 text-xs text-green-700">
          If that email is in our system, we&apos;ve sent a reset link. It expires in 1 hour.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-6 space-y-4" aria-label="Password reset form">
      {state?.error && (
        <div className="rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="mt-1.5 block w-full rounded-none border border-foreground bg-background px-3.5 py-2.5 text-sm text-foreground placeholder-slate-400 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-none bg-foreground text-background border-2 border-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
