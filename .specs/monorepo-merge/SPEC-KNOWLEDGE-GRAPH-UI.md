# SPEC: Knowledge Graph UI (Cytoscape.js)

**Status**: DRAFT — awaiting user's Composio-interview Cytoscape code for prior-art integration.
**Motivation**: per `INTEGRATION-MAP.md` §6.1, the knowledge graph is the largest under-claimed capability in the product — `entities`, `observations`, `relations` are real, queryable, populated, and invisible to every user who doesn't also write MCP code. Cytoscape.js is the right tool to surface it.
**Depends on**: monorepo merge landing (web app at `apps/web/`). This spec lives here because it's naturally part of that merge PR or the one immediately after.
**Docs verified**: 2026-04-20 via Context7 against `/cytoscape/cytoscape.js` and `/plotly/react-cytoscapejs`, plus fCoSE v2.2.0 release notes (iVis-at-Bilkent/cytoscape.js-fcose). Known Next.js integration caveat tracked in react-cytoscapejs issue #117 (2023); current fix is `next/dynamic` with `{ ssr: false }`.

## 1. Scope

### In scope

- A workspace-scoped knowledge graph page at `/w/[workspaceSlug]/knowledge`
- Interactive Cytoscape.js visualization of `entities` (nodes) and `relations` (edges)
- Node click → side panel with entity details (name, type, label, properties, observations)
- Filter controls: by entity type, by relation type, by text search, by created-after date
- Entity detail view showing linked `observations` with source session attribution
- Read-only — all creation/mutation continues via MCP

### Out of scope (for this spec)

- Node/edge creation or editing in the UI — keep the knowledge graph agent-authored
- Real-time updates via Supabase Realtime — can add later; initial version is snapshot-on-load
- Cross-workspace exploration — single-workspace view only
- Observations full-text search — can add via existing `content_tsv` GIN index later
- 3D layout, VR, anything fancy

## 2. Location in the monorepo

Assumes monorepo merge is done (web app at `apps/web/`):

```
apps/web/src/app/w/[workspaceSlug]/knowledge/
├── page.tsx                    # server component: initial load
├── loading.tsx                 # skeleton
├── components/
│   ├── KnowledgeGraph.tsx      # 'use client', wraps react-cytoscapejs
│   ├── EntityDetailPanel.tsx   # side panel on node click
│   ├── GraphFilters.tsx        # type/text filters
│   └── GraphStyles.ts          # Cytoscape stylesheet
└── lib/
    ├── toCytoscapeElements.ts  # DB rows → Cytoscape elements format
    └── graphQueries.ts         # Supabase queries (workspace-scoped)
```

## 3. Data flow

```
Supabase (entities, relations, observations)
        ↓ RLS-scoped SELECT from Server Component
page.tsx → loads initial snapshot (capped N nodes)
        ↓ passes as props
KnowledgeGraph.tsx (client)
        ↓ toCytoscapeElements()
Cytoscape.js render + layout (fcose)
        ↓ on node click
EntityDetailPanel ← fetches observations + out-relations
```

### 3.1 Server-side query (on page load)

```ts
// lib/graphQueries.ts
export async function loadWorkspaceGraph(supabase, workspaceId, opts) {
  const { maxNodes = 200, entityTypes, createdAfter } = opts ?? {};

  let entitiesQ = supabase
    .from('entities')
    .select('id, name, type, label, properties, created_at, importance_score')
    .eq('workspace_id', workspaceId)
    .order('importance_score', { ascending: false, nullsLast: true })
    .limit(maxNodes);

  if (entityTypes?.length) entitiesQ = entitiesQ.in('type', entityTypes);
  if (createdAfter) entitiesQ = entitiesQ.gte('created_at', createdAfter);

  const { data: entities, error: eErr } = await entitiesQ;
  if (eErr) throw eErr;

  const ids = entities.map((e) => e.id);
  const { data: relations, error: rErr } = await supabase
    .from('relations')
    .select('id, from_id, to_id, type, properties, created_at')
    .eq('workspace_id', workspaceId)
    .in('from_id', ids)
    .in('to_id', ids);
  if (rErr) throw rErr;

  return { entities, relations };
}
```

### 3.2 `toCytoscapeElements` — DB shape → Cytoscape elements

```ts
export function toCytoscapeElements({ entities, relations }) {
  const nodes = entities.map((e) => ({
    data: {
      id: e.id,
      label: e.label ?? e.name,
      name: e.name,
      type: e.type,             // Insight | Concept | Workflow | Decision | Agent
      importance: e.importance_score ?? 0,
      // properties kept on data for filtering, but not rendered directly
    },
    classes: `entity-${e.type.toLowerCase()}`,
  }));

  const edges = relations.map((r) => ({
    data: {
      id: r.id,
      source: r.from_id,
      target: r.to_id,
      type: r.type,             // RELATES_TO | BUILDS_ON | CONTRADICTS | ...
    },
    classes: `relation-${r.type.toLowerCase()}`,
  }));

  return [...nodes, ...edges];
}
```

## 4. Cytoscape configuration

### 4.1 Library choice

- **`cytoscape`** — core library. Pin the latest stable; no breaking changes expected in our surface.
- **`react-cytoscapejs`** — thin React wrapper from Plotly. Callback-ref pattern via `cy` prop (confirmed in current README, 2026-04-20). Accepts `elements` as a flat array (nodes + edges interleaved), `stylesheet`, `layout`, `style`, and standard viewport props.
- **`cytoscape-fcose`** v2.2.0 (Jan 2023, current) — force-directed with compound-node support. Includes `fixedNodeConstraint`, `alignmentConstraint`, `relativePlacementConstraint` (from v2.0), plus `tilingBySort` (v2.2) for ordered tiling of disconnected components. Registered via `cytoscape.use(fcose)` at module scope in a `'use client'` file.
- **Dynamic import pattern (Next.js App Router)**: the page itself is a Server Component that fetches data, but the graph component MUST be `'use client'`. Two equivalent options:
  1. Put `'use client'` at the top of `KnowledgeGraph.tsx` and import normally from the page. Next.js handles the client boundary.
  2. Use `next/dynamic` with `{ ssr: false }` to defer loading until hydration. Useful if the bundle size matters or if you want a loading skeleton: `const KnowledgeGraph = dynamic(() => import('./KnowledgeGraph'), { ssr: false, loading: () => <Skeleton /> });`
- **Known Next.js caveat** (react-cytoscapejs #117, 2023, open): microbundle compile error on certain configurations. Workaround in practice: the `next/dynamic` + `ssr: false` pattern avoids the SSR path entirely. If issues surface in Next.js 15 + Turbopack, fall back to webpack (`next dev` without `--turbo`) for local dev.

### 4.2 Layout: `fcose`

```ts
// Valid options verified against iVis-at-Bilkent/cytoscape.js-fcose README (v2.2.0)
const layout = {
  name: 'fcose',
  quality: 'default',           // 'draft' | 'default' | 'proof'. Use 'draft' for >500 nodes.
  animate: false,               // avoid layout animation on first render; set true for interactive relayout
  randomize: false,             // stable across reloads for a fixed graph
  fit: true,                    // center + zoom to fit on first layout
  padding: 30,
  nodeSeparation: 100,
  idealEdgeLength: 150,
  nodeRepulsion: 8000,
  edgeElasticity: 0.45,         // v2.0+ — can be a per-edge function for type-specific elasticity
  gravity: 0.25,
  gravityRange: 3.8,
  tilingBySort: true,           // v2.2+ — keeps disconnected components predictable across reloads
  uniformNodeDimensions: false, // set true only if all nodes share identical size (faster)
  packComponents: true,         // pack disconnected subgraphs using the layout-utilities helper
};
```

For future work: `alignmentConstraint` can pin all `Agent` nodes to the same horizontal line (organizational feel), and `relativePlacementConstraint` can ensure `Insight` nodes sit to the right of `Decision` nodes. Out of scope for v1 — default layout is sufficient.

### 4.3 Node styling — map entity types to visuals

Thoughtbox entity types: `Insight`, `Concept`, `Workflow`, `Decision`, `Agent`.

| Entity type | Shape | Stroke | Fill | Rationale |
|---|---|---|---|---|
| `Insight` | `ellipse` | tbd | soft blue | distilled observation |
| `Concept` | `round-rectangle` | tbd | soft green | named idea |
| `Workflow` | `hexagon` | tbd | amber | procedural / runnable |
| `Decision` | `diamond` | tbd | pink / magenta | branch point |
| `Agent` | `pentagon` | tbd | purple | actor identity |

Node size scales with `importance_score` (clamped to `[30, 120]` px).

### 4.4 Edge styling — map relation types

Thoughtbox relation types: `RELATES_TO`, `BUILDS_ON`, `CONTRADICTS`, `EXTRACTED_FROM`, `APPLIED_IN`, `LEARNED_BY`, `DEPENDS_ON`, `SUPERSEDES`, `MERGED_FROM`.

| Relation type | Line | Arrow | Color | Meaning |
|---|---|---|---|---|
| `RELATES_TO` | solid | small triangle | neutral gray | generic association |
| `BUILDS_ON` | solid | triangle | green | constructive |
| `CONTRADICTS` | dashed | x / crossed | red | opposition |
| `EXTRACTED_FROM` | dotted | triangle | cyan | provenance |
| `APPLIED_IN` | solid | triangle | orange | application |
| `LEARNED_BY` | dotted | triangle | purple | agent learning |
| `DEPENDS_ON` | solid | filled triangle | amber | dependency |
| `SUPERSEDES` | solid | filled triangle | teal (darker) | replaces |
| `MERGED_FROM` | solid | diamond | indigo | merge lineage |

### 4.5 Stylesheet — skeleton

```ts
// GraphStyles.ts
export const cytoscapeStylesheet = [
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'font-size': '11px',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '120px',
      'width': 'mapData(importance, 0, 1, 30, 120)',
      'height': 'mapData(importance, 0, 1, 30, 120)',
      'border-width': 2,
      'border-color': '#111',
    },
  },
  { selector: '.entity-insight',  style: { 'shape': 'ellipse',         'background-color': '#93c5fd' } },
  { selector: '.entity-concept',  style: { 'shape': 'round-rectangle', 'background-color': '#86efac' } },
  { selector: '.entity-workflow', style: { 'shape': 'hexagon',         'background-color': '#fcd34d' } },
  { selector: '.entity-decision', style: { 'shape': 'diamond',         'background-color': '#f9a8d4' } },
  { selector: '.entity-agent',    style: { 'shape': 'pentagon',        'background-color': '#c4b5fd' } },

  {
    selector: 'edge',
    style: {
      'width': 2,
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'label': 'data(type)',
      'font-size': '9px',
      'text-background-color': '#fff',
      'text-background-opacity': 0.9,
      'text-background-padding': '2px',
    },
  },
  { selector: '.relation-contradicts',  style: { 'line-color': '#dc2626', 'target-arrow-color': '#dc2626', 'line-style': 'dashed' } },
  { selector: '.relation-builds_on',    style: { 'line-color': '#16a34a', 'target-arrow-color': '#16a34a' } },
  { selector: '.relation-extracted_from', style: { 'line-color': '#0891b2', 'target-arrow-color': '#0891b2', 'line-style': 'dotted' } },
  { selector: '.relation-depends_on',   style: { 'line-color': '#d97706', 'target-arrow-color': '#d97706' } },
  { selector: '.relation-supersedes',   style: { 'line-color': '#0d9488', 'target-arrow-color': '#0d9488' } },
  // ...fill in remaining relation types
  { selector: 'node:selected', style: { 'border-color': '#f59e0b', 'border-width': 4 } },
  { selector: 'edge:selected', style: { 'width': 4 } },
];
```

### 4.6 Skeleton component

```tsx
// components/KnowledgeGraph.tsx
'use client';

import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { useEffect, useRef } from 'react';
import { cytoscapeStylesheet } from './GraphStyles';

// Register layout once at module scope (cytoscape.use is idempotent).
cytoscape.use(fcose);

export function KnowledgeGraph({ elements, onNodeClick }) {
  const cyRef = useRef(null);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const onTap = (evt) => onNodeClick(evt.target.data('id'));
    cy.on('tap', 'node', onTap);

    return () => {
      cy.off('tap', 'node', onTap);
      // IMPORTANT: don't call cy.destroy() here. react-cytoscapejs owns lifecycle;
      // destroying manually double-disposes on remount and throws.
    };
  }, [onNodeClick]);

  return (
    <CytoscapeComponent
      cy={(cy) => {
        cyRef.current = cy;
      }}
      elements={elements}
      stylesheet={cytoscapeStylesheet}
      layout={{
        name: 'fcose',
        quality: elements.length > 500 ? 'draft' : 'default',
        animate: false,
        randomize: false,
        fit: true,
        padding: 30,
        tilingBySort: true,
        packComponents: true,
      }}
      style={{ width: '100%', height: '100%' }}
      minZoom={0.2}
      maxZoom={3}
      wheelSensitivity={0.2}
      // Performance flags (see §4.7)
      hideEdgesOnViewport={elements.length > 500}
      textureOnViewport={elements.length > 1000}
      motionBlur={false}
    />
  );
}
```

### 4.7 Performance tuning (verified Cytoscape.js core init options)

For large graphs (approaching 500-1000 nodes), these core options dramatically reduce render cost:

- `hideEdgesOnViewport: true` — hide edges during pan/zoom; redraw after viewport settles. Free FPS on high-degree graphs.
- `textureOnViewport: true` — render a static texture during viewport interaction. Biggest gain above 1000 nodes.
- `motionBlur: false` — disable unless you want cinematic pans. Costs measurable frame time.
- `pixelRatio: 'auto'` — honors DPR; set to `1` on very dense graphs to halve fill cost.
- `minZoom: 0.2`, `maxZoom: 3` — bounded zoom prevents fcose from needing extreme layout recomputes.
- For the layout itself: use `quality: 'draft'` above 500 nodes; only switch to `'proof'` for final exports or screenshots.

A node-count-driven preset is baked into the skeleton above: `fcose` draft quality + `hideEdgesOnViewport` + `textureOnViewport` kick in automatically past thresholds.

## 5. Detail panel — on node selection

Fetched lazily on click, not part of initial load:

```ts
// graphQueries.ts
export async function loadEntityDetail(supabase, entityId) {
  const { data: entity } = await supabase
    .from('entities')
    .select('*')
    .eq('id', entityId)
    .single();

  const { data: observations } = await supabase
    .from('observations')
    .select('id, content, added_at, added_by, source_session')
    .eq('entity_id', entityId)
    .order('added_at', { ascending: false })
    .limit(50);

  const { data: outRelations } = await supabase
    .from('relations')
    .select('id, type, to_id, properties, created_at')
    .eq('from_id', entityId);

  const { data: inRelations } = await supabase
    .from('relations')
    .select('id, type, from_id, properties, created_at')
    .eq('to_id', entityId);

  return { entity, observations, outRelations, inRelations };
}
```

The side panel displays:

- Entity header (name, type badge, label)
- Properties as a key/value table (pretty-printed JSON for nested values)
- Observations list — each showing `content`, `added_by`, `added_at`, and if `source_session` is present, a link to `/w/[slug]/sessions/[sessionId]`
- "Relations out" and "Relations in" — each shows the relation type and links to the connected entity (clicking re-centers the graph on that entity)

## 6. Filter controls

Top bar above the graph:

- Entity type multi-select checkboxes (5 types)
- Relation type multi-select checkboxes (9 types)
- Text search on entity `label` / `name` (client-side filter of the loaded graph; server-side only if user expands beyond `maxNodes`)
- Created-after date picker (default: all time; options: 7d, 30d, 90d, all)
- "Expand" button — increases `maxNodes` cap in 100-node increments; re-queries server

When filters change: re-run `toCytoscapeElements` with the filtered set and call `cy.layout({ name: 'fcose' }).run()` to relayout.

## 7. Performance notes

- **Initial cap at 200 nodes.** Cytoscape with fcose handles 1000+ nodes, but UX degrades above ~300 without clustering. Start tight, let users expand.
- **Edges follow nodes.** Always query edges scoped to the loaded node set (`.in('from_id', ids).in('to_id', ids)`) to avoid fetching stubs that point at non-visible nodes.
- **Lazy detail.** Observations and in/out relations are only fetched for the selected entity, not bulk-loaded.
- **Layout on demand.** Don't rerun fcose on every filter change; rerun only when the node set materially changes.
- **Realtime later.** When ready, subscribe to `entities` / `relations` inserts on the workspace and append to the current graph without reflowing from scratch.

## 8. Docs alignment

- The existing `/docs/knowledge-graph` page currently describes the MCP API but has no product-side screenshot or demo. After shipping this UI, add a screenshot and a "Visit your graph" callout linking to `/w/[slug]/knowledge`.
- Add a new `/docs/observability-knowledge-graph` page or similar that explains how to read the graph — what node shapes mean, what arrows mean, how to find related entities, how to navigate via observations.

## 9. Open questions / user input needed

1. **User's Composio-interview Cytoscape code**: integrate their prior work for styling + interaction patterns.
2. **Node label strategy**: use `label` field verbatim, or truncate long labels? Current spec uses `label ?? name` with CSS `text-max-width`.
3. **Observation surfacing**: inline in node tooltip, or always side panel? Current spec says side panel only.
4. **Relation label visibility**: always show relation type on edges, or only on hover? Current spec always-shows — may be cluttered on dense graphs. Easy toggle in stylesheet.
5. **Clustering at higher node counts**: when the user clicks "Expand" past 500 nodes, fall back to type-based clustering (collapse all Insights into a cluster node) vs. honest full graph? Defer decision until we see real graph sizes.
6. **Workspace-graph page vs. thoughtbox-global-graph page**: the spec scopes everything to `/w/[slug]/knowledge`. Global cross-workspace exploration is out of scope but could be a future "community graph" surface.

## 10. Implementation sequence

1. **Branch**: `feat/web-knowledge-graph`
2. **Dependencies**: add `cytoscape`, `react-cytoscapejs`, `cytoscape-fcose` to `apps/web/package.json`
3. **Data layer**: `graphQueries.ts` + `toCytoscapeElements.ts` + smoke test against hosted Supabase with a known workspace_id
4. **Component**: `KnowledgeGraph.tsx` with minimal styling + default layout
5. **Page**: `page.tsx` (Server Component) that loads the initial graph and passes elements to the client component
6. **Detail panel**: `EntityDetailPanel.tsx` fired by node click
7. **Filters**: `GraphFilters.tsx` — iterate on UX
8. **Styling**: iterate on `GraphStyles.ts` per the tables in §4
9. **Docs update**: screenshot + link in `/docs/knowledge-graph`
10. **PR**: reviewable in one pass; expected size ~600-900 lines across ~8 files

## 11. Non-blockers for monorepo merge

This spec should NOT block the monorepo merge PR. Land the merge first, then do this as a clean follow-up PR. The benefit of waiting: the web app code is already on the right paths in the monorepo, CI is already configured, CODEOWNERS are in place — the knowledge-graph PR is pure feature work.

---

**Sources (verified 2026-04-20)**:
- `INTEGRATION-MAP.md` §6.1 (gap) and §2.2 knowledge graph tables
- `tb.knowledge.*` MCP schema from server `src/knowledge/tool.ts`
- Cytoscape.js core init + events + stylesheet — Context7 library `/cytoscape/cytoscape.js` (612 snippets, source reputation High, benchmark 85.85)
- react-cytoscapejs API — Context7 library `/plotly/react-cytoscapejs` (confirmed `cy` callback + `elements` + `layout` props, `Cytoscape.use(plugin)` registration)
- cytoscape-fcose options + version — iVis-at-Bilkent/cytoscape.js-fcose v2.2.0 release notes (Jan 2023; `tilingBySort`, `fixedNodeConstraint`, `alignmentConstraint`, `relativePlacementConstraint` confirmed)
- Next.js 15 App Router client-boundary patterns — nextjs.org docs + 2026 Server Components guides for `next/dynamic` + `ssr: false`
- Known Next.js caveat: react-cytoscapejs issue #117 (2023, open) — resolved in practice via dynamic import
- User's Composio dep-graph take-home (`dep-graph/` in repo root) — ported patterns in §12

---

## 12. Ported patterns from the Composio dep-graph take-home

Reviewed `dep-graph/` at repo root. Plain Cytoscape.js (no React wrapper), generated-HTML deployment, but the interaction patterns, data model, and aesthetic all translate cleanly into the React/Next.js version. Patterns below are directly usable; the only major adaptation is that we build the equivalent in React instead of string-concat HTML.

### 12.1 Translation table

| Composio pattern | Thoughtbox equivalent | Adopt? |
|---|---|---|
| `tool` node (dark `round-rectangle`) | `Agent` + `Workflow` entities (actor / runnable roles) | ✓ — reuse the dark round-rectangle shape for agents |
| `resource` node (blue `ellipse`, bold label) | `Insight` + `Concept` entities (noun-ish roles) | ✓ — keep the blue-ellipse treatment for concepts |
| `requires` edge (orange) | `DEPENDS_ON` relation | ✓ — direct color port, warm = needs-input |
| `produces` edge (teal) | `EXTRACTED_FROM`, `BUILDS_ON` (constructive) | ✓ — teal for provenance/construction |
| `zero-producers` red border (resource with no way to get it) | **Orphan entity** — an entity with no incoming provenance relations (`EXTRACTED_FROM`, `BUILDS_ON`, `LEARNED_BY`) | ✓ **This is load-bearing** — directly surfaces "where did this come from?" drift |
| `confidence: high / medium / low` on edges, low hidden by default | `importance_score` on entities, low-importance hidden by default (toggle in filter bar) | ✓ — same UX, different data column |
| `evidence: string[]` attached to edges | `observations` table (per-entity, contains source_session + added_by) | ✓ — click an edge or node, see the observations that justify it |
| Search + 1-hop neighborhood expansion | Same — focus view when search is non-empty | ✓ verbatim |
| Overview mode with auto-tuned threshold (target 80–200 tool nodes) | Overview mode on entities with ≥N relations (auto-tune to same 80–200 node target) | ✓ verbatim |
| Three-column layout (320px / 1fr / 320px, stacked below 1180px) | Same — filters left, graph center, selection details right | ✓ |
| `overlay-opacity: 0.15` + `overlay-color` selection (not thick border) | Same | ✓ — my spec §4.5 used thick border; change to overlay |
| `cose` layout with per-type repulsion function | `fcose` with the same pattern (v2.0+ supports per-node repulsion) | ✓ |
| `nodeDimensionsIncludeLabels: true` | Same (CRITICAL — prevents label overflow ruining layout) | ✓ — was missing in §4.2, adding |
| Generated static HTML + inline Cytoscape bundle | React component in Next.js client bundle | ✗ — replaced with proper React/ESM |

### 12.2 Styling: port the Composio palette

The take-home's palette is distinctive and warm — a good fit for a differentiated product aesthetic vs the default-blue of every other graph viz. Keeping as a starting point (final palette subject to brand pass).

```css
:root {
  --bg: #f6f3ee;
  --panel: #fffdfa;
  --ink: #201812;
  --muted: #6d6258;
  --line: #d8cec2;
  --accent: #e7ded1;

  /* Node types */
  --type-insight: #93c5fd;
  --type-concept: #86efac;
  --type-workflow: #fcd34d;
  --type-decision: #f9a8d4;
  --type-agent: #2d3748;

  /* Relation types — same semantic color language as Composio */
  --rel-depends-on: #d35400;     /* orange — was 'requires' */
  --rel-builds-on: #16a34a;
  --rel-extracted-from: #0f766e; /* teal — was 'produces' */
  --rel-applied-in: #d97706;
  --rel-contradicts: #dc2626;
  --rel-supersedes: #0d9488;
  --rel-relates-to: #6d6258;
  --rel-learned-by: #c4b5fd;
  --rel-merged-from: #4338ca;

  --orphan: #b91c1c;
}
```

### 12.3 Revised node + edge styling — data-attribute selectors

Replaces the class-based selectors from §4.5. `node[type = "Insight"]` reads better than `.entity-insight`, and it means you don't have to compute class strings in `toCytoscapeElements`.

```ts
export const cytoscapeStylesheet = [
  {
    selector: 'node',
    style: {
      'label': 'data(label)',
      'font-size': '11px',
      'text-valign': 'center',
      'text-halign': 'center',
      'text-wrap': 'wrap',
      'text-max-width': '140px',
      'width': 'mapData(importance, 0, 1, 36, 120)',
      'height': 'mapData(importance, 0, 1, 36, 120)',
      'border-width': 2,
      'border-color': '#201812',
      'padding': 10,
    },
  },
  { selector: 'node[type = "Insight"]',  style: { 'shape': 'ellipse',         'background-color': '#93c5fd'  } },
  { selector: 'node[type = "Concept"]',  style: { 'shape': 'round-rectangle', 'background-color': '#86efac'  } },
  { selector: 'node[type = "Workflow"]', style: { 'shape': 'hexagon',         'background-color': '#fcd34d' } },
  { selector: 'node[type = "Decision"]', style: { 'shape': 'diamond',         'background-color': '#f9a8d4' } },
  { selector: 'node[type = "Agent"]',    style: { 'shape': 'pentagon',        'background-color': '#2d3748', 'color': '#fff' } },

  // Orphan highlight
  { selector: 'node[isOrphan = "true"]', style: { 'border-width': 3, 'border-color': '#b91c1c' } },

  {
    selector: 'edge',
    style: {
      'width': 1.5,
      'curve-style': 'bezier',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.9,
      'label': 'data(type)',
      'font-size': '9px',
      'text-background-color': '#fffdfa',
      'text-background-opacity': 0.9,
      'text-background-padding': '2px',
      'line-opacity': 0.55,
    },
  },
  { selector: 'edge[type = "DEPENDS_ON"]',     style: { 'line-color': '#d35400', 'target-arrow-color': '#d35400' } },
  { selector: 'edge[type = "BUILDS_ON"]',      style: { 'line-color': '#16a34a', 'target-arrow-color': '#16a34a' } },
  { selector: 'edge[type = "EXTRACTED_FROM"]', style: { 'line-color': '#0f766e', 'target-arrow-color': '#0f766e', 'line-style': 'dotted' } },
  { selector: 'edge[type = "APPLIED_IN"]',     style: { 'line-color': '#d97706', 'target-arrow-color': '#d97706' } },
  { selector: 'edge[type = "CONTRADICTS"]',    style: { 'line-color': '#dc2626', 'target-arrow-color': '#dc2626', 'line-style': 'dashed' } },
  { selector: 'edge[type = "SUPERSEDES"]',     style: { 'line-color': '#0d9488', 'target-arrow-color': '#0d9488' } },
  { selector: 'edge[type = "RELATES_TO"]',     style: { 'line-color': '#6d6258', 'target-arrow-color': '#6d6258', 'line-style': 'dotted' } },
  { selector: 'edge[type = "LEARNED_BY"]',     style: { 'line-color': '#c4b5fd', 'target-arrow-color': '#c4b5fd', 'line-style': 'dotted' } },
  { selector: 'edge[type = "MERGED_FROM"]',    style: { 'line-color': '#4338ca', 'target-arrow-color': '#4338ca' } },

  // Overlay selection (Composio pattern — not a heavy border)
  { selector: ':selected', style: { 'overlay-opacity': 0.15, 'overlay-color': '#111827' } },
];
```

### 12.4 Per-type layout tuning (Composio `cose` → Thoughtbox `fcose`)

```ts
const layout = {
  name: 'fcose',
  quality: elements.length > 500 ? 'draft' : 'default',
  animate: false,
  randomize: false,
  fit: true,
  padding: 40,
  nodeSeparation: 100,
  idealEdgeLength: 150,
  nodeRepulsion: (node) => {
    const t = node.data('type');
    if (t === 'Decision') return 10000; // decisions are pivotal — spread them
    if (t === 'Agent') return 4000;     // agents cluster tighter
    return 6000;
  },
  edgeElasticity: (edge) => {
    const t = edge.data('type');
    if (t === 'CONTRADICTS') return 0.15;                       // tight — opposition close
    if (t === 'BUILDS_ON' || t === 'EXTRACTED_FROM') return 0.45; // looser — provenance chains
    return 0.3;
  },
  gravity: 0.3,
  tilingBySort: true,
  packComponents: true,
  nodeDimensionsIncludeLabels: true, // CRITICAL — prevents label clipping/overlap
  uniformNodeDimensions: false,
};
```

### 12.5 Search + neighborhood mode (direct port)

Two modes driven by search-box state:

- **Overview mode** (empty search): auto-tune a visibility threshold so 80–200 nodes are shown. In Thoughtbox, threshold is on `importance_score` (fallback: in-degree + out-degree).
- **Focus mode** (non-empty search): show matching nodes + 1-hop neighborhood. Matches on `label`, `name`, and (future) `observations.content_tsv`.

Threshold auto-tune pseudocode:

```ts
function autoTuneImportanceThreshold(entities, { target = 150 } = {}) {
  const byImportance = [...entities].sort(
    (a, b) => (b.importance_score ?? 0) - (a.importance_score ?? 0)
  );
  const top = byImportance.slice(0, target);
  return top.length === 0 ? 0 : (top.at(-1).importance_score ?? 0);
}
```

### 12.6 Evidence trail on click — surface `observations`

Composio attaches `evidence: string[]` to every edge and shows it in the selection panel on click. Thoughtbox's equivalent is richer and already exists: the `observations` table. Every entity has observations (content + added_by + added_at + source_session). Port:

- **Click an entity** → panel shows entity header + its observations, ordered by `added_at DESC`, with `source_session` linking to `/w/[slug]/sessions/[sessionId]`.
- **Click a relation** → panel shows both endpoints and any observations on either entity mentioning the relation type (simple `ilike` on `content` for v1; exact if we add a `relation_observations` table later).

Directly addresses "where did this insight come from?" — the most frequent question when browsing any knowledge graph.

### 12.7 Filter bar — confidence → importance + type

Final filter bar:

- Search input (matches `label`, `name`, `observations.content`)
- Entity-type checkboxes (Insight / Concept / Workflow / Decision / Agent, all on by default)
- Relation-type checkboxes (9 types, all on by default)
- Importance checkboxes (high / medium / low — quantile buckets on `importance_score`, low off by default)
- Created-after date picker (7d / 30d / 90d / all)
- Orphan-only toggle — show only entities with no incoming provenance relations (diagnostic mode)
- "Expand" button — increases node cap in 100-node increments; re-queries server

### 12.8 Three-column layout

Port verbatim from Composio: `grid-template-columns: 320px 1fr 320px`, collapses to `1fr` below 1180px. Next.js + Tailwind implementation trivial.

### 12.9 What NOT to port

- **Plain HTML generation / inline Cytoscape bundle.** We want a real React component in the Next.js app so it participates in client-side navigation, Suspense, and the app styling system. Composio approach was correct for a take-home (zero setup); not right for a shipped product.
- **`cose` layout.** `fcose` is strictly better. Port the tuning knobs, not the layout name.
- **Toolkit multi-select.** No equivalent dimension in Thoughtbox.
- **Confidence-on-edges model.** Thoughtbox relations don't carry a confidence field yet. If added later, the filter pattern is ready.

### 12.10 Deltas from §§1–11 (applied via §12 overrides)

- **§3.2 toCytoscapeElements**: drop class-string generation; put `type` on `data`.
- **§4.2 layout**: add `nodeDimensionsIncludeLabels: true`, per-type `nodeRepulsion` / `edgeElasticity` functions, `tilingBySort`, `packComponents`.
- **§4.3 node styling**: Agent type goes dark slate (Composio tool-node color), not purple. Purple moves to `LEARNED_BY` edges.
- **§4.5 stylesheet**: all selectors move from class-based to `[attribute = "value"]` form. Selected state switches to overlay.
- **§5 detail panel**: observations are the centerpiece of the selection view, not an aside.
- **§6 filters**: add importance quantile toggle + orphan-only mode; remove workspace multi-select (redundant).
- **New: orphan detection.** Compute in `toCytoscapeElements`: for each entity, check if any relation in the loaded set has `to_id === entity.id AND type IN ('EXTRACTED_FROM','BUILDS_ON','LEARNED_BY')`. If not, set `data.isOrphan = "true"`. Makes missing provenance visible at a glance.

### 12.11 Credit + dataset

Direct port of interaction patterns, layout tuning, and aesthetic choices from the user's Composio dep-graph take-home (`dep-graph/` in repo root). Two adjacent benefits:

1. **Ground-truth JSON** — `dep-graph/specs/ground-truth.json` is a good stress-test dataset for early Thoughtbox graph-viz prototypes if the user's own knowledge graph is still sparse.
2. **The `artifacts/graph/viewer.html` (if generated)** — can be eyeballed side-by-side with the Thoughtbox port to check the ports are faithful.
