import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = {
  title: 'Create account',
}

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">
            Get started with a free Thoughtbox workspace
          </p>
        </div>

        <SignUpForm />

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-brand-600 hover:text-brand-700 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
