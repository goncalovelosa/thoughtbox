import type { Metadata } from 'next'
import Link from 'next/link'
import { createPublicCheckoutSession } from '@/lib/stripe/actions'

export const metadata: Metadata = {
  title: 'Pricing — Thoughtbox',
  description: 'Persistent reasoning for AI agents. $17.29/month.',
}

export default function PricingPage() {
  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Mind-expansion for AI agents
          </h1>
          <p className="mt-4 text-lg text-foreground/70">
            Thoughtbox gives your AI agents persistent, queryable memory via MCP. One plan, one price.
          </p>
        </div>

        {/* Single plan */}
        <div className="mt-12 rounded-2xl border border-foreground bg-foreground/[0.03] shadow-md ring-1 ring-foreground/10 p-8">
          <span className="mb-4 inline-block w-fit rounded-full bg-foreground px-3 py-0.5 text-xs font-semibold text-background">
            Founding Beta
          </span>

          <h2 className="text-2xl font-bold text-foreground">Full Access</h2>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-5xl font-bold text-foreground">$17.29</span>
            <span className="text-sm text-foreground/70">/ month</span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground/70">
            Everything Thoughtbox offers — hosted cloud, web dashboard, API access, OTEL integration, team features.
            Have a beta invite code? You can redeem it at checkout for a comped subscription.
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {[
              'Hosted on our infrastructure — no Docker required',
              'Web dashboard with session explorer and trace view',
              'API access and key management',
              'Realtime session updates',
              'OTEL trace integration (Claude Code telemetry)',
              'Knowledge graph persistence',
              'Unlimited sessions, thoughts, and data retention',
              'Email support',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-foreground">{f}</span>
              </li>
            ))}
          </ul>

          <form action={createPublicCheckoutSession} className="mt-8">
            <button
              type="submit"
              className="block w-full rounded-full bg-foreground px-6 py-3 text-center text-sm font-semibold text-background transition-all hover:bg-foreground/80"
            >
              Get Access — $17.29/month
            </button>
          </form>

          <p className="mt-3 text-center text-xs text-foreground/60">
            Secure checkout via Stripe. Cancel anytime.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 space-y-8">
          <h2 className="text-lg font-semibold text-foreground">Common questions</h2>

          <div>
            <h3 className="text-sm font-bold text-foreground">What MCP clients are supported?</h3>
            <p className="mt-1 text-sm text-foreground">
              Thoughtbox is optimized for Claude Code. It also works with Cursor, Windsurf, and any MCP-compatible client.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">I have a beta invite code. How do I use it?</h3>
            <p className="mt-1 text-sm text-foreground">
              Click <em>Get Access</em>, then enter your code in Stripe&apos;s <em>Add promotion code</em> field during checkout.
              If your code is a full comp, your card won&apos;t be charged until the beta period ends.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">Do I need Thoughtbox for every task?</h3>
            <p className="mt-1 text-sm text-foreground">
              No. For quick tasks (&lt;10 minutes), your agent thinks just fine natively. Thoughtbox shines for deep research, strategic planning, complex debugging, and architecture design — tasks that take 30+ minutes of sustained reasoning.
            </p>
          </div>
        </div>

        <p className="mt-16 text-center text-sm text-foreground/70">
          More questions?{' '}
          <a href="mailto:thoughtboxsupport@kastalienresearch.ai" className="text-foreground hover:underline-thick hover:underline">
            Email us
          </a>{' '}
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
