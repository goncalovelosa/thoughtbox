'use client'

import { createCheckoutSession, createBillingPortalSession } from '@/lib/stripe/actions'

type Props = {
  workspaceId: string
  isActive: boolean
  hasStripeCustomer: boolean
}

export function BillingActions({ workspaceId, isActive, hasStripeCustomer }: Props) {
  // Past-due / canceled subscribers (isActive=false but hasStripeCustomer=true)
  // need the billing portal to fix payment, not a new checkout.
  if (!isActive && !hasStripeCustomer) {
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
            {isActive ? 'Manage subscription' : 'Update payment method'}
          </button>
        </form>
      )}
    </div>
  )
}
