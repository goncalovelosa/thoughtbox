import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing — Thoughtbox',
  description: 'Mind-expansion for AI agents. Free founding beta through April 23. Join now.',
}

const BETA_END = 'April 23, 2026'

type Tier = {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  ctaHref: string
  highlighted: boolean
  badge?: string
}

const tiers: Tier[] = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Self-host with Docker or npx. Full access to all 7 modules. Your data stays on your machine.',
    features: [
      'All 7 modules (thought, session, KG, notebook, hub, observability, code mode)',
      'Unlimited sessions and thoughts',
      'Local knowledge graph',
      'Observatory UI',
      'Community support (GitHub Discussions)',
    ],
    cta: 'Install free',
    ctaHref: 'https://github.com/Kastalien-Research/thoughtbox',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$0',
    period: `free until ${BETA_END}`,
    description: `Founding beta — full Pro access at no cost through ${BETA_END}. After beta: $27/month or $270/year.`,
    features: [
      'Everything in Free, plus:',
      'Hosted on our infrastructure',
      'Web dashboard with session explorer',
      'API access and key management',
      'Realtime session updates',
      'OTEL trace integration',
      'Unlimited data retention',
      'Email support',
    ],
    cta: 'Join founding beta',
    ctaHref: '/sign-up',
    highlighted: true,
    badge: 'Founding Beta',
  },
  {
    name: 'Team',
    price: '$0',
    period: `free until ${BETA_END}`,
    description: `Founding beta — full Team access at no cost through ${BETA_END}. After beta: $91/month or $910/year.`,
    features: [
      'Everything in Pro, plus:',
      '5 team seats',
      'Shared workspaces (Hub)',
      'Team knowledge graph',
      '25 API keys',
      'Hub multi-agent collaboration',
      'Priority email support',
    ],
    cta: 'Join founding beta',
    ctaHref: '/sign-up',
    highlighted: false,
    badge: 'Founding Beta',
  },
]

export default function PricingPage() {
  return (
    <div className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Mind-expansion for AI agents
          </h1>
          <p className="mt-4 text-lg text-foreground/70">
            Open source and free to self-host. Cloud is free during the founding beta through {BETA_END}.
          </p>
        </div>

        {/* Tiers */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-6 ${
                tier.highlighted
                  ? 'border-foreground bg-foreground/[0.03] shadow-md ring-1 ring-foreground/10'
                  : 'border-foreground/10 bg-background'
              }`}
            >
              {tier.badge && (
                <span className="mb-3 inline-block w-fit rounded-full bg-foreground px-3 py-0.5 text-xs font-semibold text-background">
                  {tier.badge}
                </span>
              )}

              <h2 className="text-xl font-bold text-foreground">{tier.name}</h2>

              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                <span className="text-sm text-foreground">{tier.period}</span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-foreground/70">
                {tier.description}
              </p>

              <ul className="mt-6 flex flex-1 flex-col gap-3">
                {tier.features.map((f) => (
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

              <Link
                href={tier.ctaHref}
                target={tier.ctaHref.startsWith('http') ? '_blank' : undefined}
                rel={tier.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
                className={`mt-8 block rounded-full px-6 py-3 text-center text-sm font-semibold transition-all ${
                  tier.highlighted
                    ? 'bg-foreground text-background hover:bg-foreground/80'
                    : 'border border-foreground/20 text-foreground hover:bg-foreground/5'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* Audit offer */}
        <div className="mt-12 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 text-center">
          <h3 className="text-lg font-bold text-foreground">Not sure where to start?</h3>
          <p className="mt-2 text-sm text-foreground/70">
            Get a free Agent Reasoning Audit — we analyze your AI agent setup and
            show you where structured reasoning would improve your outcomes.
          </p>
          <Link
            href="/support"
            className="mt-4 inline-block rounded-full bg-foreground px-6 py-2.5 text-sm font-semibold text-background transition-all hover:bg-foreground/80"
          >
            Request a free audit
          </Link>
        </div>

        {/* Enterprise */}
        <div className="mt-8 rounded-2xl border border-foreground/10 bg-background p-6 text-center">
          <h3 className="text-sm font-semibold text-foreground">Enterprise</h3>
          <p className="mt-2 text-sm text-foreground">
            SSO, unlimited seats, SLA, compliance exports, dedicated support.
          </p>
          <Link
            href="/support"
            className="mt-3 inline-block text-sm font-semibold text-foreground hover:underline-thick hover:underline"
          >
            Contact sales →
          </Link>
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
            <h3 className="text-sm font-bold text-foreground">What&apos;s the difference between self-hosted and Cloud?</h3>
            <p className="mt-1 text-sm text-foreground">
              Same product. Cloud gives you hosted infrastructure, a web dashboard for browsing sessions, and no Docker setup. Self-hosted is free forever — you run the container and own your data.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">What does the founding beta include?</h3>
            <p className="mt-1 text-sm text-foreground">
              Everything. Full Pro and Team access at no cost through {BETA_END}. No credit card required. After beta, paid plans kick in — or you can continue self-hosting for free. Browse a real 167-thought session right now on the{' '}
              <Link href="/explore/agentic-reasoning-research" className="text-foreground hover:underline-thick hover:underline font-semibold">
                session explorer
              </Link>.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">Do I need Thoughtbox for every task?</h3>
            <p className="mt-1 text-sm text-foreground">
              No. For quick tasks (&lt;10 minutes), your agent thinks just fine natively. Thoughtbox shines for deep research, strategic planning, complex debugging, and architecture design — tasks that take 30+ minutes of sustained reasoning.
            </p>
          </div>
        </div>

        <p className="mt-16 text-center text-sm text-foreground">
          More questions?{' '}
          <a href="mailto:glassBead@kastalienresearch.ai" className="text-foreground hover:underline-thick hover:underline">
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
