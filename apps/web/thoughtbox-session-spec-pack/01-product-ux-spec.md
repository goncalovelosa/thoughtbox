# 01 — Product UX Spec

## Purpose

Define the product behavior, primary user jobs, scope boundaries, and opinionated defaults for the Thoughtbox **Session area**.

## Canonical framing

A **Session** is the completed or in-progress reasoning trace produced by one MCP-connected agent interaction. A Session is made up of **Thoughts**. Thoughts can branch, revise prior thoughts, and optionally carry a structured `thoughtType`.

This spec assumes:
- one Session is the primary object on both the index and detail pages
- the detail page exists to answer **“how did the agent get here?”**
- the UI must support both completed and active Sessions
- the design should feel native to the existing Next.js / React / Tailwind app, not like a lifted observatory clone

## Goals

1. Make Sessions browseable and inspectable from the current dashboard.
2. Make a single Session readable as a reasoning trace, not only as a blob of logs.
3. Preserve branch information without forcing a fully spatial graph layout in v1.
4. Support typed thoughts with richer rendering while degrading cleanly for older data.
5. Support active Sessions without making a transport decision part of the product spec.
6. Produce an experience that can be implemented incrementally by agents with minimal ambiguity.

## Non-goals

- Realtime implementation detail
- Multi-agent collaboration surfaces
- Responsive/mobile design details
- Accessibility requirements
- Backend migration strategy
- Full implementation plan or ticket sequencing

## Primary users and jobs

### Primary user

An engineering or product operator inspecting agent behavior after or during a Session.

### Core jobs

1. **Find a Session**
   - locate a session by project, ID, or status
   - distinguish active from completed from abandoned

2. **Scan a Session quickly**
   - understand how many thoughts it contains
   - identify large pauses, branch points, revisions, and typed events
   - tell where the Session seems to have succeeded or failed

3. **Inspect a specific thought**
   - open the full content immediately
   - see metadata, branch context, and structured fields
   - link directly to a specific thought

4. **Debug the agent’s path**
   - filter down to interesting thought types
   - search across thought text
   - isolate revisions

5. **Monitor an active Session**
   - understand whether new thoughts are still arriving
   - keep attention on the live edge or intentionally detach from it

## Product principles

### 1. Chronology first, topology second

The default mental model is a timeline of reasoning. Branch topology should enhance that timeline, not replace it.

### 2. Density over decoration

The list should remain scannable at 100 to 400 thoughts. Decorative chrome should never bury the trace itself.

### 3. Detail by selection, not by expansion everywhere

The initial view should privilege short, dense rows. Full thought bodies belong in the selected-thought panel.

### 4. Branches are visible even when passive

A user should be able to perceive that a branch exists and where it forked without entering a separate mode.

### 5. Typed metadata should feel additive, not mandatory

Untyped historical thoughts must still look first-class. Typed thought rendering should enrich the model, not punish older sessions.

### 6. Shareability matters

The state that matters most for collaboration should be linkable: selected thought, active filters, and search.

### 7. Active sessions should behave like logs with agency

When a Session is in progress, the UI should support a “live edge” mental model while still allowing the user to detach and inspect history.

## Scope boundaries

### In scope

- Session index page
- Session detail page
- Session header and summary
- Thought trace visualization
- Selected-thought detail panel
- Search/filter utilities within a session
- URL-addressable selected thought and filters
- Status-specific states for active/completed/abandoned sessions
- Fallback behavior for incomplete or older thought data

### Out of scope

- Editing Sessions or Thoughts
- Branch-specific focus mode
- Merge visualization beyond basic survivable rendering
- Session comparison
- Cross-session analytics
- Workspace-level dashboards beyond the conservative index page

## Opinionated defaults

### Default IA choice

Keep the current route namespace if needed, but use **Session** in page titles and product copy.

### Default detail layout

Use a **two-column desktop detail page**:
- left: trace explorer
- right: selected thought detail

### Default primary visualization

Use a **hybrid list with lane rail**:
- thought rows remain stacked and chronological
- a narrow SVG rail on the left shows lanes, dots, and forks

### Default click behavior

Single-click on a thought row opens its detail immediately.

### Default live-session behavior

When a Session is active and the user has not manually chosen another thought, the UI stays attached to the **latest thought**. Manual selection detaches the live edge.

### Default filter set

V1 includes:
- search within thoughts
- filter by thought type
- show revisions only

### Default theming stance

Make the Session area feel like a specialized reasoning workspace via dark surfaces inside the content area.

## Open product questions intentionally preserved

1. Should the route namespace stay `/runs` long term if the user-facing noun becomes Session?
2. Should the detail view ever become a more spatial graph mode for large or branch-heavy sessions?
3. Should active-session transport be pull, push, or both?
4. Should filter state persist only in the URL or also in workspace memory?
5. Should the index page eventually become more analytics-heavy than this pack assumes?

## Acceptance criteria

- The Session area is defined as an end-to-end product surface, not only a detail page.
- The default mental model is a chronological reasoning trace with visible branching.
- The detail interaction model is selection-driven, not large inline expansion.
- Active Sessions are explicitly supported as a product requirement.
- Older untyped thoughts are treated as a first-class case.
- The spec preserves unresolved strategic choices without blocking implementation of v1.
