# Cross-Spec Consistency Analysis

**Date:** 2026-03-27
**Specs reviewed:** SPEC-001, SPEC-002, SPEC-003, SPEC-004
**Baseline:** Current `feat/founding-beta-launch` branch

---

## 1. File Conflict Matrix

Which specs modify which files, and whether the modifications overlap.

| File | SPEC-001 | SPEC-002 | SPEC-003 | SPEC-004 | Conflict Risk |
|------|----------|----------|----------|----------|---------------|
| `session-trace-explorer.tsx` | `activeTypeFilters` state, `typeCounts` memo, modified `filteredRows` pipeline | `debouncedSearch` + `searchMode` state, replaces `filteredRows` pipeline with `computeSearchResults` | `detectPhases` memo, collapse state `Set<string>`, passes phases to timeline | `viewMode` state, conditional render of `DecisionTimeline` vs `SessionTimeline` | **HIGH** -- all 4 specs modify this file, and 3 of them directly alter the `filteredRows` pipeline (lines 35-39) |
| `session-trace-toolbar.tsx` | Adds filter chip row (second row below search) | Adds match count line + search mode toggle (inline with search) | Adds PhaseJumpMenu trigger button | Adds view mode toggle + export dropdown | **HIGH** -- all 4 specs add props and UI elements |
| `view-models.ts` | No changes (reads `ThoughtDisplayType`) | No changes (reads `rawThought`, `previewText`) | Adds `tags: string[]` to `SessionSummaryVM`, updates `createSessionSummaryVM` | No changes (reads VMs for export) | **LOW** -- only SPEC-003 modifies |
| `page.tsx` (runs/[runId]) | Adds `computeSessionSummary` call + `SessionSummaryCard` render | No changes | No changes | No changes (export recommended in toolbar, not header) | **LOW** -- only SPEC-001 modifies |
| `thought-row.tsx` | No changes | Adds `searchQuery` prop + highlight rendering | No changes | No changes | **NONE** |
| `thought-card.tsx` | No changes | Adds `searchQuery` prop + `HighlightedPre` | No changes | Reused by `DecisionCard` (no modification) | **NONE** |
| `thought-detail-panel.tsx` | No changes | Adds `searchQuery` prop passthrough | No changes | No changes | **NONE** |
| `session-timeline.tsx` | No changes | No changes | Accepts `phases` prop, inserts `PhaseHeader`, skips collapsed rows | No changes (decisions mode uses separate `DecisionTimeline`) | **NONE** |
| `session-detail-header.tsx` | No changes | No changes | No changes | SPEC-004 considered but ultimately recommended toolbar instead | **NONE** |
| `sessions-index-client.tsx` | No changes | No changes | Adds `activeTags` state + tag filtering | No changes | **NONE** |

### Critical overlap: `filteredRows` pipeline

The current `filteredRows` memo (explorer lines 35-39) is a 4-line `useMemo` that filters by search text. Three specs rewrite it:

- **SPEC-001** inserts type filtering before text search
- **SPEC-002** replaces the entire pipeline with `computeSearchResults`, changes the dependency from `search` to `debouncedSearch`, and returns a `{ filteredRows, searchResult }` tuple
- **SPEC-004** adds a post-filter step that either passes rows through (full mode) or groups them (decisions mode)

SPEC-003 does not modify `filteredRows` itself but adds a separate `detectPhases` memo that consumes `rows` (not `filteredRows`).

These three pipeline changes are not inherently incompatible, but **no spec describes the combined pipeline**. See Section 2.

---

## 2. State Composition Analysis

### State variables added to `SessionTraceExplorer`

| Spec | State Variable | Type | Default |
|------|---------------|------|---------|
| (existing) | `search` | `string` | `''` |
| SPEC-001 | `activeTypeFilters` | `Set<ThoughtDisplayType>` | `new Set()` |
| SPEC-002 | `debouncedSearch` | `string` | `''` |
| SPEC-002 | `searchMode` | `'content' \| 'titles'` | `'content'` |
| SPEC-003 | `collapsedPhases` | `Set<string>` | `new Set()` |
| SPEC-004 | `viewMode` | `'full' \| 'decisions'` | `'full'` |

Total: 6 state variables (up from 1). These compose without naming conflicts.

### Combined `filteredRows` pipeline

The correct composition order, merging all three specs:

```
rows (from useSessionRealtime)
  |
  +-- [SPEC-001] type filter: if activeTypeFilters.size > 0, keep only matching types
  |
  +-- [SPEC-002] text search: use computeSearchResults with debouncedSearch + searchMode
  |       (replaces the old inline .includes() filter)
  |       (produces both filteredRows and searchResult for match counts)
  |
  = filteredRows (type-filtered + search-filtered)
  |
  +-- [SPEC-004] view mode: if 'decisions', run groupByDecisions on filteredRows
  |                         if 'full', pass filteredRows unchanged
  |
  = displayRows / decisionGroups (what actually renders)
  |
  +-- [SPEC-003] detectPhases runs on `rows` (unfiltered), NOT on filteredRows
  |              phases are a structural overlay, not a filter
```

**Issue found:** SPEC-002's `computeSearchResults` searches `detail.rawThought` (content mode) or `row.previewText` (titles mode), but SPEC-001's type filter narrows `rows` before search runs. This means `computeSearchResults` would receive the type-filtered rows, not the full set. The match count ("12 matches in 8 thoughts") would reflect only the type-filtered subset. This is arguably correct behavior (you're searching within what you're looking at), but **none of the specs explicitly state this interaction**. SPEC-001 says "Counts are computed against the full `rows` array (not `filteredRows`)" for type chip counts -- but SPEC-002's match count has no equivalent clarification.

**Issue found:** SPEC-002 replaces the `filteredRows` pipeline signature to return a tuple `{ filteredRows, searchResult }`. SPEC-001's code sample shows a simple array return. These two specs provide incompatible code samples for the same `useMemo` block. An implementer following SPEC-001 first would write an array-returning memo; implementing SPEC-002 next would require restructuring that memo to return a tuple and integrating the type filter into the new structure.

**Recommendation:** Define the canonical combined pipeline in a shared implementation note or in whichever spec is implemented last. The pipeline order (type filter -> search -> view mode) should be documented once, not inferred from 3 separate specs.

### Phase detection and filtering interaction

SPEC-003's `detectPhases` runs on the full `rows` array, not `filteredRows`. This means phases are stable regardless of active filters. However, when type filters are active (SPEC-001), the timeline shows only matching rows while phase headers are computed from all rows. Two scenarios to consider:

1. **Type filter active + phases visible:** A phase header says "12 thoughts" but only 3 are visible after type filtering. The phase header count becomes misleading.
2. **Type filter to "decisions only" + phases:** Phase headers still render between decision rows even when all reasoning rows are hidden. The structural grouping loses meaning.

**Neither SPEC-001 nor SPEC-003 addresses this.** The specs need a rule: either (a) phase headers hide when their visible thought count drops to zero, or (b) phase headers always show with an "(N of M visible)" indicator.

---

## 3. Toolbar Layout Mockup

Current toolbar (1 row):

```
+---------------------------------------------------------------+
| [Search thoughts...]                                   [LIVE] |
+---------------------------------------------------------------+
```

With all 4 specs applied:

```
+---------------------------------------------------------------+
| [Search thoughts...] [Content|Titles] [Full|Decisions] [LIVE] |  <- Row 1
| 12 matches in 8 thoughts                        [Phases v]    |  <- Row 1.5 (SPEC-002 match count left, SPEC-003 jump menu right)
|                                                                |
| [All] [Reasoning(80)] [Decision(5)] [Action(3)] [Beliefs(2)]  |  <- Row 2 (SPEC-001 filter chips)
| [Assumption(1)] [Context(0)] [Progress(4)]                    |     (wraps on narrow viewports)
|                                                                |
|                                    [Export v]                  |  <- Row 3? (SPEC-004 export dropdown)
+---------------------------------------------------------------+
```

**Issue: Toolbar crowding on Row 1.**

Row 1 holds: search input (`max-w-sm`), search mode toggle (SPEC-002, ~120px), view mode toggle (SPEC-004, ~200px), and LIVE indicator (~80px). On a viewport of 768px (tablet), the left column is ~60% of 768px = ~460px. With the search input at `max-w-sm` (384px), there is no room for both toggles inline. The toolbar's `flex-wrap` will push elements to a second line, but the specs don't account for this.

**Issue: Export button placement ambiguity.**

SPEC-004 recommends placing the export button in `SessionTraceToolbar` but does not specify exactly where relative to the other additions. If placed in the right area near LIVE, it competes with the PhaseJumpMenu trigger (SPEC-003) for the same visual slot.

**Recommendation:** Define a toolbar layout grid with explicit zones:
- Left zone: search input + mode toggle (SPEC-002)
- Center zone: view mode toggle (SPEC-004)
- Right zone: Phases button (SPEC-003) + Export button (SPEC-004) + LIVE indicator
- Below: match count (SPEC-002) on left, nothing on right
- Row 2: filter chips (SPEC-001), full width, flex-wrap

This avoids collisions but needs to be specified once, not inferred from 4 specs.

---

## 4. Feature Interaction Table

| Interaction | Specified? | Status | Notes |
|-------------|-----------|--------|-------|
| SPEC-001 type filters + SPEC-002 search | Partially | ISSUE | SPEC-001 AC-4 says "Filters compose with search" and shows type filter applied before search. SPEC-002 does not mention type filters at all. The pipeline order works but match counts are ambiguous (do they reflect pre- or post-type-filter?). |
| SPEC-001 type filters + SPEC-003 phases | No | ISSUE | Phase headers are computed from all rows but rendered in a type-filtered timeline. Phase headers with 0 visible thoughts will show as orphans. |
| SPEC-001 type filters + SPEC-004 decisions view | No | GAP | When type filters restrict to "decisions only" and view mode is "decisions", the result is the same. But what if type filters exclude decisions? Decisions view would show an empty state even though the session has decisions. This is correct but potentially confusing -- no spec warns about it. |
| SPEC-001 type filters + SPEC-004 export | Yes (SPEC-004 US-7) | OK | SPEC-004 explicitly says export respects active filters. The "(filtered)" label is specified. |
| SPEC-002 search + SPEC-003 phases | No | MINOR | When search is active, phases still render from unfiltered rows. Phase headers may appear between filtered rows that aren't actually adjacent. Not harmful but visually odd. |
| SPEC-002 search highlighting + SPEC-004 decisions view | No | GAP | SPEC-002 passes `searchQuery` to `ThoughtRow` and `ThoughtCard`. SPEC-004's `DecisionTimeline` renders `DecisionCard` (which wraps `ThoughtCard`) and `ReasoningGap` (which renders `ThoughtRow` when expanded). Neither spec says whether `searchQuery` reaches these components. The `DecisionCard` and `ReasoningGap` components are new and not covered by SPEC-002's component changes list. |
| SPEC-002 search + SPEC-004 export | No | MINOR | SPEC-004 says export respects search text filters (the filtered thoughts array). SPEC-002 changes how search works (debounce, content vs titles). Export would use the debounced/mode-aware filtered set, which is correct. No conflict. |
| SPEC-003 phases + SPEC-004 decisions view | No | GAP | When view mode is "decisions", phases are irrelevant (decisions view has its own grouping via `ReasoningGap`). Should the Phases button hide in decisions mode? Neither spec addresses this. |
| SPEC-003 tag filtering + other specs | N/A | OK | Tag filtering is on the sessions index page, completely separate from the session detail features. No interaction. |

---

## 5. Recommended Implementation Order

### Dependency analysis

```
SPEC-001 (type filters)     -- no dependencies, modifies filteredRows pipeline
SPEC-002 (full-text search) -- no dependencies, replaces filteredRows pipeline
SPEC-003 (phases + tags)    -- no dependencies on other specs
SPEC-004 (decisions + export) -- US-7 soft-depends on SPEC-001 for filter awareness
```

No spec has a hard blocker on another. However, the `filteredRows` pipeline is the critical shared surface, and the implementation order determines how much rework is needed.

### Recommended order

1. **SPEC-002 (Full-Text Search)** -- Implement first because it replaces the `filteredRows` pipeline most aggressively (new return type, debounce, `computeSearchResults`). Starting here establishes the new pipeline structure that other specs build on.

2. **SPEC-001 (Type Filters)** -- Implement second, inserting the type filter step into the pipeline that SPEC-002 established. This is additive (one filter stage before search).

3. **SPEC-003 (Phases + Tags)** -- Implement third. Phases are an overlay computed separately from `filteredRows`, so they slot in with minimal pipeline interaction. Tags are on a different page entirely. At this point, the interaction between phases and type filters should be resolved (see Issue in Section 2).

4. **SPEC-004 (Decisions + Export)** -- Implement last. The decision timeline is a view mode that consumes `filteredRows` as output, so it benefits from having the complete pipeline (type filters + search) already in place. The export feature's filter awareness (US-7) works correctly because it reads the final `filteredRows` array.

### Parallelization potential

- SPEC-003's tag filtering (sessions index page) can be done in parallel with anything, since it touches different files entirely.
- SPEC-003's phase navigation can be done in parallel with SPEC-001 or SPEC-002 since it adds a separate memo, but the toolbar additions will conflict.
- SPEC-001 and SPEC-002 should NOT be done in parallel -- they both rewrite the same `filteredRows` memo with incompatible signatures.

---

## 6. Blockers and Issues Summary

### Blockers (must resolve before implementation)

| # | Issue | Specs | Resolution needed |
|---|-------|-------|-------------------|
| B1 | `filteredRows` pipeline has 3 incompatible code samples | 001, 002, 004 | Write a single canonical pipeline definition that integrates type filters, debounced search with `computeSearchResults`, and view mode branching. Place it in SPEC-002 (since it's the most invasive change) or in a shared "SPEC-PIPELINE" addendum. |
| B2 | Phase headers vs type filters: orphan phase headers when all thoughts in a phase are filtered out | 001, 003 | Add a rule to SPEC-003: "Phase headers are hidden when zero of their thoughts are visible in `filteredRows`." Or: "Phase headers show a `(0 visible)` badge when all their thoughts are filtered." |

### Issues (should resolve, not blocking)

| # | Issue | Specs | Recommendation |
|---|-------|-------|----------------|
| I1 | Toolbar layout not specified as a unified design | All | Create a single toolbar layout spec showing all elements from all 4 specs. Assign explicit zones (left/center/right, rows). |
| I2 | Search match counts ambiguity with type filters | 001, 002 | Clarify in SPEC-002: "Match counts reflect the type-filtered row set, not the full session." Or: "Match counts always reflect the full session, with a note like '12 matches in 8 thoughts (of 42 total)' when type filters are active." |
| I3 | Search highlighting not specified for `DecisionTimeline` components | 002, 004 | Add to SPEC-004: "`DecisionCard` and `ReasoningGap` accept and pass through `searchQuery` for highlighting." Or: "Search highlighting is not applied in decisions view mode." |
| I4 | Phases button visibility in decisions view mode | 003, 004 | Add to SPEC-003 or SPEC-004: "The Phases jump menu button is hidden when `viewMode === 'decisions'`." |
| I5 | SPEC-002 `computeSearchResults` receives `details` map, but type filtering happens on `rows` before search -- the details map is unfiltered | 001, 002 | This is actually fine (details is a lookup, not filtered), but the interaction should be noted to prevent confusion during implementation. |

### Observations (no action required)

- `view-models.ts` is only modified by SPEC-003 (adding `tags` to `SessionSummaryVM`). Low conflict risk.
- `page.tsx` is only modified by SPEC-001 (adding summary card). Low conflict risk.
- SPEC-004's export button placement recommendation (in toolbar, not header) avoids cross-component state lifting, which is the right call given the other 3 specs also add toolbar elements.
- All 4 specs agree on ephemeral UI state (no URL persistence for filters, search mode, view mode, phase collapse). This is consistent.
- All 4 specs operate client-side on already-fetched data. No server-side changes or new API endpoints. This is consistent with the architecture described in CLAUDE.md.
