import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-foreground hover:underline-thick">404</p>
      <h1 className="mt-4 text-3xl font-bold text-foreground">Page not found</h1>
      <p className="mt-3 text-foreground">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-none bg-foreground text-background border-2 border-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm hover:bg-background transition-colors"
        >
          Go home
        </Link>
        <Link
          href="/support"
          className="rounded-none border border-foreground px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-background transition-colors"
        >
          Contact support
        </Link>
      </div>
    </div>
  )
}
