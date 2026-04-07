import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <p className="text-sm font-semibold tracking-widest text-foreground">404</p>
      <h1 className="mt-4 text-3xl font-bold text-foreground">Page not found</h1>
      <p className="mt-3 text-foreground">
        Sorry, we couldn&apos;t find the page you&apos;re looking for.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-full bg-foreground text-background px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:bg-foreground/80"
        >
          Go home
        </Link>
        <Link
          href="/support"
          className="rounded-full border border-foreground/10 px-5 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-foreground/5"
        >
          Contact support
        </Link>
      </div>
    </div>
  )
}
