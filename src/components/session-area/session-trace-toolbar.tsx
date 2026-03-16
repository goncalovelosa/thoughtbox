'use client'

import { useState } from 'react'

type Props = {
  isLive?: boolean
}

export function SessionTraceToolbar({ isLive }: Props) {
  const [search, setSearch] = useState('')

  return (
    <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-3 flex items-center justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          disabled
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search thoughts…"
          className="h-9 w-full max-w-sm rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {isLive && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Live</span>
        </div>
      )}
    </div>
  )
}
