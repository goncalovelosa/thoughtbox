import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'

// Use service role client — webhooks run without user context
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Stripe webhook signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const workspaceId = session.metadata?.workspace_id
      const planId = session.metadata?.plan_id

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

      // Look up workspace by stripe_customer_id
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

      const { error } = await supabase
        .from('workspaces')
        .update({
          plan_id: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        })
        .eq('id', workspace.id)

      if (error) console.error('Failed to downgrade workspace:', error)
      else console.log(`Workspace ${workspace.id} downgraded to free`)
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
      // Unhandled event type — acknowledge receipt
      break
  }

  return NextResponse.json({ received: true })
}
