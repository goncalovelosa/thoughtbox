# Runs UI Gap Analysis: Code Mode vs Web Interface

## The Experiment

I used Thoughtbox Code Mode to query the **47f71fb session** ("Agent Phenomenology: When Does the Tool Disappear?" — 150 thoughts, 2 branches) and compared what I could learn programmatically versus what a human sees clicking through the web UI.

## What Code Mode Can Do

| Query | What It Returns | Time |
|-------|----------------|------|
| `tb.session.analyze(id)` | Linearity (0.99), revision rate (0.01), density (5.87), branch count (2) | ~400ms |
| `tb.session.get(id)` + JS filter | Type distribution, confidence levels, all decisions with options, belief snapshots | ~500ms |
| Content keyword search | Thought numbers mentioning "ready-to-hand", "RECOMMENDATION", etc. across all 150 thoughts | ~600ms |
| Phase transition detection | Where thought types change — narrative arc of the session | ~600ms |
| `tb.session.search(query)` | Cross-session search by title, tags, and metadata | ~100ms |
| `tb.session.export(id, 'markdown')` | Full session as structured document | ~600ms |

An agent can answer "what were the 7 recommendations in this session?" in one call. A human must read all 150 thoughts sequentially.

## What the Web UI Offers

The current `/runs` route has two pages:

### Sessions Index (`runs/page.tsx`)
- Text search on session title and short ID
- Status filter dropdown (all / active / completed / abandoned)
- Table with columns: session name, status badge, thought count, start date

### Session Detail (`runs/[runId]/page.tsx`)
- **SessionTraceToolbar**: text search across thought preview text (truncated)
- **SessionTimeline**: flat list of ThoughtRow components with timeline rail showing branch lanes
- **ThoughtDetailPanel**: sticky panel showing full thought content with typed rendering (decision_frame options, belief snapshots, action reports, etc.)
- **Keyboard navigation**: arrow up/down to move between thoughts
- **Realtime**: live updates for active sessions via Supabase channels
- **Timestamp gaps**: visual breaks between thought clusters

### What's Good
The typed card rendering in ThoughtCard is genuinely better than reading JSON — decision_frames render as checkbox lists, belief_snapshots as entity state grids, assumption_updates as status transition arrows. The timeline rail visualizes branch structure. Real-time streaming is something Code Mode can't replicate.

### What's Missing
For a 150-thought session, the UI is a book with no index. No way to:
- Filter by thought type
- See session shape at a glance
- Search full thought content (only previews)
- Jump to decisions or specific metadata types
- Navigate by "phase" or chapter
- Export or share

## The Irony

The 47f71fb session is literally about tool usability — an agent evaluating whether Thoughtbox is "ready-to-hand" (disappears into use) or "present-at-hand" (you notice the tool itself). The session contains numbered RECOMMENDATIONS, structured decisions, and belief snapshots. But in the web UI, finding those recommendations requires scrolling through all 150 thoughts. The UI makes the session "present-at-hand" — you notice the interface instead of engaging with the content.

## Recommendations (Priority Order)

### P0: Thought Type Filter Chips
**In SessionTraceToolbar**, add toggle chips below the search input:

```
[All] [Reasoning 142] [Decision 5] [Belief 2] [Action 1]
```

- Multiple can be active (OR logic)
- Show count per type
- Implementation: add `typeFilter: Set<string>` state to `SessionTraceExplorer`, extend the `filteredRows` useMemo
- **Effort**: Small — data already exists in `displayType` on every thought row
- **Impact**: Transforms the experience. A user can instantly see "this 150-thought session had 5 decisions" and view only those.

### P0: Session Summary Card
**Between SessionDetailHeader and SessionTraceExplorer**, add a collapsible summary:

- Thought type breakdown (counts or small bar)
- Branch count, revision count, total duration
- Confidence distribution (if present)
- Tags as clickable chips
- Default expanded for sessions >20 thoughts
- **Effort**: Small — compute from `initialThoughts` in the server component
- **Impact**: Gives humans the "session shape at a glance" that `tb.session.analyze()` gives agents

### P1: Full-Text Search with Match Count
- Search complete `thought` content, not just `searchIndexText`
- Show "12 matches in 8 thoughts" indicator
- Highlight matches in ThoughtRow preview and ThoughtDetailPanel
- **Effort**: Medium — need to ensure `searchIndexText` includes full content, add highlighting logic

### P2: Phase/Chapter Navigation
- Detect consecutive runs of the same thought type or explicit progress markers
- Render as collapsible sections with labels
- The 47f71fb session naturally breaks into ~6 phases
- **Effort**: Medium — needs heuristic for phase detection

### P2: Tag-Based Cross-Session Navigation
- On sessions index, make tags clickable (filter sessions by tag)
- On session detail, show "Related sessions" by tag overlap
- **Effort**: Small — tags already stored, just need filter UI on index page

### P3: Decision Timeline View
- Dedicated view mode showing only decision_frames
- Connected by collapsed reasoning summaries between them
- "Executive summary" of a reasoning session
- **Effort**: Medium — new view component, but data is already structured

### P3: Export Button
- Markdown, JSON, or clipboard
- Can call the same endpoint as `tb.session.export()`
- **Effort**: Small — backend already exists

## Summary

The gap between Code Mode and the web UI is large but closable with two small changes: **type filters** and a **summary card**. These don't require new data — they surface metadata that's already captured on every thought. The remaining features (full-text search, phase navigation, decision timeline) add progressive depth for power users.

The design principle: **give humans the same queryability that Code Mode gives agents, expressed as visual controls instead of JavaScript.**
