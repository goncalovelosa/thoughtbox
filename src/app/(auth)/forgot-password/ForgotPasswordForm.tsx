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
      <div className="mt-6 rounded-lg border border-green-200 bg-green-50 px-6 py-5 text-center">
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
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
