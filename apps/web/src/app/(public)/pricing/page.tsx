import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing — Thoughtbox',
  description: 'Mind-expansion for AI agents. Free founding beta through May 10. Join now.',
}

const BETA_END = 'May 10, 2026'

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
            Thoughtbox is free during the founding beta through {BETA_END}. No credit card required.
          </p>
        </div>

        {/* Single plan */}
        <div className="mt-12 rounded-2xl border border-foreground bg-foreground/[0.03] shadow-md ring-1 ring-foreground/10 p-8">
          <span className="mb-4 inline-block w-fit rounded-full bg-foreground px-3 py-0.5 text-xs font-semibold text-background">
            Founding Beta
          </span>

          <h2 className="text-2xl font-bold text-foreground">Full Access</h2>

          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-5xl font-bold text-foreground">$0</span>
            <span className="text-sm text-foreground/70">through {BETA_END}</span>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground/70">
            Everything Thoughtbox offers — hosted cloud, web dashboard, API access,
            OTEL integration, team features — completely free while we build this together with our founding users.
          </p>

          <ul className="mt-6 flex flex-col gap-3">
            {[
              'Hosted on our infrastructure — no Docker required',
              'Web dashboard with session explorer and trace view',
              'API access and key management',
              'Realtime session updates',
              'OTEL trace integration (Claude Code telemetry)',
              'Knowledge graph persistence',
              'Team workspaces and Hub collaboration',
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

          <Link
            href="/sign-up"
            className="mt-8 block rounded-full bg-foreground px-6 py-3 text-center text-sm font-semibold text-background transition-all hover:bg-foreground/80"
          >
            Join the founding beta
          </Link>
        </div>

        {/* Self-host option */}
        <div className="mt-6 rounded-2xl border border-foreground/10 bg-background p-6 text-center">
          <h3 className="text-sm font-semibold text-foreground">Prefer to self-host?</h3>
          <p className="mt-2 text-sm text-foreground/70">
            Thoughtbox is open source. Run it locally with Docker or npx — free forever, no account needed.
          </p>
          <Link
            href="https://github.com/Kastalien-Research/thoughtbox"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-semibold text-foreground hover:underline-thick hover:underline"
          >
            View on GitHub
          </Link>
        </div>

        {/* Audit offer */}
        <div className="mt-6 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 text-center">
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
        <div className="mt-6 rounded-2xl border border-foreground/10 bg-background p-6 text-center">
          <h3 className="text-sm font-semibold text-foreground">Enterprise</h3>
          <p className="mt-2 text-sm text-foreground/70">
            SSO, unlimited seats, SLA, compliance exports, dedicated support.
          </p>
          <Link
            href="/support"
            className="mt-3 inline-block text-sm font-semibold text-foreground hover:underline-thick hover:underline"
          >
            Contact sales
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
            <h3 className="text-sm font-bold text-foreground">What happens after the beta?</h3>
            <p className="mt-1 text-sm text-foreground">
              Paid plans will be introduced after {BETA_END}. Founding beta users will get advance notice and favorable terms.
              Self-hosting remains free forever.
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
