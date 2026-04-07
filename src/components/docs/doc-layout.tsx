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
      <div className="mx-auto max-w-6xl lg:grid lg:grid-cols-[240px_1fr] lg:gap-16">
        {/* Sidebar nav */}
        <nav className="hidden lg:block border-r-4 border-foreground pr-8">
          <p className="mb-6 bg-foreground text-background inline-block px-3 py-1 text-sm font-black uppercase tracking-widest shadow-brutal-sm">
            DOCUMENTATION
          </p>
          <div className="flex flex-col gap-8">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="mb-3 border-b-2 border-foreground/20 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
                  {section.label}
                </p>
                <ul className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-2 py-2 text-sm font-bold uppercase tracking-wide text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
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
        <div className="max-w-4xl relative">
          <nav className="mb-12 flex items-center gap-3 text-xs font-mono-terminal font-bold uppercase tracking-widest text-foreground">
            <Link
              href="/docs"
              className="border-b-2 border-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              DOCS
            </Link>
            <span className="text-foreground/30">/</span>
            <span className="bg-foreground/5 px-2 py-1 border border-foreground/20">{breadcrumb}</span>
          </nav>

          <article className="prose-none">{children}</article>
        </div>
      </div>
    </div>
  )
}
