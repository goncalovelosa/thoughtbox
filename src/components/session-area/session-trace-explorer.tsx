'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { RawThoughtRecord } from '@/lib/session/view-models'
import { useSessionRealtime } from '@/lib/session/use-session-realtime'
import { SessionTraceToolbar } from './session-trace-toolbar'
import { SessionTimeline } from './session-timeline'
import { ThoughtDetailPanel } from './thought-detail-panel'

type Props = {
  initialThoughts: RawThoughtRecord[]
  workspaceId: string
  sessionId: string
  sessionStatus: 'active' | 'completed' | 'abandoned'
}

export function SessionTraceExplorer({
  initialThoughts,
  workspaceId,
  sessionId,
  sessionStatus,
}: Props) {
  const { rows, details, isLive } = useSessionRealtime(
    initialThoughts,
    workspaceId,
    sessionId,
  )
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const hasAppliedDefault = useRef(false)

  const thoughtParam = searchParams.get('thought')

  // Resolve selected thought ID from ?thought=<number> param
  const selectedId = (() => {
    if (!thoughtParam || rows.length === 0) return null
    const num = Number(thoughtParam)
    if (Number.isNaN(num)) return null
    const match = rows.find((r) => r.thoughtNumber === num)
    return match?.id ?? null
  })()

  // Update URL param without full navigation
  const setThoughtParam = useCallback(
    (thoughtNumber: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('thought', String(thoughtNumber))
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  // Handle click on a thought row
  const handleSelect = useCallback(
    (id: string) => {
      const row = rows.find((r) => r.id === id)
      if (row) {
        setThoughtParam(row.thoughtNumber)
      }
    },
    [rows, setThoughtParam],
  )

  // Apply default selection when no param is present and rows are loaded
  useEffect(() => {
    if (rows.length === 0 || thoughtParam || hasAppliedDefault.current) return
    hasAppliedDefault.current = true

    const defaultRow =
      sessionStatus === 'active' ? rows[rows.length - 1] : rows[0]
    if (defaultRow) {
      setThoughtParam(defaultRow.thoughtNumber)
    }
  }, [rows, thoughtParam, sessionStatus, setThoughtParam])

  // Scroll selected thought into view on initial load
  useEffect(() => {
    if (!selectedId) return
    const el = document.querySelector(`[data-thought-id="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] gap-6 items-start">
      {/* Left Column: Trace List */}
      <div className="w-full rounded-2xl border border-slate-800 bg-slate-950 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
        <SessionTraceToolbar isLive={isLive} />

        <div className="flex-1 overflow-y-auto relative">
          <SessionTimeline
            rows={rows}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
      </div>

      {/* Right Column: Selected Thought Detail */}
      <div className="w-full sticky top-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
        <ThoughtDetailPanel
          detail={selectedId ? details[selectedId] : null}
        />
      </div>
    </div>
  )
}
