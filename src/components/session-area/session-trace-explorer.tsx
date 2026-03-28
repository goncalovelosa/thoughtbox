'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type {
  RawThoughtRecord,
  ThoughtDisplayType,
  SessionDetailVM,
} from '@/lib/session/view-models'
import { useSessionRealtime } from '@/lib/session/use-session-realtime'
import {
  computeSearchResults,
  type SearchMode,
  type SearchResult,
} from '@/lib/session/search-utils'
import { groupByDecisions } from '@/lib/session/decision-grouping'
import { detectPhases } from '@/lib/session/phase-detection'
import { SessionTraceToolbar } from './session-trace-toolbar'
import { SessionTimeline } from './session-timeline'
import { DecisionTimeline } from './decision-timeline'
import { ThoughtDetailPanel } from './thought-detail-panel'
import { ExportDropdown } from './export-dropdown'

type ViewMode = 'full' | 'decisions'

type Props = {
  initialThoughts: RawThoughtRecord[]
  workspaceId: string
  sessionId: string
  sessionStatus: 'active' | 'completed' | 'abandoned'
  sessionVM: SessionDetailVM
}

export function SessionTraceExplorer({
  initialThoughts,
  workspaceId,
  sessionId,
  sessionStatus,
  sessionVM,
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

  // --- State ---
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('content')
  const [activeTypeFilters, setActiveTypeFilters] = useState<
    Set<ThoughtDisplayType>
  >(new Set())
  const [viewMode, setViewMode] = useState<ViewMode>('full')
  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(
    new Set(),
  )

  // --- Debounce search ---
  useEffect(() => {
    if (search === '') {
      setDebouncedSearch('')
      return
    }
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // --- Type counts (from FULL rows, stable regardless of filters) ---
  const typeCounts = useMemo(() => {
    const counts: Record<ThoughtDisplayType, number> = {
      reasoning: 0,
      decision_frame: 0,
      action_report: 0,
      belief_snapshot: 0,
      assumption_update: 0,
      context_snapshot: 0,
      progress: 0,
    }
    for (const row of rows) {
      counts[row.displayType]++
    }
    return counts
  }, [rows])

  // --- Combined filter pipeline ---
  const { filteredRows, searchResult } = useMemo((): {
    filteredRows: typeof rows
    searchResult: SearchResult | null
  } => {
    let result = rows

    // [SPEC-001] Type filter (OR logic)
    if (activeTypeFilters.size > 0) {
      result = result.filter((r) => activeTypeFilters.has(r.displayType))
    }

    // [SPEC-002] Text search with match counting
    const q = debouncedSearch.trim().toLowerCase()
    if (q === '') {
      return { filteredRows: result, searchResult: null }
    }

    const sr = computeSearchResults(result, details, q, searchMode)
    const filtered = result.filter((r) => sr.matchingRowIds.has(r.id))

    return { filteredRows: filtered, searchResult: sr }
  }, [rows, details, activeTypeFilters, debouncedSearch, searchMode])

  // --- Type filter handlers ---
  const handleTypeFilterToggle = useCallback(
    (type: ThoughtDisplayType) => {
      setActiveTypeFilters((prev) => {
        const next = new Set(prev)
        if (next.has(type)) {
          next.delete(type)
        } else {
          next.add(type)
        }
        return next
      })
    },
    [],
  )

  const handleTypeFilterClear = useCallback(() => {
    setActiveTypeFilters(new Set())
  }, [])

  // --- Decision grouping (SPEC-004) ---
  const decisionGroups = useMemo(() => {
    if (viewMode !== 'decisions') return null
    return groupByDecisions(filteredRows, details)
  }, [viewMode, filteredRows, details])

  // --- Phase detection (SPEC-003) ---
  const phases = useMemo(
    () => detectPhases(rows, details),
    [rows, details],
  )

  // Hide phases with zero visible thoughts after filtering
  const visiblePhases = useMemo(() => {
    if (phases.length === 0) return phases
    const filteredIds = new Set(filteredRows.map((r) => r.id))
    return phases.filter((phase) => {
      for (let i = phase.startIndex; i <= phase.endIndex; i++) {
        if (rows[i] && filteredIds.has(rows[i].id)) return true
      }
      return false
    })
  }, [phases, filteredRows, rows])

  const handlePhaseToggle = useCallback((phaseId: string) => {
    setCollapsedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }, [])

  const hasActiveFilters =
    activeTypeFilters.size > 0 || debouncedSearch.trim() !== ''

  // Build the list of ThoughtDetailVMs for export
  const exportThoughts = useMemo(() => {
    return filteredRows.map((r) => details[r.id]).filter(Boolean)
  }, [filteredRows, details])

  // --- Thought selection ---
  const thoughtParam = searchParams.get('thought')

  const selectedId = (() => {
    if (!thoughtParam || rows.length === 0) return null
    const num = Number(thoughtParam)
    if (Number.isNaN(num)) return null
    const match = rows.find((r) => r.thoughtNumber === num)
    return match?.id ?? null
  })()

  const setThoughtParam = useCallback(
    (thoughtNumber: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('thought', String(thoughtNumber))
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const handleSelect = useCallback(
    (id: string) => {
      const row = rows.find((r) => r.id === id)
      if (row) {
        setThoughtParam(row.thoughtNumber)
      }
    },
    [rows, setThoughtParam],
  )

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filteredRows.length === 0) return
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()

      const currentIdx = selectedId
        ? filteredRows.findIndex((r) => r.id === selectedId)
        : -1

      let nextIdx: number
      if (e.key === 'ArrowDown') {
        nextIdx = currentIdx < filteredRows.length - 1 ? currentIdx + 1 : 0
      } else {
        nextIdx = currentIdx > 0 ? currentIdx - 1 : filteredRows.length - 1
      }

      const nextRow = filteredRows[nextIdx]
      if (nextRow) {
        setThoughtParam(nextRow.thoughtNumber)
      }
    },
    [filteredRows, selectedId, setThoughtParam],
  )

  // Default selection
  useEffect(() => {
    if (rows.length === 0 || thoughtParam || hasAppliedDefault.current) return
    hasAppliedDefault.current = true

    const defaultRow =
      sessionStatus === 'active' ? rows[rows.length - 1] : rows[0]
    if (defaultRow) {
      setThoughtParam(defaultRow.thoughtNumber)
    }
  }, [rows, thoughtParam, sessionStatus, setThoughtParam])

  // Scroll selected thought into view
  useEffect(() => {
    if (!selectedId) return
    const el = document.querySelector(`[data-thought-id="${selectedId}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [selectedId])

  const debouncedQuery = debouncedSearch.trim()

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)] gap-6 items-start">
      {/* Left Column: Trace List */}
      <div
        className="w-full rounded-none border border-foreground bg-background shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <SessionTraceToolbar
          isLive={isLive}
          sessionStatus={sessionStatus}
          search={search}
          onSearchChange={setSearch}
          searchResult={searchResult}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          activeTypeFilters={activeTypeFilters}
          onTypeFilterToggle={handleTypeFilterToggle}
          onTypeFilterClear={handleTypeFilterClear}
          typeCounts={typeCounts}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          exportSlot={
            <ExportDropdown
              session={sessionVM}
              thoughts={exportThoughts}
              hasActiveFilters={hasActiveFilters}
            />
          }
        />

        <div className="flex-1 overflow-y-auto relative">
          {viewMode === 'decisions' && decisionGroups ? (
            <DecisionTimeline
              data={decisionGroups}
              selectedId={selectedId}
              onSelect={handleSelect}
              searchQuery={debouncedQuery}
            />
          ) : (
            <SessionTimeline
              rows={filteredRows}
              selectedId={selectedId}
              onSelect={handleSelect}
              searchQuery={debouncedQuery}
              phases={viewMode === 'full' ? visiblePhases : []}
              collapsedPhases={collapsedPhases}
              onPhaseToggle={handlePhaseToggle}
            />
          )}
        </div>
      </div>

      {/* Right Column: Selected Thought Detail */}
      <div className="w-full sticky top-6 rounded-none border border-foreground bg-background/80 shadow-sm overflow-hidden h-[calc(100vh-12rem)] flex flex-col">
        <ThoughtDetailPanel
          detail={selectedId ? details[selectedId] : null}
          positionIndex={
            selectedId
              ? filteredRows.findIndex((r) => r.id === selectedId)
              : undefined
          }
          totalCount={filteredRows.length}
          hasPrev={
            selectedId
              ? filteredRows.findIndex((r) => r.id === selectedId) > 0
              : false
          }
          hasNext={
            selectedId
              ? filteredRows.findIndex((r) => r.id === selectedId) <
                filteredRows.length - 1
              : false
          }
          onPrev={() => {
            if (!selectedId) return
            const idx = filteredRows.findIndex((r) => r.id === selectedId)
            if (idx > 0) setThoughtParam(filteredRows[idx - 1].thoughtNumber)
          }}
          onNext={() => {
            if (!selectedId) return
            const idx = filteredRows.findIndex((r) => r.id === selectedId)
            if (idx < filteredRows.length - 1)
              setThoughtParam(filteredRows[idx + 1].thoughtNumber)
          }}
          searchQuery={debouncedQuery}
        />
      </div>
    </div>
  )
}
