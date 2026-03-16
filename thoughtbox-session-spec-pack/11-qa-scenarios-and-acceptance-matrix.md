# 11 — QA Scenarios and Acceptance Matrix

## Purpose

Provide a concrete test matrix for the Session area so implementation agents can validate behavior without inventing their own interpretation of the spec.

## QA stance

This is not an accessibility plan and not a full engineering test plan. It is a **product-facing acceptance matrix** that covers the behaviors most likely to regress.

## Scenario matrix

## 1. Session index — happy path

### Setup
Workspace has at least 10 Sessions with mixed statuses.

### Expected behaviors

- The page heading reads `Sessions`.
- Search and status controls are enabled and visible.
- The table shows Session, Project, Status, Thoughts, Started, and Duration columns.
- Clicking a row navigates to the correct Session detail page.

## 2. Session index — empty workspace

### Setup
Workspace has zero Sessions.

### Expected behaviors

- A clear empty state appears instead of an empty table shell.
- The copy references Sessions, not Runs.
- The page does not show broken filters or misleading zero-value table chrome.

## 3. Session index — no results under filters

### Setup
Workspace has Sessions, but the current search/filter set matches none.

### Expected behaviors

- A no-results state appears.
- The current filters remain visible.
- A clear-filters action is available.

## 4. Session detail — completed session default load

### Setup
Completed Session with 50 thoughts and no query params.

### Expected behaviors

- The detail page loads in split view.
- The trace is ordered oldest to newest.
- The first visible thought is selected by default.
- The right panel shows the selected thought detail immediately.

## 5. Session detail — active session default load

### Setup
Active Session with 50 thoughts and no query params.

### Expected behaviors

- The latest visible thought is selected by default.
- The UI communicates that the Session is active.
- The explorer enters a live-edge attached state.

## 6. Thought selection and URL sync

### Setup
Open any detail page and click a non-selected thought.

### Expected behaviors

- The selected row styling updates immediately.
- The detail panel updates immediately.
- The URL updates with the new `thought` param.
- Refresh preserves the selected thought.

## 7. Search within thoughts

### Setup
A detail page whose thoughts contain a distinctive search term.

### Expected behaviors

- Typing the term narrows the visible row set.
- The query state is represented in the URL.
- Clearing the term restores the full visible set.
- A no-results state appears when nothing matches.

## 8. Thought-type filter

### Setup
A detail page containing at least three distinct thought types.

### Expected behaviors

- Type filters can be toggled on and off.
- Untyped thoughts behave as `reasoning` for filter purposes.
- The visible row count changes deterministically with filters.
- The URL preserves active type filters.

## 9. Revisions-only mode

### Setup
A detail page containing revision thoughts.

### Expected behaviors

- Enabling the toggle shows only revision thoughts.
- Revision rows remain selectable.
- If the selected thought becomes hidden, the UI handles it according to the detail spec rather than silently failing.

## 10. Timestamp gaps

### Setup
A detail page with at least one pair of thoughts separated by more than 5 minutes.

### Expected behaviors

- A gap separator appears in the correct location.
- The label is human-readable.
- Gap separators are not selectable as thoughts.

## 11. Branch visualization

### Setup
A detail page with at least one branch and complete branch metadata.

### Expected behaviors

- The main lane is visually distinct.
- Branch thoughts render in a secondary lane.
- A fork connector appears at the first branch thought.
- Thought rows remain readable without understanding the SVG rail.

## 12. Missing branch metadata

### Setup
A thought has `branchId` but incomplete `branchFromThought` data.

### Expected behaviors

- The row still renders.
- The lane rail does not break layout.
- Missing fork metadata does not crash the page.

## 13. Typed thought rendering

### Setup
A detail page containing each supported typed thought at least once.

### Expected behaviors

- Each typed thought renders through the same shell.
- Type-specific metadata appears when present.
- Missing optional metadata does not create broken empty UI.

## 14. Untyped historical thought rendering

### Setup
A detail page containing older thoughts with no `thoughtType`.

### Expected behaviors

- The row still feels first-class.
- The detail panel shows raw content and metadata disclosure.
- The thought is included when the `reasoning` type is visible.

## 15. Large session performance sanity

### Setup
A detail page with ~400 thoughts.

### Expected behaviors

- Initial load is still usable.
- Row scrolling remains reasonable.
- Selecting a thought does not block the UI noticeably.
- The app does not require inline expansion to inspect detail.

## 16. Filtered-out selected thought

### Setup
Open a detail URL that selects a valid thought, then apply a filter that hides it.

### Expected behaviors

- The UI makes the conflict visible.
- The user can reveal the selected thought or clear the conflicting filter.
- The URL and detail panel do not drift into an incoherent state.

## 17. Abandoned session

### Setup
An abandoned Session with incomplete metadata.

### Expected behaviors

- The Session is clearly marked abandoned.
- Missing completion data does not break duration or header rendering.
- The trace remains navigable.

## 18. Live-session detached state

### Setup
Active Session, user manually selects an older thought, new thoughts arrive.

### Expected behaviors

- The user is not forcibly pulled back to the latest thought.
- A `new thoughts available` affordance appears.
- Reattaching to latest is explicit.

## Acceptance matrix by surface

| Surface | Minimum acceptance bar |
|---|---|
| Index | Search, status filter, clickable rows, empty/error states |
| Detail header | Title/ID, project, status, timing, thought count |
| Trace explorer | Chronological rows, lane rail, gap separators, selected state |
| Detail panel | Structured card, raw content, metadata disclosure |
| State model | URL-addressable selection, search/filter sync, live-edge handling |
| Data handling | Untyped and incomplete data degrade gracefully |

## Exit criteria for this pack

- The index page is fully spec'd as a conservative directory.
- The detail page can be implemented without inventing missing interaction rules.
- Core regressions have named scenarios.
- The matrix covers completed, active, abandoned, typed, untyped, branchy, and large Session cases.

## Acceptance criteria

- The QA matrix covers both the index and detail surfaces.
- The scenarios explicitly test active-session behavior, not only completed sessions.
- The matrix includes degraded-data cases, not only ideal data.
- The matrix is specific enough to become tickets or acceptance checks directly.
