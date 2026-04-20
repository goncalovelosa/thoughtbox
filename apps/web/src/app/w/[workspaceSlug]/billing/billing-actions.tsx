'use client'

import { createCheckoutSession, createBillingPortalSession } from '@/lib/stripe/actions'
import type { PlanId } from '@/lib/stripe/server'

type Props = {
  workspaceId: string
  currentPlanId: PlanId
  hasStripeCustomer: boolean
}

export function BillingActions({ workspaceId, currentPlanId, hasStripeCustomer }: Props) {
  if (currentPlanId === 'free') {
    return (
      <div className="flex flex-wrap gap-3">
        <UpgradeButton workspaceId={workspaceId} targetPlan="pro" label="Upgrade to Pro — $27/mo" />
        <UpgradeButton workspaceId={workspaceId} targetPlan="team" label="Upgrade to Team — $91/mo" />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
      {currentPlanId === 'pro' && (
        <UpgradeButton workspaceId={workspaceId} targetPlan="team" label="Upgrade to Team — $91/mo" />
      )}
      {hasStripeCustomer && (
        <form action={async () => { await createBillingPortalSession(workspaceId) }}>
          <button
            type="submit"
            className="rounded-full border border-foreground/20 px-5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
          >
            Manage subscription
          </button>
        </form>
      )}
    </div>
  )
}

function UpgradeButton({
  workspaceId,
  targetPlan,
  label,
}: {
  workspaceId: string
  targetPlan: PlanId
  label: string
}) {
  return (
    <form action={async () => { await createCheckoutSession(workspaceId, targetPlan) }}>
      <button
        type="submit"
        className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-all hover:bg-foreground/80"
      >
        {label}
      </button>
    </form>
  )
}
