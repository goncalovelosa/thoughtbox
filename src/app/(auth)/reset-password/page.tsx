import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set new password',
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Set a new password</h1>
          <p className="mt-2 text-sm text-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <ResetPasswordForm />

        <p className="mt-6 text-center text-sm text-foreground">
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
