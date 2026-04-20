# 06 — Interaction State and URL Spec

## Purpose

Define user interaction rules, derived UI state, filter/search behavior, live-session state, and URL synchronization for the Session detail experience.

## State model overview

The Session detail page has three layers of state:

1. **Source state**
   - normalized Session data and ordered thoughts
2. **Derived view state**
   - visible rows after search/filtering
   - selected thought resolution
   - lane visibility and gap separators
3. **Ephemeral interaction state**
   - search input draft
   - live-edge attachment state
   - pending URL writes
   - scroll-follow behavior

## Thought selection

### Default interaction

- single-click on a thought row selects it immediately
- selection updates the detail panel immediately
- selection updates the `thought` URL param

### Keyboard interaction

Even without a dedicated accessibility spec, keyboard behavior should be operational:
- Up / Down moves to previous / next visible thought
- Home / End jumps to first / last visible thought
- Enter on a focused row selects it if focus and selection are distinct

## URL-addressable selection

### Canonical param

`thought=<thoughtNumber>`

### Selection resolution algorithm

1. Parse the `thought` param.
2. If it matches a visible thought, select it.
3. If it matches an existing but filtered-out thought, show a filtered-out notice in the detail panel area.
4. If it is missing or invalid, apply the default selection rule and normalize the URL.

## Default selection rules

### Completed Session

- if there is no `thought` param, select the first visible thought
- scroll to the top of the trace

### Active Session

- if there is no `thought` param, select the latest visible thought
- scroll to the bottom or latest anchor
- attach to the live edge

## Live-edge model

### Purpose

Support active Sessions without making transport implementation a product dependency.

### Live-edge states

- `attached` — the UI follows newly arriving thoughts
- `detached` — the user has intentionally navigated away from the latest thought
- `stale` — the Session is marked active but no new activity has arrived within a configurable freshness window
- `completed` — the Session has ended; live edge is no longer relevant

### Attach / detach rules

Detach when:
- the user clicks an older thought
- the user scrolls far enough away from the bottom, if auto-follow is implemented
- the user applies a filter that hides the latest thought

Reattach when:
- the user clicks `Follow latest`
- filters again reveal the latest thought and the user opts back in

### Newly arrived thought behavior while detached

- do not forcibly move selection
- show a subtle `New thoughts available` affordance near the toolbar or bottom edge

## Search within thoughts

### Scope

Search should match across:
- thought preview text
- full thought body
- structured human-readable fields:
  - option labels and reasons
  - action tool and target
  - belief entities and states
  - assumption text and trigger
  - context model/tool/source strings
  - progress task and note

### Behavior

- case-insensitive
- debounced URL updates
- visible row subset updates after debounce
- matching rows may show lightweight text highlighting in preview and detail

### No-results behavior

If search yields no visible rows:
- keep the detail panel stable if possible
- show a no-results state in the trace
- offer `Clear search`

## Thought-type filter

### Filter model

Multi-select thought types:
- reasoning
- decision_frame
- action_report
- belief_snapshot
- assumption_update
- context_snapshot
- progress

### Default

All types visible.

### Untyped thoughts

Treat untyped historical thoughts as `reasoning` for filter purposes.

## Revisions-only toggle

### Semantics

When enabled, show only thoughts where:
- `isRevision === true`, or
- `revisesThought` is present

### Selection behavior

If the current selected thought disappears under revisions-only mode:
- keep the URL as-is temporarily
- surface a filtered-out selected thought notice
- offer `Show selected thought`

Alternative acceptable behavior:
- automatically select the first visible revision thought and replace the URL

The first behavior is preferred because it preserves user intent more faithfully.

## Filter persistence in URL

Recommended query model:
- `q=<string>`
- repeated `type=<enum>`
- `revisions=1`

The URL is the canonical state store for shareable detail state. Local component state may mirror it, but must not silently diverge.

## Scroll behavior

### On selection

- selecting a row should not aggressively re-scroll the list if the row is already visible
- selecting via URL on initial load should scroll the row into view

### On filter/search change

- preserve the user's scroll position when practical
- if the selected row becomes hidden, do not yank the scroll unexpectedly

## Detail panel behavior

- switching selected thoughts updates the right panel immediately
- the raw thought content should not animate heavily
- metadata disclosure state may reset on selection change; preserving it is optional

## State for incomplete or live-ingesting data

The UI state model should survive:
- a Session that is active but currently idle
- thought counts that increase while the page is open
- late-arriving thought metadata
- temporary disagreement between `totalThoughts` and the currently loaded row count

These are UI concerns, not transport decisions.

## Open questions

1. Should search and filter state update the URL immediately or only after debounce/submit?
2. Should a filtered-out selected thought keep occupying the detail panel, or should the panel swap to a filter notice?
3. Should live-edge attachment be based only on selection, or also on scroll position?

## Acceptance criteria

- Thought selection is single-click and URL-addressable.
- The detail page defines different default selection rules for completed versus active Sessions.
- The UI state model supports a live-edge concept without requiring a transport decision.
- Search, type filters, and revisions-only mode are defined precisely enough to implement.
- Filter/search changes do not silently break shareable links or browser history.
- The spec explains how the UI behaves when the selected thought becomes hidden by filters.
