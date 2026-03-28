'use client'

import { useMemo } from 'react'
import type { ThoughtRowVM } from '@/lib/session/view-models'
import type { Phase } from '@/lib/session/phase-detection'
import { ThoughtRow } from './thought-row'
import { TimestampGap } from './timestamp-gap'
import { PhaseHeader } from './phase-header'
import { SessionTimelineRail } from './session-timeline-rail'

type Props = {
  rows: ThoughtRowVM[]
  selectedId: string | null
  onSelect: (id: string) => void
  searchQuery?: string
  phases?: Phase[]
  collapsedPhases?: Set<string>
  onPhaseToggle?: (phaseId: string) => void
}

export function SessionTimeline({
  rows,
  selectedId,
  onSelect,
  searchQuery,
  phases = [],
  collapsedPhases = new Set(),
  onPhaseToggle,
}: Props) {
  const maxLane = Math.max(...rows.map((r) => r.laneIndex), 0)

  // Map row IDs to their phase (for the first visible row in each phase)
  const phaseStartRowIds = useMemo(() => {
    const result = new Map<string, Phase>()
    if (phases.length === 0) return result
    for (const phase of phases) {
      for (const row of rows) {
        const origIdx = row.thoughtNumber - 1
        if (origIdx >= phase.startIndex && origIdx <= phase.endIndex) {
          result.set(row.id, phase)
          break
        }
      }
    }
    return result
  }, [phases, rows])

  // Set of collapsed phase row IDs
  const collapsedRowIds = useMemo(() => {
    if (phases.length === 0 || collapsedPhases.size === 0) {
      return new Set<string>()
    }
    const hiddenIds = new Set<string>()
    for (const phase of phases) {
      if (!collapsedPhases.has(phase.id)) continue
      for (const row of rows) {
        const origIdx = row.thoughtNumber - 1
        if (origIdx >= phase.startIndex && origIdx <= phase.endIndex) {
          hiddenIds.add(row.id)
        }
      }
    }
    return hiddenIds
  }, [phases, collapsedPhases, rows])

  if (rows.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-foreground">
        No thoughts match the current filters.
      </div>
    )
  }

  return (
    <div className="relative flex min-w-max">
      <div className="sticky left-0 z-10 bg-background">
        <SessionTimelineRail
          rows={rows}
          maxLane={maxLane}
          selectedId={selectedId}
        />
      </div>

      <div className="flex-1 py-4 flex flex-col relative z-0">
        {rows.map((row) => {
          const phase = phaseStartRowIds.get(row.id)
          const isCollapsed =
            phase != null && collapsedPhases.has(phase.id)
          const isHidden =
            collapsedRowIds.has(row.id) &&
            !phaseStartRowIds.has(row.id)

          return (
            <div key={row.id}>
              {phase && onPhaseToggle && (
                <PhaseHeader
                  phase={phase}
                  isCollapsed={isCollapsed}
                  onToggle={() => onPhaseToggle(phase.id)}
                />
              )}
              {!isHidden && (
                <>
                  {row.showGapBefore && row.gapLabel && (
                    <TimestampGap label={row.gapLabel} />
                  )}
                  <ThoughtRow
                    row={row}
                    isSelected={row.id === selectedId}
                    onClick={() => onSelect(row.id)}
                    searchQuery={searchQuery}
                  />
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
