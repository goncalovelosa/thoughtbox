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
      { label: 'Thoughts', href: '#', description: 'The fundamental unit of memory in Thoughtbox.' },
      { label: 'Projects', href: '#', description: 'Isolated memory namespaces within a workspace.' },
      { label: 'Knowledge graphs', href: '#', description: 'How entities and relations are automatically built.' },
      { label: 'Sessions & runs', href: '#', description: 'How MCP sessions map to traceable runs.' },
    ],
  },
  {
    title: 'API reference',
    items: [
      { label: 'MCP tools', href: '#', description: 'Full reference for all MCP tools exposed by Thoughtbox.' },
      { label: 'REST API', href: '#', description: 'REST endpoints for management operations.' },
      { label: 'Authentication', href: '#', description: 'API key format, scopes, and revocation.' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { label: 'Multi-agent memory sharing', href: '#', description: 'How to share context between parallel agents.' },
      { label: 'Integrating with Claude', href: '#', description: 'Step-by-step for Claude Desktop and API.' },
      { label: 'Integrating with Cursor', href: '#', description: 'Add Thoughtbox to your Cursor MCP config.' },
    ],
  },
]

export default function DocsPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Documentation</h1>
        <p className="mt-4 text-lg text-foreground">
          Everything you need to connect Thoughtbox to your AI agents.
        </p>

        <div className="mt-12 grid gap-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground hover:underline-thick">
                {section.title}
              </h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className={`group flex flex-col gap-1 rounded-none border border-foreground bg-background p-5 shadow-sm transition-shadow hover:shadow-md ${
                        item.href === '#' ? 'pointer-events-none opacity-50' : ''
                      }`}
                    >
                      <span className="flex items-center gap-2 font-semibold text-foreground group-hover:text-foreground hover:underline-thick">
                        {item.label}
                        {item.href === '#' && (
                          <span className="rounded-none border border-foreground bg-background px-2 py-0.5 text-[10px] font-semibold text-foreground">
                            Coming soon
                          </span>
                        )}
                      </span>
                      <span className="text-sm text-foreground">{item.description}</span>
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
