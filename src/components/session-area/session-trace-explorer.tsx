'use client'

import type { ThoughtDetailVM, ThoughtRowVM } from '@/lib/session/view-models'
import { SessionTraceToolbar } from './session-trace-toolbar'

type Props = {
  rows: ThoughtRowVM[]
  details: Record<string, ThoughtDetailVM>
}

export function SessionTraceExplorer({ rows, details }: Props) {
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] gap-6 items-start">
      {/* Left Column: Trace List */}
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <SessionTraceToolbar />
        
        <div className="flex-1 overflow-y-auto relative">
          <div className="p-4 text-center text-sm text-slate-500">
            [Timeline Implementation Pending]
          </div>
        </div>
      </div>

      {/* Right Column: Selected Thought Detail */}
      <div className="w-full sticky top-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
        <div className="p-4 text-center text-sm text-slate-500 my-auto">
          Select a thought to view details
        </div>
      </div>
    </div>
  )
}
