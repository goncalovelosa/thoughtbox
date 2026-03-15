import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function SignInPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your Thoughtbox workspace</p>
        </div>

        <SignInForm />

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
