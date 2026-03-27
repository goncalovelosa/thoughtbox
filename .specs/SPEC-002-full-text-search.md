# SPEC-002: Full-Text Search with Match Count and Highlighting

**Status:** Draft
**Date:** 2026-03-27
**Area:** Session Trace Explorer (`/w/[workspaceSlug]/runs/[sessionId]`)

---

## 1. Problem Statement

The session trace explorer's search filters thoughts using `searchIndexText`, which already contains the full `thought` content (see `view-models.ts` lines 316-331). However, the search has three gaps:

1. **No match visibility.** Users type a query and the list silently shrinks. There is no indication of how many matches exist or how they distribute across thoughts.
2. **No highlighting.** When a search matches, nothing in the ThoughtRow preview or ThoughtDetailPanel indicates *where* the match occurs. Users must visually scan each thought to find the relevant passage.
3. **No debounce.** Every keystroke triggers a full `useMemo` recomputation of `filteredRows`. For sessions with 150+ thoughts containing multi-paragraph content, this creates unnecessary work during fast typing.

The net effect: if an agent wrote an important insight deep in thought #47, a user searching for that phrase gets a filtered list but still has to click through thoughts and read manually to locate the match.

## 2. User Stories

**US-1: Match count feedback.** As a user searching a session, I want to see "12 matches in 8 thoughts" so I know how many results exist before scrolling.

**US-2: Highlighted preview text.** As a user scanning the filtered thought list, I want matching text highlighted in the ThoughtRow preview so I can identify relevant thoughts at a glance.

**US-3: Highlighted detail content.** As a user reading a selected thought, I want matching text highlighted in the ThoughtDetailPanel so I can jump to the exact passage.

**US-4: Search mode toggle.** As a user, I want to toggle between "Search content" (full thought text) and "Search titles only" (first-line preview) so I can narrow or broaden my search scope.

**US-5: Responsive input.** As a user typing quickly, I want the search to debounce so the UI stays responsive during fast input on large sessions.

## 3. Component Changes

### 3.1 `src/lib/session/search-utils.ts` (new file)

Utility module containing search logic shared across components.

```ts
type SearchMode = 'content' | 'titles'

type SearchResult = {
  matchingRowIds: Set<string>
  matchCountByRow: Map<string, number>
  totalMatchCount: number
  matchingThoughtCount: number
}

type HighlightSegment =
  | { type: 'text'; value: string }
  | { type: 'match'; value: string }

function computeSearchResults(
  rows: ThoughtRowVM[],
  details: Record<string, ThoughtDetailVM>,
  query: string,
  mode: SearchMode,
): SearchResult

function highlightText(
  text: string,
  query: string,
): HighlightSegment[]
```

- `computeSearchResults` performs case-insensitive matching. In `'content'` mode it searches `row.searchIndexText` (which includes the full thought content PLUS structured metadata like tool names, option labels, belief entities, assumption text, and progress tasks). In `'titles'` mode it searches `row.previewText` (first line, max 120 chars).
- **AMENDMENT (CC-3):** The original spec proposed searching `detail.rawThought` in content mode. This was changed to `row.searchIndexText` because searchIndexText aggregates all metadata fields (view-models.ts lines 316-331), while rawThought is only the main thought text. Switching to rawThought would be a regression: searching for "sql_query" would stop matching action_report thoughts that used that tool. See SPEC-PIPELINE for the canonical pipeline definition.
- `highlightText` splits text at match boundaries. Returns an array of segments for rendering. Does not use regex to avoid special character issues -- uses `indexOf` in a loop with case-folded strings.

### 3.2 `src/components/session-area/session-trace-explorer.tsx`

**State additions:**

| State | Type | Default | Purpose |
|-------|------|---------|---------|
| `debouncedSearch` | `string` | `''` | Debounced version of `search`, updated 300ms after last keystroke |
| `searchMode` | `'content' \| 'titles'` | `'content'` | Toggle between full-text and title-only search |

**Changes to `filteredRows` pipeline (line 35-39):**

Replace the current inline filter with a call to `computeSearchResults`. The `useMemo` depends on `debouncedSearch` (not `search`) and `searchMode`. Returns both `filteredRows` and `searchResult` (match counts).

```ts
const { filteredRows, searchResult } = useMemo(() => {
  const q = debouncedSearch.trim()
  if (q === '') return { filteredRows: rows, searchResult: null }

  const result = computeSearchResults(rows, details, q, searchMode)
  const filtered = rows.filter((r) => result.matchingRowIds.has(r.id))
  return { filteredRows: filtered, searchResult: result }
}, [rows, details, debouncedSearch, searchMode])
```

**Debounce implementation:** Use a `useEffect` + `setTimeout`/`clearTimeout` pattern (no external dependency). The raw `search` state drives the input; `debouncedSearch` drives filtering.

**New props passed down:**

- `SessionTraceToolbar`: `searchResult`, `searchMode`, `onSearchModeChange`
- `SessionTimeline` / `ThoughtRow`: `searchQuery` (the debounced query string, for highlighting)
- `ThoughtDetailPanel` / `ThoughtCard`: `searchQuery`

### 3.3 `src/components/session-area/session-trace-toolbar.tsx`

**New props:**

| Prop | Type | Purpose |
|------|------|---------|
| `searchResult` | `SearchResult \| null` | Match count data to display |
| `searchMode` | `'content' \| 'titles'` | Current search mode |
| `onSearchModeChange` | `(mode) => void` | Mode toggle callback |

**UI changes:**

1. **Match count indicator.** Below the search input (or inline to the right), render a line like `"12 matches in 8 thoughts"` when `searchResult` is non-null. Use `text-xs text-foreground/60 font-mono` styling. Show nothing when the query is empty.

2. **Search mode toggle.** A pair of small buttons or a segmented control next to the search input: `Content | Titles`. Uses the same border/background styling as existing toolbar elements. The active segment gets `bg-foreground/10 text-foreground`; the inactive one gets `text-foreground/50`.

Layout sketch:

```
+--[Search thoughts...]----+ [Content | Titles]  [LIVE]
  12 matches in 8 thoughts
```

### 3.4 `src/components/session-area/thought-row.tsx`

**New prop:** `searchQuery: string` (empty string when no active search).

**Change to preview text rendering (line 49-51):**

When `searchQuery` is non-empty, replace the plain text render with highlighted segments:

```tsx
// Before:
{row.previewText}

// After:
{searchQuery
  ? highlightText(row.previewText, searchQuery).map((seg, i) =>
      seg.type === 'match'
        ? <mark key={i} className="bg-amber-400/30 text-foreground rounded-sm px-0.5">{seg.value}</mark>
        : <span key={i}>{seg.value}</span>
    )
  : row.previewText}
```

The `truncate` CSS class on the parent div already handles overflow. The `<mark>` elements are inline and do not affect layout.

### 3.5 `src/components/session-area/thought-card.tsx`

**New prop:** `searchQuery: string`.

**Change to raw thought rendering:**

In the reasoning block (line 17) and the raw thought disclosure (line 279), replace:

```tsx
<pre className="whitespace-pre-wrap font-inherit">{detail.rawThought}</pre>
```

With a `<HighlightedPre>` helper that applies `highlightText` to the content. The `<mark>` elements use the same amber highlight style. Since `rawThought` can be long, the highlight function operates on the full string -- it does not truncate.

For structured card types (decision_frame, action_report, etc.), highlighting is applied to the raw thought disclosure section only. The structured metadata fields are not highlighted in this iteration.

### 3.6 `src/components/session-area/thought-detail-panel.tsx`

**New prop:** `searchQuery: string`.

Passes `searchQuery` through to `<ThoughtCard>`.

### 3.7 `src/lib/session/view-models.ts`

No changes. The `searchIndexText` field remains for backward compatibility but is no longer the primary search target. The `rawThought` field on `ThoughtDetailVM` (line 145) and the `previewText` field on `ThoughtRowVM` (line 125) are the search targets.

## 4. Search Algorithm Design

### 4.1 Matching

Case-insensitive substring matching using `String.toLowerCase()` + `String.includes()`. No regex. Reasons:

- User search terms are plain text, not patterns.
- `includes()` handles all Unicode correctly.
- No risk of regex injection from special characters like `(`, `[`, `*`.

### 4.2 Match counting

`computeSearchResults` iterates all rows once. For each row:

1. Look up the corresponding detail by `row.id` in the `details` record.
2. Get the search target: `detail.rawThought` (content mode) or `row.previewText` (titles mode).
3. Count occurrences by walking the lowercased target with `indexOf` in a loop, advancing by query length after each hit.
4. If count > 0, add the row ID to `matchingRowIds` and record the count.

### 4.3 Highlighting (`highlightText`)

```
function highlightText(text: string, query: string): HighlightSegment[]
```

Algorithm:
1. Lowercase both `text` and `query`.
2. Walk the lowercased text with `indexOf`, collecting match start positions.
3. Build segments from the original (case-preserved) text: text before match, the match itself, text after match, repeating.
4. Return the segment array.

Edge cases:
- Empty query: return a single text segment with the full string.
- Overlapping matches: advance by `query.length` after each match (no overlaps).
- Query longer than text: return a single text segment.

### 4.4 Debounce

300ms debounce on the `search` state before it becomes `debouncedSearch`:

```ts
const [debouncedSearch, setDebouncedSearch] = useState('')

useEffect(() => {
  const timer = setTimeout(() => setDebouncedSearch(search), 300)
  return () => clearTimeout(timer)
}, [search])
```

The input remains instantly responsive (controlled by `search`). Filtering and match computation only run when `debouncedSearch` updates.

### 4.5 Search mode

Two modes stored in component state (not URL params -- this is ephemeral UI state):

- **Content** (default): searches `detail.rawThought` for each thought. Finds matches anywhere in the full text.
- **Titles**: searches `row.previewText`. Equivalent to today's behavior but with highlighting and match counting.

## 5. UI Mockup Description

### 5.1 Toolbar area

```
+------------------------------------------------------------------+
| [Search thoughts...]          [Content | Titles]         [LIVE]  |
| 12 matches in 8 thoughts                                        |
+------------------------------------------------------------------+
```

- The search input retains its current styling (`h-9 w-full max-w-sm rounded-none border ...`).
- The mode toggle sits to the right of the input, inline in the same flex row. Two buttons with shared border, 24px height, `text-xs font-medium`. Active button: `bg-foreground/10 border-foreground text-foreground`. Inactive: `bg-transparent border-foreground/30 text-foreground/50`.
- Match count text appears on a second line below the input, left-aligned. `text-xs font-mono text-foreground/60`. Hidden when query is empty.
- When no matches: `"0 matches"` in `text-foreground/40`.

### 5.2 ThoughtRow highlight

The preview text line uses inline `<mark>` elements:

```
[#47] ...the agent concluded that [database migration] was...
```

Where `database migration` (the search term) renders with `bg-amber-400/30 text-foreground rounded-sm px-0.5`. The amber highlight is visible on both light and dark backgrounds at 30% opacity.

### 5.3 ThoughtDetailPanel highlight

In the detail view's `<pre>` block, matched text gets the same amber `<mark>` treatment. Since the detail view shows the full thought, there may be multiple highlights per thought. The user scrolls normally; no auto-scroll-to-first-match in this iteration.

## 6. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| AC-1 | Typing a query filters the thought list to only thoughts whose full `rawThought` content contains the query (case-insensitive). | Manual: search for a word that appears mid-paragraph in thought #47 but not in its preview text. Thought #47 appears in filtered results. |
| AC-2 | The toolbar displays "{N} matches in {M} thoughts" reflecting actual occurrence counts. | Manual: search a known term, verify counts match. |
| AC-3 | Matched text in ThoughtRow preview is visually highlighted with amber background. | Visual inspection. |
| AC-4 | Matched text in ThoughtDetailPanel content is visually highlighted with amber background. | Visual inspection. |
| AC-5 | Typing rapidly (>5 chars/sec) does not cause visible jank or layout shifts. | Manual: type quickly on a session with 100+ thoughts. |
| AC-6 | The debounce delay is 300ms: filtering does not begin until 300ms after the last keystroke. | Manual: type a long word, observe that results appear after a brief pause, not per-character. |
| AC-7 | Toggling to "Titles" mode restricts search to preview text only. | Manual: search a word that exists in thought body but not in preview. In "Titles" mode, no match. In "Content" mode, match found. |
| AC-8 | Clearing the search input restores the full unfiltered thought list immediately (no debounce on clear). | Manual: clear the input, list restores instantly. |
| AC-9 | Search state does not persist in the URL. Refreshing the page shows no search query. | Manual: search, refresh, observe empty search. |
| AC-10 | Keyboard navigation (arrow up/down) still works correctly on the filtered list while search is active. | Manual: search, arrow through results. |

## 7. Non-Goals

- **Server-side search / API endpoint.** All thought data is already loaded client-side via `initialThoughts`. No network requests for search.
- **Fuzzy or semantic search.** This is exact substring matching. Fuzzy matching (typo tolerance, stemming) is a separate future feature.
- **Regex support.** Users search plain text. No regex syntax.
- **Auto-scroll to first match in detail panel.** The detail view highlights matches but does not scroll to the first one. This can be added later if needed.
- **Highlighting in structured card metadata.** Only `rawThought` text is highlighted. Decision options, action results, belief entities, etc. are not highlighted.
- **Persisted search state.** Search is ephemeral -- not saved to URL params, local storage, or any backend.
- **Search across multiple sessions.** This feature is scoped to a single session's thought list.

## 8. Performance Considerations

### 8.1 Data size estimates

| Metric | Typical | Upper bound |
|--------|---------|-------------|
| Thoughts per session | 10-30 | 150+ |
| Characters per thought | 200-500 | 5,000+ |
| Total text per session | 5-15 KB | 750 KB |

### 8.2 Filtering cost

`computeSearchResults` does one pass over all rows. For each row, it calls `toLowerCase()` on `rawThought` and then `indexOf` in a loop. On 150 thoughts averaging 3,000 chars each (450 KB total), this is sub-millisecond on modern hardware. No optimization needed.

However, the `toLowerCase()` call on every thought for every search update is wasteful. **Optimization:** pre-compute lowercased `rawThought` once when `details` changes (in the `useMemo` that produces `filteredRows`), store in a `Map<string, string>`, and reuse across searches. This avoids re-lowering 450 KB of text on every debounced keystroke.

### 8.3 Highlighting cost

`highlightText` runs per-render for each visible ThoughtRow (virtualized by overflow scroll, but all filtered rows mount). For 150 rows with 120-char preview text, this is negligible.

For the detail panel, `highlightText` runs on one thought's full `rawThought` (up to 5,000 chars). Also negligible.

### 8.4 React render cost

The `filteredRows` memo prevents re-renders when the debounced search hasn't changed. ThoughtRow components receive `searchQuery` as a prop; rows that don't change query won't re-render if wrapped in `React.memo` (which they should be, but that's a separate optimization outside this spec's scope).

### 8.5 Future scaling path

If sessions grow beyond 500 thoughts or 1 MB of text, consider:

- **Virtual scrolling** for the thought list (only render visible rows). This is independent of search but compounds with it.
- **Web Worker search** to move `computeSearchResults` off the main thread. Only worth it if profiling shows jank.
- **Pre-built search index** (e.g., a suffix array or trigram index built once on load). Only if `indexOf` becomes measurably slow.

None of these are needed for the current scale.
