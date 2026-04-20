# SPEC-004: Decision Timeline View + Session Export

## Problem Statement

The Thoughtbox MCP server exposes `tb.session.export()` supporting markdown, JSON, and cipher formats. Agents working in Code Mode can export sessions programmatically, but the web UI has no equivalent. Users reviewing sessions in the browser must scroll through the full trace to find decisions, and have no way to extract a session for sharing, documentation, or offline review.

Two gaps:

1. **No decision-focused view.** Sessions with dozens of reasoning thoughts bury the 3-5 decision_frame thoughts that actually drove the outcome. There is no way to see just the decisions and the reasoning gaps between them.

2. **No export.** The only way to get session data out of the web UI is to copy-paste from the browser. The MCP server's export capability is invisible to web users.

---

## User Stories

| ID | Story | Feature |
|----|-------|---------|
| US-1 | As a user reviewing a completed session, I want to toggle to a "Decisions only" view so I can see the key choices without scrolling through every reasoning step. | Decision Timeline |
| US-2 | As a user in Decisions view, I want to see a collapsed count of reasoning thoughts between decisions so I understand how much analysis happened and can expand it if needed. | Decision Timeline |
| US-3 | As a user viewing a session with no decision_frame thoughts, I want a clear empty state that explains what decision_frames are, so I know it is not a bug. | Decision Timeline |
| US-4 | As a user, I want to export the current session as Markdown so I can paste it into a document or share it with a teammate. | Session Export |
| US-5 | As a user, I want to export the current session as JSON so I can feed it into another tool or archive it. | Session Export |
| US-6 | As a user, I want a one-click "Copy to clipboard" that copies the session as Markdown with a success toast. | Session Export |
| US-7 | As a user with type filters active (from SPEC-001, if implemented), I want the export to respect those filters so I only export what I am looking at. | Session Export |

---

## Feature A: Decision Timeline View

### View Mode Toggle

Add a segmented toggle to `SessionTraceToolbar` with two modes:

| Mode | Label | Behavior |
|------|-------|----------|
| `full` | Full trace | Current behavior. All thoughts rendered in `SessionTimeline`. |
| `decisions` | Decisions only | Filter to `decision_frame` thoughts with collapsed reasoning gaps between them. |

The toggle is a controlled state lifted to `SessionTraceExplorer`, which already owns `filteredRows`. The active mode is stored as a `viewMode` state variable (`'full' | 'decisions'`).

### Component Changes

**`session-trace-explorer.tsx`**

- Add `viewMode` state: `useState<'full' | 'decisions'>('full')`
- Pass `viewMode` and `onViewModeChange` to `SessionTraceToolbar`
- Compute `displayRows` from `filteredRows` based on `viewMode`:
  - When `'full'`: pass `filteredRows` unchanged (current behavior)
  - When `'decisions'`: run the decision grouping logic (below), pass grouped structure to a new `DecisionTimeline` component
- Pass `displayRows` to `SessionTimeline` (full mode) or `DecisionTimeline` (decisions mode)

**`session-trace-toolbar.tsx`**

- Add `viewMode` and `onViewModeChange` props
- Render a two-segment toggle after the search input:
  ```
  [ Full trace | Decisions only ]
  ```
- Styling: `rounded-none border border-foreground` segments, active segment gets `bg-foreground text-background`, inactive gets `bg-background text-foreground`

**New: `decision-timeline.tsx`**

- Receives the grouped decision data
- Renders a vertical list of `DecisionCard` components with `ReasoningGap` components between them
- If no decisions exist, renders the empty state

### Decision Grouping Logic

New pure function in `src/lib/session/decision-grouping.ts`:

```typescript
type DecisionGroup = {
  decision: ThoughtDetailVM
  reasoningBefore: ThoughtRowVM[]
}

type DecisionTimelineData =
  | { hasDecisions: true; groups: DecisionGroup[]; trailingReasoning: ThoughtRowVM[] }
  | { hasDecisions: false }

function groupByDecisions(
  rows: ThoughtRowVM[],
  details: Record<string, ThoughtDetailVM>,
): DecisionTimelineData
```

Algorithm:
1. Walk `rows` in order
2. Accumulate non-decision thoughts into a buffer
3. When a `decision_frame` row is encountered, emit a `DecisionGroup` with the buffer as `reasoningBefore` and the decision's `ThoughtDetailVM` as `decision`
4. Clear the buffer
5. After the loop, any remaining buffer becomes `trailingReasoning`
6. If no decision_frame rows were found, return `{ hasDecisions: false }`

### Decision Card Rendering

Each `DecisionCard` renders:

```
+-------------------------------------------------------+
| DECISION  #7  ·  high confidence                      |
+-------------------------------------------------------+
|                                                        |
|  [x] Use connection pooling                            |
|      Reduces cold start latency by 40%                 |
|                                                        |
|  [ ] Direct connections                                |
|      Simpler but 200ms overhead per request            |
|                                                        |
|  [ ] Hybrid approach                                   |
|      Complex configuration, marginal benefit           |
|                                                        |
+-------------------------------------------------------+
```

This reuses the existing rendering logic from `ThoughtCard`'s `decision_frame` case. The `DecisionCard` component is a wrapper that renders the decision_frame `ThoughtDetailVM` using the same option list layout (emerald highlight for selected, neutral for rejected, reason text below each option).

### Reasoning Gap Component

Between decision cards, render a collapsible summary:

```
--- 15 reasoning thoughts ---  [expand v]
```

- Collapsed by default
- Shows count of non-decision thoughts in the gap
- Expand toggle reveals the full list of `ThoughtRow` components for those thoughts (reusing existing `ThoughtRow`)
- Styling: `text-xs text-foreground/50 py-2` with a dashed border line

### Empty State

When `groupByDecisions` returns `{ hasDecisions: false }`:

```
+-------------------------------------------------------+
|                                                        |
|  No decisions recorded in this session                 |
|                                                        |
|  Decision frames capture key choices your agent made.  |
|  Use the decision_frame thought type when calling      |
|  tb.think() to record decisions with options and       |
|  confidence levels.                                    |
|                                                        |
+-------------------------------------------------------+
```

Styled with `text-foreground/60`, centered in the timeline area.

### Search Highlighting in Decisions View

**AMENDMENT (I3):** When search is active (SPEC-002), `DecisionCard` and `ReasoningGap` must pass through `searchQuery` for highlighting:
- `DecisionCard` wraps `ThoughtCard`, which already accepts `searchQuery` per SPEC-002
- `ReasoningGap` renders `ThoughtRow` when expanded, which already accepts `searchQuery` per SPEC-002
- Both components accept `searchQuery: string` as a prop and pass it through to their children

### Keyboard and URL Behavior

- The `viewMode` is not persisted in the URL (it is ephemeral UI state)
- Arrow key navigation in decisions mode navigates between decision cards only
- Clicking a decision card updates the `?thought=N` param and shows the full detail in `ThoughtDetailPanel`
- When expanding a reasoning gap, clicking a reasoning thought also updates `?thought=N`

---

## Feature B: Session Export

### Export Button Location

Add an export dropdown button to `SessionDetailHeader`, positioned after the metadata row:

```
<- Back to Sessions

Session: Analyze database schema          [Export v]
abc1234 · Completed · Started Mar 27... · 42 Thoughts
```

### Component Changes

**`session-detail-header.tsx`**

- Convert to `'use client'` (currently a Server Component)
- Accept new props: `thoughts: ThoughtDetailVM[]` and `sessionTitle: string`
- Render an `ExportDropdown` component in the header row

**New: `export-dropdown.tsx`** (`src/components/session-area/export-dropdown.tsx`)

Client component. Renders a button that opens a dropdown with three actions:

| Action | Icon | Label |
|--------|------|-------|
| Markdown file | Download icon | Export Markdown |
| JSON file | Download icon | Export JSON |
| Clipboard | Clipboard icon | Copy to clipboard |

Dropdown positioning: anchored bottom-right of the button. Closes on click outside or Escape. No external dependency -- plain `useState` toggle with a `useEffect` for outside-click dismissal.

**New: `src/lib/session/export-formatters.ts`**

Pure functions, no React dependency. Three exports:

```typescript
function formatSessionMarkdown(
  session: SessionDetailVM,
  thoughts: ThoughtDetailVM[],
): string

function formatSessionJSON(
  session: SessionDetailVM,
  thoughts: ThoughtDetailVM[],
): string

function downloadAsFile(
  content: string,
  filename: string,
  mimeType: string,
): void

function copyToClipboard(text: string): Promise<boolean>
```

### Export Format: Markdown

```markdown
# Session: Analyze database schema

- **ID**: abc1234f-...
- **Status**: Completed
- **Started**: Mar 27, 2026 14:32
- **Duration**: 12m 45s
- **Thoughts**: 42

---

## Thought #1 — Reasoning

I need to understand the current database schema before making
recommendations. Let me start by examining the tables...

---

## Thought #2 — Decision

**Confidence**: high

| Option | Selected | Reason |
|--------|----------|--------|
| Use connection pooling | Yes | Reduces cold start latency by 40% |
| Direct connections | No | Simpler but 200ms overhead per request |
| Hybrid approach | No | Complex configuration, marginal benefit |

---

## Thought #3 — Action

**Tool**: `sql_query`
**Target**: `public.sessions`
**Result**: Success
**Reversible**: yes

---

## Thought #4 — Beliefs

**Entities**:
- sessions table: has 12 columns, no indexes on status
- thoughts table: properly indexed on session_id

**Constraints**:
- Must maintain backward compatibility with v1 API

**Risks**:
- Migration could lock table during peak hours

---

## Thought #5 — Assumption Update

"The sessions table is small enough to not need partitioning"

believed -> refuted

**Trigger**: Row count query returned 2.4M rows

---

## Thought #6 — Progress

**Task**: Schema analysis
**Status**: done
**Note**: All tables reviewed, moving to recommendations

---

## Thought #7 — Context Snapshot

**Model**: claude-opus-4-6
**Tools Available**: `sql_query`, `file_read`, `file_write`
```

Formatting rules:
- H1 for session title
- Metadata as a bullet list
- H2 per thought with `## Thought #N -- {TypeLabel}`
- Type label from `THOUGHT_TYPE_LABEL` map
- Decision options as a markdown table
- Action reports as bold key-value pairs
- Belief entities as a sub-list
- Assumption updates show old -> new with arrow
- Progress as bold key-value pairs
- Context snapshot as bold key-value pairs, tools as inline code
- Raw reasoning thoughts render their content as-is (they are already prose)
- Horizontal rules between thoughts

### Export Format: JSON

Structured export of all `ThoughtDetailVM` data:

```json
{
  "session": {
    "id": "abc1234f-5678-...",
    "title": "Analyze database schema",
    "status": "completed",
    "startedAt": "2026-03-27T14:32:00Z",
    "completedAt": "2026-03-27T14:44:45Z",
    "duration": "12m 45s",
    "thoughtCount": 42,
    "tags": ["database", "schema"]
  },
  "thoughts": [
    {
      "thoughtNumber": 1,
      "type": "reasoning",
      "content": "I need to understand the current database schema...",
      "timestamp": "2026-03-27T14:32:01Z",
      "isRevision": false,
      "branchId": null,
      "nextThoughtNeeded": true
    },
    {
      "thoughtNumber": 2,
      "type": "decision_frame",
      "content": "Evaluating connection strategies...",
      "timestamp": "2026-03-27T14:33:15Z",
      "confidence": "high",
      "options": [
        { "label": "Use connection pooling", "selected": true, "reason": "Reduces cold start latency by 40%" },
        { "label": "Direct connections", "selected": false, "reason": "Simpler but 200ms overhead per request" },
        { "label": "Hybrid approach", "selected": false, "reason": "Complex configuration, marginal benefit" }
      ]
    },
    {
      "thoughtNumber": 3,
      "type": "action_report",
      "content": "Querying the sessions table...",
      "timestamp": "2026-03-27T14:34:02Z",
      "actionResult": {
        "success": true,
        "reversible": "yes",
        "tool": "sql_query",
        "target": "public.sessions",
        "sideEffects": []
      }
    }
  ],
  "exportedAt": "2026-03-27T15:00:00Z",
  "exportFormat": "thoughtbox-session-v1"
}
```

The JSON export includes all fields from `ThoughtDetailVM` except UI-only fields (`shortId`, `previewText`, `searchIndexText`, `laneIndex`, `laneColorToken`, `showGapBefore`, `gapLabel`, `debugMeta`). A `exportFormat` version tag is included for forward compatibility.

### Copy to Clipboard

Uses the Markdown format. Flow:

1. Call `formatSessionMarkdown(session, thoughts)`
2. Call `navigator.clipboard.writeText(text)`
3. On success: show a toast "Copied to clipboard" (2s auto-dismiss)
4. On failure: show a toast "Failed to copy — try Export Markdown instead"

Toast: a simple absolute-positioned div at the bottom of the header area. No toast library -- a `useState` with a `setTimeout` cleanup.

### Filter Awareness

If type filters from SPEC-001 are active (or search text is non-empty), the export functions receive only the currently visible `ThoughtDetailVM` array. The export button label updates to indicate this:

- No filters active: "Export"
- Filters active: "Export (filtered)"

This requires `SessionDetailHeader` to receive the filtered thoughts array from `SessionTraceExplorer`. Since the header is above the explorer in the page layout, the filtered thoughts must be lifted to a shared parent or passed via a callback. The recommended approach: pass `thoughts` and `filteredThoughts` down from the page component, and let `SessionTraceExplorer` call an `onFilteredThoughtsChange` callback that updates a ref in the parent.

Simpler alternative for the initial implementation: the export button lives inside `SessionTraceExplorer` (in the toolbar area) instead of the header. This avoids cross-component state lifting. The header can add the button later when the layout warrants it.

**Recommended**: Place the export button in `SessionTraceToolbar` next to the view mode toggle. This keeps all filtered-data-aware controls in the same component tree that owns the filter state.

---

## Acceptance Criteria

### Decision Timeline View

- [ ] Segmented toggle ("Full trace" / "Decisions only") renders in `SessionTraceToolbar`
- [ ] In "Decisions only" mode, only `decision_frame` thoughts render as full cards
- [ ] Between decision cards, a collapsed gap shows "N reasoning thoughts" with expand toggle
- [ ] Expanding a gap reveals the reasoning thoughts as standard `ThoughtRow` components
- [ ] Clicking a decision card or expanded reasoning thought updates `?thought=N` and shows detail in `ThoughtDetailPanel`
- [ ] Sessions with zero decision_frame thoughts show the empty state with usage guidance
- [ ] Arrow key navigation in decisions mode moves between decision cards
- [ ] `groupByDecisions` is a pure function with no React imports
- [ ] `groupByDecisions` has unit tests covering: no decisions, one decision, multiple decisions, trailing reasoning after last decision, empty input

### Session Export

- [ ] Export dropdown renders in the toolbar area with three options: Markdown, JSON, Copy to clipboard
- [ ] Markdown export produces a well-formatted document matching the format specification above
- [ ] JSON export produces valid JSON matching the schema above, with `exportFormat: "thoughtbox-session-v1"`
- [ ] Copy to clipboard uses the Markdown format and shows a success/failure toast
- [ ] When search text or type filters are active, export includes only filtered thoughts
- [ ] Export button label shows "(filtered)" when filters are active
- [ ] `formatSessionMarkdown` and `formatSessionJSON` are pure functions with no React imports
- [ ] `formatSessionMarkdown` has unit tests covering: all thought types, empty session, session with only reasoning thoughts
- [ ] `formatSessionJSON` has unit tests covering: round-trip parse validity, excluded UI-only fields, version tag presence
- [ ] File downloads use correct MIME types (`text/markdown` for .md, `application/json` for .json)
- [ ] Downloaded filenames include session short ID: `session-abc1234.md`, `session-abc1234.json`

---

## Non-Goals

- **Server-side export API.** This spec is client-side only, formatting data already loaded in the browser. A server-side export endpoint (mirroring the MCP server's `tb.session.export`) is a separate concern.
- **Cipher format.** The MCP server supports an encrypted "cipher" export format. The web UI does not need this -- it is designed for agent-to-agent handoff, not human consumption.
- **PDF export.** Not in scope. Markdown is sufficient for sharing and documentation.
- **Export of multiple sessions.** This spec covers single-session export from the detail page only.
- **Persisting view mode.** The full/decisions toggle is ephemeral. No localStorage or URL param persistence.
- **Decision analytics.** Aggregate stats across sessions (e.g., "how many decisions used high confidence") are a separate analytics feature.

---

## Implementation Notes

### File Summary

| File | Change | Feature |
|------|--------|---------|
| `src/components/session-area/session-trace-explorer.tsx` | Add `viewMode` state, conditional rendering | Decision Timeline |
| `src/components/session-area/session-trace-toolbar.tsx` | Add view toggle + export dropdown | Both |
| `src/lib/session/decision-grouping.ts` | **New.** Pure grouping logic | Decision Timeline |
| `src/components/session-area/decision-timeline.tsx` | **New.** Decision cards + reasoning gaps | Decision Timeline |
| `src/lib/session/export-formatters.ts` | **New.** Markdown/JSON formatters + download/clipboard helpers | Session Export |
| `src/components/session-area/export-dropdown.tsx` | **New.** Dropdown UI | Session Export |
| `src/lib/session/badge-styles.ts` | No changes (consumed, not modified) | -- |
| `src/lib/session/view-models.ts` | No changes (consumed, not modified) | -- |
| `src/components/session-area/thought-card.tsx` | No changes (reused by DecisionCard) | -- |

### Parallel Implementation (Agent Teams)

These two features are fully independent and can be implemented in parallel by separate agents without file conflicts:

**Agent A: Decision Timeline View**
- Creates `decision-grouping.ts` + tests
- Creates `decision-timeline.tsx`
- Modifies `session-trace-explorer.tsx` (adds `viewMode` state + conditional render)
- Modifies `session-trace-toolbar.tsx` (adds toggle)

**Agent B: Session Export**
- Creates `export-formatters.ts` + tests
- Creates `export-dropdown.tsx`
- Modifies `session-trace-toolbar.tsx` (adds export button)

The only shared file is `session-trace-toolbar.tsx`. To avoid conflicts: Agent A adds the view toggle in the left `flex` group (after the search input). Agent B adds the export button in the right area (where the live indicator currently lives, to its left). These are different DOM positions in the same file, so the edits do not overlap.
