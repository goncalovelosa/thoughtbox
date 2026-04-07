'use client'

import { useMemo, useState } from 'react'
import type { SessionSummaryVM } from '@/lib/session/view-models'
import { SessionsIndexControls } from './sessions-index-controls'
import { SessionsTableShell } from './sessions-table-shell'
import { SessionsTimeline, sessionInBucket, type TimeRange } from './sessions-timeline'

const MIN_THOUGHTS = 3

type Props = {
  sessions: SessionSummaryVM[]
}

export function SessionsIndexClient({ sessions }: Props) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [range, setRange] = useState<TimeRange>('7d')
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null)
  const [showMinor, setShowMinor] = useState(false)

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const s of sessions) {
      for (const t of s.tags) tagSet.add(t)
    }
    return [...tagSet].sort()
  }, [sessions])

  const minorCount = useMemo(
    () => sessions.filter((s) => (s.thoughtCount ?? 0) < MIN_THOUGHTS).length,
    [sessions],
  )

  const isFiltered =
    search !== '' ||
    status !== 'all' ||
    activeTags.length > 0 ||
    selectedBucket !== null

  const filtered = useMemo(() => {
    let result = sessions

    // Hide minor sessions unless toggled
    if (!showMinor) {
      result = result.filter((s) => (s.thoughtCount ?? 0) >= MIN_THOUGHTS)
    }

    // Time bucket filter from chart click
    if (selectedBucket !== null) {
      result = result.filter((s) => sessionInBucket(s, selectedBucket, range))
    }

    if (status !== 'all') {
      result = result.filter((s) => s.status === status)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          (s.title?.toLowerCase().includes(q) ?? false) ||
          s.shortId.toLowerCase().includes(q),
      )
    }

    if (activeTags.length > 0) {
      result = result.filter((s) =>
        activeTags.every((tag) => s.tags.includes(tag)),
      )
    }

    return result
  }, [sessions, search, status, activeTags, selectedBucket, range, showMinor])

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const handleRangeChange = (r: TimeRange) => {
    setRange(r)
    setSelectedBucket(null)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setActiveTags([])
    setSelectedBucket(null)
  }

  return (
    <>
      <SessionsTimeline
        sessions={sessions}
        range={range}
        onRangeChange={handleRangeChange}
        selectedBucket={selectedBucket}
        onBucketClick={setSelectedBucket}
      />

      <SessionsIndexControls
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        allTags={allTags}
        activeTags={activeTags}
        onTagToggle={handleTagToggle}
        onTagClear={() => setActiveTags([])}
      />

      {minorCount > 0 && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setShowMinor(!showMinor)}
            className="text-[11px] text-foreground/40 hover:text-foreground transition-colors"
          >
            {showMinor
              ? `Hide ${minorCount} minor sessions`
              : `Show ${minorCount} minor sessions (<${MIN_THOUGHTS} thoughts)`}
          </button>
        </div>
      )}

      {filtered.length === 0 && isFiltered ? (
        <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.03] shadow-sm p-12 text-center">
          <h3 className="text-lg font-medium text-foreground">
            No sessions match these filters
          </h3>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-foreground hover:text-foreground"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <SessionsTableShell
          sessions={filtered}
          onTagClick={handleTagToggle}
        />
      )}
    </>
  )
}
