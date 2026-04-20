# Web App OTEL Query Fix

## Problem

`/w/[workspaceSlug]/runs/[runId]/page.tsx` queries `otel_events` with `.eq('session_id', runId)` — treating the Thoughtbox session UUID as the OTEL session ID. These are different values. OTEL events have `session_id` = Claude Code's session ID (e.g. `e6749f07`), not the Thoughtbox session UUID (e.g. `8a405981`). Result: OTEL events never load.

## Fix

In `src/app/w/[workspaceSlug]/runs/[runId]/page.tsx`, replace the OTEL queries (lines 44-56) with a two-step lookup through the `runs` binding table:

### Step 1: After fetching the session row (line 25-34), fetch the OTEL session IDs from the `runs` table:

```typescript
const { data: runRows } = await supabase
  .from('runs')
  .select('otel_session_id')
  .eq('session_id', runId)
  .not('otel_session_id', 'is', null)

const otelSessionIds = [...new Set(
  (runRows ?? []).map(r => r.otel_session_id).filter(Boolean)
)]
```

### Step 2: Replace the OTEL event queries to use the bound IDs:

```typescript
// Replace .eq('session_id', runId) with .in('session_id', otelSessionIds)
// Guard: if otelSessionIds is empty, skip the query entirely

const [thoughtsResult, otelResult, otelCountResult] = await Promise.all([
  supabase
    .from('thoughts')
    .select('*')
    .eq('session_id', runId)
    .order('thought_number', { ascending: true }),
  otelSessionIds.length > 0
    ? supabase
        .from('otel_events')
        .select('id, event_type, event_name, severity, timestamp_at, body, metric_value, event_attrs, session_id')
        .eq('workspace_id', sessionRow.workspace_id)
        .in('session_id', otelSessionIds)
        .order('timestamp_at', { ascending: true })
        .limit(OTEL_PAGE_LIMIT)
    : Promise.resolve({ data: [], error: null }),
  otelSessionIds.length > 0
    ? supabase
        .from('otel_events')
        .select('id', { count: 'exact', head: true })
        .eq('workspace_id', sessionRow.workspace_id)
        .in('session_id', otelSessionIds)
    : Promise.resolve({ count: 0, error: null }),
])
```

## What stays the same

- Thoughts query: unchanged, still `.eq('session_id', runId)` — thoughts are stored by Thoughtbox session ID
- All components: unchanged — `SessionTraceExplorer`, `SessionTimeline`, `ThoughtDetailPanel`, `mergeTimeline` all work already
- The rendering is built and waiting for data

## Verification

After applying, navigate to `/w/<workspace>/runs/8a405981-1830-4a15-96c5-ce09a865d344`. You should see:
- Thoughts: 5 reasoning thoughts
- OTEL events: ~946 events from Claude Code session `e6749f07`
- Merged timeline showing both interleaved by timestamp

## Database context

The `runs` table bridges Thoughtbox sessions to OTEL sessions:
- `runs.session_id` → Thoughtbox session UUID (FK to `sessions.id`)
- `runs.otel_session_id` → Claude Code OTEL session ID (matches `otel_events.session_id`)
- Multiple runs can share the same `otel_session_id` (reconnects)
