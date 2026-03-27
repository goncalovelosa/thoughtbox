# SPEC-001: Thought Type Filters + Session Summary Card

**Status:** Draft
**Created:** 2026-03-27
**Scope:** `/runs/[runId]` session detail page

---

## Problem Statement

Thoughtbox's web UI displays AI reasoning sessions as a linear timeline of thoughts. In Code Mode (the MCP protocol), agents emit structured thought types -- decisions, belief snapshots, action reports, assumption updates -- that carry distinct semantic weight. The web UI renders these as badges on individual thought rows, but provides no way to filter or navigate by type.

For short sessions (under 20 thoughts), scrolling works fine. For real-world sessions (50-150+ thoughts), the information asymmetry between what the MCP protocol captures and what the web UI surfaces becomes a usability problem. A user reviewing a 120-thought session to find the 4 decision frames must scroll through every row, visually scanning for violet badges. There is no way to answer "how many belief snapshots did this session produce?" without counting manually.

The existing `SessionTraceToolbar` has a single text search input. Text search helps when you know *what* you're looking for, but not when you want to filter by *kind* of thinking.

## User Stories

1. **As a user reviewing a long session**, I want to filter the timeline to show only decision frames so I can trace the agent's key decision points without scrolling through 100+ reasoning thoughts.

2. **As a user debugging an agent's behavior**, I want to toggle on both "Action" and "Assumption" filters simultaneously so I can see the relationship between what the agent did and what assumptions changed.

3. **As a user opening a completed session for the first time**, I want a summary showing the breakdown of thought types, branch count, and duration so I can orient myself before diving into the timeline.

4. **As a user monitoring a live session**, I want filter chip counts to update in real time as new thoughts arrive so the summary stays accurate without page refresh.

5. **As a user reviewing a short session (under 20 thoughts)**, I want the summary card collapsed by default so it doesn't consume vertical space when the timeline is already scannable.

## Component Changes

### A. Thought Type Filter Chips

#### File: `src/components/session-area/session-trace-toolbar.tsx`

**New props added to `Props` type:**

```typescript
type Props = {
  isLive?: boolean
  sessionStatus: 'active' | 'completed' | 'abandoned'
  search: string
  onSearchChange: (value: string) => void
  // New:
  activeTypeFilters: Set<ThoughtDisplayType>
  onTypeFilterToggle: (type: ThoughtDisplayType) => void
  onTypeFilterClear: () => void
  typeCounts: Record<ThoughtDisplayType, number>
}
```

`ThoughtDisplayType` is the existing union type from `ThoughtRowVM['displayType']`.

**UI structure:** A second row below the search input containing horizontally-scrolling filter chips. Each chip renders as a button with:
- Label from `THOUGHT_TYPE_LABEL` in `badge-styles.ts` (e.g., "Decision", "Action")
- Count in parentheses from `typeCounts` (e.g., "Decision (5)")
- Active state uses the corresponding color from `THOUGHT_TYPE_BADGE`
- Inactive state uses `bg-background text-foreground ring-1 ring-foreground/20`
- An "All" chip at the start that is active when `activeTypeFilters` is empty
- Chips with count of 0 are rendered but visually muted (`opacity-40`) and disabled

**Chip dimensions:** Same height as existing search input (`h-9`), with `px-3 text-xs font-medium`. Chips wrap on narrow viewports using `flex-wrap`.

#### File: `src/components/session-area/session-trace-explorer.tsx`

**New state:**

```typescript
const [activeTypeFilters, setActiveTypeFilters] =
  useState<Set<ThoughtDisplayType>>(new Set())
```

**Filter pipeline change.** The existing `filteredRows` memo currently filters only by search text. It must integrate type filtering:

```typescript
const filteredRows = useMemo(() => {
  let result = rows

  // Type filter (OR logic: show rows matching ANY active type)
  if (activeTypeFilters.size > 0) {
    result = result.filter((r) => activeTypeFilters.has(r.displayType))
  }

  // Text search (applied after type filter)
  const q = search.trim().toLowerCase()
  if (q !== '') {
    result = result.filter((r) => r.searchIndexText.includes(q))
  }

  return result
}, [rows, search, activeTypeFilters])
```

**Count computation:**

```typescript
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
```

Counts are computed against the full `rows` array (not `filteredRows`) so they always reflect the complete session. This matches the convention in tools like GitHub issue filters where total counts are stable regardless of active filters.

**Toggle handlers passed to toolbar:**

```typescript
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
```

**Detail panel counter:** The existing `totalCount` and `positionIndex` props on `ThoughtDetailPanel` already derive from `filteredRows`, so the "3 of 12" counter will automatically reflect filtered results.

### B. Session Summary Card

#### New file: `src/components/session-area/session-summary-card.tsx`

A client component (`'use client'`) that receives pre-computed summary data and manages its own collapsed/expanded state.

**Props:**

```typescript
type SessionSummaryProps = {
  typeCounts: Record<ThoughtDisplayType, number>
  totalThoughts: number
  branchCount: number
  revisionCount: number
  durationLabel: string
  confidenceDistribution: {
    high: number
    medium: number
    low: number
  } | null
  tags: string[]
  defaultExpanded: boolean
}
```

**Layout (expanded state):**
- Outer container: `border border-foreground bg-background rounded-none mb-6 overflow-hidden`
- Header row (always visible): "Session Overview" label on the left, chevron toggle on the right. Clicking toggles collapse.
- Body (collapsible, animated with `grid-rows-[1fr]` / `grid-rows-[0fr]` transition):
  - **Top row** (3-4 stat boxes inline): Total Thoughts, Branches, Revisions, Duration
  - **Middle row**: Thought type breakdown as mini bar or chip list showing each type's count and percentage of total
  - **Bottom row** (conditional): Confidence distribution (only rendered if `confidenceDistribution` is not null) as three inline badges: "High (N)" / "Medium (N)" / "Low (N)"
  - **Tags row** (conditional): Rendered only if `tags.length > 0`. Tags displayed as chips using existing `BADGE_BASE` style.

**Collapse behavior:**
- `defaultExpanded` prop controls initial state
- Local `useState` manages toggle after mount
- No URL persistence (collapse state is ephemeral)

#### New file: `src/lib/session/compute-session-summary.ts`

A pure function that runs server-side in the page component. No database calls -- it operates on the `RawThoughtRecord[]` already fetched.

```typescript
export type SessionSummary = {
  typeCounts: Record<ThoughtDisplayType, number>
  totalThoughts: number
  branchCount: number
  revisionCount: number
  confidenceDistribution: {
    high: number
    medium: number
    low: number
  } | null
  tags: string[]
}

export function computeSessionSummary(
  thoughts: RawThoughtRecord[],
  sessionTags: string[],
): SessionSummary
```

Implementation:
- `typeCounts`: iterate thoughts, bucket by `thoughtType ?? 'reasoning'`
- `branchCount`: count unique non-null `branchId` values
- `revisionCount`: count thoughts where `isRevision === true` or `revisesThought != null`
- `confidenceDistribution`: count thoughts by `confidence` field. Return `null` if zero thoughts have confidence data (avoids rendering an empty section).
- `tags`: pass through from session record

#### File: `src/app/w/[workspaceSlug]/runs/[runId]/page.tsx`

Add summary computation after thought mapping, pass to new component:

```typescript
import { computeSessionSummary } from '@/lib/session/compute-session-summary'
import { SessionSummaryCard } from '@/components/session-area/session-summary-card'

// After rawThoughts mapping:
const summary = computeSessionSummary(rawThoughts, rawSession.tags)
const defaultExpanded = rawThoughts.length >= 20
```

Render between header and explorer:

```tsx
<SessionDetailHeader session={sessionVM} workspaceSlug={workspaceSlug} />
<SessionSummaryCard
  {...summary}
  totalThoughts={rawThoughts.length}
  durationLabel={sessionVM.durationLabel}
  defaultExpanded={defaultExpanded}
/>
<SessionTraceExplorer ... />
```

## Data Flow

```
[Supabase] ──fetch──> page.tsx (Server Component)
                         │
                         ├── computeSessionSummary(rawThoughts, tags) ──> SessionSummaryCard (client, static)
                         │
                         └── rawThoughts ──> SessionTraceExplorer (client)
                                                │
                                                ├── useSessionRealtime() ──> rows, details
                                                │
                                                ├── typeCounts memo (from rows)  ──> SessionTraceToolbar
                                                │
                                                ├── activeTypeFilters state ──> filteredRows memo
                                                │
                                                └── filteredRows ──> SessionTimeline + ThoughtDetailPanel
```

The summary card receives server-computed data and does not update in real time. The filter chips derive counts from the `rows` array inside `useSessionRealtime`, which *does* update in real time as new thoughts arrive via broadcast. This is intentional: the summary card is an orientation snapshot, while the filter chips are live navigation tools.

## UI Behavior Details

### Chip Toggle Logic

| Action | Result |
|--------|--------|
| Click "Decision" (no filters active) | "All" deactivates, "Decision" activates, timeline shows only decision_frame rows |
| Click "Action" (Decision already active) | Both "Decision" and "Action" active (OR logic), timeline shows decision_frame + action_report |
| Click "Decision" again | "Decision" deactivates, only "Action" remains active |
| Click "All" | All type filters cleared, full timeline shown |
| Click last remaining active chip | That chip deactivates, equivalent to "All" — full timeline shown |

### Count Display

- Chip label format: `"Decision (5)"` when count > 0
- Chip label format: `"Decision (0)"` when count is 0, chip rendered at `opacity-40` and `pointer-events-none`
- Counts reflect all thoughts in the session, not just those visible after text search

### Summary Card Collapse

- Sessions with < 20 thoughts: collapsed by default (user can expand)
- Sessions with >= 20 thoughts: expanded by default (user can collapse)
- Transition: CSS `grid-template-rows` animation for smooth expand/collapse

### Keyboard

- Filter chips are focusable via Tab and toggleable via Enter/Space
- No new keyboard shortcuts beyond standard button behavior

## Acceptance Criteria

1. **Filter chips render with correct counts.** Given a session with 80 reasoning, 5 decision_frame, 3 action_report, and 2 belief_snapshot thoughts: the Decision chip shows "Decision (5)", Action shows "Action (3)", Beliefs shows "Beliefs (2)", and types with 0 count are muted and disabled.

2. **Single filter narrows timeline.** Activating "Decision" reduces `filteredRows` to exactly the 5 decision_frame thoughts. The detail panel counter updates to "X of 5".

3. **Multiple filters use OR logic.** Activating both "Decision" and "Action" shows 8 rows (5 + 3).

4. **Filters compose with search.** With "Decision" active and search text "deploy", only decision_frame rows whose `searchIndexText` includes "deploy" appear.

5. **"All" clears filters.** Clicking "All" with any filters active returns to the full timeline.

6. **Counts do not change when filters are active.** The chip count for "Reasoning" still shows 80 even when only "Decision" filter is active.

7. **Real-time count updates.** When a new thought arrives via broadcast, `typeCounts` updates and the corresponding chip count increments.

8. **Summary card shows correct breakdown.** For the session above: total 90, branch count matches unique branchIds, revision count matches revisions.

9. **Summary card collapses/expands.** Click the toggle: body hides with animation. Click again: body shows.

10. **Summary card default state.** Session with 15 thoughts: card collapsed on load. Session with 25 thoughts: card expanded on load.

11. **Confidence distribution conditional.** Session where no thoughts have `confidence` set: confidence section not rendered. Session where some thoughts have confidence: section shows counts.

12. **Zero-thought edge case.** Session with 0 thoughts: all chip counts are 0, summary card shows "0" for all stats, no crash.

13. **URL state preserved.** Active type filters do not persist to URL params (ephemeral client state). Text search and `?thought=N` param continue to work as before.

## Non-Goals

- **Persisting filter state to URL.** Type filters are ephemeral. If the user navigates away and returns, filters reset. URL-persisted filters can be added later if there's demand.
- **Server-side filtering.** All filtering happens client-side against the already-fetched thought array. The current architecture fetches all thoughts for a session; server-side filtering would require pagination which is a separate initiative.
- **Filter-by-confidence or filter-by-branch.** This spec covers thought type filters only. Confidence and branch filtering are natural extensions but out of scope.
- **Summary card real-time updates.** The summary card is a server-rendered snapshot. It does not update when new thoughts arrive via realtime. The filter chips in the toolbar handle the live case.
- **Animated filter transitions on the timeline.** When filters change, rows appear/disappear immediately. Layout animations (e.g., FLIP transitions on row reorder) are not in scope.
- **Mobile-specific filter UI** (bottom sheet, drawer). Chips wrap naturally via `flex-wrap`. A dedicated mobile filter experience is deferred.

## Agent Teams Parallelization

This spec decomposes cleanly into three independent workstreams that share only the `ThoughtDisplayType` union (already defined in `view-models.ts`) and the `THOUGHT_TYPE_LABEL` / `THOUGHT_TYPE_BADGE` maps (already defined in `badge-styles.ts`).

### Workstream 1: Filter Chips (toolbar + explorer state)

**Files touched:**
- `src/components/session-area/session-trace-toolbar.tsx` (add chip row)
- `src/components/session-area/session-trace-explorer.tsx` (add filter state, count memo, modified filteredRows pipeline)

**Dependencies:** None beyond existing types.

**Merge risk:** Low. Changes to `session-trace-explorer.tsx` touch the `filteredRows` memo and add new state -- no overlap with Workstream 2.

### Workstream 2: Summary Card (new component + server integration)

**Files touched:**
- `src/lib/session/compute-session-summary.ts` (new file, pure function)
- `src/components/session-area/session-summary-card.tsx` (new file, client component)
- `src/app/w/[workspaceSlug]/runs/[runId]/page.tsx` (import and render summary card)

**Dependencies:** None beyond existing types. The `page.tsx` change is additive (new JSX between two existing components).

**Merge risk:** Low. Only the `page.tsx` change overlaps with other workstreams, and it's a two-line insertion.

### Workstream 3: Test Coverage

**Files touched:**
- `src/lib/session/__tests__/compute-session-summary.test.ts` (unit tests for pure summary function)
- `src/components/session-area/__tests__/session-trace-toolbar.test.tsx` (chip rendering, toggle behavior)
- `src/components/session-area/__tests__/session-trace-explorer.test.tsx` (filter pipeline integration)

**Dependencies:** Blocked on Workstreams 1 and 2 for implementation, but test *structure* (describe blocks, fixture data, assertion shapes) can be written in parallel using the acceptance criteria above as the test plan. Tests run red until implementations merge, then go green.

### Coordination Points

- All three workstreams use `ThoughtDisplayType` from `view-models.ts` -- no changes needed to that type.
- Workstream 1 and Workstream 2 both touch `page.tsx` but in different locations (Workstream 2 adds the summary card JSX, Workstream 1 does not touch `page.tsx`). No merge conflict expected.
- Workstream 3 should sync with Workstreams 1 and 2 on final prop shapes before writing assertions.
