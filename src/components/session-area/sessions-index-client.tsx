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

  const isFiltered = search !== '' || status !== 'all'

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

    return result
  }, [sessions, search, status])

  const clearFilters = () => {
    setSearch('')
    setStatus('all')
  }

  return (
    <>
      <SessionsIndexControls
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
      />

      {filtered.length === 0 && isFiltered ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm p-12 text-center">
          <h3 className="text-lg font-medium text-slate-200">
            No sessions match these filters
          </h3>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-3 text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <SessionsTableShell sessions={filtered} />
      )}
    </>
  )
}
