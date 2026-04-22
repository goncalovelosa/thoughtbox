'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { getStripe, PLAN_CONFIG, PUBLIC_SIGNUP_PLAN, type PlanId } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/thoughtbox-config'

// Resolve the base URL for Stripe redirect URLs. Prefers the request Origin
// header (which reflects the host the browser actually hit, so it's correct
// for preview deploys and custom domains) and falls back to getSiteUrl() —
// which resolves NEXT_PUBLIC_SITE_URL, then VERCEL_URL (per-deploy), then
// localhost. The previous fallback was a hardcoded production URL, which
// broke post-checkout redirects on preview/staging deploys.
async function resolveOrigin(): Promise<string> {
  const headersList = await headers()
  return headersList.get('origin') || getSiteUrl()
}

// Public (unauthenticated) checkout session for Stripe-gated signup.
// Creates a subscription Checkout Session that does NOT require a pre-existing
// workspace or authenticated user. The webhook at /api/stripe/webhook is the
// authoritative account creator: it fires on checkout.session.completed,
// creates the Supabase auth user via admin API, and the auto-provisioning
// trigger creates the workspace.
//
// This eliminates the "money charged, no account" race — the account is
// created by the same asynchronous side effect as the charge, not by a
// client redirect that the user might never complete.
export async function createPublicCheckoutSession(): Promise<void> {
  const config = PLAN_CONFIG[PUBLIC_SIGNUP_PLAN]
  if (!config.priceId) {
    throw new Error(
      `STRIPE_PRICE_FOUNDING is not configured — cannot create public checkout session`,
    )
  }

  const origin = await resolveOrigin()

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: config.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    customer_creation: 'always',
    success_url: `${origin}/sign-up/claim?stripe_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
    metadata: {
      signup_flow: 'public',
      plan_id: PUBLIC_SIGNUP_PLAN,
    },
  }

  const session = await getStripe().checkout.sessions.create(sessionParams)

  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  redirect(session.url)
}

export async function createCheckoutSession(workspaceId: string, planId: PlanId) {
  const config = PLAN_CONFIG[planId]
  if (!config.priceId) {
    throw new Error(`No Stripe price configured for plan: ${planId}`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get workspace to check for existing Stripe customer
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, slug, stripe_customer_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace) throw new Error('Workspace not found')

  const origin = await resolveOrigin()

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: config.priceId, quantity: 1 }],
    success_url: `${origin}/w/${workspace.slug}/billing?upgraded=true`,
    cancel_url: `${origin}/w/${workspace.slug}/billing`,
    metadata: {
      workspace_id: workspace.id,
      plan_id: planId,
      user_id: user.id,
    },
  }

  // Reuse existing Stripe customer if available
  if (workspace.stripe_customer_id) {
    sessionParams.customer = workspace.stripe_customer_id
  } else {
    sessionParams.customer_email = user.email
  }

  const session = await getStripe().checkout.sessions.create(sessionParams)

  if (!session.url) throw new Error('Stripe did not return a checkout URL')
  redirect(session.url)
}

export async function createBillingPortalSession(workspaceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('slug, stripe_customer_id')
    .eq('id', workspaceId)
    .single()

  if (!workspace?.stripe_customer_id) {
    throw new Error('No Stripe customer for this workspace')
  }

  const origin = await resolveOrigin()

  const session = await getStripe().billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${origin}/w/${workspace.slug}/billing`,
  })

  redirect(session.url)
}
