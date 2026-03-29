import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Billing' }

type Props = { params: Promise<{ workspaceSlug: string }> }

const plans = [
  {
    name: 'Founding Beta',
    price: 'Free through May 1',
    active: true,
    features: ['Unlimited thoughts', 'Unlimited projects', 'Unlimited API keys', 'Full run history', 'Direct line to the team'],
  },
]

export default async function BillingPage({ params }: Props) {
  const { workspaceSlug } = await params

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-foreground">
          Manage your subscription and payment details.{' '}
          <span className="italic text-foreground">
            Stripe integration coming soon (ADR-BILL-01).
          </span>
        </p>
      </div>

      {/* Current plan */}
      <div className="mb-6 rounded-none border border-foreground bg-background p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Current plan
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">Founding Beta</p>
            <p className="mt-1 text-sm text-foreground">Free through May 1, 2026</p>
          </div>
          <span className="rounded-none bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Active
          </span>
        </div>

        <div className="mt-6 border-t border-foreground pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
            Founding beta
          </p>
          <p className="mt-2 text-sm text-foreground">
            You have full, unlimited access through May 1, 2026. Paid plans will be announced before then — founding beta members get early notice and favorable terms.
          </p>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-none border p-5 ${
              plan.active
                ? 'border-foreground bg-background'
                : 'border-foreground bg-background'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">{plan.name}</p>
              {plan.active && (
                <span className="rounded-none bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  Current
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-foreground">{plan.price}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {plan.features.map((f) => (
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
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-foreground">
        Need a custom plan?{' '}
        <Link href="/support" className="text-foreground hover:underline-thick hover:underline">
          Contact us
        </Link>
        . View{' '}
        <Link href="/pricing" className="text-foreground hover:underline-thick hover:underline">
          full pricing page
        </Link>
        .
      </p>

      {/* Usage quick link */}
      <div className="mt-8 flex items-center justify-between rounded-none border border-foreground bg-background px-6 py-4 shadow-sm">
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
