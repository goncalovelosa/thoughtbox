'use client'

import { useState } from 'react'

export function SessionsIndexControls() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('All statuses')

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <input
        type="text"
        disabled
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search sessions…"
        className="h-10 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <select
        disabled
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="h-10 rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option>All statuses</option>
        <option>Active</option>
        <option>Completed</option>
        <option>Abandoned</option>
      </select>
    </div>
  )
}
