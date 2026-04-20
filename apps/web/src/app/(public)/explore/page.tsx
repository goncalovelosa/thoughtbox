import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore — Thoughtbox Session Gallery',
  description:
    'Browse real AI reasoning sessions. See how agents think, form beliefs, revise assumptions, and build knowledge graphs over hours of structured reasoning.',
}

type SessionEntry = {
  slug: string
  title: string
  thoughtCount: number
  durationLabel: string
  tags: string[]
  description: string
}

const sessions: SessionEntry[] = [
  {
    slug: 'agentic-reasoning-research',
    title: 'Agentic Reasoning Research for Thoughtbox',
    thoughtCount: 167,
    durationLabel: '2h 31m',
    tags: ['research', 'agentic-reasoning', 'meta-cognition'],
    description:
      'A deep research session surveying 30+ agentic reasoning paradigms across 8 categories. Produced the Five Pillars framework, 138 knowledge entities, and the insight that "the bottleneck on AI capability is cognitive infrastructure, not model intelligence."',
  },
]

export default function ExplorePage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b-4 border-foreground px-6 py-12 md:px-12 md:py-20">
        <span className="mb-4 block font-mono-terminal text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">
          Session Gallery
        </span>
        <h1 className="mb-4 max-w-3xl text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
          This is what mind-expansion looks like.
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-foreground/70">
          Browse real Thoughtbox sessions. Each one is a complete reasoning
          trace — every thought, belief, revision, and knowledge connection,
          fully auditable.
        </p>
      </section>

      {/* Session Cards */}
      <section className="px-6 py-10 md:px-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <Link
              key={session.slug}
              href={`/explore/${session.slug}`}
              className="group border-4 border-foreground bg-background p-6 shadow-brutal-sm transition-transform hover:-translate-y-1"
            >
              {/* Tags */}
              <div className="mb-3 flex flex-wrap gap-2">
                {session.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-foreground/20 px-1.5 py-0.5 font-mono-terminal text-[9px] font-black uppercase tracking-widest text-foreground/50"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h2 className="mb-3 text-lg font-black uppercase tracking-tight text-foreground group-hover:underline">
                {session.title}
              </h2>

              {/* Stats */}
              <div className="mb-4 flex gap-4 font-mono-terminal text-sm tabular-nums text-foreground">
                <span className="font-black">{session.thoughtCount} thoughts</span>
                <span className="text-foreground/40">|</span>
                <span>{session.durationLabel}</span>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed text-foreground/60">
                {session.description}
              </p>

              {/* CTA */}
              <div className="mt-4 font-mono-terminal text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 group-hover:text-foreground transition-colors">
                Browse session →
              </div>
            </Link>
          ))}

          {/* Coming Soon placeholder */}
          <div className="border-4 border-dashed border-foreground/20 p-6 flex flex-col items-center justify-center text-center">
            <span className="font-mono-terminal text-[10px] font-black uppercase tracking-[0.3em] text-foreground/30 mb-2">
              More sessions coming
            </span>
            <p className="text-sm text-foreground/30">
              New research sessions are added weekly. Each one becomes a
              browsable demo.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t-4 border-foreground bg-foreground px-6 py-12 text-center md:px-12 md:py-16">
        <h2 className="mb-4 text-2xl font-black uppercase tracking-tight text-background md:text-3xl">
          Want your agents to think like this?
        </h2>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/pricing"
            className="border-4 border-background bg-background px-6 py-3 font-black uppercase tracking-widest text-foreground transition-transform hover:-translate-y-0.5"
          >
            Try Thoughtbox Free
          </Link>
          <Link
            href="/support"
            className="border-4 border-background/50 px-6 py-3 font-black uppercase tracking-widest text-background transition-all hover:border-background hover:-translate-y-0.5"
          >
            Get a Free Audit
          </Link>
        </div>
      </section>
    </main>
  )
}
