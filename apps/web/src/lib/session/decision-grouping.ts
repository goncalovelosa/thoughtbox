import type { ThoughtRowVM, ThoughtDetailVM } from '@/lib/session/view-models'

export type DecisionGroup = {
  decision: ThoughtDetailVM
  reasoningBefore: ThoughtRowVM[]
}

export type DecisionTimelineData =
  | { hasDecisions: true; groups: DecisionGroup[]; trailingReasoning: ThoughtRowVM[] }
  | { hasDecisions: false }

export function groupByDecisions(
  rows: ThoughtRowVM[],
  details: Record<string, ThoughtDetailVM>,
): DecisionTimelineData {
  const groups: DecisionGroup[] = []
  let buffer: ThoughtRowVM[] = []

  for (const row of rows) {
    if (row.displayType === 'decision_frame') {
      const detail = details[row.id]
      if (detail) {
        groups.push({ decision: detail, reasoningBefore: buffer })
        buffer = []
      }
    } else {
      buffer.push(row)
    }
  }

  if (groups.length === 0) {
    return { hasDecisions: false }
  }

  return {
    hasDecisions: true,
    groups,
    trailingReasoning: buffer,
  }
}
