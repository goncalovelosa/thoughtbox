import Link from 'next/link'

type Props = {
  title: string
  tags: string[]
  thoughtCount: number
  durationMs: number
  entityCount: number
  relationCount: number
  typeCounts: Record<string, number>
}

function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

export function ExplorerHero({
  title,
  tags,
  thoughtCount,
  durationMs,
  entityCount,
  relationCount,
  typeCounts,
}: Props) {
  const beliefCount = typeCounts['belief_snapshot'] || 0

  return (
    <section className="border-b-4 border-foreground">
      {/* Top bar */}
      <div className="border-b-2 border-foreground/20 px-6 py-3">
        <span className="font-mono-terminal text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">
          Thoughtbox Session Explorer
        </span>
      </div>

      <div className="px-6 py-10 md:px-12 md:py-16">
        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="border-2 border-foreground/30 px-2 py-0.5 font-mono-terminal text-[10px] font-black uppercase tracking-widest text-foreground/70"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="mb-6 max-w-4xl text-3xl font-black uppercase tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-2xl text-base leading-relaxed text-foreground/80">
          Watch an AI agent conduct a {formatDuration(durationMs)} deep research
          session on agentic reasoning, forming beliefs, making decisions, and
          building a knowledge graph in real time.
        </p>

        {/* Stats */}
        <div className="mb-8 flex flex-wrap gap-6 border-4 border-foreground bg-foreground/5 p-6">
          <Stat value={thoughtCount} label="thoughts" />
          <Stat value={formatDuration(durationMs)} label="duration" />
          <Stat value={beliefCount} label="belief snapshots" />
          <Stat value={entityCount} label="knowledge entities" />
          <Stat value={relationCount} label="relations" />
        </div>

        {/* CTA */}
        <div className="flex flex-wrap gap-4">
          <Link
            href="/pricing"
            className="border-4 border-foreground bg-foreground px-6 py-3 font-black uppercase tracking-widest text-background shadow-brutal-sm transition-transform hover:-translate-y-0.5"
          >
            Try Thoughtbox Free
          </Link>
          <Link
            href="/support"
            className="border-4 border-foreground bg-background px-6 py-3 font-black uppercase tracking-widest text-foreground transition-transform hover:-translate-y-0.5"
          >
            Get a Free Audit
          </Link>
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono-terminal text-2xl font-black tabular-nums text-foreground md:text-3xl">
        {value}
      </span>
      <span className="font-mono-terminal text-[10px] font-black uppercase tracking-[0.2em] text-foreground/60">
        {label}
      </span>
    </div>
  )
}
