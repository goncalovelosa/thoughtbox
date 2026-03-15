import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Thoughtbox — Persistent memory for AI agents',
}

const features = [
  {
    title: 'Persistent thought capture',
    description:
      'Store thoughts, ideas, and reasoning steps with rich metadata. Query them back instantly with semantic search.',
    icon: '🧠',
  },
  {
    title: 'Knowledge graphs',
    description:
      'Build and traverse entity graphs automatically as your agents think. Surface hidden connections.',
    icon: '🕸️',
  },
  {
    title: 'Full run tracing',
    description:
      'Every MCP session is logged from start to finish. Inspect the exact sequence of thoughts that led to any conclusion.',
    icon: '🔍',
  },
  {
    title: 'API key management',
    description:
      'Issue, rotate, and revoke keys per workspace. Fine-grained control without complexity.',
    icon: '🔑',
  },
  {
    title: 'Multi-project workspaces',
    description:
      'Organize memory across projects. Each project gets its own isolated context, all in one workspace.',
    icon: '📁',
  },
  {
    title: 'Usage & billing transparency',
    description:
      'See exactly what you\'ve used, when, and how much it costs. No surprise invoices.',
    icon: '📊',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_#eef2ff_0%,_transparent_60%)]" />
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            Now in early access
          </div>
          <h1 className="mt-8 text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
            Persistent memory
            <br />
            <span className="text-brand-600">for AI agents</span>
          </h1>
          <p className="mt-6 text-xl text-slate-600 sm:text-2xl">
            Thoughtbox gives your AI agents a queryable external memory via the Model Context
            Protocol. Capture thoughts, build knowledge graphs, and trace every reasoning step.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className="rounded-xl bg-brand-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
            >
              Get started free
            </Link>
            <Link
              href="/docs/quickstart"
              className="rounded-xl border border-slate-200 px-8 py-3.5 text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Read the quickstart →
            </Link>
          </div>
        </div>
      </section>

      {/* Code preview */}
      <section className="border-y border-slate-200 bg-slate-900 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Connect in seconds
          </p>
          <pre className="overflow-x-auto rounded-xl bg-black/40 p-6 font-mono text-sm leading-relaxed text-slate-200">
            <code>{`# Add Thoughtbox to your MCP client config
{
  "mcpServers": {
    "thoughtbox": {
      "url": "https://api.thoughtbox.dev/mcp",
      "headers": {
        "Authorization": "Bearer tbx_YOUR_API_KEY"
      }
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
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything your agents need to remember
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Built specifically for LLM agent workflows. No generic note-taking tools.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="text-3xl">{feature.icon}</div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 px-6 py-20 text-center text-white">
        <h2 className="text-3xl font-bold">Ready to give your agents a memory?</h2>
        <p className="mt-4 text-brand-200">
          Sign up in 60 seconds. No credit card required on the free plan.
        </p>
        <Link
          href="/sign-up"
          className="mt-8 inline-block rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-brand-700 shadow-sm hover:bg-brand-50 transition-colors"
        >
          Create your workspace
        </Link>
      </section>
    </>
  )
}
