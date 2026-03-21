'use client'

import type { ThoughtRowVM } from '@/lib/session/view-models'

type Props = {
  rows: ThoughtRowVM[]
  maxLane: number
  selectedId: string | null
}

const LANE_WIDTH = 20
const ROW_HEIGHT = 48
const GAP_HEIGHT = 28
const LANE_OFFSET = 30
const DOT_R = 4
const DOT_R_SELECTED = 6

const LANE_COLORS: Record<string, string> = {
  'sessionLane-main': '#3fb950',
  'sessionLane-branch1': '#a371f7',
  'sessionLane-branch2': '#58a6ff',
  'sessionLane-branch3': '#d29922',
  'sessionLane-branch4': '#db61a2',
  'sessionLane-branch5': '#f85149',
}

function laneX(laneIndex: number): number {
  return LANE_OFFSET + laneIndex * LANE_WIDTH
}

function laneColor(token: string): string {
  return LANE_COLORS[token] ?? '#334155'
}

export function SessionTimelineRail({ rows, maxLane, selectedId }: Props) {
  const width = LANE_OFFSET + (maxLane + 1) * LANE_WIDTH

  // Compute Y center for each row, accounting for gap separators
  const rowYPositions: number[] = []
  let currentY = 0
  for (const row of rows) {
    if (row.showGapBefore && row.gapLabel) {
      currentY += GAP_HEIGHT
    }
    rowYPositions.push(currentY + ROW_HEIGHT / 2)
    currentY += ROW_HEIGHT
  }

  const totalHeight = currentY

  // Group rows by lane to draw lane lines
  const laneSpans = new Map<number, { firstY: number; lastY: number; color: string }>()
  rows.forEach((row, i) => {
    const y = rowYPositions[i]
    const existing = laneSpans.get(row.laneIndex)
    if (existing) {
      existing.lastY = y
    } else {
      laneSpans.set(row.laneIndex, {
        firstY: y,
        lastY: y,
        color: laneColor(row.laneColorToken),
      })
    }
  })

  // Build fork connectors: row has branchFromThought and is on a different lane
  const forks: { parentY: number; parentLane: number; childY: number; childLane: number; color: string }[] = []
  rows.forEach((row, i) => {
    if (row.branchFromThought == null || row.laneIndex === 0) return
    const parentIdx = rows.findIndex(
      (r) => r.thoughtNumber === row.branchFromThought,
    )
    if (parentIdx < 0) return
    forks.push({
      parentY: rowYPositions[parentIdx],
      parentLane: rows[parentIdx].laneIndex,
      childY: rowYPositions[i],
      childLane: row.laneIndex,
      color: laneColor(row.laneColorToken),
    })
  })

  return (
    <div className="h-full pt-4" style={{ width: `${Math.max(width, 60)}px` }}>
      <svg
        className="w-full"
        style={{ height: `${totalHeight}px` }}
      >
        {/* Lane lines */}
        {[...laneSpans.entries()].map(([lane, span]) => (
          <line
            key={`lane-${lane}`}
            x1={laneX(lane)}
            y1={span.firstY}
            x2={laneX(lane)}
            y2={span.lastY}
            stroke={span.color}
            strokeWidth="2"
            strokeOpacity={0.4}
          />
        ))}

        {/* Fork connectors */}
        {forks.map((fork, i) => {
          const x1 = laneX(fork.parentLane)
          const x2 = laneX(fork.childLane)
          const midY = (fork.parentY + fork.childY) / 2
          return (
            <path
              key={`fork-${i}`}
              d={`M ${x1} ${fork.parentY} Q ${x1} ${midY}, ${x2} ${fork.childY}`}
              fill="none"
              stroke={fork.color}
              strokeWidth="2"
              strokeOpacity={0.5}
            />
          )
        })}

        {/* Row dots */}
        {rows.map((row, i) => {
          const isSelected = row.id === selectedId
          return (
            <circle
              key={row.id}
              cx={laneX(row.laneIndex)}
              cy={rowYPositions[i]}
              r={isSelected ? DOT_R_SELECTED : DOT_R}
              fill={laneColor(row.laneColorToken)}
              opacity={isSelected ? 1 : 0.8}
            />
          )
        })}
      </svg>
    </div>
  )
}
