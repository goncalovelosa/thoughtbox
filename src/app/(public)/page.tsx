import type { Metadata } from 'next'
import Link from 'next/link'
import { GitBranch, Code2, Network, PlayCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thoughtbox — Observable agency for AI systems',
}

const features = [
  {
    title: 'Replayable reasoning traces',
    description:
      'Every session is a numbered, timestamped chain of thoughts. Reconstruct exactly what the agent was reasoning about when it took any action.',
    icon: <PlayCircle className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Branch visualization',
    description:
      'See where the agent explored alternatives, forked into parallel paths, and converged on a decision. Topology is visible, not hidden.',
    icon: <GitBranch className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Code Mode',
    description:
      'Two MCP tools replace dozens. Agents write JavaScript against the tb SDK to search, record, and analyze — no context window bloat.',
    icon: <Code2 className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Knowledge graph',
    description:
      'Entities, relations, and observations accumulate across sessions. Prior experience surfaces automatically to new agents.',
    icon: <Network className="h-8 w-8 text-foreground" />,
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 dots-pattern" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-foreground/5 px-4 py-1.5 text-sm font-medium tracking-wide text-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Founding beta — now open
          </div>
          <h1 className="mt-8 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Observable Agency
            <br />
            <span className="text-foreground/80">for AI Systems</span>
          </h1>
          <p className="mt-6 text-xl text-foreground/70 sm:text-2xl font-normal leading-relaxed">
            Thoughtbox is an intention ledger. When an agent causes a failure, you get the black box recording — what it was reasoning, what it considered, and why it decided what it did.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/pricing"
              className="rounded-full bg-foreground text-background px-8 py-3.5 text-base font-semibold transition-all hover:bg-foreground/80"
            >
              Join the founding beta
            </Link>
            <Link
              href="/docs/quickstart"
              className="rounded-full border border-foreground/20 bg-foreground/5 text-foreground px-8 py-3.5 text-base font-semibold transition-all hover:bg-foreground/10"
            >
              Read the quickstart
            </Link>
          </div>
        </div>
      </section>

      {/* Code preview */}
      <section className="border-y border-foreground/10 bg-foreground/[0.02] px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Connect in seconds
          </p>
          <pre className="overflow-x-auto rounded-xl border border-foreground/10 bg-background p-6 font-mono text-sm leading-relaxed text-foreground">
            <code>{`# Add Thoughtbox to your MCP client config
{
  "mcpServers": {
    "thoughtbox": {
      "type": "http",
      "url": "https://mcp.kastalienresearch.ai/mcp?key=tbx_YOUR_API_KEY"
    }
  }
}`}</code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              The audit trail your agents are missing
            </h2>
            <p className="mt-4 text-lg text-foreground/70">
              Agents are ephemeral. Thoughtbox captures the reasoning that would otherwise disappear when the session ends.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-8 transition-colors hover:bg-foreground/[0.06]"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-foreground/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background rounded-3xl mx-6 my-12 px-6 py-20 text-center">
        <h2 className="text-3xl font-bold text-background">Know why your agents did what they did</h2>
        <p className="mt-4 text-background/60">
          Free through May 1. Full access, no credit card. Sign up and start recording agent reasoning today.
        </p>
        <Link
          href="/pricing"
          className="mt-8 inline-block rounded-full bg-background px-8 py-3.5 text-base font-semibold text-foreground transition-all hover:bg-background/90"
        >
          Join the founding beta
        </Link>
      </section>
    </>
  )
}
