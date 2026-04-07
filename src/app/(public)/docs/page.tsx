import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation',
}

const sections = [
  {
    title: 'Getting started',
    items: [
      { label: 'Quickstart', href: '/docs/quickstart', description: 'Connect your first MCP client in under 5 minutes.' },
    ],
  },
  {
    title: 'Core concepts',
    items: [
      { label: 'Sessions & Thoughts', href: '/docs/sessions-and-thoughts', description: 'The structured reasoning trace — sessions, thoughts, branching, and revisions.' },
      { label: 'Code Mode', href: '/docs/code-mode', description: 'Two MCP tools replace dozens. Write JavaScript against the tb SDK.' },
      { label: 'Authentication', href: '/docs/authentication', description: 'API key format, creation, rotation, and workspace scoping.' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Session Lifecycle', href: '/docs/session-lifecycle', description: 'Session lifecycle, search, resume, export, and analysis.' },
      { label: 'Knowledge Graph', href: '/docs/knowledge-graph', description: 'Entities, relations, observations, and graph traversal.' },
      { label: 'Interleaved Thinking', href: '/docs/interleaved-thinking', description: 'IRCoT pattern: think, act, reflect, repeat.' },
      { label: 'Ulysses Protocol', href: '/docs/ulysses-protocol', description: 'Surprise-gated debugging with forced hypotheses.' },
      { label: 'Subagent Patterns', href: '/docs/subagent-patterns', description: 'Context isolation for session retrieval and thought evolution.' },
      { label: 'Observability', href: '/docs/observability', description: 'OTEL setup, cost tracking, and session timelines.' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Documentation</h1>
        <p className="mt-4 text-lg text-foreground/70">
          Everything you need to connect Thoughtbox to your AI agents.
        </p>

        <div className="mt-12 grid gap-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground">
                {section.title}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group flex flex-col gap-1 rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 transition-colors hover:bg-foreground/[0.06]"
                    >
                      <span className="font-semibold text-foreground group-hover:underline">
                        {item.label}
                      </span>
                      <span className="text-sm text-foreground/70">{item.description}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
