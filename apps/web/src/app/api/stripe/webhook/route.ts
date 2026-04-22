import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/server'
import { createClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { getSiteUrl } from '@/lib/thoughtbox-config'

// Use service role client — webhooks run without user context.
function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Supabase env vars missing')
  return createClient(url, key)
}

// Look up an existing auth user by email via Supabase admin API.
// Returns the user or null. As of @supabase/supabase-js 2.99.1, the JS SDK
// admin surface does not expose a direct getUserByEmail helper (only
// getUserById and listUsers); we call the GoTrue REST endpoint directly.
// Revisit if a future SDK upgrade adds a typed email lookup.
async function findAuthUserByEmail(email: string): Promise<{ id: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  const r = await fetch(
    `${url}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  )
  if (!r.ok) return null
  const body = await r.json()
  const users = Array.isArray(body?.users) ? body.users : Array.isArray(body) ? body : []
  return users[0] ?? null
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
      const signupFlow = session.metadata?.signup_flow
      const planId = session.metadata?.plan_id

      // Public signup flow: webhook is the authoritative account creator.
      // This branch creates the Supabase auth user and updates the auto-
      // provisioned workspace with Stripe state. No workspace_id is expected
      // in metadata because the workspace does not exist yet at checkout time.
      if (signupFlow === 'public') {
        const email = session.customer_details?.email
        const customerId = session.customer as string | null
        const subscriptionId = session.subscription as string | null

        // All three guards return 500 (not 400) so Stripe retries with
        // exponential backoff for up to ~3 days. 4xx would make Stripe give up
        // immediately, which is catastrophic here: the user has already been
        // charged, so we need a recovery window to either auto-heal (transient
        // race) or manually intervene (genuine anomaly surfaced in logs).
        if (!email) {
          console.error('public signup webhook missing customer_details.email:', session.id)
          return NextResponse.json({ error: 'missing email' }, { status: 500 })
        }
        if (!customerId || !subscriptionId) {
          console.error('public signup webhook missing customer or subscription:', session.id)
          return NextResponse.json({ error: 'missing stripe ids' }, { status: 500 })
        }

        // Find or create the auth user. createUser is idempotent from our side:
        // if the email already exists (e.g. webhook re-delivery), we fetch the
        // existing user and proceed.
        let userId: string
        const { data: createData, error: createError } =
          await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              signup_source: 'stripe_checkout',
              stripe_session_id: session.id,
            },
          })

        if (createError) {
          // Common case: user already exists (webhook redelivery). Look up.
          const existing = await findAuthUserByEmail(email)
          if (!existing) {
            console.error('Failed to create user and no existing user found:', createError)
            return NextResponse.json({ error: 'user creation failed' }, { status: 500 })
          }
          userId = existing.id
        } else {
          userId = createData.user.id
        }

        // The auto-provisioning trigger (handle_new_user) creates the
        // workspace row synchronously when createUser inserts into
        // auth.users, so the UPDATE below will find it. For the re-delivery
        // path (existing user), we still update to reflect latest Stripe state.
        //
        // We chain .select('id') so we can detect the zero-rows-matched case
        // (e.g. the auto-provisioning trigger failed silently, or the user
        // pre-dates the trigger). PostgREST does NOT raise an error on a
        // zero-row UPDATE; without this check the webhook would return 200 to
        // Stripe and leave the user charged but without Stripe IDs populated
        // on their workspace. Returning 500 lets Stripe's at-least-once
        // retry handle the gap.
        const { data: updatedRows, error: updateError } = await supabase
          .from('workspaces')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_id: planId ?? 'founding',
            subscription_status: 'active',
          })
          .eq('owner_user_id', userId)
          .select('id')

        if (updateError || !updatedRows || updatedRows.length === 0) {
          console.error('Failed to update workspace after public signup:', {
            userId,
            email,
            rowsUpdated: updatedRows?.length ?? 0,
            updateError,
          })
          return NextResponse.json(
            { error: 'workspace update failed — no rows matched owner_user_id' },
            { status: 500 },
          )
        }

        // Send the user a set-password link. We use resetPasswordForEmail rather
        // than inviteUserByEmail because the user already exists (just-created
        // above) and because recovery links are the supported flow for setting
        // the initial password on an admin-created account. Failure here is
        // logged but non-fatal: the user can request a fresh link from the
        // claim page.
        const { error: mailError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${getSiteUrl()}/api/auth/callback?next=/reset-password`,
        })
        if (mailError) {
          console.error('Failed to send welcome email:', mailError)
        }

        console.log(`Public signup completed for ${email} → user ${userId}`)
        break
      }

      // In-app upgrade flow (authenticated user clicked Upgrade on the billing
      // page). Workspace already exists; metadata carries workspace_id.
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
      break
  }

  return NextResponse.json({ received: true })
}
