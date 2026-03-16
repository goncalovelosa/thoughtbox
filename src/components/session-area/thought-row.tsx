'use client'

import type { ThoughtRowVM } from '@/lib/session/view-models'

type Props = {
  row: ThoughtRowVM
  isSelected: boolean
  onClick: () => void
}

export function ThoughtRow({ row, isSelected, onClick }: Props) {
  // Determine Type Badge colors
  const getTypeBadgeStyles = (type: string) => {
    switch (type) {
      case 'decision_frame': return 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20'
      case 'action_report': return 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20'
      case 'progress': return 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20'
      case 'belief_snapshot': return 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/20'
      case 'assumption_update': return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20'
      case 'context_snapshot': return 'bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20'
      default: return 'bg-slate-700/50 text-slate-200 ring-1 ring-slate-600'
    }
  }

  return (
    <div 
      className="group grid grid-cols-[84px_minmax(0,1fr)] items-start gap-3 px-4 py-3 cursor-pointer"
      onClick={onClick}
    >
      {/* SVG Rail goes here, but we'll mock it for now until timeline is built */}
      <div className="flex justify-center pt-2">
        <div className={`w-2 h-2 rounded-full bg-${row.laneColorToken}`} />
      </div>

      <div className={`rounded-xl border px-3 py-2 transition-colors ${
        isSelected 
          ? 'border-brand-500/30 bg-brand-500/10 ring-1 ring-brand-500/20' 
          : 'border-transparent bg-transparent group-hover:bg-slate-900/70'
      }`}>
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-1.5">
          {row.branchLabel && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-slate-800 text-slate-300">
              {row.branchLabel}
            </span>
          )}
          {row.isTyped && row.displayType !== 'reasoning' && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getTypeBadgeStyles(row.displayType)}`}>
              {row.displayType.replace('_', ' ')}
            </span>
          )}
          {row.isRevision && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20">
              Revision
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm font-medium leading-5 text-slate-100 line-clamp-1">
          {row.previewText || <span className="text-slate-500 italic">Empty thought</span>}
        </div>

        {/* Metadata */}
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span className="font-mono text-[12px]">{row.shortId}</span>
          <span>•</span>
          <span title={row.absoluteTimeLabel}>{row.relativeTimeLabel}</span>
        </div>
      </div>
    </div>
  )
}
