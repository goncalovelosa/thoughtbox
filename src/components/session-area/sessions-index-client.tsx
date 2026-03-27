'use client'

import { useMemo, useState } from 'react'
import type { SessionSummaryVM } from '@/lib/session/view-models'
import { SessionsIndexControls } from './sessions-index-controls'
import { SessionsTableShell } from './sessions-table-shell'

type Props = {
  sessions: SessionSummaryVM[]
}

export function SessionsIndexClient({ sessions }: Props) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const s of sessions) {
      for (const t of s.tags) tagSet.add(t)
    }
    return [...tagSet].sort()
  }, [sessions])

  const isFiltered = search !== '' || status !== 'all' || activeTags.length > 0

  const filtered = useMemo(() => {
    let result = sessions

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
  }, [sessions, search, status, activeTags])

  const handleTagToggle = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
    setActiveTags([])
  }

  return (
    <>
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

      {filtered.length === 0 && isFiltered ? (
        <div className="rounded-none border border-foreground bg-background/80 shadow-sm p-12 text-center">
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
