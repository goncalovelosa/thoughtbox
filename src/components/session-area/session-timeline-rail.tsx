'use client'

import type { ThoughtRowVM } from '@/lib/session/view-models'

type Props = {
  rows: ThoughtRowVM[]
  maxLane: number
}

// Design system constants from 08-visual-design-and-tailwind-token-spec.md
const LANE_WIDTH = 20
const ROW_HEIGHT = 48 // Assuming a relatively fixed height for the visual rail layout
const LANE_OFFSET = 30
const DOT_RADIUS = 4

export function SessionTimelineRail({ rows, maxLane }: Props) {
  const width = LANE_OFFSET + ((maxLane + 1) * LANE_WIDTH)
  
  // NOTE: This is a placeholder SVG rail. 
  // In a full implementation, we'd need to calculate exactly where each row sits
  // vertically. For v1, this provides the basic structural boundary.
  
  return (
    <div 
      className="h-full pt-4" 
      style={{ width: `${Math.max(width, 60)}px` }}
    >
      <svg 
        className="w-full h-full text-slate-800"
        style={{ minHeight: `${rows.length * ROW_HEIGHT}px` }}
      >
        {/* Placeholder: Just drawing a straight main lane line for now */}
        <line 
          x1={LANE_OFFSET} 
          y1={0} 
          x2={LANE_OFFSET} 
          y2="100%" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeDasharray="4 4"
        />
      </svg>
    </div>
  )
}
