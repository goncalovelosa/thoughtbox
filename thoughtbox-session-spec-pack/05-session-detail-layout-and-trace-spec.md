# 05 — Session Detail Layout and Trace Spec

## Purpose

Define the Session detail page layout, trace visualization, branch rendering, and major content regions.

## Route

`/w/[workspaceSlug]/runs/[runId]`

## Page goal

Make the reasoning trace readable as a sequence of thoughts with visible topology, while preserving a fast path to inspecting the full content of any one thought.

## Desktop-first layout

The detail page should default to a **split layout**.

### Column structure

- **Left column:** trace explorer
- **Right column:** selected-thought detail panel

### Width guidance

Recommended desktop proportion:
- trace explorer: `minmax(0, 1.4fr)`
- detail panel: `minmax(320px, 0.9fr)`

This keeps the trace dominant while leaving enough width for structured cards and code blocks in the detail panel.

## Page regions

1. Back link
2. Session header
3. Trace utility bar
4. Main split region
   - trace explorer
   - selected thought detail panel

## Session header

### Required header content

- back link to Sessions
- session title or short ID
- full session ID in secondary metadata
- status badge
- started time
- duration or live elapsed
- thought count

### Optional header content

- session tags
- last updated timestamp for active Sessions
- live dot or activity pulse

## Status banner behavior

### Active Session

Show a compact banner or inline badge that communicates:
- the Session is still active
- the trace may update
- the user may be attached or detached from the live edge

### Completed Session

No banner required beyond the status badge.

### Abandoned Session

Use a muted warning treatment that indicates the Session ended unexpectedly or without completion.

## Trace utility bar

The utility bar sits directly above the trace list.

### Required controls

- search within thoughts
- thought-type filter
- revisions-only toggle

### Optional state indicator

- live-edge state chip for active Sessions, e.g. `Following latest` or `Detached from live`

## Trace explorer container

The trace explorer is a dark, scrollable surface with a fixed utility bar and a vertically scrollable body.

Recommended outer classes:

```tsx
rounded-2xl border border-slate-800 bg-slate-950 shadow-sm
```

## Trace body anatomy

Each row in the body aligns to:
- a left **lane rail**
- a right **row content area**

### Rail purpose

The rail visually communicates:
- main lane
- branch lanes
- fork points
- row position through the trace

### Row purpose

The row communicates:
- thought preview text
- branch membership
- type
- revision state
- short ID
- timestamp

## Row ordering

Default ordering:
- ascending by `thoughtNumber`
- oldest at the top, newest at the bottom

This preserves the natural “reasoning unfolded this way” mental model.

## Thought row anatomy

### Required elements

- lane dot aligned to the current row
- first-line thought preview, truncated
- branch badge when on a branch
- type badge when `thoughtType` is not plain reasoning
- revision badge when `isRevision` is true
- metadata row with short ID and relative timestamp

### Preview text rules

- use the first line of the thought body
- cap to roughly 120 characters before truncation
- preserve meaningful punctuation rather than aggressively sanitizing the preview

## Timestamp gaps

Insert a gap separator when two adjacent visible thoughts are separated by **more than 5 minutes**.

### Gap separator anatomy

- horizontal rule
- centered label such as `7m gap` or `1h 12m gap`

Gap separators are informational only. They are not selectable.

## Branch visualization

### v1 rendering model

Use a **lightweight SVG lane rail** with deterministic lanes.

### Lane assignment

- lane `0` is the main chain
- each new `branchId` gets the next available lane at first appearance
- branch lanes persist from the branch's first visible thought to its last visible thought

### Color sequence

- main lane: green
- additional lanes cycle through:
  - purple
  - blue
  - amber
  - pink
  - red

### Fork rendering

At the first branch thought, render a curved connector from the origin lane to the branch lane.

### Merge rendering

No explicit merge UI is required in v1. If the data model later adds merge semantics, the lane system may be extended.

### Missing branch metadata

If a thought has a `branchId` but lacks usable `branchFromThought` metadata:
- still render it in a branch lane
- omit the fork curve
- add no warning in-row unless this becomes common data debt

## Row selection state

A selected row should be visually obvious through:
- elevated or tinted background
- stronger border or ring
- more prominent lane dot

The row should not expand in place; the detail appears in the right panel.

## Right detail panel

The selected thought detail panel is sticky relative to the main page scroll if possible.

### Required detail regions

1. Thought header
2. Structured thought card
3. Raw content block
4. Metadata disclosure

### Empty selection state

No empty state is expected on desktop if default selection rules are followed.

## Large-session behavior

At up to ~400 thoughts:
- render the full row list
- keep rows dense
- avoid inline expansion that would explode page height
- keep heavy formatting confined to the selected-thought panel

## Open questions

1. Should the trace explorer gain a denser “compact mode” later?
2. Should gap separators ever be collapsible or skippable?
3. Should a future graph mode coexist with this hybrid list view rather than replace it?

## Acceptance criteria

- The detail page is specified as a split view with a trace explorer and selected-thought panel.
- The trace is chronological and oldest-first.
- Branches are visible through a lane rail, dots, and fork connectors.
- Thought rows stay dense and do not inline-expand into full detail.
- Gap separators appear for pauses longer than 5 minutes.
- The spec handles active, completed, and abandoned Sessions in the detail header.
