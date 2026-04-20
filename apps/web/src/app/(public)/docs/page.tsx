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
      <div className="mx-auto max-w-6xl">
        <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground relative inline-block">
          <span className="relative z-10">DOCUMENTATION</span>
          <div className="absolute -bottom-4 -right-4 w-12 h-12 diagonal-lines opacity-10"></div>
        </h1>
        <p className="mt-8 text-xl md:text-2xl font-bold uppercase tracking-wide text-foreground/60 max-w-2xl leading-relaxed border-l-8 border-foreground pl-6">
          EVERYTHING YOU NEED TO CONNECT THOUGHTBOX TO YOUR AI AGENTS.
        </p>

        <div className="mt-20 grid gap-16">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="mb-6 border-b-4 border-foreground pb-4 text-sm md:text-base font-black uppercase tracking-[0.2em] text-foreground">
                {section.title}
              </h2>
              <ul className="mt-8 grid gap-6 sm:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="group flex flex-col gap-4 border-4 border-foreground bg-background p-6 transition-all hover:-translate-y-1 shadow-brutal hover:shadow-brutal-md relative"
                    >
                      <div className="absolute top-0 right-0 w-8 h-8 diagonal-lines opacity-10 group-hover:opacity-20 transition-opacity"></div>
                      <span className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground bg-foreground/5 inline-block w-fit px-2 py-1">
                        {item.label}
                      </span>
                      <span className="text-base font-bold text-foreground/70 leading-relaxed uppercase tracking-wide">{item.description}</span>
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
