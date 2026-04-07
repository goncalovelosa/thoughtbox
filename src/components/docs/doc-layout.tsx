import Link from 'next/link'

const navSections = [
  {
    label: 'Getting Started',
    items: [
      { label: 'Quickstart', href: '/docs/quickstart' },
    ],
  },
  {
    label: 'Core Concepts',
    items: [
      { label: 'Sessions & Thoughts', href: '/docs/sessions-and-thoughts' },
      { label: 'Code Mode', href: '/docs/code-mode' },
      { label: 'Authentication', href: '/docs/authentication' },
    ],
  },
  {
    label: 'Guides',
    items: [
      { label: 'Session Lifecycle', href: '/docs/session-lifecycle' },
      { label: 'Knowledge Graph', href: '/docs/knowledge-graph' },
      { label: 'Interleaved Thinking', href: '/docs/interleaved-thinking' },
      { label: 'Ulysses Protocol', href: '/docs/ulysses-protocol' },
      { label: 'Subagent Patterns', href: '/docs/subagent-patterns' },
      { label: 'Observability', href: '/docs/observability' },
    ],
  },
]

export function DocLayout({
  children,
  breadcrumb,
}: {
  children: React.ReactNode
  breadcrumb: string
}) {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[200px_1fr] lg:gap-12">
        {/* Sidebar nav */}
        <nav className="hidden lg:block">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Documentation
          </p>
          <div className="flex flex-col gap-5">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="mb-1.5 px-2 text-xs font-semibold uppercase tracking-wider text-foreground/50">
                  {section.label}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-2 py-1.5 text-sm text-foreground hover:underline hover:underline-thick transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-3xl">
          <nav className="mb-8 flex items-center gap-2 text-sm text-foreground">
            <Link
              href="/docs"
              className="hover:text-foreground hover:underline-thick transition-colors"
            >
              Docs
            </Link>
            <span>/</span>
            <span className="text-foreground">{breadcrumb}</span>
          </nav>

          <article className="prose-none">{children}</article>
        </div>
      </div>
    </div>
  )
}
