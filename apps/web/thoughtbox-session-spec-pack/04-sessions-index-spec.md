# 04 — Sessions Index Spec

## Purpose

Define the Session index page as a conservative but complete entry point into the Session area.

## Product stance

This page should remain a **high-signal directory**, not a second analytics dashboard. Its job is to help the user find and open the right Session quickly.

## Route

`/w/[workspaceSlug]/runs`

## Page structure

1. Page heading
2. Lightweight controls row
3. Session table
4. Empty or error states as needed

## Heading content

### Primary heading

`Sessions`

### Supporting copy

`Inspect completed and in-progress reasoning traces.`

### Optional result count

Show `N sessions` near the heading or above the table when the total is known cheaply.

## Controls row

Keep the controls conservative in v1.

### Required controls

- Search input
- Status filter

### Optional control

- Clear filters action, shown only when filters are active

### Deliberately excluded from v1

- Branch analytics
- Session tags facet
- Time-range charting
- Dense summary cards
- Saved views

## Search behavior

Search should match the fields most likely to help a user relocate a Session:

- session title, if present
- session ID / short ID

Search should be debounced before URL updates.

## Status filter

Statuses:
- `All`
- `Active`
- `Completed`
- `Abandoned`

Default: `All`

## Table design

### Column set

1. `Session`
2. `Status`
3. `Thoughts`
4. `Started`
5. `Duration`

### Column behavior

#### Session

Display:
- session title if present
- short session ID beneath or alongside in monospace

#### Status

Use a pill badge with distinct colors for active, completed, and abandoned.

#### Thoughts

Right-aligned integer. If unknown, use `—`.

#### Started

Show compact absolute time with tooltip/fallback to full timestamp if desired.

#### Duration

- completed: total duration
- active: live elapsed time
- abandoned: elapsed time until last update or abandonment marker

## Row behavior

- Entire row is clickable.
- Row acts like a navigational link to the detail page.
- Hover and focus states should make this obvious without adding button clutter.
- Opening in a new tab should work via standard link semantics.

## Sorting

Default sort:
- newest started first

Optional future sorts:
- oldest
- most thoughts
- longest duration

This pack does not require a visible sort UI in v1.

## States

### Loading

Use skeleton rows with the same column structure as the final table.

### Empty workspace state

Shown when the workspace has no Sessions at all.

Recommended content:
- heading: `No sessions yet`
- body: brief explanation that Session traces will appear here once agents run through Thoughtbox

### No-results state

Shown when filters/search eliminate all visible rows.

Recommended content:
- heading: `No sessions match these filters`
- action: `Clear filters`

### Error state

Show a non-destructive error block above or in place of the table with a retry affordance if the app supports it.

## Status-specific index cues

### Active

- blue badge
- duration ticks upward while page is open if live state is supported
- may show a subtle `Live` dot beside the badge

### Completed

- green badge
- static duration

### Abandoned

- red badge
- still navigable
- may have incomplete thought counts

## Copy and terminology

Use:
- `Sessions`
- `Session ID`
- `Thoughts`

Do not use:
- `Runs`
- `Commits`
- `Logs` as the page title

## Open questions

1. Should the index later include a lightweight summary strip for counts by status?
2. Should the search field eventually cover tags as well as ID?

## Acceptance criteria

- The index page stays conservative and table-first.
- Search and status filtering are first-class and no longer disabled placeholders.
- Rows are clearly clickable and navigate to Session detail.
- The table handles loading, empty, no-results, and error states.
- Status display works for active, completed, and abandoned Sessions.
- The spec avoids turning the index page into an analytics-heavy surface.
