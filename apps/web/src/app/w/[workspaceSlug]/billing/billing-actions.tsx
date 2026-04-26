'use client'

import { createCheckoutSession, createBillingPortalSession } from '@/lib/stripe/actions'

type Props = {
  workspaceId: string
  isActive: boolean
  hasStripeCustomer: boolean
}

export function BillingActions({ workspaceId, isActive, hasStripeCustomer }: Props) {
  if (!isActive) {
    return (
      <div className="flex flex-wrap gap-3">
        <form action={async () => { await createCheckoutSession(workspaceId, 'founding') }}>
          <button
            type="submit"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition-all hover:bg-foreground/80"
          >
            Upgrade to Founding Beta — $17.29/mo
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-3">
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
