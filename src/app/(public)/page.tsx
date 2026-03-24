import type { Metadata } from 'next'
import Link from 'next/link'
import { Brain, Network, Search, Key, FolderOpen, BarChart3 } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thoughtbox — Persistent memory for AI agents',
}

const features = [
  {
    title: 'Persistent thought capture',
    description:
      'Store thoughts, ideas, and reasoning steps with rich metadata. Query them back instantly with semantic search.',
    icon: <Brain className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Knowledge graphs',
    description:
      'Build and traverse entity graphs automatically as your agents think. Surface hidden connections.',
    icon: <Network className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Full run tracing',
    description:
      'Every MCP session is logged from start to finish. Inspect the exact sequence of thoughts that led to any conclusion.',
    icon: <Search className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'API key management',
    description:
      'Issue, rotate, and revoke keys per workspace. Fine-grained control without complexity.',
    icon: <Key className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Multi-project workspaces',
    description:
      'Organize memory across projects. Each project gets its own isolated context, all in one workspace.',
    icon: <FolderOpen className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Usage & billing transparency',
    description:
      'See exactly what you\'ve used, when, and how much it costs. No surprise invoices.',
    icon: <BarChart3 className="h-8 w-8 text-foreground" />,
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 dots-pattern" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-none border border-foreground bg-background px-4 py-1.5 text-sm font-medium text-foreground">
            <span className="h-1.5 w-1.5 rounded-none bg-foreground" />
            Now in early access
          </div>
          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl uppercase">
            Observable Agency
            <br />
            <span className="text-foreground hover:underline-thick">for AI Systems</span>
          </h1>
          <p className="mt-6 text-xl text-foreground sm:text-2xl font-medium tracking-wide">
            Thoughtbox is an intention ledger for agents that lets you evaluate AI&apos;s decisions against its decision-making.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className="rounded-none border-4 border-foreground bg-foreground text-background px-8 py-3.5 text-base font-bold uppercase tracking-wider hover-grow"
            >
              Get started free
            </Link>
            <Link
              href="/docs/quickstart"
              className="border-4 border-foreground bg-background text-foreground px-8 py-3.5 text-base font-bold uppercase tracking-wider hover-grow"
            >
              Read the quickstart →
            </Link>
          </div>
        </div>
      </section>

      {/* Code preview */}
      <section className="border-y border-foreground bg-background px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-foreground">
            Connect in seconds
          </p>
          <pre className="overflow-x-auto rounded-none border-2 border-foreground bg-background p-6 font-mono text-sm leading-relaxed text-foreground">
            <code>{`# Add Thoughtbox to your MCP client config
{
  "mcpServers": {
    "thoughtbox": {
      "type": "http",
      "url": "https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp?key=tbx_YOUR_API_KEY"
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
              Everything your agents need to remember
            </h2>
            <p className="mt-4 text-lg text-foreground">
              Built specifically for LLM agent workflows. No generic note-taking tools.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-none border border-foreground bg-background p-6 shadow-sm"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-foreground text-background border-2 border-foreground px-6 py-20 text-center text-background">
        <h2 className="text-3xl font-bold">Ready to give your agents a memory?</h2>
        <p className="mt-4 text-foreground">
          Sign up in 60 seconds. No credit card required on the free plan.
        </p>
        <Link
          href="/sign-up"
          className="mt-8 inline-block rounded-none bg-background px-8 py-3.5 text-base font-semibold text-foreground shadow-sm hover:bg-background transition-colors"
        >
          Create your workspace
        </Link>
      </section>
    </>
  )
}
