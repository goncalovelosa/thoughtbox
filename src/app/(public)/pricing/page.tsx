import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing',
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for exploring Thoughtbox with small projects.',
    cta: 'Get started free',
    ctaHref: '/sign-up',
    highlighted: false,
    features: [
      '1 workspace',
      '3 projects',
      '10,000 thoughts / month',
      '1 API key',
      '30-day run history',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$29',
    period: 'per month',
    description: 'For teams building production AI workflows.',
    cta: 'Start Pro trial',
    ctaHref: '/sign-up',
    highlighted: true,
    features: [
      'Unlimited workspaces',
      'Unlimited projects',
      '500,000 thoughts / month',
      'Unlimited API keys',
      '1-year run history',
      'Priority support',
      'Usage analytics',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    description: 'Dedicated infrastructure, SLAs, and white-glove onboarding.',
    cta: 'Contact sales',
    ctaHref: '/support',
    highlighted: false,
    features: [
      'Everything in Pro',
      'Custom thought limits',
      'Dedicated Cloud Run instances',
      'SSO / SAML',
      'Audit logs',
      'Custom data retention',
      'SLA guarantee',
    ],
  },
]

export default function PricingPage() {
  return (
    <div className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-foreground">
            Start free. Upgrade when you need more. No surprise charges.
          </p>
        </div>

        {/* Plans */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-none p-8 ${
                plan.highlighted
                  ? 'bg-foreground text-background border-2 border-foreground text-background shadow-xl ring-2 ring-foreground'
                  : 'border border-foreground bg-background text-foreground shadow-sm'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-none bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900">
                    Most popular
                  </span>
                </div>
              )}

              <div>
                <h2
                  className={`text-lg font-semibold ${plan.highlighted ? 'text-foreground' : 'text-foreground'}`}
                >
                  {plan.name}
                </h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span
                    className={`text-sm ${plan.highlighted ? 'text-foreground' : 'text-foreground'}`}
                  >
                    / {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm ${plan.highlighted ? 'text-foreground' : 'text-foreground'}`}
                >
                  {plan.description}
                </p>
              </div>

              <ul className="mt-8 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <svg
                      className={`mt-0.5 h-4 w-4 shrink-0 ${plan.highlighted ? 'text-foreground' : 'text-foreground'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className={plan.highlighted ? 'text-background' : 'text-foreground'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`mt-10 block rounded-none px-6 py-3 text-center text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? 'bg-background text-foreground hover:bg-background'
                    : 'bg-foreground text-background border-2 border-foreground text-background hover:bg-background'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <p className="mt-16 text-center text-sm text-foreground">
          Questions?{' '}
          <Link href="/support" className="text-foreground hover:underline-thick hover:underline">
            Contact us
          </Link>{' '}
          or read the{' '}
          <Link href="/docs" className="text-foreground hover:underline-thick hover:underline">
            docs
          </Link>
          .
        </p>
      </div>
    </div>
  )
}
