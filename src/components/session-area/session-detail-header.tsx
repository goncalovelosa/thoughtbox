import Link from 'next/link'
import type { SessionDetailVM } from '@/lib/session/view-models'

type Props = {
  session: SessionDetailVM
  workspaceSlug: string
}

export function SessionDetailHeader({ session, workspaceSlug }: Props) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <Link 
        href={`/w/${workspaceSlug}/runs`}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
        Back to Sessions
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          {session.title || `Session ${session.shortId}`}
        </h1>
        
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-400">
          <span className="font-mono text-[12px] leading-5">{session.id}</span>
          <span>•</span>
          
          {session.status === 'active' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20">
              Active
            </span>
          )}
          {session.status === 'completed' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20">
              Completed
            </span>
          )}
          {session.status === 'abandoned' && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20">
              Abandoned
            </span>
          )}
          
          <span>•</span>
          <span>Started {session.startedAtLabel}</span>
          
          <span>•</span>
          <span>Duration: <span className="font-mono text-[12px] leading-5">{session.durationLabel}</span></span>
          
          <span>•</span>
          <span>{session.thoughtCount} Thoughts</span>
        </div>
      </div>
    </div>
  )
}
