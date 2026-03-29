import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = {
  title: 'Create account',
}

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-none border border-foreground bg-background p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-foreground">
            Free through May 1, 2026
          </p>
        </div>

        <SignUpForm />

        <p className="mt-6 text-center text-sm text-foreground">
          Already have an account?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-foreground hover:underline-thick hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
