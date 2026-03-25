import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation',
}

const sections = [
  {
    title: 'Getting started',
    items: [
      { label: 'Quickstart', href: '/docs/quickstart', description: 'Connect your first MCP client in under 60 seconds.' },
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
]

export default function DocsPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black tracking-tight text-foreground uppercase">Documentation</h1>
        <p className="mt-4 text-lg text-foreground">
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
                      className="group flex flex-col gap-1 rounded-none border-4 border-foreground bg-background p-5 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <span className="font-semibold text-foreground group-hover:underline group-hover:underline-thick">
                        {item.label}
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
