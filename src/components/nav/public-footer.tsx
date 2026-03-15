import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-black text-white">
                T
              </span>
              Thoughtbox
            </Link>
            <p className="mt-2 max-w-xs text-sm text-slate-500">
              Persistent memory for AI agents. Capture thoughts, build knowledge graphs, trace every step.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Product</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/pricing" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Docs</Link></li>
                <li><Link href="/docs/quickstart" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Quickstart</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/support" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legal</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/terms" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Thoughtbox. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
