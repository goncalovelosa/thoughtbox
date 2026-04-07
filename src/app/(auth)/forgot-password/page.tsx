import type { Metadata } from 'next'
import Link from 'next/link'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Reset password',
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Forgot your password?</h1>
          <p className="mt-2 text-sm text-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-foreground">
          Remembered it?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-foreground hover:underline-thick hover:text-foreground transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
