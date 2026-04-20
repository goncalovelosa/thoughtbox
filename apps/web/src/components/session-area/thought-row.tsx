'use client'

import type { ThoughtRowVM } from '@/lib/session/view-models'
import { highlightText } from '@/lib/session/search-utils'
import { LANE_DOT_COLOR } from '@/lib/session/badge-styles'

type Props = {
  row: ThoughtRowVM
  isSelected: boolean
  onClick: () => void
  searchQuery?: string
}

export function ThoughtRow({ row, isSelected, onClick, searchQuery }: Props) {
  return (
    <div
      data-thought-id={row.id}
      className={`group grid grid-cols-[84px_minmax(0,1fr)] items-start gap-0 px-4 py-3 min-h-[48px] cursor-pointer border-b-2 border-foreground/10 transition-all ${
        isSelected ? 'bg-foreground/5' : 'hover:bg-foreground/5'
      }`}
      onClick={onClick}
    >
      <div className="flex justify-center pt-2 relative">
        <div
          className={`w-3 h-3 ${isSelected ? 'animate-pulse ring-4 ring-foreground/20' : ''} ${LANE_DOT_COLOR[row.laneColorToken]}`}
          style={{ borderRadius: 0 }} /* Brutalist square dots */
        />
        {isSelected && (
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-l-[8px] border-l-foreground border-b-[6px] border-b-transparent"></div>
        )}
      </div>

      <div
        className={`border-l-4 pl-4 transition-colors min-w-0 overflow-hidden py-1 ${
          isSelected
            ? 'border-foreground'
            : 'border-transparent group-hover:border-foreground/30'
        }`}
      >
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-2">
          {row.branchLabel && (
            <span className="border border-foreground bg-background text-foreground px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest">
              {row.branchLabel}
            </span>
          )}
          {row.isTyped && row.displayType !== 'reasoning' && (
            <span className="border border-foreground/20 bg-foreground/5 text-foreground px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest">
              {row.displayType.replace('_', ' ')}
            </span>
          )}
          {row.isRevision && (
            <span className="border border-foreground bg-foreground text-background px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest shadow-brutal-sm">
              REVISION
            </span>
          )}
        </div>

        {/* Content with search highlighting */}
        <div
          className={`text-sm leading-5 truncate ${isSelected ? 'font-black' : 'font-medium'} text-foreground`}
          title={row.previewText}
        >
          {row.previewText ? (
            searchQuery ? (
              highlightText(row.previewText, searchQuery).map((seg, i) =>
                seg.type === 'match' ? (
                  <mark
                    key={i}
                    className="bg-foreground text-background font-black px-0.5"
                  >
                    {seg.value}
                  </mark>
                ) : (
                  <span key={i}>{seg.value}</span>
                ),
              )
            ) : (
              row.previewText
            )
          ) : (
            <span className="text-foreground/50 italic">Empty thought</span>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-mono-terminal tracking-widest uppercase text-foreground/60">
          <span className={`font-black ${isSelected ? 'text-foreground' : ''} tabular-nums`}>
            #{row.thoughtNumber}
          </span>
          <span className="w-1 h-1 bg-foreground/30"></span>
          <span>
            {row.shortId}
          </span>
          <span className="w-1 h-1 bg-foreground/30"></span>
          <span title={row.absoluteTimeLabel}>{row.relativeTimeLabel}</span>
        </div>
      </div>
    </div>
  )
}
