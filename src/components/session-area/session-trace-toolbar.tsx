'use client'

import type { ThoughtDisplayType } from '@/lib/session/view-models'
import type { SearchMode, SearchResult } from '@/lib/session/search-utils'
import {
  THOUGHT_TYPE_LABEL,
  THOUGHT_TYPE_BADGE,
  BADGE_BASE,
} from '@/lib/session/badge-styles'

const ALL_TYPES: ThoughtDisplayType[] = [
  'reasoning',
  'decision_frame',
  'action_report',
  'belief_snapshot',
  'assumption_update',
  'context_snapshot',
  'progress',
]

type ViewMode = 'full' | 'decisions'

type Props = {
  isLive?: boolean
  sessionStatus: 'active' | 'completed' | 'abandoned'
  search: string
  onSearchChange: (value: string) => void
  searchResult: SearchResult | null
  searchMode: SearchMode
  onSearchModeChange: (mode: SearchMode) => void
  activeTypeFilters: Set<ThoughtDisplayType>
  onTypeFilterToggle: (type: ThoughtDisplayType) => void
  onTypeFilterClear: () => void
  typeCounts: Record<ThoughtDisplayType, number>
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  exportSlot?: React.ReactNode
}

export function SessionTraceToolbar({
  isLive,
  sessionStatus,
  search,
  onSearchChange,
  searchResult,
  searchMode,
  onSearchModeChange,
  activeTypeFilters,
  onTypeFilterToggle,
  onTypeFilterClear,
  typeCounts,
  viewMode,
  onViewModeChange,
  exportSlot,
}: Props) {
  const showLiveIndicator = sessionStatus === 'active'
  const hasAnyNonReasoning = ALL_TYPES.some(
    (t) => t !== 'reasoning' && typeCounts[t] > 0,
  )

  return (
    <div className="sticky top-0 z-10 border-b border-foreground/10 bg-background/95 backdrop-blur">
      {/* Row 1: Search + toggles + live indicator */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search thoughts…"
          className="h-9 w-full max-w-xs rounded-xl border border-foreground/10 bg-background px-3 text-sm text-foreground placeholder:text-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />

        {/* Search mode toggle */}
        <div role="group" aria-label="Search mode" className="flex rounded-lg border border-foreground/10 overflow-hidden">
          <button
            type="button"
            aria-pressed={searchMode === 'content'}
            onClick={() => onSearchModeChange('content')}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none ${
              searchMode === 'content'
                ? 'bg-foreground/10 text-foreground border-r border-foreground/30'
                : 'text-foreground/50 border-r border-foreground/30 hover:text-foreground'
            }`}
          >
            Content
          </button>
          <button
            type="button"
            aria-pressed={searchMode === 'titles'}
            onClick={() => onSearchModeChange('titles')}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none ${
              searchMode === 'titles'
                ? 'bg-foreground/10 text-foreground'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            Titles
          </button>
        </div>

        {/* View mode toggle */}
        <div role="group" aria-label="View mode" className="flex rounded-lg border border-foreground/10 overflow-hidden">
          <button
            type="button"
            aria-pressed={viewMode === 'full'}
            onClick={() => onViewModeChange('full')}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none ${
              viewMode === 'full'
                ? 'bg-foreground/10 text-foreground border-r border-foreground/30'
                : 'text-foreground/50 border-r border-foreground/30 hover:text-foreground'
            }`}
          >
            Full Trace
          </button>
          <button
            type="button"
            aria-pressed={viewMode === 'decisions'}
            onClick={() => onViewModeChange('decisions')}
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none ${
              viewMode === 'decisions'
                ? 'bg-foreground/10 text-foreground'
                : 'text-foreground/50 hover:text-foreground'
            }`}
          >
            Decisions
          </button>
        </div>

        <div className="flex-1" />

        {exportSlot}

        {showLiveIndicator && isLive != null && (
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-lg border ${
              isLive
                ? 'bg-emerald-500/10 border-emerald-500/20'
                : 'bg-background/50 border-foreground/10'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-emerald-500 animate-pulse motion-reduce:animate-none' : 'bg-background0'
              }`}
            />
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider ${
                isLive ? 'text-emerald-400' : 'text-foreground'
              }`}
            >
              {isLive ? 'Live' : 'Connecting'}
            </span>
          </div>
        )}
      </div>

      {/* Match count */}
      {searchResult && (
        <div className="px-4 pb-2 -mt-1" aria-live="polite">
          <span className="text-xs font-mono text-foreground/60">
            {searchResult.totalMatchCount === 0
              ? '0 matches'
              : `${searchResult.totalMatchCount} match${searchResult.totalMatchCount === 1 ? '' : 'es'} in ${searchResult.matchingThoughtCount} thought${searchResult.matchingThoughtCount === 1 ? '' : 's'}`}
          </span>
        </div>
      )}

      {/* Row 2: Type filter chips */}
      {hasAnyNonReasoning && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleTypeFilterClear}
            className={`${BADGE_BASE} transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none ${
              activeTypeFilters.size === 0
                ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/30'
                : 'bg-background text-foreground/50 ring-1 ring-foreground/20 hover:text-foreground'
            }`}
          >
            All
          </button>
          {ALL_TYPES.map((type) => {
            const count = typeCounts[type]
            const isActive = activeTypeFilters.has(type)
            const isDisabled = count === 0

            return (
              <button
                key={type}
                type="button"
                disabled={isDisabled}
                onClick={() => onTypeFilterToggle(type)}
                className={`${BADGE_BASE} transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-foreground/40 focus-visible:outline-none ${
                  isActive
                    ? THOUGHT_TYPE_BADGE[type]
                    : isDisabled
                      ? 'bg-background text-foreground/30 ring-1 ring-foreground/10 cursor-not-allowed'
                      : 'bg-background text-foreground/60 ring-1 ring-foreground/20 hover:text-foreground'
                }`}
              >
                {THOUGHT_TYPE_LABEL[type]} ({count})
              </button>
            )
          })}
        </div>
      )}
    </div>
  )

  function handleTypeFilterClear() {
    onTypeFilterClear()
  }
}
