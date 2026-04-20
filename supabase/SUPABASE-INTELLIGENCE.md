Here's a summary of all the proposed changes across the codebase and storage layer from the "Supabase-Side Intelligence" session (run `72d9d8c3`, completed Apr 7, 2026, 3m 48s, 16 thoughts): [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=1)

***

## Core Architecture Decision

The session establishes a clear two-plane split: [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=3)

- **Cloud Run = Execution Plane** — MCP server (`thoughtbox_search`, `thoughtbox_execute`), Code Mode sandboxes, session management, protocol enforcement, and subscribing to Supabase Realtime for cross-instance coordination. Cloud Run is explicitly non-negotiable for this layer.
- **Supabase = Intelligence Plane** — everything that happens to data *after* it's stored. "The agent writes thoughts. Everything else happens automatically in Supabase."

***

## Codebase Changes

**New Edge Functions proposed:** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=2)
1. **Queue processors** — consume `pgmq` queues to run embedding generation, similarity search, contradiction detection, and evolution candidate detection on thoughts and knowledge entities
2. **WebSocket server** — bridges Supabase Realtime → agent channels, replacing the existing SSE + Redis approach entirely
3. **Lightweight MCP endpoint** — fast read layer inside Supabase for semantic search and knowledge queries (using `mcp-lite` + `StreamableHttpTransport`), running directly where the data lives with zero network hop to Postgres

**Trigger logic (SQL-side):** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=16)
- `thought INSERT` → enqueue to `thought_processing` queue
- `entity INSERT` → enqueue to `entity_processing` queue
- `session status → closed` → enqueue to `session_closing` queue
- Hub table changes → Realtime Postgres Changes broadcasts automatically (no code required)

**Cron jobs via `pg_cron`:** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=16)
- Every 5s: poll/process queue messages
- Nightly: session digest, knowledge graph health check
- Weekly: assumption decay verification, stale entity cleanup

***

## Storage Layer Changes

**New tables proposed:** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=16)

| Table | Purpose |
|---|---|
| `thoughts` | Existing, gains an `embedding` column (pgvector) |
| `knowledge_entities` | Gains an `embedding` column |
| `knowledge_observations` | Gains an `embedding` column |
| `sessions` + `session_analyses` | Session tracking and post-session analysis |
| `hub_agents` | Stores agent identity for stateless resolution (replaces per-session Map) |
| `hub_workspaces` | Hub workspace state |
| `hub_problems`, `hub_proposals`, `hub_consensus` | Hub collaboration state |
| `hub_channels`, `hub_messages` | Hub event messaging |
| `pending_evolutions` | Queued knowledge evolution candidates |
| `pending_contradictions` | Queued contradiction detections |
| `pending_verifications` | Queued assumption verifications |

**pgmq queues:** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=16)
- `thought_processing` — embeddings, similarity, contradiction, evolution checks
- `entity_processing` — embeddings, dedup detection, auto-relation creation
- `session_closing` — analysis, learning extraction, digest prep

**Vectors (pgvector + `gte-small`):** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=1)
- Built-in `gte-small` model generates embeddings at insert time inside Edge Functions — no external API call, no network hop
- HNSW indexes for fast ANN similarity search
- Hybrid search combining `tsvector` + `pgvector` for best retrieval quality
- Semantic knowledge graph traversal via vector similarity

**Realtime:** [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=16)
- Postgres Changes: automatic event broadcast on any table mutation (RLS-aware)
- Broadcast: workspace-scoped pub/sub event bus
- Presence: live agent state tracking (also solves hub identity without a per-session Map)

***

## What This Unblocks (The 4 Hub Deployment Blockers) [thoughtbox.kastalienresearch](https://thoughtbox.kastalienresearch.ai/w/mynameiscards-16bc/runs/72d9d8c3-64d8-4de6-afa4-0f8459d66d72?thought=15)

1. **No hub HTTP surface in deployed mode** → solved by SupabaseHubStorage; hub ops write to Postgres, events flow through Realtime
2. **Missing `SupabaseHubStorage`** → solved by implementing it with the 7 hub tables, same pattern as existing `SupabaseStorage`/`SupabaseKnowledgeStorage`, now also with semantic search on problems/proposals
3. **SSE fan-out/ordering across Cloud Run instances** → solved by Supabase Realtime replacing SSE entirely; no Redis, no in-memory client sets
4. **Session-scoped agent identity** → solved by `hub_agents` table; stateless resolution on every request