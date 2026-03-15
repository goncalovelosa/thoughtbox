import type { Metadata } from 'next'
import Link from 'next/link'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Set new password',
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
          <p className="mt-2 text-sm text-slate-500">
            Choose a strong password for your account.
          </p>
        </div>

        <ResetPasswordForm />

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link
            href="/sign-in"
            className="font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
