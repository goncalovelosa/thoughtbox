import Link from 'next/link'

const navItems = [
  { label: 'Quickstart', href: '/docs/quickstart' },
  { label: 'Sessions & Thoughts', href: '/docs/sessions-and-thoughts' },
  { label: 'Code Mode', href: '/docs/code-mode' },
  { label: 'Authentication', href: '/docs/authentication' },
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
          <p className="mb-3 text-xs font-black uppercase tracking-widest text-foreground">
            Documentation
          </p>
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
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
