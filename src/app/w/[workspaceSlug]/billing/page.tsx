import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Billing' }

type Props = { params: Promise<{ workspaceSlug: string }> }

const plans = [
  {
    name: 'Free',
    price: '$0 / month',
    active: true,
    features: ['10,000 thoughts / month', '3 projects', '1 API key', '30-day run history'],
  },
  {
    name: 'Pro',
    price: '$29 / month',
    active: false,
    features: ['500,000 thoughts / month', 'Unlimited projects', 'Unlimited API keys', '1-year run history', 'Usage analytics'],
  },
]

export default async function BillingPage({ params }: Props) {
  const { workspaceSlug } = await params

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your subscription and payment details.{' '}
          <span className="italic text-slate-400">
            Stripe integration coming soon (ADR-BILL-01).
          </span>
        </p>
      </div>

      {/* Current plan */}
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Current plan
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900">Free</p>
            <p className="mt-1 text-sm text-slate-500">$0 / month · renews never</p>
          </div>
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Active
          </span>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Next steps
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Upgrade to Pro to unlock higher limits, longer run history, and priority support.
          </p>
          <button
            disabled
            className="mt-4 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white opacity-50 cursor-not-allowed"
            title="Stripe integration coming soon"
          >
            Upgrade to Pro — $29/month
          </button>
          <p className="mt-2 text-xs text-slate-400">
            Stripe checkout will be enabled once ADR-BILL-01 is implemented.
          </p>
        </div>
      </div>

      {/* Plan comparison */}
      <div className="grid gap-4 sm:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl border p-5 ${
              plan.active
                ? 'border-brand-300 bg-brand-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{plan.name}</p>
              {plan.active && (
                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                  Current
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{plan.price}</p>
            <ul className="mt-4 flex flex-col gap-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-brand-500"
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

      <p className="mt-6 text-center text-xs text-slate-400">
        Need a custom plan?{' '}
        <Link href="/support" className="text-brand-600 hover:underline">
          Contact us
        </Link>
        . View{' '}
        <Link href="/pricing" className="text-brand-600 hover:underline">
          full pricing page
        </Link>
        .
      </p>

      {/* Usage quick link */}
      <div className="mt-8 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
        <p className="text-sm text-slate-700">View detailed usage breakdown</p>
        <Link
          href={`/w/${workspaceSlug}/usage`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Usage →
        </Link>
      </div>
    </div>
  )
}
