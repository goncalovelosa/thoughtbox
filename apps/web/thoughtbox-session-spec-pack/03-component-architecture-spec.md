# 03 — Component Architecture Spec

## Purpose

Define the React component hierarchy and the recommended Server Component / Client Component boundaries for the Session area.

## Architectural stance

- Fetch on the server where possible.
- Keep page shells and static summaries as Server Components.
- Put interaction-heavy session browsing inside a focused client boundary.
- Avoid fragmenting state across many small client islands when one bounded explorer shell would do.

## High-level component map

## Session index page

### Server Components

- `SessionsIndexPage`
- `SessionsIndexHeader`
- `SessionsIndexDataBoundary`
- `SessionsTableShell`
- `SessionsEmptyState`
- `SessionsErrorState`

### Client Components

- `SessionsIndexControls`
- `SessionsTable`
- `SessionsTableRowLink`

## Session detail page

### Server Components

- `SessionDetailPage`
- `SessionDetailHeader`
- `SessionStatusBanner`
- `SessionDetailDataBoundary`
- `SessionNotFoundState`
- `SessionLoadErrorState`

### Client Components

- `SessionTraceExplorer`
- `SessionTraceToolbar`
- `SessionTimeline`
- `SessionTimelineRail`
- `ThoughtRow`
- `TimestampGap`
- `ThoughtDetailPanel`
- `ThoughtCard`
- `ThoughtMetadataDisclosure`

## Recommended file-tree sketch

```text
app/
  w/[workspaceSlug]/runs/
    page.tsx
    [runId]/
      page.tsx

components/session-area/
  sessions-index-header.tsx
  sessions-index-controls.tsx
  sessions-table.tsx
  sessions-empty-state.tsx
  session-detail-header.tsx
  session-status-banner.tsx
  session-trace-explorer.tsx
  session-trace-toolbar.tsx
  session-timeline.tsx
  session-timeline-rail.tsx
  thought-row.tsx
  thought-detail-panel.tsx
  thought-card.tsx
  thought-metadata-disclosure.tsx
```

## Server / client boundary recommendation

### Index page boundary

The page, heading, initial data fetch, and empty/error states should remain server-rendered. The controls and table behaviors can live inside a small client wrapper.

**Reasoning:** the index page is conservative and mostly list-driven.

### Detail page boundary

The detail page should render:
- server-side header and status summary
- one interactive `SessionTraceExplorer` client boundary for:
  - selected thought
  - search/filter state
  - live-edge behavior
  - list scrolling and selection
  - detail panel content

**Reasoning:** selection state and URL coupling are central enough that a single explorer boundary will be simpler than many isolated client controls.

## Component responsibilities

### `SessionsIndexPage` (server)

Responsibilities:
- receive `workspaceSlug` and search params
- fetch session summaries
- render page shell, heading, and initial list state

Does not own:
- row hover state
- client-side table interactions

### `SessionsIndexControls` (client)

Responsibilities:
- manage the visible search input state
- apply or clear index filters
- sync supported filters back to the URL

### `SessionsTable` (client or server-enhanced client)

Responsibilities:
- render rows
- support row click / keyboard navigation
- preserve table semantics and link behavior

### `SessionDetailPage` (server)

Responsibilities:
- fetch the Session and its thoughts
- derive top-level session summary
- render not-found / load-error states
- pass normalized view-model data into the explorer

### `SessionDetailHeader` (server)

Responsibilities:
- show back link, title, status, project, timing, and thought count
- show state-specific badges for active/completed/abandoned

### `SessionTraceExplorer` (client)

Responsibilities:
- own the selected-thought state
- parse and write detail-page URL params
- own filter/search state
- coordinate timeline list and detail panel
- own live-edge attachment state for active Sessions

### `SessionTimeline` (client)

Responsibilities:
- render ordered rows and gap separators
- render the lane rail and row alignment
- notify the explorer of selection changes

### `SessionTimelineRail` (client)

Responsibilities:
- draw the lightweight SVG graph:
  - vertical lanes
  - dots
  - fork curves
- remain visually aligned to row positions

### `ThoughtRow` (client)

Responsibilities:
- show a dense preview
- visually encode selection, type, branch, revision, and timestamp state
- act as the primary selection affordance

### `ThoughtDetailPanel` (client)

Responsibilities:
- render the selected thought
- show the unified thought card
- show raw content
- show metadata disclosure

## Data flow contract

The server layer should not hand raw persistence objects straight to the client UI. Instead it should pass:

- `SessionSummaryVM` for index rows
- `SessionDetailVM` for the detail shell
- `ThoughtRowVM[]` for the timeline
- `ThoughtDetailVM` derived on selection or precomputed per thought
- filter option metadata

## Derived-data placement

### Prefer server-derived

- session summary fields
- normalized thought ordering
- lane assignment metadata
- preview text
- duration calculations
- gap-separator calculations, if cheap and stable

### Prefer client-derived

- visible row subset under filters
- selected-thought resolution against current URL state
- live-edge attachment state
- search highlighting state
- filtered-out selected thought notice

## Performance stance

Given the current observed scale ceiling of ~400 thoughts for a single-agent Session:
- render the row list directly in v1
- do not require virtualization by default
- do not render all full thought bodies inline
- keep expensive text formatting inside the selected-thought panel only

## Rejected patterns

- A client-only page shell for the whole detail route
- Dozens of tiny stateful client widgets with competing URL ownership
- A fully spatial graph canvas for v1
- D3 or graph-layout dependencies

## Acceptance criteria

- The component hierarchy clearly separates page-shell/server work from explorer/client work.
- A single interactive boundary owns selected-thought and filter state on the detail page.
- The UI consumes normalized view models rather than raw persistence types.
- The component map is specific enough for implementation naming and file planning.
- The performance stance is compatible with the stated 100–400 thought scale.
