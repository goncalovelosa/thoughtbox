import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Use service role client — webhooks run without user context.
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  // Split the header check from the env-var check so each returns the
  // appropriate status code:
  //  - Missing stripe-signature header → 400 (request is not from Stripe, or
  //    is malformed; retrying won't help and we want the forgery defense)
  //  - Missing STRIPE_WEBHOOK_SECRET env var → 500 (server misconfiguration;
  //    we want Stripe to retry so the problem can self-heal once ops fixes
  //    the config, rather than Stripe giving up permanently)
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured in runtime env')
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const planId = session.metadata?.plan_id

      // Only the in-app upgrade flow goes through the webhook. Public-signup
      // account creation lives on /sign-up/claim — see that file for the
      // create-user + workspace-update flow.
      const workspaceId = session.metadata?.workspace_id
      if (!workspaceId || !planId) {
        console.error('checkout.session.completed missing metadata:', session.id)
        break
      }

      const { error } = await supabase
        .from('workspaces')
        .update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan_id: planId,
          subscription_status: 'active',
        })
        .eq('id', workspaceId)

      if (error) {
        console.error('Failed to update workspace after checkout:', error)
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
      }

      console.log(`Workspace ${workspaceId} upgraded to ${planId}`)
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: workspace, error: lookupError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (lookupError || !workspace) {
        console.error('subscription.updated: workspace not found for customer', customerId)
        break
      }

      const status = subscription.status === 'active' ? 'active'
        : subscription.status === 'past_due' ? 'past_due'
        : subscription.status === 'canceled' ? 'canceled'
        : subscription.status

      const { error } = await supabase
        .from('workspaces')
        .update({ subscription_status: status })
        .eq('id', workspace.id)

      if (error) console.error('Failed to update subscription status:', error)
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!workspace) break

      // Single-tier product: only `founding` exists in PLAN_CONFIG, so the
      // legacy `'free'` tombstone is no longer meaningful. Leave plan_id as-is
      // and signal cancellation via subscription_status, which the UI uses.
      const { error } = await supabase
        .from('workspaces')
        .update({
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        })
        .eq('id', workspace.id)

      if (error) console.error('Failed to mark workspace canceled:', error)
      else console.log(`Workspace ${workspace.id} subscription canceled`)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!workspace) break

      await supabase
        .from('workspaces')
        .update({ subscription_status: 'past_due' })
        .eq('id', workspace.id)

      console.log(`Workspace ${workspace.id} marked past_due`)
      break
    }

    default:
      break
  }

  return NextResponse.json({ received: true })
}
