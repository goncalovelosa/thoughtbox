# Thought processing worker (prototype)

Isolated prototype for draining the Supabase **pgmq** queue `thought_processing`, aligned with the repo’s **Cloud Run execution plane** and **Supabase intelligence plane** split (`CLAUDE.md`, `supabase/SUPABASE-INTELLIGENCE.md`).

This package is **not** wired into the root `@kastalien-research/thoughtbox` build.

## References

| Artifact | Role |
|----------|------|
| `supabase/migrations/20260408033928_add_hub_tables_vectors_pgmq_realtime.sql` | Creates `thought_processing` queue, `AFTER INSERT` trigger on `thoughts`, `vector(384)` + HNSW on `thoughts`, Realtime publication including `thoughts`. |
| `.specs/hub-deployed/SCOPE-LAYER-2-SUPABASE-HUB-STORAGE.md` | Hub tables + `SupabaseHubStorage`; **explicitly excludes** Edge queue processors — workers belong next to or behind the execution plane, not as a second MCP surface. |
| Dual-backend (`THOUGHTBOX_STORAGE`) | **FileSystemStorage** (local/self-hosted) does not use this Postgres queue. **SupabaseStorage** paths that persist `thoughts` to Supabase do; run this worker only when the database is the source of truth for thoughts. |

## Code layout

```
src/
  index.ts              # Poll loop, poison handling, orchestration
  config.ts             # env
  db/
    pool.ts             # node-postgres pool (DATABASE_URL)
    pgmq.ts             # pgmq_public.read / archive / delete
    supabase.ts         # service-role Supabase client (REST)
  pipeline/
    embed.ts            # stub 384-d vectors + optional Xenova path
    embed-xenova.ts     # optional @xenova/transformers (not installed by default)
    intel.ts            # UPDATE embedding, ANN neighbors, evolution/contradiction hints
  realtime/
    monitor.ts          # optional postgres_changes subscription on thoughts
  http/
    health.ts           # GET /health for Cloud Run
```

### Queue contract

Trigger payload (from migration):

```json
{ "thought_id": "<uuid>", "action": "process" }
```

### Why `pg` + `DATABASE_URL`?

PostgREST exposes `public` RPCs by default. `pgmq_public.read` / `archive` / `delete` live outside `public` (see `20260320191032_remote_schema.sql`). A worker typically uses the **direct Postgres connection string** (pooler or session mode) for queue I/O, and `@supabase/supabase-js` for row reads and Realtime.

Alternative: thin `SECURITY DEFINER` wrappers in `public` that delegate to `pgmq_public.*` if you want a single client.

### Realtime

Updating `thoughts.embedding` (or any column) emits **Postgres Changes** to subscribers because `thoughts` is in `supabase_realtime` (migration §7). This worker does not need to publish manually for clients to see updates.

Optional `REALTIME_MONITOR=1` logs change events for debugging.

### Evolution / contradiction (stub level)

- **Evolution:** detects revision chains via `is_revision` + `revises_thought` (feeds higher layers like `.claude/skills/thoughtbox-evolution`).
- **Contradiction:** heuristic flags when `decision_frame` / `belief_snapshot` has semantic neighbors under a configurable distance threshold (`SIMILARITY_THRESHOLD`). Production would write to tables such as `pending_contradictions` / `pending_evolutions` described in `SUPABASE-INTELLIGENCE.md` (not present in the Layer 2 migration).

## Run locally

```bash
cd prototypes/thought-processing-worker
cp .env.example .env
# fill SUPABASE_*, DATABASE_URL
pnpm install
REALTIME_MONITOR=0 pnpm start
```

- **Stub embeddings** (default): deterministic 384-d vectors — good for plumbing, not semantics.
- **Xenova:** `pnpm add @xenova/transformers` and `EMBEDDING_MODE=xenova` — cold start downloads weights; size and CPU matter on Cloud Run.

## Deploy as Cloud Run worker

1. Build image from this directory (`Dockerfile`).
2. Deploy with the same **non-negotiables** as the main server: **stateless container**, **no local durable queue state** — all work is backed by PGMQ + Postgres.
3. Set secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`.
4. **Concurrency:** set Cloud Run concurrency **1** if each replica runs one tight poll loop (avoids duplicate embedding work on the same row; PGMQ visibility timeout already reduces double consumption).
5. **CPU/memory:** embedding models dominate; stub mode is cheap.
6. **Health:** platform probes `PORT` (default 8080) → `GET /health`.
7. **SIGTERM:** handler closes the pool (extend with in-flight drain as needed).

### pg_cron note

The sample migration schedules `pgmq.read('thought_processing', …)` on a timer **without** a consumer that archives messages. That pattern only hides messages for the VT window. **Production** should either remove that cron in favor of this worker, or add a SQL consumer that archives — avoid “read-only” polling.

## Cloud Run Node worker vs Supabase Edge

| | **Cloud Run (this prototype)** | **Supabase Edge Functions** |
|--|-------------------------------|------------------------------|
| **Runtime** | Node 22, full `pg`, long-lived loop | Deno, shorter requests, no raw TCP in some setups |
| **Embeddings** | ONNX / native addons / large deps feasible | WASM models OK; heavy models tighter |
| **Cold start** | Configurable min instances | Per-invocation cold starts |
| **Alignment** | Matches **execution plane** mandate: same org patterns as the MCP server container, VPC egress controls, shared secret management | Fits “next to data” but is **not** the MCP surface; spec warns Edge is for background-only roles |
| **Risk** | Another service to operate | Couples compute to Supabase project limits |

**Recommendation:** treat **queue + embedding + ANN** as a **dedicated worker service on Cloud Run** (or Cloud Run Job + scheduler for batch drains), keep **Edge** for tiny webhooks or Supabase-native hooks if latency/cost wins are clear.

## Operational checklist

- [ ] Service role key never shipped to browsers.
- [ ] `DATABASE_URL` uses pooler appropriately for many short queries; consider session mode for long transactions if added later.
- [ ] RLS: service role bypasses RLS on `thoughts` — worker must only run in trusted environments.
- [ ] After applying the Layer 2+ migration, regenerate `src/database.types.ts` in the main app (`supabase gen types typescript`).
