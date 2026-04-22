import { redirect } from 'next/navigation'

// The public self-service signup path is closed — signup is gated by a paid
// Stripe Checkout session. Account creation happens in the webhook at
// /api/stripe/webhook (see ADR-021 and .specs/launch/stripe-gated-signup-runbook.src.md).
// Users finish setting up their account at /sign-up/claim after payment.
export default function SignUpPage() {
  redirect('/pricing')
}
