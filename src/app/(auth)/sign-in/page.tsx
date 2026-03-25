import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function SignInPage() {
  return (
    <div className="w-full max-w-md">
      <div className="rounded-none border border-foreground bg-background p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-foreground">Sign in to your Thoughtbox workspace</p>
        </div>

        <SignInForm />

        <p className="mt-6 text-center text-sm text-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/sign-up"
            className="font-medium text-foreground hover:underline-thick hover:text-foreground transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
