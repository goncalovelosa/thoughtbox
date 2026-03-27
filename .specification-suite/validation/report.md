# Specification Validation Report

**Date:** 2026-03-27
**Branch:** feat/founding-beta-launch
**Overall Status:** FAIL (all 4 specs have issues requiring resolution)

---

## Summary

All 4 specs demonstrate strong familiarity with the codebase. File paths, component structures, and most type references are accurate. However, each spec has at least one issue that would cause implementation problems if not addressed.

### Critical Findings

| ID | Severity | Spec(s) | Finding |
|----|----------|---------|---------|
| CC-1 | HIGH | All | `ThoughtDisplayType` is not exported from `view-models.ts`. It only exists as a derived type in `badge-styles.ts`. |
| CC-2 | HIGH | 001, 003 | `SessionSummaryVM` has no `tags` field. SPEC-003 correctly identifies this as a needed change; SPEC-001 assumes it exists. |
| CC-3 | MEDIUM | 002 | Switching search from `searchIndexText` to `rawThought` loses metadata search (tool names, option labels, belief entities). |
| CC-4 | MEDIUM | All | SessionTraceToolbar accumulates props from all 4 specs without any refactoring plan. |

---

## SPEC-001: Thought Type Filters + Session Summary Card

**Status:** FAIL (1 high, 1 medium, 2 low issues)

### Verified Correct

- File paths: `session-trace-toolbar.tsx`, `session-trace-explorer.tsx`, `page.tsx` all exist at stated paths.
- SessionTraceToolbar current props: `{ isLive?, sessionStatus, search, onSearchChange }` -- matches spec baseline.
- SessionTraceExplorer current props: `{ initialThoughts: RawThoughtRecord[], workspaceId, sessionId, sessionStatus }` -- matches.
- `filteredRows` memo (lines 35-39) currently filters only by search text -- matches spec description.
- `useSessionRealtime` returns `{ rows, details, isLive }` -- confirmed.
- `THOUGHT_TYPE_LABEL`, `THOUGHT_TYPE_BADGE`, `BADGE_BASE` are all exported from `badge-styles.ts` -- confirmed.
- The 7 values in the `typeCounts` initialization match the actual `displayType` union type.
- `ThoughtDetailPanel` has `positionIndex` and `totalCount` props that derive from `filteredRows` -- confirmed.

### Issues

**[001-A2] HIGH -- SessionSummaryVM lacks `tags`.**
The spec passes `rawSession.tags` to `computeSessionSummary`, which is valid since `RawSessionRecord` has `tags`. But the summary card's `tags: string[]` prop implies `SessionSummaryVM` has tags, which it does not. The spec should note this dependency on SPEC-003's VM change, or source tags from `SessionDetailVM` (which does have `tags`).

**[001-A1] LOW -- ThoughtDisplayType naming.**
The spec says `ThoughtDisplayType` is "the existing union type from `ThoughtRowVM['displayType']`." This is technically correct as a derived type, but `ThoughtDisplayType` is not a named export from `view-models.ts`. It is defined locally in `badge-styles.ts`. Implementers should add an explicit export to `view-models.ts`.

---

## SPEC-002: Full-Text Search with Match Count and Highlighting

**Status:** FAIL (1 high, 3 medium, 1 low issues)

### Verified Correct

- All referenced file paths exist.
- `searchIndexText` does contain full thought content (`raw.thought` is the first searchPart) -- spec claim confirmed.
- `previewText` is first line, max 120 chars (line 313 of view-models.ts) -- matches spec.
- Line references to `filteredRows` pipeline (lines 35-39), ThoughtRow preview (line 49), ThoughtCard reasoning block (line 17), and raw thought disclosure (line 279) are all accurate.
- `ThoughtCard` Props is `{ detail: ThoughtDetailVM }` -- correctly described.
- `ThoughtDetailPanel` Props do not currently include `searchQuery` -- correctly identified as new.

### Issues

**[002-A1] HIGH -- Search scope regression.**
`searchIndexText` (lines 316-331 of view-models.ts) includes:
- Full `raw.thought` content
- `branchId`, `thoughtType`
- `actionResult.tool`, `actionResult.target`
- `assumptionChange.text`
- `progressData.task`, `progressData.note`
- Option labels and reasons
- Belief entity names and states

The spec proposes searching `detail.rawThought` in content mode, which is only the `raw.thought` field. Queries matching tool names (e.g., "sql_query"), assumption text, or belief entities would no longer match. The `computeSearchResults` function should search `searchIndexText` (or a combined string) rather than only `rawThought`.

---

## SPEC-003: Phase Navigation + Cross-Session Tag Filtering

**Status:** FAIL (1 high, 2 medium, 3 low issues)

### Verified Correct

- All existing file paths are accurate: `session-trace-explorer.tsx`, `session-timeline.tsx`, `session-trace-toolbar.tsx`, `view-models.ts`, `sessions-index-client.tsx`, `sessions-index-controls.tsx`, `sessions-table-shell.tsx`.
- `session-timeline.tsx` exists for the phase header insertion point.
- Phase detection correctly references `ThoughtRowVM.timestampISO` and `ThoughtRowVM.displayType` (both exist).
- Phase detection correctly references `ThoughtDetailVM.progressData` (exists).
- Sessions index search currently matches titles and shortIds only (confirmed in `sessions-index-client.tsx` lines 29-30).
- `runs/page.tsx` does read `row.tags` into `RawSessionRecord` (line 40) -- confirmed.
- `clearFilters` currently resets search and status only -- correctly identified.

### Issues

**[003-A1] HIGH -- SessionSummaryVM lacks `tags`.**
The spec correctly identifies this as a needed change: "Add `tags: string[]` field to `SessionSummaryVM`" and "Update `createSessionSummaryVM` to pass through `raw.tags || []`." This is accurately scoped. The `runs/page.tsx` already populates `tags` on `RawSessionRecord`, so the data flows through; it just gets dropped in `createSessionSummaryVM`. This is a real gap in the current code that the spec correctly addresses.

**[003-A4] LOW -- SessionsTableShell needs `onTagClick`.**
Current `SessionsTableShell` props are `{ sessions: SessionSummaryVM[] }`. No `onTagClick` exists. Since `SessionSummaryVM` lacks tags, the table cannot render them. Both changes are needed and correctly identified.

---

## SPEC-004: Decision Timeline View + Session Export

**Status:** FAIL (1 high, 2 medium, 2 low issues)

### Verified Correct

- All existing file paths are accurate.
- `SessionDetailHeader` is confirmed as a Server Component (no `'use client'` directive).
- `SessionDetailHeader` current props: `{ session: SessionDetailVM, workspaceSlug: string }` -- matches spec baseline.
- `ThoughtCard` decision_frame rendering (lines 57-73) uses emerald highlight for selected options -- matches spec description.
- `ThoughtDetailVM` extends `ThoughtRowVM` and includes all fields referenced in the export format: `rawThought`, `confidence`, `options`, `actionResult`, `beliefs`, `assumptionChange`, `contextData`, `progressData`.
- The UI-only fields listed for JSON exclusion (`shortId`, `previewText`, `searchIndexText`, `laneIndex`, `laneColorToken`, `showGapBefore`, `gapLabel`, `debugMeta`) all exist on `ThoughtRowVM`/`ThoughtDetailVM`.
- `badge-styles.ts` and `view-models.ts` are correctly identified as consumed but not modified.

### Issues

**[004-A1] HIGH -- Redundant sessionTitle prop.**
The spec proposes adding `sessionTitle: string` to `SessionDetailHeader`. But `SessionDetailVM` (already passed as `session`) has `title?: string`. The `sessionTitle` prop is redundant. The export formatters should extract the title from `SessionDetailVM.title`.

**[004-A2] MEDIUM -- Export button placement.**
The spec initially places the export button in `SessionDetailHeader` but then recommends placing it in `SessionTraceToolbar` instead (since the toolbar has access to filtered state). The spec should commit to one location. The toolbar recommendation is sound.

---

## Cross-Cutting Observations

### Type System

- `ThoughtDisplayType` should be exported from `view-models.ts` as a named type alias before any spec implementation begins. All 4 specs depend on it.
- `SessionSummaryVM` needs `tags: string[]` added. SPEC-003 identifies this; SPEC-001 depends on it silently.

### Component Architecture

- `SessionTraceToolbar` will accumulate 12+ new props across all 4 specs: type filter props (SPEC-001), search result/mode props (SPEC-002), phase jump menu (SPEC-003), view toggle + export (SPEC-004). Consider a toolbar composition pattern or breaking it into sub-components.

### Data Flow

- All specs correctly describe the server-to-client data flow: `page.tsx` (server) fetches data, passes `RawThoughtRecord[]` to `SessionTraceExplorer` (client), which calls `useSessionRealtime` to get `{ rows, details, isLive }`.
- The `searchIndexText` field is richer than `rawThought` alone. SPEC-002's proposed search target change needs reconsideration.

### Interactions Between Specs

- SPEC-001 (type filters) and SPEC-004 (decision view) both add state to `SessionTraceExplorer`. Their interaction is unspecified: should the decision timeline respect active type filters?
- SPEC-001 (type filters) and SPEC-002 (search) both modify the `filteredRows` pipeline. The specs describe composing these correctly (type filter first, then search).
- SPEC-003 (phases) consumes `filteredRows` but it is unclear whether phases should be recomputed after filtering or computed from the full row set.
