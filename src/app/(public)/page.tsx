import type { Metadata } from 'next'
import Link from 'next/link'
import { GitBranch, Code2, Network, PlayCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Thoughtbox — Observable agency for AI systems',
}

const features = [
  {
    title: 'Replayable reasoning traces',
    description:
      'Every session is a numbered, timestamped chain of thoughts. Reconstruct exactly what the agent was reasoning about when it took any action.',
    icon: <PlayCircle className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Branch visualization',
    description:
      'See where the agent explored alternatives, forked into parallel paths, and converged on a decision. Topology is visible, not hidden.',
    icon: <GitBranch className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Code Mode',
    description:
      'Two MCP tools replace dozens. Agents write JavaScript against the tb SDK to search, record, and analyze — no context window bloat.',
    icon: <Code2 className="h-8 w-8 text-foreground" />,
  },
  {
    title: 'Knowledge graph',
    description:
      'Entities, relations, and observations accumulate across sessions. Prior experience surfaces automatically to new agents.',
    icon: <Network className="h-8 w-8 text-foreground" />,
  },
]

export default function HomePage() {
  return (
    <>
      {/* Marquee Banner */}
      <div className="border-b-4 border-foreground bg-foreground text-background overflow-hidden relative z-20">
        <div className="py-3 whitespace-nowrap animate-marquee">
          <span className="inline-block font-black uppercase tracking-widest text-sm">
            TRACK REASONING • MEASURE AUTONOMY • IMPROVE AGENTS • SHARPEN YOUR SYSTEMS • 
            TRACK REASONING • MEASURE AUTONOMY • IMPROVE AGENTS • SHARPEN YOUR SYSTEMS • 
            TRACK REASONING • MEASURE AUTONOMY • IMPROVE AGENTS • SHARPEN YOUR SYSTEMS • 
            TRACK REASONING • MEASURE AUTONOMY • IMPROVE AGENTS • SHARPEN YOUR SYSTEMS • 
          </span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-background px-6 py-24 sm:py-32">
        <div className="absolute inset-0 -z-10 grid-pattern opacity-10" />
        
        <div className="mx-auto max-w-4xl text-center relative">
          <div className="absolute top-0 right-0 w-32 h-32 diagonal-lines opacity-10"></div>
          <div className="absolute -bottom-10 -left-10 w-48 h-48 border-[20px] border-foreground opacity-5 rounded-full pointer-events-none"></div>

          <div className="inline-flex items-center gap-3 border-2 border-foreground bg-foreground/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-foreground shadow-brutal-sm">
            <span className="h-2 w-2 bg-emerald-500 animate-pulse" />
            FOUNDING BETA — NOW OPEN
          </div>

          <h1 className="mt-12 text-6xl font-black uppercase tracking-tighter text-foreground sm:text-7xl lg:text-8xl animate-glitch relative inline-block">
            <span className="relative z-10">
              Observable Agency<br />
              <span className="text-foreground/80">for AI Systems</span>
            </span>
          </h1>

          {/* Animated divider */}
          <div className="flex items-center justify-center gap-4 mt-8 mb-6">
            <div className="h-2 w-16 bg-foreground"></div>
            <div className="w-4 h-4 bg-foreground rotate-45"></div>
            <div className="h-2 w-32 bg-foreground"></div>
            <div className="w-4 h-4 bg-foreground rotate-45"></div>
            <div className="h-2 w-16 bg-foreground"></div>
          </div>

          <p className="mt-6 text-xl font-bold uppercase tracking-wide text-foreground/70 sm:text-2xl leading-relaxed max-w-3xl mx-auto">
            Thoughtbox is an intention ledger. When an agent causes a failure, you get the black box recording — what it was reasoning, what it considered, and why it decided what it did.
          </p>

          <div className="mt-12 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <Link
              href="/pricing"
              className="border-4 border-foreground bg-foreground text-background px-10 py-5 text-lg font-black uppercase tracking-widest transition-all hover:-translate-y-1 shadow-brutal hover:shadow-brutal-lg flex items-center gap-3 group"
            >
              <span>JOIN THE BETA</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth="4" stroke="currentColor" className="group-hover:translate-x-1 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/docs/quickstart"
              className="border-4 border-foreground bg-background text-foreground px-10 py-5 text-lg font-black uppercase tracking-widest transition-all hover:-translate-y-1 shadow-brutal hover:bg-foreground/5"
            >
              READ QUICKSTART
            </Link>
          </div>
        </div>
      </section>

      {/* Code preview */}
      <section className="border-y-8 border-foreground bg-foreground text-background px-6 py-20 relative overflow-hidden">
        <div className="absolute inset-0 scanlines opacity-30 pointer-events-none"></div>
        <div className="mx-auto max-w-4xl relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 border-2 border-background flex items-center justify-center">
              <Code2 className="w-6 h-6" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">CONNECT IN SECONDS</h2>
          </div>
          
          <div className="border-4 border-background p-1 bg-background relative shadow-brutal-invert">
            <div className="bg-foreground text-background font-mono-terminal p-8 text-sm md:text-base overflow-x-auto">
              <div className="text-background/50 mb-4 uppercase text-[10px] tracking-widest"># ADD THOUGHTBOX TO YOUR MCP CLIENT CONFIG</div>
              <code>{`{
  "mcpServers": {
    "thoughtbox": {
      "type": "http",
      "url": "https://mcp.kastalienresearch.ai/mcp?key=tbx_YOUR_API_KEY"
    }
  }
}`}</code>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-24 bg-background">
        <div className="mx-auto max-w-6xl">
          <div className="border-l-8 border-foreground pl-8 mb-16">
            <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground sm:text-6xl">
              THE AUDIT TRAIL<br/>YOUR AGENTS MISS
            </h2>
            <p className="mt-6 text-xl font-bold uppercase tracking-wide text-foreground/60 max-w-2xl">
              AGENTS ARE EPHEMERAL. THOUGHTBOX CAPTURES THE REASONING THAT DISAPPEARS WHEN THE SESSION ENDS.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="border-4 border-foreground bg-background p-10 relative group hover:bg-foreground/5 transition-colors"
              >
                <div className="absolute top-0 right-0 w-16 h-16 diagonal-lines opacity-10"></div>
                <div className="text-[10px] font-mono-terminal font-black text-foreground/40 mb-6">0{i + 1}</div>
                <div className="w-16 h-16 border-2 border-foreground flex items-center justify-center mb-8 bg-foreground text-background group-hover:rotate-12 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight text-foreground mb-4">{feature.title}</h3>
                <p className="text-sm font-bold uppercase tracking-wide text-foreground/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-8 border-foreground bg-foreground text-background px-6 py-32 relative overflow-hidden">
        <div className="absolute inset-0 dots-pattern opacity-10 pointer-events-none"></div>
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <h2 className="text-5xl font-black uppercase tracking-tighter sm:text-7xl mb-8">KNOW WHY THEY DECIDED WHAT THEY DID</h2>
          <p className="text-2xl font-bold uppercase tracking-wide text-background/60 max-w-2xl mx-auto mb-12 leading-relaxed">
            FREE THROUGH MAY 1. FULL ACCESS, NO CREDIT CARD. START RECORDING AGENT REASONING TODAY.
          </p>
          <Link
            href="/pricing"
            className="inline-flex border-4 border-background bg-background text-foreground px-12 py-6 text-xl font-black uppercase tracking-widest transition-all hover:-translate-y-1 shadow-brutal-invert hover:bg-background/90"
          >
            JOIN THE FOUNDING BETA
          </Link>
        </div>
      </section>
    </>
  )
}
