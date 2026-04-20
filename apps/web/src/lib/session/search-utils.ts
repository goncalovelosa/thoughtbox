import type { ThoughtRowVM, ThoughtDetailVM } from '@/lib/session/view-models'

export type SearchMode = 'content' | 'titles'

export type SearchResult = {
  matchingRowIds: Set<string>
  matchCountByRow: Map<string, number>
  totalMatchCount: number
  matchingThoughtCount: number
}

export type HighlightSegment =
  | { type: 'text'; value: string }
  | { type: 'match'; value: string }

export function computeSearchResults(
  rows: ThoughtRowVM[],
  details: Record<string, ThoughtDetailVM>,
  query: string,
  mode: SearchMode,
): SearchResult {
  const queryLower = query.toLowerCase()
  const matchingRowIds = new Set<string>()
  const matchCountByRow = new Map<string, number>()
  let totalMatchCount = 0

  for (const row of rows) {
    // searchIndexText is already lowercased in view-models.ts
    const targetLower = mode === 'content'
      ? row.searchIndexText
      : row.previewText.toLowerCase()

    let count = 0
    let idx = targetLower.indexOf(queryLower)
    while (idx !== -1) {
      count++
      idx = targetLower.indexOf(queryLower, idx + queryLower.length)
    }

    if (count > 0) {
      matchingRowIds.add(row.id)
      matchCountByRow.set(row.id, count)
      totalMatchCount += count
    }
  }

  return {
    matchingRowIds,
    matchCountByRow,
    totalMatchCount,
    matchingThoughtCount: matchingRowIds.size,
  }
}

export function highlightText(
  text: string,
  query: string,
): HighlightSegment[] {
  if (!query || !text) {
    return [{ type: 'text', value: text || '' }]
  }

  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  const segments: HighlightSegment[] = []
  let lastEnd = 0

  let idx = textLower.indexOf(queryLower)
  while (idx !== -1) {
    if (idx > lastEnd) {
      segments.push({ type: 'text', value: text.slice(lastEnd, idx) })
    }
    segments.push({
      type: 'match',
      value: text.slice(idx, idx + queryLower.length),
    })
    lastEnd = idx + queryLower.length
    idx = textLower.indexOf(queryLower, lastEnd)
  }

  if (lastEnd < text.length) {
    segments.push({ type: 'text', value: text.slice(lastEnd) })
  }

  if (segments.length === 0) {
    return [{ type: 'text', value: text }]
  }

  return segments
}
