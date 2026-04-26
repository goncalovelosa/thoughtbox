import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLAN_CONFIG } from '@/lib/stripe/server'
import { BillingActions } from './billing-actions'

export const metadata: Metadata = { title: 'Billing' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function BillingPage({ params }: Props) {
  const { workspaceSlug } = await params
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, slug, subscription_status, stripe_customer_id')
    .eq('slug', workspaceSlug)
    .single()

  const subscriptionStatus = workspace?.subscription_status ?? 'inactive'
  const isActive = subscriptionStatus === 'active'
  const hasStripeCustomer = Boolean(workspace?.stripe_customer_id)
  const founding = PLAN_CONFIG.founding

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Subscription
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{founding.name}</p>
            <p className="mt-1 text-sm text-foreground">
              {isActive
                ? `$${founding.price}/month`
                : `No active subscription — upgrade to access the dashboard.`}
            </p>
          </div>
          <StatusBadge status={subscriptionStatus} />
        </div>

        {workspace && (
          <div className="mt-6 border-t border-foreground/10 pt-5">
            <BillingActions
              workspaceId={workspace.id}
              isActive={isActive}
              hasStripeCustomer={hasStripeCustomer}
            />
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-foreground">
        Need a custom plan?{' '}
        <Link href="/support" className="text-foreground hover:underline-thick hover:underline">
          Contact us
        </Link>
        .
      </p>

      <div className="mt-8 flex items-center justify-between rounded-2xl border border-foreground/10 bg-foreground/[0.03] px-6 py-4 shadow-sm">
        <p className="text-sm text-foreground">View detailed usage breakdown</p>
        <Link
          href={`/w/${workspaceSlug}/usage`}
          className="text-sm font-medium text-foreground hover:underline-thick hover:text-foreground transition-colors"
        >
          Usage →
        </Link>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === 'active'
      ? 'bg-green-100 text-green-700'
      : status === 'past_due'
        ? 'bg-amber-100 text-amber-700'
        : 'bg-red-100 text-red-700'

  const label =
    status === 'active'
      ? 'Active'
      : status === 'past_due'
        ? 'Past Due'
        : status === 'canceled'
          ? 'Canceled'
          : 'Inactive'

  return (
    <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  )
}
