'use client'

import { useMemo } from 'react'
import type { TimelineItem, ThoughtRowVM } from '@/lib/session/view-models'
import type { Phase } from '@/lib/session/phase-detection'
import { ThoughtRow } from './thought-row'
import { OtelEventRow } from './otel-event-row'
import { TimestampGap } from './timestamp-gap'
import { PhaseHeader } from './phase-header'
import { SessionTimelineRail } from './session-timeline-rail'

type Props = {
  rows: TimelineItem[]
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
  // Group rows by runId
  const rowsByRun = useMemo(() => {
    const groups = new Map<string, TimelineItem[]>()
    for (const row of rows) {
      const runId = ('runId' in row ? row.runId : undefined) || 'default'
      if (!groups.has(runId)) groups.set(runId, [])
      groups.get(runId)!.push(row)
    }
    return groups
  }, [rows])

  // Extract only thought rows for the rail and phase logic
  const thoughtRows = useMemo(
    () => rows.filter((r): r is ThoughtRowVM & { kind: 'thought' } => r.kind === 'thought'),
    [rows],
  )

  const maxLane = Math.max(...thoughtRows.map((r) => r.laneIndex), 0)

  // Map row IDs to their phase (for the first visible row in each phase)
  const phaseStartRowIds = useMemo(() => {
    const result = new Map<string, Phase>()
    if (phases.length === 0) return result
    for (const phase of phases) {
      for (const row of thoughtRows) {
        const origIdx = row.thoughtNumber - 1
        if (origIdx >= phase.startIndex && origIdx <= phase.endIndex) {
          result.set(row.id, phase)
          break
        }
      }
    }
    return result
  }, [phases, thoughtRows])

  // Set of collapsed phase row IDs
  const collapsedRowIds = useMemo(() => {
    if (phases.length === 0 || collapsedPhases.size === 0) {
      return new Set<string>()
    }
    const hiddenIds = new Set<string>()
    for (const phase of phases) {
      if (!collapsedPhases.has(phase.id)) continue
      for (const row of thoughtRows) {
        const origIdx = row.thoughtNumber - 1
        if (origIdx >= phase.startIndex && origIdx <= phase.endIndex) {
          hiddenIds.add(row.id)
        }
      }
    }
    return hiddenIds
  }, [phases, collapsedPhases, thoughtRows])

  if (rows.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-foreground">
        No items match the current filters.
      </div>
    )
  }

  return (
    <div className="relative flex">
      <div className="sticky left-0 z-10 bg-background">
        <SessionTimelineRail
          rows={thoughtRows}
          maxLane={maxLane}
          selectedId={selectedId}
        />
      </div>

      <div className="flex-1 py-4 flex flex-col relative z-0">
        {Array.from(rowsByRun.entries()).map(([runId, runRows]) => (
          <div key={runId} className="mb-8">
            {runId !== 'default' && (
              <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-zinc-800 py-2 px-4">
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Run: {runId.slice(0, 8)}
                </h3>
              </div>
            )}
            {runRows.map((item) => {
          if (item.kind === 'otel_event') {
            return (
              <OtelEventRow
                key={item.id}
                row={item}
                isSelected={item.id === selectedId}
                onClick={() => onSelect(item.id)}
                searchQuery={searchQuery}
              />
            )
          }

          const row = item
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
        ))}
      </div>
    </div>
  )
}
