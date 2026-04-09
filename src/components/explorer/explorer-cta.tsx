import Link from 'next/link'

type Props = {
  thoughtCount: number
}

export function ExplorerCTA({ thoughtCount }: Props) {
  return (
    <section className="border-b-4 border-foreground bg-foreground text-background">
      <div className="px-6 py-16 md:px-12 md:py-20 text-center">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight md:text-4xl">
          This is what your agents are thinking.
          <br />
          You just can&apos;t see it yet.
        </h2>

        <p className="mb-8 font-mono-terminal text-sm uppercase tracking-[0.15em] text-background/60">
          {thoughtCount} thoughts. One session. Full auditability.
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/pricing"
            className="border-4 border-background bg-background px-8 py-4 font-black uppercase tracking-widest text-foreground shadow-brutal-invert transition-transform hover:-translate-y-0.5"
          >
            Try Thoughtbox Free
          </Link>
          <Link
            href="/support"
            className="border-4 border-background/50 bg-transparent px-8 py-4 font-black uppercase tracking-widest text-background transition-all hover:border-background hover:-translate-y-0.5"
          >
            Get a Free Audit
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-6 font-mono-terminal text-[10px] uppercase tracking-[0.3em] text-background/40">
          <span>Open Source (MIT)</span>
          <span className="w-1 h-1 bg-background/30 self-center" />
          <span>2 Minutes to Set Up</span>
          <span className="w-1 h-1 bg-background/30 self-center" />
          <span>Works with Claude Code</span>
        </div>
      </div>
    </section>
  )
}
