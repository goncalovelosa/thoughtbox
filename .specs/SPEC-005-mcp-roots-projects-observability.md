# SPEC-005: MCP Roots as Projects + Claude Code Observability Dashboard

## Problem Statement

Two related gaps in the Thoughtbox web app:

1. **Projects page was a stub.** The `/w/[slug]/projects` page showed a static empty state with no data. The `sessions.project` field (populated by the MCP server from the Claude Code root URI) was unused in the UI.

2. **No observability layer.** Claude Code emits rich telemetry via OpenTelemetry (cost, tokens, tool usage, model breakdown). Thoughtbox had no place in the web app to surface this data — neither the real-time metrics derivable from Supabase nor the OTel-gated metrics that require an external pipeline.

---

## Design Decisions

### MCP Roots → Projects

The MCP specification defines [Roots](https://modelcontextprotocol.io/specification/2025-11-25/client/roots) as a client primitive: when Claude Code connects to an MCP server, it exposes filesystem roots via `roots/list`. Each root has a `uri` (always a `file://` URI) and an optional `name`.

**Mapping rule**: `root.uri` → `sessions.project`. The Thoughtbox MCP server reads the first root at session creation time and stores its URI as the `project` column value. Therefore:

- `project = "file:///home/user/projects/my-app"` → display name = `my-app`
- `project = "my-app"` → display name = `my-app` (plain strings also handled)

Projects are **derived** from sessions, not a separate table. This avoids schema migration complexity and keeps the data model simple. A "project" exists as long as there are sessions referencing it.

**Project slug (URL)**: `encodeURIComponent(project)` → `/w/[slug]/projects/[projectSlug]`. Decoded server-side with `decodeURIComponent`.

### Observability Dashboard Strategy

Two tiers of data:

| Tier | Source | Available now |
|------|--------|---------------|
| **Session analytics** | Supabase `sessions` table | ✅ Yes |
| **Claude Code telemetry** | OTel → Prometheus/Loki | ❌ Requires OTel pipeline |

The dashboard (`/w/[slug]/observability`) shows both tiers:
- Real data where available (session counts, activity timeline, project breakdown, status distribution)
- Locked "OTel gate" panels for cost/token/model metrics with inline setup instructions

This is honest — users see what's available today and a clear path to unlock richer analytics.

---

## Feature A: Projects Page + Detail

### Routes

| Route | Description |
|-------|-------------|
| `/w/[slug]/projects` | Lists all distinct projects, sorted by last active |
| `/w/[slug]/projects/[projectSlug]` | Sessions filtered by project + MCP root context |

### Data Fetching

Both pages query `sessions` with `workspace_id` filter. Projects page fetches up to 500 sessions and groups by `project` in TypeScript (server component). Project detail page queries directly with `.eq('project', project)`.

### Display

Each project card shows:
- **Display name**: last path component of the root URI (e.g., `file:///home/user/projects/my-app` → `my-app`)
- **Subtitle**: full path (for root URIs) or raw project string
- **Run count**, **thought count**, **last active** timestamp
- Link to project detail → link to each run

Project detail additionally shows:
- Stats strip (total runs, thoughts, completed, active)
- Full session list with status badges (reusing existing `BADGE_BASE`/`STATUS_BADGE`)
- MCP Root context note explaining the `roots/list` connection

---

## Feature B: Observability Dashboard

### Route

`/w/[slug]/observability` — added to main nav in `WorkspaceSidebar` between Runs and API Keys.

### Dashboard Sections

#### 1. KPI Strip (real data)

4 stat cards computed from sessions in the last 30 days:

| Card | Source |
|------|--------|
| Total runs | `COUNT(sessions)` where `created_at >= now() - 30d` |
| Active | `COUNT(sessions)` where `status = 'active'` |
| Thoughts | `COUNT(thoughts)` all-time (separate query with `head: true`) |
| Projects | `COUNT(DISTINCT project)` from the 30d sessions |

#### 2. Sessions per Day (real data)

14-day vertical bar chart. CSS-only — each bar is a `div` with `height` set as a percentage of `maxDayCount` via inline style. Zero-count days render at 2px height with 15% opacity.

#### 3. Top Projects (real data)

Horizontal bar chart (top 6 projects by session count). Each row: project name (linked) | CSS bar | count. Bar width = `(count / maxCount) * 100%`.

#### 4. Status Breakdown (real data)

Stacked horizontal bar + legend. Colors: emerald (completed), blue (active), rose (abandoned). Percentages computed from counts.

#### 5. Claude Code Telemetry Gate (locked)

Section header with `Lock` icon and "Requires OTel" badge. Contains:
- 3 locked cards: "Cost by model", "Token usage", "Tool performance" — each with description, 15% opacity, mock greyed bars
- Setup code block with the 6 required env vars
- Link to official observability docs

### Sidebar Change

`ObservabilityIcon` (bar chart SVG) added to `WorkspaceSidebar.mainNavItems` at position 4 (after Runs, before API Keys).

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/w/[workspaceSlug]/projects/page.tsx` | Replaced empty state with real project data from sessions |
| `src/app/w/[workspaceSlug]/projects/[projectSlug]/page.tsx` | **New.** Project detail with filtered sessions + MCP root context |
| `src/app/w/[workspaceSlug]/observability/page.tsx` | **New.** Observability dashboard with 5 sections |
| `src/components/nav/workspace-sidebar.tsx` | Added `ObservabilityIcon` + "Observability" nav item |

---

## Non-Goals

- **New Supabase tables for OTel data.** Storing OTel events in Supabase requires either an OTel receiver endpoint or changes to the MCP server. Out of scope here — the OTel gate panels communicate this clearly.
- **Real-time updates.** The dashboard is server-rendered at request time, no polling.
- **OTel receiver implementation.** The backend pipeline (OTel Collector → storage → query API) is a separate initiative.
- **Project CRUD.** Projects are derived from sessions. Manual create/delete is not implemented.
- **Multi-root sessions.** If Claude Code exposes multiple roots, only the first is used as the project identifier (MCP server responsibility, not UI).

---

## Acceptance Criteria

### Projects

- [x] Projects page shows all distinct `project` values as rows, sorted by last active
- [x] Root URIs (`file://...`) display as the last path component; full path shown as subtitle
- [x] Clicking a project navigates to `/projects/[encodedSlug]`
- [x] Project detail page shows sessions filtered to that project with status badges
- [x] Project detail page includes MCP Root context note with the raw URI and `roots/list` reference
- [x] Empty state shown when workspace has no sessions

### Observability

- [x] KPI strip shows real counts derived from Supabase (last 30 days)
- [x] Sessions-per-day bar chart shows 14 days with correct relative heights
- [x] Top-projects bar chart shows up to 6 projects; bars proportional to session count; project names link to project detail
- [x] Status breakdown stacked bar + legend shows completed/active/abandoned breakdown
- [x] OTel gate section renders 3 locked cards at reduced opacity with mock bars
- [x] OTel setup code block contains all 6 required environment variables
- [x] "Observability" appears in `WorkspaceSidebar` main nav, active state works via `pathname.startsWith`
