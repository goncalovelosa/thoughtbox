import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Minimal top bar */}
      <header className="border-b border-foreground/10 bg-background px-6 py-4">
        <Link href="/" className="flex w-fit items-center gap-2 font-bold text-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground text-background text-xs font-bold">
            T
          </span>
          Thoughtbox
        </Link>
      </header>

      {/* Centered card area */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">{children}</main>

      {/* Minimal footer */}
      <footer className="px-6 py-4 text-center text-xs text-foreground">
        <Link href="/terms" className="hover:text-foreground transition-colors">
          Terms
        </Link>
        {' · '}
        <Link href="/privacy" className="hover:text-foreground transition-colors">
          Privacy
        </Link>
      </footer>
    </div>
  )
}
