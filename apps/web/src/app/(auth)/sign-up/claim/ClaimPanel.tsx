'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { resendWelcomeEmailAction } from '../../actions'

interface Props {
  email: string
  stripeSessionId: string
}

export function ClaimPanel({ email, stripeSessionId }: Props) {
  const [pending, startTransition] = useTransition()
  const [resent, setResent] = useState<'idle' | 'success' | 'error'>('idle')

  const handleResend = () => {
    startTransition(async () => {
      const result = await resendWelcomeEmailAction(email)
      setResent(result.ok ? 'success' : 'error')
    })
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Payment received</h1>
          <p className="mt-2 text-sm text-foreground/70">
            We sent a set-password link to{' '}
            <span className="font-semibold text-foreground">{email}</span>.
          </p>
          <p className="mt-1 text-sm text-foreground/70">
            Open that email and click the link to finish setting up your account.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-foreground/10 bg-background px-4 py-3 text-xs text-foreground/60">
          <p className="font-semibold text-foreground/80">Didn&apos;t get the email?</p>
          <p className="mt-1">
            It can take a minute to arrive. Check your spam folder.
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={pending}
            className="mt-3 text-xs font-semibold text-foreground hover:underline disabled:opacity-50"
          >
            {pending ? 'Sending…' : 'Resend the email'}
          </button>
          {resent === 'success' && (
            <p className="mt-2 text-xs text-green-700">Sent. Check your inbox.</p>
          )}
          {resent === 'error' && (
            <p className="mt-2 text-xs text-red-700">
              Something went wrong. Contact{' '}
              <a
                href="mailto:thoughtboxsupport@kastalienresearch.ai"
                className="underline"
              >
                support
              </a>
              .
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-foreground/50">
          Reference:{' '}
          <code className="font-mono text-[10px]">{stripeSessionId.slice(0, 20)}…</code>
        </p>

        <p className="mt-6 text-center text-sm text-foreground">
          Already set your password?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-foreground hover:underline-thick hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
