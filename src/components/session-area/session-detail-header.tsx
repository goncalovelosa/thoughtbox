import Link from 'next/link'
import type { SessionDetailVM } from '@/lib/session/view-models'

type Props = {
  session: SessionDetailVM
  workspaceSlug: string
}

export function SessionDetailHeader({ session, workspaceSlug }: Props) {
  // Override soft status badge styling to raw B&W styles
  const getBrutalistStatusStyles = (status: string) => {
    switch (status) {
      case 'active':
        return 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
      case 'error':
        return 'border-rose-500 bg-rose-500/10 text-rose-500'
      default:
        return 'border-foreground bg-background text-foreground'
    }
  }

  return (
    <div className="mb-10 flex flex-col gap-6 sticky top-0 z-20 bg-background py-6 border-b-8 border-foreground">
      <div className="absolute top-0 right-0 w-32 h-32 diagonal-lines opacity-10 pointer-events-none"></div>
      
      <Link 
        href={`/w/${workspaceSlug}/runs`}
        className="inline-flex w-fit items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground hover:bg-foreground hover:text-background border-2 border-transparent hover:border-foreground px-2 py-1 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        BACK TO SESSIONS
      </Link>

      <div className="flex flex-col gap-4 relative z-10">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground animate-glitch relative inline-block w-fit">
          <span className="relative z-10">{session.title || `SESSION ${session.shortId}`}</span>
        </h1>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3 font-mono-terminal text-xs uppercase tracking-widest text-foreground/80 mt-2">
          <div className="flex items-center gap-2 bg-foreground text-background px-3 py-1 font-black cursor-help shadow-brutal-sm border-2 border-foreground" title={session.id}>
            <span>ID:</span>
            <span>{session.shortId}</span>
          </div>

          <span className={`inline-flex items-center gap-2 border-2 px-3 py-1 font-black shadow-brutal-sm ${getBrutalistStatusStyles(session.status)}`}>
            {session.status === 'active' && <span className="w-2 h-2 bg-emerald-500 animate-pulse"></span>}
            {session.status}
          </span>

          <div className="flex items-center gap-2 border-2 border-foreground/30 px-3 py-1">
            <span className="opacity-50">STARTED</span>
            <span>{session.startedAtLabel}</span>
          </div>

          <div className="flex items-center gap-2 border-2 border-foreground/30 px-3 py-1">
            <span className="opacity-50">DURATION</span>
            <span>{session.durationLabel}</span>
          </div>

          <div className="flex items-center gap-2 border-2 border-foreground/30 px-3 py-1">
            <span className="text-foreground">{session.thoughtCount}</span>
            <span className="opacity-50">THOUGHTS</span>
          </div>
        </div>
      </div>
    </div>
  )
}
