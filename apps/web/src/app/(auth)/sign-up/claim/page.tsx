import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe/server'
import { getSiteUrl } from '@/lib/thoughtbox-config'
import { ClaimPanel } from './ClaimPanel'

export const metadata: Metadata = {
  title: 'Claim your account — Thoughtbox',
  description: 'Finish setting up your Thoughtbox account.',
}

interface Props {
  searchParams: Promise<{ stripe_session_id?: string }>
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase admin env vars missing')
  return createAdminClient(url, key)
}

async function findAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const r = await fetch(
    `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  if (!r.ok) return null
  const body = (await r.json()) as { users?: Array<{ id: string }> } | Array<{ id: string }>
  const users = Array.isArray(body) ? body : (body.users ?? [])
  return users[0] ?? null
}

// Claim page is the account creator. Stripe redirects here after Checkout with
// the session id; we verify the session is paid, create (or find) the auth user,
// update the workspace with Stripe ids, and send a set-password email. This
// replaces the webhook-based account-creation path, which was fragile in prod.
export default async function ClaimPage({ searchParams }: Props) {
  const { stripe_session_id: sessionId } = await searchParams

  if (!sessionId) {
    redirect('/pricing')
  }

  const stripe = getStripe()
  let session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId)
  } catch (err) {
    console.error('Failed to retrieve Stripe session on claim page:', err)
    return <ClaimError />
  }

  // `status === 'complete'` covers the paid path (`payment_status === 'paid'`)
  // and the 100%-comped path (`payment_status === 'no_payment_required'`).
  const paid = session.status === 'complete'
  const email = session.customer_details?.email ?? null
  const customerId = typeof session.customer === 'string' ? session.customer : null
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null
  const planId = session.metadata?.plan_id ?? 'founding'

  if (!paid || !email || !customerId || !subscriptionId) {
    return <ClaimError />
  }

  const admin = adminClient()

  // Create-or-find: createUser errors on duplicate email (refresh of this page,
  // or retry after a previous run partially completed). Only fall back to the
  // existing-user lookup on duplicate-email errors — other failures (rate
  // limits, validation, transient 5xx) must not silently overwrite an
  // unrelated existing user's workspace with this session's Stripe state.
  let userId: string
  let userWasJustCreated = false
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      signup_source: 'stripe_checkout',
      stripe_session_id: sessionId,
    },
  })

  if (createError) {
    const isDuplicate =
      createError.code === 'email_exists' ||
      createError.code === 'user_already_exists' ||
      createError.status === 422
    if (!isDuplicate) {
      console.error('Claim: user creation failed (non-duplicate):', createError)
      return <ClaimError />
    }
    const existing = await findAuthUserByEmail(email)
    if (!existing) {
      console.error('Claim: user creation failed and no existing user:', createError)
      return <ClaimError />
    }
    userId = existing.id
  } else {
    if (!createData.user) {
      console.error('Claim: createUser returned no user and no error')
      return <ClaimError />
    }
    userId = createData.user.id
    userWasJustCreated = true
  }

  // DB trigger `handle_new_user` creates a workspace row on auth.users insert.
  // Update it with Stripe state. Idempotent — re-running writes the same values.
  // `.select('id')` lets us detect the zero-rows case (trigger didn't fire,
  // user pre-dates the trigger) and surface it instead of silently continuing.
  const { data: updated, error: updateError } = await admin
    .from('workspaces')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan_id: planId,
      subscription_status: 'active',
    })
    .eq('owner_user_id', userId)
    .select('id')

  if (updateError || !updated || updated.length === 0) {
    console.error('Claim: workspace update failed:', {
      userId,
      email,
      rowsUpdated: updated?.length ?? 0,
      updateError,
    })
    return <ClaimError />
  }

  // Send the set-password link only on fresh creation. Refreshes, retries, and
  // bookmarked revisits skip the send to avoid duplicate emails and tripping
  // GoTrue's per-email rate limit. The "Resend the email" button in ClaimPanel
  // is the supported path for getting another link.
  if (userWasJustCreated) {
    const siteUrl = getSiteUrl()
    const { error: mailError } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/api/auth/callback?next=/reset-password`,
    })
    if (mailError) {
      console.error('Claim: welcome email failed:', mailError)
    }
  }

  return <ClaimPanel email={email} stripeSessionId={sessionId} />
}

function ClaimError() {
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
