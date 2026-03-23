'use client'

import type { ThoughtRowVM } from '@/lib/session/view-models'
import { BADGE_BASE, THOUGHT_TYPE_BADGE, REVISION_BADGE, LANE_DOT_COLOR } from '@/lib/session/badge-styles'

type Props = {
  row: ThoughtRowVM
  isSelected: boolean
  onClick: () => void
}

export function ThoughtRow({ row, isSelected, onClick }: Props) {
  return (
    <div
      data-thought-id={row.id}
      className="group grid grid-cols-[84px_minmax(0,1fr)] items-start gap-3 px-4 py-3 min-h-[48px] cursor-pointer"
      onClick={onClick}
    >
      {/* SVG Rail goes here, but we'll mock it for now until timeline is built */}
      <div className="flex justify-center pt-2">
        <div className={`w-2 h-2 rounded-full ${LANE_DOT_COLOR[row.laneColorToken]}`} />
      </div>

      <div className={`rounded-xl border px-3 py-2 transition-colors ${
        isSelected
          ? 'border-brand-500/30 bg-brand-500/10 ring-1 ring-brand-500/20'
          : 'border-transparent bg-transparent group-hover:bg-slate-900/70'
      }`}>
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-1.5">
          {row.branchLabel && (
            <span className={`${BADGE_BASE} bg-slate-800 text-slate-300`}>
              {row.branchLabel}
            </span>
          )}
          {row.isTyped && row.displayType !== 'reasoning' && (
            <span className={`${BADGE_BASE} ${THOUGHT_TYPE_BADGE[row.displayType]}`}>
              {row.displayType.replace('_', ' ')}
            </span>
          )}
          {row.isRevision && (
            <span className={`${BADGE_BASE} ${REVISION_BADGE}`}>
              Revision
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-sm font-medium leading-5 text-slate-100 line-clamp-1" title={row.previewText}>
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
