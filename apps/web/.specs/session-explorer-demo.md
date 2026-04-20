# Session Explorer Demo Page

**Status:** Draft
**Created:** 2026-04-09
**Route:** `/(public)/explore/[sessionSlug]`
**First instance:** `/explore/agentic-reasoning-research`

---

## Problem

Thoughtbox records structured AI reasoning sessions, but there is no way for a visitor to see what that looks like in practice. The marketing site describes the product; it does not demonstrate it. A prospective user must sign up and run a session before they understand the value.

We have a 167-thought research session (880b76fa) with 12 belief snapshots, a decision frame, action reports, assumption updates, progress checkpoints, and 17 knowledge graph entities connected by 10 relations. This is a compelling artifact. It should be browsable on the public site as a zero-friction demo.

## Goal

A static, pre-rendered page at `/explore/agentic-reasoning-research` that lets any visitor browse the 880b76fa session interactively. No authentication, no API calls at runtime, instant load. The page serves two purposes:

1. **Product demo** -- show what Thoughtbox captures, visually
2. **Lead generation** -- convert interest into signups and audit requests

## Data Requirements

### Session Export Format

At build time, the page reads a static JSON file containing the full session payload. This file is committed to the repo at `src/data/sessions/agentic-reasoning-research.json`.

The JSON file is produced by running `tb.session.export(sessionId, "json")` and augmenting with knowledge graph data. Schema:

```typescript
type ExplorerSessionData = {
  session: {
    id: string
    title: string
    tags: string[]
    status: "completed"
    createdAt: string          // ISO 8601
    completedAt: string        // ISO 8601
    thoughtCount: number
  }

  thoughts: RawThoughtRecord[] // same type from view-models.ts

  knowledgeGraph: {
    entities: Array<{
      id: string
      name: string
      type: "Insight" | "Concept" | "Decision" | "Workflow"
      label: string
    }>
    relations: Array<{
      id: string
      from_id: string
      to_id: string
      type: string             // BUILDS_ON, CONTRADICTS, etc.
    }>
  }

  // Curated by hand -- not auto-generated
  keyMoments: Array<{
    thoughtNumber: number
    label: string              // e.g., "First belief snapshot"
    why: string                // 1-sentence explanation of significance
  }>
}
```

### What Goes Into the Export

From the 880b76fa session:

| Dimension | Count | Notes |
|-----------|-------|-------|
| Thoughts | 167 | All types: 148 reasoning, 12 belief_snapshot, 2 action_report, 2 progress, 1 decision_frame, 1 assumption_update, 1 context_snapshot |
| Knowledge entities | 17 | Created during this session (Insights + Concepts) |
| Relations | 10+ | BUILDS_ON, CONTRADICTS, RELATES_TO edges |
| Key moments | ~10-15 | Hand-curated highlights from the 19 non-reasoning thoughts |
| Duration | ~90 minutes | 09:04 to 10:35 UTC |

### Data Generation Script

A one-time Node script at `scripts/export-session-for-explorer.ts` that:

1. Calls `tb.session.get(sessionId)` to get all thoughts
2. Calls `tb.knowledge.listEntities()` filtered to the session's time window
3. Queries relations between those entities via `tb.knowledge.queryGraph()`
4. Writes the combined JSON to `src/data/sessions/<slug>.json`
5. Outputs a skeleton `keyMoments` array for manual curation

This script runs once. The JSON is committed. Future sessions get their own export runs.

---

## Page Structure

### Route and Layout

- Route group: `(public)` -- uses existing `PublicNav` + `PublicFooter`
- Path: `/explore/agentic-reasoning-research`
- Dynamic route: `src/app/(public)/explore/[sessionSlug]/page.tsx`
- Static generation: `generateStaticParams()` returns the known session slugs from `src/data/sessions/`
- The page is a Server Component. Interactive sections are Client Component islands.

### Information Architecture

The page has five sections, top to bottom:

#### 1. Hero / Session Header

Full-width section with session identity and aggregate stats.

Content:
- Session title: "Agentic Reasoning Research for Thoughtbox"
- Subtitle: session tags as pills (`research`, `agentic-reasoning`, `thoughtbox`, `meta-cognition`)
- Stats row: `167 thoughts` | `~90 min` | `12 belief snapshots` | `17 knowledge entities` | `10 relations`
- One-sentence description: "Watch an AI agent conduct a 90-minute deep research session on agentic reasoning, forming beliefs, making decisions, and building a knowledge graph in real time."
- Primary CTA: "Try Thoughtbox Free" (links to `/pricing`)

Design: Uses the existing brutalist style from the homepage. `border-4 border-foreground`, `font-black uppercase`, stats in monospace.

#### 2. Key Moments Navigator

A horizontal strip of curated highlights that act as jump links into the timeline.

Content:
- 10-15 hand-curated moments, each showing: thought number, label, thought type badge
- Clicking a moment scrolls to that thought in the timeline and expands it

Design: Horizontal scrollable row of small cards. Each card has a type-colored left border. Active card gets `bg-foreground text-background`.

Implementation: Client Component (`KeyMomentsNav`). Uses `scrollIntoView()` with URL fragment update.

#### 3. Session Timeline (Primary View)

The main content area. A vertical timeline of all 167 thoughts with the existing git-log visual language.

Components reused from `src/components/session-area/`:
- `ThoughtRow` -- row in the timeline list (preview text, type badge, timestamp)
- `ThoughtCard` -- expanded thought detail with structured type cards
- `TimestampGap` -- gap separators between thoughts with >5 minute pauses
- `SessionTimelineRail` -- SVG branch lane visualization on the left

Adaptations needed for the public explorer context:
- **No branch rail for this session** -- 880b76fa has 0 branches. The rail component should still mount (for future sessions with branches) but renders as a simple vertical line.
- **Collapsed by default** -- All thoughts render as `ThoughtRow` (one line). Clicking expands inline to show `ThoughtCard`.
- **URL fragments** -- Each thought gets `#thought-42`. On load, if a fragment is present, auto-scroll and expand that thought.
- **Lazy rendering** -- Only render thoughts near the viewport. Use a virtualized list or intersection observer to avoid mounting 167 full DOM nodes at once.
- **Type filter chips** -- Reuse the filter chip pattern from SPEC-001. Let visitors filter to just belief snapshots, decisions, etc.
- **Stat sidebar removed** -- No sidebar on the public page. Stats are in the hero. Keep the full width for the timeline.

The `ThoughtRow` and `ThoughtCard` components from `session-area/` are designed for the authenticated workspace context. They use the same brutalist design tokens (`border-foreground`, `font-mono-terminal`, `shadow-brutal-sm`) that match the public site, so they can be used directly or with thin wrapper components that strip workspace-specific props (like `runId`).

Implementation: Client Component (`ExplorerTimeline`). Wraps existing components. Manages expand/collapse state, scroll position, and filter chips.

#### 4. Knowledge Graph View

An interactive force-directed graph showing the 17 entities and their relations.

Content:
- Nodes: entities, sized by connection count, colored by type (Concept = blue, Insight = amber, Decision = purple, Workflow = green)
- Edges: relations, labeled with type (BUILDS_ON, CONTRADICTS, etc.)
- Hover: shows entity label and type
- Click: highlights connected nodes and shows a detail card

Design considerations:
- The existing codebase has **no graph visualization dependency**. The observatory design brief explicitly states "No D3, no Mermaid, no graph layout libraries" for the workspace UI.
- For the public demo page, the constraint is different. This is a marketing page, not a workspace tool. A graph visualization library is justified here because: (a) the data is static and small (17 nodes, ~10 edges), (b) the graph is the visual hook that makes the demo compelling, (c) it runs on a single page, not across the app.
- **Recommended: D3 force simulation** (`d3-force` + `d3-selection`, not full D3). Tree-shakeable, well-understood, no layout server needed. Alternative: pure SVG with hand-positioned coordinates for 17 nodes (simpler, no dependency, but less impressive and harder to maintain for future sessions).
- **Fallback for SSR**: The graph section renders a static placeholder (entity count + relation count + a teaser image) on the server. The interactive graph hydrates client-side.

Implementation: Client Component (`KnowledgeGraphViewer`). Imports only `d3-force` and `d3-selection` (not the full d3 bundle). Canvas or SVG rendering for the 17-node graph.

#### 5. Bottom CTA

Full-width conversion section.

Content:
- Headline: "This is what your agents are thinking. You just can't see it yet."
- Two CTAs side by side:
  - "Try Thoughtbox Free" -- links to `/pricing`
  - "Get a Free Audit" -- links to `/support` or a Calendly embed (TBD)
- Social proof line: "167 thoughts. 17 entities. 10 relations. One session."

Design: Matches the existing homepage CTA section. `bg-foreground text-background`, `border-4`, `shadow-brutal-invert`.

### View Toggle: Timeline vs. Graph

A toggle in the section between Key Moments and the main content area lets visitors switch between:
- **Timeline** (default): the vertical thought list
- **Graph**: the knowledge graph visualization

The toggle is a two-button group: `[TIMELINE]` `[GRAPH]`. Active button gets `bg-foreground text-background`. The inactive view unmounts (not hidden) to avoid rendering both simultaneously.

---

## Interactive Features

### Thought Expansion

- **Default state**: All thoughts collapsed, showing `ThoughtRow` (one-line preview)
- **Click to expand**: Thought expands inline to show full `ThoughtCard` with type-specific structured content
- **Click again to collapse**: Returns to one-line preview
- **Only one expanded at a time**: Expanding a thought collapses the previously expanded one (accordion behavior). This keeps the page scannable.
- **Keyboard**: Enter/Space to toggle, arrow keys to navigate between thoughts

### URL Fragments and Deep Links

- Every thought gets a fragment: `#thought-{number}` (1-indexed)
- Loading the page with a fragment scrolls to and expands that thought
- Expanding a thought updates the URL fragment via `history.replaceState` (no navigation)
- This enables sharing links to specific thoughts: `/explore/agentic-reasoning-research#thought-42`

### Type Filter Chips

Above the timeline, a row of filter chips:
- `ALL` | `BELIEF (12)` | `ACTION (2)` | `DECISION (1)` | `PROGRESS (2)` | `ASSUMPTION (1)` | `CONTEXT (1)`
- Clicking a chip filters the timeline to show only that type
- `ALL` shows everything (default)
- Multiple selection not needed for the demo (simplify UX)
- Filter state is not persisted in the URL (low value for a demo page)

### Knowledge Graph Interactions

- **Hover node**: Tooltip with entity label and type
- **Click node**: Highlights the node and its direct connections. Shows a detail card below the graph with the entity name, type, and label.
- **Drag node**: Repositions the node in the force layout (standard D3 drag behavior)
- **Zoom/pan**: Mouse wheel to zoom, click-drag on background to pan

### Key Moments Navigation

- Clicking a key moment scrolls to that thought and expands it
- If the timeline is filtered (e.g., showing only beliefs), clicking a key moment clears the filter first
- Active key moment highlights based on scroll position (intersection observer on thought elements)

---

## Technical Approach

### Static Generation

The page uses Next.js `generateStaticParams()` + static JSON imports. Zero runtime API calls.

```typescript
// src/app/(public)/explore/[sessionSlug]/page.tsx
import sessionData from "@/data/sessions/agentic-reasoning-research.json"

export function generateStaticParams() {
  // Read filenames from src/data/sessions/ at build time
  return [{ sessionSlug: "agentic-reasoning-research" }]
}

export default async function ExplorerPage({ params }) {
  const { sessionSlug } = await params
  // Load the JSON for this slug
  // Transform through existing view-model adapters
  // Render Server Component shell + Client Component islands
}
```

### Component Reuse

Existing components from `src/components/session-area/` that can be reused:

| Component | Reuse | Adaptation |
|-----------|-------|------------|
| `ThoughtRow` | Direct | Strip workspace-specific styling if any |
| `ThoughtCard` | Direct | Already handles all 7 thought types |
| `TimestampGap` | Direct | No changes needed |
| `SessionTimelineRail` | Direct | Renders simple vertical line for branchless sessions |
| `PhaseHeader` | Maybe | Could use for grouping if we detect phases |

Existing utilities reused:

| Utility | Reuse |
|---------|-------|
| `createThoughtViewModels()` | Transforms raw thoughts to `ThoughtRowVM` + `ThoughtDetailVM` |
| `THOUGHT_TYPE_BADGE` / `THOUGHT_TYPE_LABEL` | Badge styling constants |
| `highlightText()` | For search highlighting (if we add search) |

### New Components

| Component | Type | Purpose |
|-----------|------|---------|
| `ExplorerHero` | Server | Session header with stats |
| `KeyMomentsNav` | Client | Horizontal scrollable key moment chips |
| `ExplorerTimeline` | Client | Timeline wrapper with expand/collapse, filtering, lazy rendering |
| `KnowledgeGraphViewer` | Client | D3 force-directed graph |
| `ExplorerViewToggle` | Client | Timeline/Graph toggle |
| `ExplorerCTA` | Server | Bottom conversion section |

### New Dependencies

| Package | Purpose | Size |
|---------|---------|------|
| `d3-force` | Force simulation layout | ~15 KB min+gz |
| `d3-selection` | DOM binding for SVG graph | ~8 KB min+gz |

Both are tree-shakeable ESM packages. They only load on the explorer page (dynamic import in the `KnowledgeGraphViewer` client component). They do not affect bundle size for other pages.

Alternative (no dependency): Pre-compute node positions in the export script and render a static SVG. Loses drag/zoom interactivity but eliminates the dependency entirely. Worth considering if the graph is not compelling enough to justify the bundle cost.

### Styling

The public marketing site uses the brutalist design language: `border-4 border-foreground`, `font-black uppercase tracking-widest`, `shadow-brutal`, monospace accents via `font-mono-terminal`. The session-area components already use this same language (they were built during the brutalist calibration work on the current branch). No design system bridging needed.

### Performance Budget

| Metric | Target | How |
|--------|--------|-----|
| LCP | < 1.5s | Static generation, no API calls, hero is server-rendered |
| FID | < 100ms | Timeline is lazy, graph is dynamically imported |
| CLS | 0 | Fixed-height thought rows, graph has reserved height |
| JS bundle (page) | < 80 KB gz | Timeline components + d3-force/selection |
| Total transfer | < 200 KB | JSON data (~50 KB for 167 thoughts) + JS + CSS |

The 167-thought JSON payload is the main data cost. At ~300 bytes/thought average, that is ~50 KB uncompressed, ~15 KB gzipped. Well within budget.

### Lazy Rendering Strategy

167 thoughts is manageable but benefits from virtualization:

- Render the first 20 thoughts immediately (above the fold)
- Use `IntersectionObserver` to render remaining thoughts as the user scrolls
- Collapsed `ThoughtRow` is lightweight (~50 bytes DOM). Expanded `ThoughtCard` is heavier but only one is open at a time.
- The knowledge graph only initializes when the Graph view is selected (dynamic import + `useEffect`)

---

## Sharing and SEO

### OpenGraph Metadata

```typescript
export const metadata: Metadata = {
  title: "Agentic Reasoning Research — Thoughtbox Session Explorer",
  description:
    "Browse 167 thoughts from a 90-minute AI research session. "
    + "See belief snapshots, decision frames, and a knowledge graph "
    + "built in real time by an AI agent.",
  openGraph: {
    title: "167 thoughts. One AI research session.",
    description:
      "Watch an AI agent reason through agentic reasoning research, "
      + "forming beliefs and building a knowledge graph.",
    type: "article",
    // OG image: static asset showing timeline + stats
    images: ["/og/session-explorer.png"],
  },
  twitter: {
    card: "summary_large_image",
  },
}
```

### OG Image

A static 1200x630 PNG generated once (not dynamically). Shows:
- Session title
- Key stats (167 thoughts, 90 min, 17 entities)
- A stylized timeline fragment
- Thoughtbox branding

Place at `public/og/session-explorer.png`.

### Deep Link Sharing

When a user shares `/explore/agentic-reasoning-research#thought-42`, the receiving visitor lands on the page, which scrolls to thought 42 and expands it. The OG metadata is the same regardless of fragment (fragments are not sent to the server).

---

## CTAs and Conversion

### Placement

| Location | CTA | Style |
|----------|-----|-------|
| Hero (top) | "Try Thoughtbox Free" | Primary button (`bg-foreground text-background`) |
| After Key Moments strip | "Get a Free Audit" | Secondary button, smaller |
| After every 50th thought in timeline | Inline banner: "This is thought 50 of 167. Imagine this for your agents." | Subtle, non-intrusive, `border-2 border-foreground/20` |
| Bottom section | "Try Thoughtbox Free" + "Get a Free Audit" | Full-width CTA block |

### Inline Timeline CTAs

At thought 50 and thought 100, insert a non-thought element into the timeline:

```
--------------------------------------------------
  THIS IS THOUGHT 50 OF 167.
  YOUR AGENTS REASON LIKE THIS TOO.
  YOU JUST CAN'T SEE IT.

  [TRY THOUGHTBOX FREE]
--------------------------------------------------
```

These are not filterable and always appear regardless of type filters.

---

## Future Sessions

The architecture supports multiple explorer sessions:

- Each session gets a slug, a JSON file in `src/data/sessions/`, and a `generateStaticParams` entry
- The route is already `[sessionSlug]`, so `/explore/gtm-strategy` works with no code changes
- Different sessions can have different `keyMoments` arrays
- The knowledge graph viewer works with any set of entities/relations

For now, there is exactly one session. The second session to add would be the GTM strategy session (a6c60112, 106 thoughts) once it completes.

---

## File Layout

```
src/
  app/(public)/explore/
    [sessionSlug]/
      page.tsx                    # Server Component, static params
  components/explorer/
    explorer-hero.tsx             # Server: title, stats, CTA
    key-moments-nav.tsx           # Client: horizontal chip strip
    explorer-timeline.tsx         # Client: timeline with expand/filter
    explorer-view-toggle.tsx      # Client: timeline/graph switch
    knowledge-graph-viewer.tsx    # Client: D3 force graph
    explorer-cta.tsx              # Server: bottom conversion block
    inline-cta.tsx                # Server: mid-timeline conversion nudge
  data/sessions/
    agentic-reasoning-research.json
scripts/
  export-session-for-explorer.ts
public/og/
  session-explorer.png
```

---

## Out of Scope

- Real-time / live sessions (this is static export only)
- Search within thoughts (the timeline filter chips are sufficient for a demo)
- Authenticated features (bookmarking, annotations)
- Multi-session comparison
- Session export/download by the visitor
- Auto-generating `keyMoments` (hand-curation is the point)
- Mobile graph interaction (the graph is view-only on mobile; timeline is the primary mobile experience)
