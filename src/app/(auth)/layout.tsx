import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Minimal top bar */}
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/" className="flex w-fit items-center gap-2 font-bold text-slate-900">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-black text-white">
            T
          </span>
          Thoughtbox
        </Link>
      </header>

      {/* Centered card area */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">{children}</main>

      {/* Minimal footer */}
      <footer className="px-6 py-4 text-center text-xs text-slate-400">
        <Link href="/terms" className="hover:text-slate-600 transition-colors">
          Terms
        </Link>
        {' · '}
        <Link href="/privacy" className="hover:text-slate-600 transition-colors">
          Privacy
        </Link>
      </footer>
    </div>
  )
}
