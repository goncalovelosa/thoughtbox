'use client'

import type { ThoughtRowVM } from '@/lib/session/view-models'
import { ThoughtRow } from './thought-row'
import { TimestampGap } from './timestamp-gap'
import { SessionTimelineRail } from './session-timeline-rail'

type Props = {
  rows: ThoughtRowVM[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function SessionTimeline({ rows, selectedId, onSelect }: Props) {
  if (rows.length === 0) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        No thoughts match the current filters.
      </div>
    )
  }

  // Find max lane index to size the rail properly
  const maxLane = Math.max(...rows.map(r => r.laneIndex), 0)

  return (
    <div className="relative flex min-w-max">
      <div className="sticky left-0 z-10 bg-slate-950">
        <SessionTimelineRail rows={rows} maxLane={maxLane} selectedId={selectedId} />
      </div>
      
      <div className="flex-1 py-4 flex flex-col relative z-0">
        {rows.map((row) => (
          <div key={row.id}>
            {row.showGapBefore && row.gapLabel && (
              <TimestampGap label={row.gapLabel} />
            )}
            <ThoughtRow 
              row={row} 
              isSelected={row.id === selectedId} 
              onClick={() => onSelect(row.id)} 
            />
          </div>
        ))}
      </div>
    </div>
  )
}
