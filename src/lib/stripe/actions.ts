'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { getStripe, PLAN_CONFIG, type PlanId } from '@/lib/stripe/server'
import { createClient } from '@/lib/supabase/server'

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

  const headersList = await headers()
  const origin = headersList.get('origin') || 'https://thoughtbox.kastalienresearch.ai'

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

  const headersList = await headers()
  const origin = headersList.get('origin') || 'https://thoughtbox.kastalienresearch.ai'

  const session = await getStripe().billingPortal.sessions.create({
    customer: workspace.stripe_customer_id,
    return_url: `${origin}/w/${workspace.slug}/billing`,
  })

  redirect(session.url)
}
