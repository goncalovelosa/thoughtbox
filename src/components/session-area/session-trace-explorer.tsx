'use client'

import { useState } from 'react'
import type { ThoughtDetailVM, ThoughtRowVM } from '@/lib/session/view-models'
import { SessionTraceToolbar } from './session-trace-toolbar'
import { SessionTimeline } from './session-timeline'

type Props = {
  rows: ThoughtRowVM[]
  details: Record<string, ThoughtDetailVM>
}

export function SessionTraceExplorer({ rows, details }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] gap-6 items-start">
      {/* Left Column: Trace List */}
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <SessionTraceToolbar />
        
        <div className="flex-1 overflow-y-auto relative">
          <SessionTimeline 
            rows={rows} 
            selectedId={selectedId} 
            onSelect={setSelectedId} 
          />
        </div>
      </div>

      {/* Right Column: Selected Thought Detail */}
      <div className="w-full sticky top-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
        {selectedId && details[selectedId] ? (
          <div className="p-4 text-slate-200">
            {/* TODO: Detail panel implementation coming in Phase 5 */}
            <h3 className="font-semibold mb-2">Detail for: {details[selectedId].shortId}</h3>
            <pre className="text-xs font-mono text-slate-400 bg-slate-950 p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(details[selectedId], null, 2)}
            </pre>
          </div>
        ) : (
          <div className="p-4 text-center text-sm text-slate-500 my-auto">
            Select a thought to view details
          </div>
        )}
      </div>
    </div>
  )
}
