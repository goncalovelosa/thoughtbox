import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PLAN_CONFIG, type PlanId } from '@/lib/stripe/server'
import { BillingActions } from './billing-actions'

export const metadata: Metadata = { title: 'Billing' }

type Props = { params: Promise<{ workspaceSlug: string }> }

export default async function BillingPage({ params }: Props) {
  const { workspaceSlug } = await params
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, slug, plan_id, subscription_status, stripe_customer_id')
    .eq('slug', workspaceSlug)
    .single()

  const rawPlanId = workspace?.plan_id ?? 'free'
  const planId: PlanId = rawPlanId in PLAN_CONFIG ? rawPlanId as PlanId : 'free'
  const planConfig = PLAN_CONFIG[planId]
  const subscriptionStatus = workspace?.subscription_status || 'active'
  const hasStripeCustomer = Boolean(workspace?.stripe_customer_id)

  const upgraded = false // Check searchParams if you want the ?upgraded=true flash

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      {upgraded && (
        <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-sm text-green-700">
          Upgrade successful! Your workspace is now on the {planConfig.name} plan.
        </div>
      )}

      {/* Current plan */}
      <div className="mb-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Current plan
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{planConfig.name}</p>
            <p className="mt-1 text-sm text-foreground">
              {planId === 'free'
                ? 'Free tier — upgrade to unlock unlimited sessions and thoughts.'
                : `$${planConfig.price}/month`}
            </p>
          </div>
          <StatusBadge status={subscriptionStatus} />
        </div>

        {workspace && (
          <div className="mt-6 border-t border-foreground/10 pt-5">
            <BillingActions
              workspaceId={workspace.id}
              currentPlanId={planId}
              hasStripeCustomer={hasStripeCustomer}
            />
          </div>
        )}
      </div>

      {/* Plan comparison */}
      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.entries(PLAN_CONFIG) as [PlanId, typeof PLAN_CONFIG[PlanId]][]).map(
          ([id, config]) => (
            <PlanCard
              key={id}
              planId={id}
              name={config.name}
              price={config.price}
              isCurrent={id === planId}
            />
          ),
        )}
      </div>

      <p className="mt-6 text-center text-xs text-foreground">
        Need a custom plan?{' '}
        <Link href="/support" className="text-foreground hover:underline-thick hover:underline">
          Contact us
        </Link>
        .
      </p>

      {/* Usage quick link */}
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

const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: ['5 sessions', '100 thoughts', '2 API keys', '30-day retention', 'Community support'],
  pro: ['Unlimited sessions', 'Unlimited thoughts', '10 API keys', 'Unlimited retention', 'Realtime', 'OTEL traces', 'Email support'],
  team: ['Everything in Pro', '5 seats', '25 API keys', 'Shared workspaces', 'Hub collaboration', 'Priority support'],
}

function PlanCard({
  planId,
  name,
  price,
  isCurrent,
}: {
  planId: PlanId
  name: string
  price: number
  isCurrent: boolean
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        isCurrent
          ? 'border-foreground/20 bg-foreground/[0.03]'
          : 'border-foreground/10 bg-background'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">{name}</p>
        {isCurrent && (
          <span className="rounded-lg bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
            Current
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-foreground">
        {price === 0 ? 'Free' : `$${price}/mo`}
      </p>
      <ul className="mt-4 flex flex-col gap-2">
        {PLAN_FEATURES[planId].map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {f}
          </li>
        ))}
      </ul>
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
          : status

  return (
    <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${styles}`}>
      {label}
    </span>
  )
}
