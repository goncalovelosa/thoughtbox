import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t-4 border-foreground bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-black text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-none bg-foreground text-background border-2 border-foreground text-xs font-black text-background">
                T
              </span>
              Thoughtbox
            </Link>
            <p className="mt-2 max-w-xs text-sm text-foreground">
              Observable agency for AI systems. An intention ledger for auditable agent reasoning.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-foreground">Product</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/pricing" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Pricing</Link></li>
                <li><Link href="/docs" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Docs</Link></li>
                <li><Link href="/docs/quickstart" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Quickstart</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-foreground">Company</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/support" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-foreground">Legal</p>
              <ul className="mt-3 flex flex-col gap-2">
                <li><Link href="/terms" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="text-sm text-foreground hover:text-foreground hover:underline-thick transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-foreground pt-8 text-center text-xs text-foreground">
          &copy; {new Date().getFullYear()} Thoughtbox. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
