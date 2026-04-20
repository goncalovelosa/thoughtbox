# SPEC-003: Phase Navigation + Cross-Session Tag Filtering

## Problem Statement

Sessions with 20-150+ thoughts are a flat wall of timeline rows. Users scrolling through long reasoning traces have no structural landmarks to orient themselves or skip to the part they care about. The only navigation aid is text search, which requires knowing what to search for.

On the sessions index page, each session carries tags (assigned by the MCP server based on context), but those tags are invisible. Users cannot answer "show me all sessions tagged `deployment`" without opening sessions one by one. The existing search bar matches titles and IDs only.

These are two independent gaps in the same user flow: finding the right session, then finding the right part of that session.

## User Stories

1. **As a developer reviewing a long agent trace**, I want to see the session broken into labeled phases so I can jump directly to the decision-making section without scrolling through 40 reasoning thoughts.

2. **As a developer reviewing a long trace**, I want to collapse phases I have already read so the remaining content fits on screen.

3. **As a team lead triaging sessions**, I want to click a tag on any session row to instantly filter the list to all sessions sharing that tag.

4. **As a team lead triaging sessions**, I want to combine tag filters with the existing text search and status dropdown so I can narrow results like "all completed sessions tagged `refactor`."

5. **As a developer on a detail page**, I want to see a minimap or jump menu of phases so I can understand the session's structure at a glance without scrolling.

## Design

### A. Phase Detection Algorithm

Phase detection runs client-side in a pure function that takes `ThoughtRowVM[]` (plus the corresponding `ThoughtDetailVM` details map for accessing `progressData` and `thoughtType`) and returns `Phase[]`.

```
type Phase = {
  id: string                // stable id: `phase-${startIndex}`
  label: string             // auto-generated from content
  startIndex: number        // index into the rows array
  endIndex: number          // inclusive
  thoughtCount: number
  typeBreakdown: Record<string, number>  // e.g. { reasoning: 8, decision_frame: 2 }
  isCollapsed: boolean      // UI state, default false
}
```

**Pseudocode:**

```
function detectPhases(rows, details):
  if rows.length < 20:
    return []  // no phases for short sessions

  boundaries = []  // list of row indices where a phase break occurs

  for i in 1..rows.length-1:
    prev = rows[i-1]
    curr = rows[i]
    prevDetail = details[prev.id]
    currDetail = details[curr.id]

    // Heuristic 1: Significant timestamp gap (>30 min)
    gapMs = parse(curr.timestampISO) - parse(prev.timestampISO)
    if gapMs > 30 * 60 * 1000:
      boundaries.push({ index: i, reason: 'time_gap' })
      continue

    // Heuristic 2: Progress status transition
    if prevDetail.progressData and currDetail.progressData:
      if prevDetail.progressData.status != currDetail.progressData.status:
        boundaries.push({ index: i, reason: 'progress_change' })
        continue

    // Heuristic 3: Thought type transition
    //   Only fire when the type changes AND the previous run
    //   of the same type was >= 3 thoughts long.
    if prev.displayType != curr.displayType:
      runLength = countConsecutiveTypeBackward(rows, i-1)
      if runLength >= 3:
        boundaries.push({ index: i, reason: 'type_change' })
        continue

  // Merge small phases: any phase with < 3 thoughts gets
  // absorbed into its predecessor
  merged = mergeSmallPhases(boundaries, minSize=3)

  // Generate labels
  phases = []
  for each segment defined by merged boundaries:
    startRow = rows[segment.start]
    startDetail = details[startRow.id]
    label = generateLabel(startRow, startDetail, segment)
    phases.push(Phase { ... })

  return phases
```

**Label generation priority:**

1. If the first thought in the phase has `progressData.task`, use that task name.
2. If the phase is dominated (>60%) by one thought type, use "Decision Phase", "Action Phase", "Reasoning Phase", etc.
3. Fall back to first 6 words of the first thought's `previewText`.

### B. Component Changes: Phase Navigation (Session Detail)

**New files:**

| File | Purpose |
|------|---------|
| `src/lib/session/phase-detection.ts` | `detectPhases()` pure function + `Phase` type |
| `src/components/session-area/phase-header.tsx` | Collapsible phase header row rendered inline in the timeline |
| `src/components/session-area/phase-jump-menu.tsx` | Dropdown/popover listing all phases for quick navigation |

**Modified files:**

| File | Change |
|------|--------|
| `session-trace-explorer.tsx` | Call `detectPhases(rows, details)` in a `useMemo`. Pass `phases` and collapse state down to `SessionTimeline`. Add phase jump menu to toolbar area. |
| `session-timeline.tsx` | Accept `phases` prop. Before rendering each thought, check if it starts a new phase and insert a `PhaseHeader`. Skip rendering thoughts in collapsed phases. |
| `session-trace-toolbar.tsx` | Add `PhaseJumpMenu` trigger button (only visible when `phases.length > 0`). |
| `src/lib/session/view-models.ts` | No changes. Phase detection consumes existing VMs. |

**PhaseHeader component:**

- Full-width row inserted before the first thought of each phase
- Shows: phase label, thought count badge, type breakdown as small colored dots, chevron toggle
- Click chevron to collapse/expand the phase's thoughts
- Visually distinct from thought rows: slightly darker background, left border accent

**PhaseJumpMenu component:**

- Triggered from a "Phases" button in the toolbar (appears only for sessions with detected phases)
- Dropdown listing all phases with their labels and thought counts
- Clicking a phase scrolls to its header and expands it if collapsed

**Collapse state management:**

- `useState<Set<string>>` in `SessionTraceExplorer` tracking collapsed phase IDs
- Toggling a phase adds/removes its ID from the set
- "Collapse all" / "Expand all" controls in the phase jump menu

### C. Component Changes: Cross-Session Tag Filtering (Sessions Index)

**New files:**

| File | Purpose |
|------|---------|
| `src/components/session-area/tag-filter-bar.tsx` | Horizontal scrollable row of tag chips above the table |
| `src/components/session-area/tag-chip.tsx` | Individual clickable/removable tag chip |

**Modified files:**

| File | Change |
|------|--------|
| `src/lib/session/view-models.ts` | Add `tags: string[]` field to `SessionSummaryVM`. Update `createSessionSummaryVM` to pass through `raw.tags \|\| []`. |
| `runs/page.tsx` | Already reads `row.tags` into `RawSessionRecord`. No query changes needed. |
| `sessions-index-client.tsx` | Add `activeTags: string[]` state. Compute `allTags` from sessions. Add tag filter to the `filtered` memo (AND with existing search + status). Pass tag state to controls. Wire `clearFilters` to also clear tags. |
| `sessions-index-controls.tsx` | Accept `allTags`, `activeTags`, `onTagToggle`, `onTagClear` props. Render `TagFilterBar` below the search/status row. |
| `sessions-table-shell.tsx` | Render tags as small chips in the Session column (below title/shortId). Each chip calls `onTagClick` to activate that tag filter. Accept `onTagClick` prop. |

**Tag filter behavior:**

- Multiple tags can be active simultaneously (AND logic: session must have ALL active tags)
- Active tags shown as removable chips in the filter bar with an "x" button
- Inactive tags shown as outlined chips; click to activate
- Tag cloud derives from `allTags = [...new Set(sessions.flatMap(s => s.tags))]`, sorted alphabetically
- If no sessions have tags, the tag filter bar is not rendered
- URL state: active tags stored as `?tags=deploy,refactor` search param for shareability (optional, can defer)

**Data flow:**

```
runs/page.tsx (server)
  -> sessions[] with tags
    -> SessionsIndexClient (client)
      -> derives allTags
      -> manages activeTags state
      -> filters: status AND search AND tags
        -> SessionsIndexControls (tag bar + search + status)
        -> SessionsTableShell (tag chips in rows)
```

## Acceptance Criteria

### Phase Navigation

- [ ] Sessions with fewer than 20 thoughts show no phase headers
- [ ] Sessions with 20+ thoughts show phase headers at detected boundaries
- [ ] Phase headers display label, thought count, and type breakdown
- [ ] Clicking a phase header's chevron collapses/expands that phase
- [ ] Collapsed phases show only the header; thought rows are hidden
- [ ] Phase jump menu lists all phases and scrolls to the selected one
- [ ] Phase detection handles edge cases: all thoughts same type (no type-based phases), no progress data, single-thought branches
- [ ] Keyboard navigation (arrow keys) skips collapsed thoughts
- [ ] Phase detection runs in < 5ms for 150 thoughts (no network calls)
- [ ] **AMENDMENT (B2):** Phase headers are hidden when all thoughts in the phase are filtered out by type filters or search. A phase with 12 total thoughts but 0 visible (after filtering) does not render its header.
- [ ] **AMENDMENT (I4):** Phase jump menu button is hidden when `viewMode === 'decisions'` (SPEC-004). Phases are meaningless in decision timeline view, which has its own grouping via ReasoningGap.

### Tag Filtering

- [ ] Session rows display tags as chips when tags exist
- [ ] Tag filter bar appears above the table when any session has tags
- [ ] Clicking a tag chip in the table or filter bar activates that tag filter
- [ ] Active tag filters are shown as removable chips
- [ ] Multiple active tags use AND logic
- [ ] Tag filters combine with existing search and status filters
- [ ] "Clear filters" button also clears active tags
- [ ] Sessions with no tags are excluded when any tag filter is active
- [ ] Empty state message updates to mention tag filters when relevant

## Non-Goals

- **Server-side phase detection or persistence.** Phases are a UI-only concept computed on the client. We do not store phase boundaries in the database.
- **Manual phase labeling.** Users cannot rename or redefine phases. This is fully automatic.
- **Tag CRUD.** Tags are assigned by the MCP server at session creation time. This spec does not add UI for creating, editing, or deleting tags.
- **Related sessions.** Surfacing "sessions similar to this one" is a separate feature that would require semantic search or shared-tag heuristics beyond simple filtering.
- **Phase detection for live sessions.** Phases are recomputed on each render, which works for live sessions, but we do not animate phase creation or guarantee stable phase IDs across re-renders during live streaming.
- **URL persistence for phase collapse state.** Collapse state is ephemeral; refreshing the page resets all phases to expanded.

## Agent Teams: Parallelization Notes

These two features touch almost entirely disjoint files and can be developed simultaneously by two agents working in separate worktrees.

**Agent A: Phase Navigation**
- Creates: `phase-detection.ts`, `phase-header.tsx`, `phase-jump-menu.tsx`
- Modifies: `session-trace-explorer.tsx`, `session-timeline.tsx`, `session-trace-toolbar.tsx`
- Tests: `phase-detection.test.ts` (unit tests for the pure detection function with various thought sequences)

**Agent B: Tag Filtering**
- Creates: `tag-filter-bar.tsx`, `tag-chip.tsx`
- Modifies: `view-models.ts` (adds `tags` to `SessionSummaryVM`), `sessions-index-client.tsx`, `sessions-index-controls.tsx`, `sessions-table-shell.tsx`
- Tests: `sessions-index-client.test.tsx` (tag filtering logic), `view-models.test.ts` (updated VM includes tags)

**Shared touchpoint:** `view-models.ts` is modified only by Agent B (adding `tags` to `SessionSummaryVM`). Agent A reads from existing VM types without modification. No merge conflict expected.

**Integration test (after both merge):** Manual verification that navigating from a tag-filtered sessions list into a detail page with phases works end-to-end. No cross-feature coupling exists in the code.
