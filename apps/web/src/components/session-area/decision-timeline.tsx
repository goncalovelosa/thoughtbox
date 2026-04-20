'use client'

import { useState } from 'react'
import type { DecisionTimelineData } from '@/lib/session/decision-grouping'
import { ThoughtCard } from './thought-card'
import { ThoughtRow } from './thought-row'

type Props = {
  data: DecisionTimelineData
  selectedId: string | null
  onSelect: (id: string) => void
  searchQuery?: string
}

export function DecisionTimeline({
  data,
  selectedId,
  onSelect,
  searchQuery,
}: Props) {
  if (!data.hasDecisions) {
    return (
      <div className="p-12 text-center">
        <h3 className="text-sm font-medium text-foreground mb-2">
          No decisions recorded in this session
        </h3>
        <p className="text-xs text-foreground/60 max-w-sm mx-auto">
          Decision frames capture key choices your agent made. Use the
          decision_frame thought type when calling tb.thought() to record
          decisions with options and confidence levels.
        </p>
      </div>
    )
  }

  return (
    <div className="py-4 space-y-2">
      {data.groups.map((group) => (
        <div key={group.decision.id}>
          {group.reasoningBefore.length > 0 && (
            <ReasoningGap
              rows={group.reasoningBefore}
              selectedId={selectedId}
              onSelect={onSelect}
              searchQuery={searchQuery}
            />
          )}
          <button
            type="button"
            data-thought-id={group.decision.id}
            className={`mx-4 rounded-2xl border transition-colors cursor-pointer w-[calc(100%-2rem)] text-left focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none ${
              selectedId === group.decision.id
                ? 'border-foreground/30 bg-foreground/5'
                : 'border-foreground/10 hover:border-foreground/30'
            }`}
            onClick={() => onSelect(group.decision.id)}
          >
            <ThoughtCard
              detail={group.decision}
              searchQuery={searchQuery}
            />
          </button>
        </div>
      ))}

      {data.trailingReasoning.length > 0 && (
        <ReasoningGap
          rows={data.trailingReasoning}
          selectedId={selectedId}
          onSelect={onSelect}
          searchQuery={searchQuery}
        />
      )}
    </div>
  )
}

function ReasoningGap({
  rows,
  selectedId,
  onSelect,
  searchQuery,
}: {
  rows: import('@/lib/session/view-models').ThoughtRowVM[]
  selectedId: string | null
  onSelect: (id: string) => void
  searchQuery?: string
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mx-4 my-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-3 py-2 text-xs text-foreground/50 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none"
      >
        <div className="flex-1 border-t border-dashed border-foreground/20" />
        <span className="font-mono shrink-0">
          {rows.length} reasoning thought{rows.length === 1 ? '' : 's'}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className={`transition-transform motion-reduce:transition-none ${expanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
        <div className="flex-1 border-t border-dashed border-foreground/20" />
      </button>

      {expanded && (
        <div className="mt-1 rounded-xl border border-foreground/10 overflow-hidden">
          {rows.map((row) => (
            <ThoughtRow
              key={row.id}
              row={row}
              isSelected={row.id === selectedId}
              onClick={() => onSelect(row.id)}
              searchQuery={searchQuery}
            />
          ))}
        </div>
      )}
    </div>
  )
}
