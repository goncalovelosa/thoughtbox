import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getStripe } from '@/lib/stripe/server'
import { ClaimPanel } from './ClaimPanel'

export const metadata: Metadata = {
  title: 'Claim your account — Thoughtbox',
  description: 'Finish setting up your Thoughtbox account.',
}

interface Props {
  searchParams: Promise<{ stripe_session_id?: string }>
}

// Landing page after Stripe Checkout. The Stripe webhook is the authoritative
// account creator (see /api/stripe/webhook); this page only confirms the
// payment went through and points the user at the set-password email.
//
// If the user closes the browser before this page renders, no harm done: the
// webhook still creates the account and emails the password-set link.
export default async function ClaimPage({ searchParams }: Props) {
  const { stripe_session_id: sessionId } = await searchParams

  // No session id → this page was hit directly, not via Stripe redirect.
  if (!sessionId) {
    redirect('/pricing')
  }

  // Server-side verify: was this Stripe session actually paid?
  // `status === 'complete'` covers both the paid path (`payment_status === 'paid'`)
  // and the 100%-comped path (`payment_status === 'no_payment_required'`).
  const stripe = getStripe()
  let email: string | null = null
  let valid = false
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    valid = session.status === 'complete'
    email = session.customer_details?.email ?? null
  } catch (err) {
    console.error('Failed to retrieve Stripe session on claim page:', err)
  }

  if (!valid || !email) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-xl font-bold text-red-800">We couldn&apos;t verify your payment</h1>
          <p className="mt-2 text-sm text-red-700">
            If you just completed checkout and Stripe is still processing, try refreshing in a
            minute. If you think this is an error, contact{' '}
            <a href="mailto:thoughtboxsupport@kastalienresearch.ai" className="underline">
              support
            </a>
            .
          </p>
        </div>
      </div>
    )
  }

  return <ClaimPanel email={email} stripeSessionId={sessionId} />
}
