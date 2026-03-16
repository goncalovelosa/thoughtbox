'use client'

import { useState } from 'react'

export function SessionTraceToolbar() {
  const [search, setSearch] = useState('')

  return (
    <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          disabled
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search thoughts…"
          className="h-9 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        
        <div className="flex items-center gap-2">
          {/* Mock filters for v1 UI shell */}
          <button className="inline-flex h-9 items-center rounded-full border border-brand-500/40 bg-brand-500/10 px-3 text-xs font-medium text-brand-200">
            All Types
          </button>
          <button className="inline-flex h-9 items-center rounded-full border border-slate-800 bg-slate-900 px-3 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white">
            Revisions Only
          </button>
        </div>
      </div>
    </div>
  )
}
