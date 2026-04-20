# 02 — Routing and Information Architecture Spec

## Purpose

Define page inventory, routing behavior, URL state, page titles, and shareability rules for the Session area.

## IA stance

Short-term continuity matters. The current dashboard already uses a `/runs` namespace. This spec treats that namespace as compatible with a product-facing **Sessions** IA.

### Recommended short-term IA

- Navigation label: **Sessions**
- Page title on index: **Sessions**
- Page title on detail: **Session**
- Route namespace remains: `/w/[workspaceSlug]/runs/*`

This avoids avoidable route churn while fixing product language immediately.

## Route inventory

### 1. Session index

`/w/[workspaceSlug]/runs`

Purpose:
- browse Sessions
- search/filter the list
- navigate to a Session detail page

### 2. Session detail

`/w/[workspaceSlug]/runs/[runId]`

Purpose:
- inspect one Session
- browse the reasoning trace
- inspect a selected thought
- share a link to a selected thought and its filter context

## Page titles and breadcrumb language

### Index page

- top bar title: `Sessions`
- page heading: `Sessions`
- supporting copy: `Inspect completed and in-progress reasoning traces.`

### Detail page

- back link label: `Back to Sessions`
- top bar title: `Session`
- page heading:
  - use `session.title` if present
  - otherwise use `Session {shortId}`

### Session nomenclature in UI

Use:
- `Session ID`
- `Session status`
- `Session started`
- `Session duration`
- `Thoughts`

Avoid:
- `Run` in new labels
- `Commit` in user-facing copy

## Index-page URL state

The index page should remain conservative. URL state is still valuable for shareability and browser navigation.

### Recommended query params

- `q=<string>` — free-text search across visible session summary fields
- `status=<active|completed|abandoned>` — single status filter
- `sort=<started_desc|started_asc|thoughts_desc|duration_desc>` — optional, if supported
- `cursor=<opaque>` — server-pagination cursor, if needed later

### Canonical behaviors

- Unknown query params are ignored.
- Invalid filter values fall back to the unfiltered list.
- Clearing all filters returns to `/w/[workspaceSlug]/runs`.
- The index page is linkable with its filters intact.

## Detail-page URL state

The detail page should encode the state that most affects shared interpretation.

### Required query params

- `thought=<number>` — canonical selected-thought identifier, using `thoughtNumber`

### Recommended optional query params

- `q=<string>` — search term within thoughts
- `type=<thoughtType>` — repeatable or comma-separated; repeated params are preferred
- `revisions=1` — revisions-only mode
- `panel=detail` — optional future guard if the panel can collapse; not required in v1

### Canonical behaviors

#### Selected thought

- If `thought` resolves to an existing visible thought, select it.
- If `thought` resolves to an existing thought that is hidden by current filters, the UI should:
  1. keep the current filters visible
  2. show a notice that the selected thought is filtered out
  3. offer a one-click action to reveal it by clearing the conflicting filter

#### Missing `thought` param

- Completed Session: select the first visible thought on initial load.
- Active Session: select the latest visible thought on initial load and enter live-edge mode.

#### Invalid `thought` param

- Ignore the value
- select the default thought using the rules above
- replace the URL with the canonical valid selection

### Query param encoding for `type`

Preferred encoding:

`?type=decision_frame&type=action_report`

Fallback allowed:
- comma-separated string, normalized internally

## Browser navigation rules

- Clicking a thought row updates the `thought` query param.
- Typing in search may update the URL after debounce.
- Toggling filters updates the URL immediately.
- Browser Back / Forward should restore:
  - selected thought
  - search term
  - type filters
  - revisions-only state

## Information hierarchy

### Index page hierarchy

1. Page heading
2. Search and filters
3. Session table
4. Empty / no results / error states as needed

### Detail page hierarchy

1. Back link
2. Session header summary
3. Trace utility bar
4. Trace explorer and selected-thought panel

## Deep-link expectations

A shared detail URL should allow another user to land on:
- the same Session
- the same thought
- the same active filters/search
- a stable interpretation of the trace, independent of local UI memory

## Open IA questions

1. Should the route namespace become `/sessions` when broader dashboard IA is touched?
2. Should the selected thought remain `thoughtNumber`-based forever, or move to ID-based links if multiple numbering schemes appear?
3. Should index filters all live in the URL from day one, or only the filters currently exposed?

## Acceptance criteria

- The index and detail routes are explicitly defined.
- Product-facing copy uses `Session` even if the route stays under `/runs`.
- The detail page encodes thought selection in the URL.
- Search and filter state are designed to survive refresh and sharing.
- Invalid URL state is normalized without breaking page usability.
- The spec makes clear how default selection behaves for completed versus active Sessions.
