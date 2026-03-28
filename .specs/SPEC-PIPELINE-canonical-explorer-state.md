# SPEC-PIPELINE: Canonical SessionTraceExplorer State & Pipeline

**Status:** Draft
**Created:** 2026-03-27
**Purpose:** Resolves cross-spec conflicts in `session-trace-explorer.tsx` — the combined `filteredRows` pipeline, state management, and toolbar layout.

This addendum supersedes the individual `filteredRows` code samples in SPEC-001, SPEC-002, and SPEC-004.

---

## Prerequisites (before any spec implementation)

1. **Export `ThoughtDisplayType` from `view-models.ts`:**
   ```typescript
   export type ThoughtDisplayType = ThoughtRowVM['displayType']
   ```
   All 4 specs reference this type. Currently only derived locally in `badge-styles.ts`.

---

## Combined State

```typescript
// Existing
const [search, setSearch] = useState('')

// SPEC-001: Type Filters
const [activeTypeFilters, setActiveTypeFilters] = useState<Set<ThoughtDisplayType>>(new Set())

// SPEC-002: Debounced Search + Mode
const [debouncedSearch, setDebouncedSearch] = useState('')
const [searchMode, setSearchMode] = useState<'content' | 'titles'>('content')

// SPEC-003: Phase Collapse
const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set())

// SPEC-004: View Mode
const [viewMode, setViewMode] = useState<'full' | 'decisions'>('full')
```

## Canonical `filteredRows` Pipeline

```typescript
// Step 0: Debounce search input (SPEC-002)
useEffect(() => {
  if (search === '') {
    setDebouncedSearch('')
    return
  }
  const timer = setTimeout(() => setDebouncedSearch(search), 300)
  return () => clearTimeout(timer)
}, [search])

// Step 1: Type counts from FULL rows (SPEC-001)
// Always computed from unfiltered rows so chip counts are stable
const typeCounts = useMemo(() => {
  const counts = {} as Record<ThoughtDisplayType, number>
  for (const row of rows) {
    counts[row.displayType] = (counts[row.displayType] || 0) + 1
  }
  return counts
}, [rows])

// Step 2: Combined filter pipeline
const { filteredRows, searchResult } = useMemo(() => {
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

  // AMENDMENT (CC-3): Search searchIndexText in content mode,
  // NOT rawThought. searchIndexText includes tool names, option
  // labels, belief entities, and other structured metadata that
  // rawThought alone would miss.
  const matchingRowIds = new Set<string>()
  const matchCountByRow = new Map<string, number>()
  let totalMatchCount = 0

  for (const row of result) {
    const target = searchMode === 'content'
      ? row.searchIndexText
      : row.previewText
    const targetLower = target.toLowerCase()

    let count = 0
    let idx = targetLower.indexOf(q)
    while (idx !== -1) {
      count++
      idx = targetLower.indexOf(q, idx + q.length)
    }

    if (count > 0) {
      matchingRowIds.add(row.id)
      matchCountByRow.set(row.id, count)
      totalMatchCount += count
    }
  }

  const filtered = result.filter((r) => matchingRowIds.has(r.id))

  return {
    filteredRows: filtered,
    searchResult: {
      matchingRowIds,
      matchCountByRow,
      totalMatchCount,
      matchingThoughtCount: matchingRowIds.size,
    },
  }
}, [rows, activeTypeFilters, debouncedSearch, searchMode])

// Step 3: Phase detection (SPEC-003)
// Runs on FULL rows, NOT filteredRows — phases are structural
const phases = useMemo(() => {
  return detectPhases(rows, details)
}, [rows, details])

// Step 3b: Compute visible phase counts for hiding empty phases (B2 fix)
const visiblePhases = useMemo(() => {
  if (phases.length === 0) return phases
  const filteredIds = new Set(filteredRows.map(r => r.id))
  return phases.filter(phase => {
    const phaseRows = rows.slice(phase.startIndex, phase.endIndex + 1)
    return phaseRows.some(r => filteredIds.has(r.id))
  })
}, [phases, filteredRows, rows])

// Step 4: View mode branching (SPEC-004)
// Decision view groups filteredRows; full view passes them through
const decisionGroups = useMemo(() => {
  if (viewMode !== 'decisions') return null
  return groupByDecisions(filteredRows, details)
}, [viewMode, filteredRows, details])
```

### Key Design Decisions

1. **Type filter counts are stable** — computed from unfiltered `rows`, not `filteredRows`. This matches GitHub-style filter UIs where total counts don't change when filters are applied.

2. **Search match counts reflect the type-filtered set** — if you filter to "Decision" thoughts and then search, the match count tells you how many of those decisions match. This is intuitive: you're searching within what you're looking at.

3. **Content-mode search uses `searchIndexText`** (not `rawThought`) — this preserves the current behavior where searching for "sql_query" finds action_report thoughts that used that tool. `searchIndexText` includes tool names, option labels, belief entities, and other structured metadata.

4. **Phases run on unfiltered rows** — phases are structural landmarks, not filters. But **phase headers hide when all their thoughts are filtered out** (B2 fix).

5. **Decision grouping is a view transform, not a filter** — it consumes `filteredRows` (already type-filtered and search-filtered) and restructures them into decision groups.

---

## Unified Toolbar Layout

All 4 specs add elements to `SessionTraceToolbar`. The canonical layout:

```
+------------------------------------------------------------------+
| Row 1: Core controls                                             |
| [Search thoughts...] [Content|Titles]  [Full|Decisions]  [LIVE] |
|                                          [Phases v] [Export v]   |
+------------------------------------------------------------------+
| Row 1.5: Search feedback (visible only when searching)           |
| 12 matches in 8 thoughts                                        |
+------------------------------------------------------------------+
| Row 2: Filter chips (visible when session has >1 thought type)   |
| [All] [Reasoning(80)] [Decision(5)] [Action(3)] [Belief(2)] ... |
+------------------------------------------------------------------+
```

### Zone assignments:
- **Left**: Search input (`max-w-xs` on narrow, `max-w-sm` on wide) + search mode toggle (SPEC-002)
- **Center-right**: View mode toggle (SPEC-004) — hidden on mobile, stacks below search
- **Right cluster**: Phases button (SPEC-003, hidden when `viewMode === 'decisions'`) + Export button (SPEC-004) + LIVE indicator
- **Below search** (conditional): Match count text (SPEC-002)
- **Full-width row 2** (conditional): Type filter chips (SPEC-001), `flex-wrap`

### Responsive behavior:
- **>1024px**: Single-row layout with all controls inline
- **768-1024px**: Search + toggles on row 1, right cluster wraps below
- **<768px**: Search full-width, toggles below, chips scroll horizontally

### Toolbar props (combined):

```typescript
type SessionTraceToolbarProps = {
  // Existing
  isLive?: boolean
  sessionStatus: 'active' | 'completed' | 'abandoned'
  search: string
  onSearchChange: (value: string) => void

  // SPEC-001: Type Filters
  activeTypeFilters: Set<ThoughtDisplayType>
  onTypeFilterToggle: (type: ThoughtDisplayType) => void
  onTypeFilterClear: () => void
  typeCounts: Record<ThoughtDisplayType, number>

  // SPEC-002: Search
  searchResult: SearchResult | null
  searchMode: 'content' | 'titles'
  onSearchModeChange: (mode: 'content' | 'titles') => void

  // SPEC-003: Phases
  phases: Phase[]
  onPhaseJump: (phaseId: string) => void

  // SPEC-004: View + Export
  viewMode: 'full' | 'decisions'
  onViewModeChange: (mode: 'full' | 'decisions') => void
  onExport: (format: 'markdown' | 'json' | 'clipboard') => void
  hasActiveFilters: boolean
}
```

This is 17 props. If this feels unwieldy during implementation, the toolbar can be split into sub-components (`SearchControls`, `FilterChips`, `ViewControls`) that each receive a focused subset. But the flat prop interface is fine for the initial implementation.

---

## Implementation Order

Based on the pipeline dependency analysis:

1. **Prerequisites**: Export `ThoughtDisplayType` from `view-models.ts`
2. **SPEC-002** (search) — most invasive pipeline change, establishes the `{ filteredRows, searchResult }` return shape
3. **SPEC-001** (type filters) — inserts type filter step before search in the pipeline
4. **SPEC-003** (phases + tags) — phases are a separate memo; tags are on a different page
5. **SPEC-004** (decisions + export) — consumes the complete pipeline

SPEC-003's tag filtering (sessions index page) can be parallelized with any of the above since it touches entirely different files.

### Agent Teams recommendation for implementation:

**Team 1** (serial, shared pipeline):
- SPEC-002 → SPEC-001 → SPEC-004 (decision view only)

**Team 2** (parallel, independent files):
- SPEC-003 tag filtering (sessions index page)
- SPEC-004 export formatters + dropdown (pure functions, no pipeline dependency)
- SPEC-003 phase detection algorithm + tests (pure function)

After both teams complete, integrate phase headers into the timeline and export button into the toolbar.
