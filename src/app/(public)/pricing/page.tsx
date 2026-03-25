import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Pricing — Founding Beta',
}

const included = [
  'One hosted workspace',
  'Full Code Mode access (tb SDK)',
  'Session trace visualization',
  'Knowledge graph',
  'API key management',
  'Founder-assisted onboarding',
  'Direct line to the team',
  'Early input into the product roadmap',
]

export default function PricingPage() {
  return (
    <div className="px-6 py-24">
      <div className="mx-auto max-w-2xl">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
            Founding Beta
          </h1>
          <p className="mt-4 text-lg text-foreground">
            Thoughtbox is early. You get in at the ground floor, we get honest signal about what matters. One price, no tiers.
          </p>
        </div>

        {/* Single card */}
        <div className="mt-12 border-4 border-foreground bg-background p-8">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-foreground">$99</span>
            <span className="text-sm text-foreground">one-time</span>
          </div>

          <p className="mt-4 text-sm text-foreground leading-relaxed">
            Pay once, get founding beta access for the life of the beta period.
            When we introduce usage-based plans, founding members get grandfathered pricing.
          </p>

          <ul className="mt-8 flex flex-col gap-3">
            {included.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-foreground"
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
                <span className="text-foreground">{item}</span>
              </li>
            ))}
          </ul>

          <a
            href="mailto:glassBead@kastalienresearch.ai?subject=Thoughtbox%20Founding%20Beta"
            className="mt-10 block rounded-none bg-foreground px-6 py-3 text-center text-sm font-black uppercase tracking-wider text-background transition-colors hover:bg-foreground/90"
          >
            Get founding beta access
          </a>

          <p className="mt-4 text-center text-xs text-foreground/60">
            We&apos;ll respond within 24 hours to set up your workspace.
          </p>
        </div>

        {/* Self-host */}
        <div className="mt-8 border-2 border-foreground bg-background p-6 text-center">
          <h3 className="text-sm font-black uppercase text-foreground">Or self-host for free</h3>
          <p className="mt-2 text-sm text-foreground">
            Thoughtbox is open source. Run it locally with Docker — your data never leaves your machine.
          </p>
          <a
            href="https://github.com/Kastalien-Research/thoughtbox"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm font-semibold text-foreground hover:underline-thick hover:underline"
          >
            View on GitHub &rarr;
          </a>
        </div>

        {/* FAQ */}
        <div className="mt-16 space-y-8">
          <h2 className="text-lg font-black uppercase text-foreground">Common questions</h2>

          <div>
            <h3 className="text-sm font-bold text-foreground">What do I get?</h3>
            <p className="mt-1 text-sm text-foreground">
              A hosted Thoughtbox workspace connected to your MCP clients. Your agents record structured reasoning traces that you can inspect, replay, and analyze in the dashboard.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">What MCP clients are supported?</h3>
            <p className="mt-1 text-sm text-foreground">
              Thoughtbox is optimized for Claude Code. It also works with Cursor and VS Code via MCP configuration. We&apos;re actively expanding client support.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">What does &ldquo;founding beta&rdquo; mean?</h3>
            <p className="mt-1 text-sm text-foreground">
              The product is early and actively evolving. You get direct access to the team, your feedback shapes the roadmap, and you&apos;ll be grandfathered into favorable pricing when we move to general availability.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-foreground">What&apos;s the difference between hosted and self-hosted?</h3>
            <p className="mt-1 text-sm text-foreground">
              Same product. The founding beta gives you a managed workspace, onboarding support, and a direct line to the team. Self-hosting is free forever — you run the Docker container and manage your own data.
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
