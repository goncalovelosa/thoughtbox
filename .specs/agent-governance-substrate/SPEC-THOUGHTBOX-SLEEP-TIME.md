# SPEC: Thoughtbox Sleep-Time — Supabase-Native Async Governance Substrate

**Status**: DRAFT — research artifact, not accepted
**Source session**: `316ec05c-e2c0-4960-8322-05caf9708736`
**Primary reference**: Letta Sleep-Time Compute (blog Apr 21 2025; arXiv 2504.13171). Follow-ups: Letta Skill Learning (Dec 2025), Context Repositories (Feb 2026), Context Constitution (Apr 2026). Adjacent: XSkill (arXiv 2603.12056v2, Mar 2026).

## Thesis

Adopt Letta's sleep-time compute pattern as the async governance substrate for Thoughtbox. Run the sleep-time agent on Supabase — pgmq + pg_cron + edge functions — using infrastructure already shipped in migration `20260408033928`. The primary agent (Claude Code session) handles user interaction; the sleep-time agent (Supabase edge function) reorganizes memory, applies evolution-check classifications, reflects on trajectories, extracts skills. Claude Code remains the primary interface; Thoughtbox becomes the memory-and-evolution substrate underneath.

This reframes governance from *friction imposed on agents* to *ambient search-space narrowing at every decision point*.

## Core mapping

| Letta sleep-time compute | Thoughtbox / Supabase equivalent |
|---|---|
| Primary agent (user-facing) | Claude Code session over MCP |
| Sleep-time agent (async, memory-editor) | Supabase edge function invoked by pgmq + pg_cron |
| Memory blocks | `thoughts`, `knowledge_entities`, `knowledge_observations`, (future) `skills` tables |
| "Every N steps" trigger | `AFTER INSERT ON thoughts` → `thought_processing` queue (already live) |
| Primary cannot edit core memory | Claude Code gets scoped MCP token; memory-mutation tools behind service-role key inside edge function |
| Anytime read | Supabase Realtime broadcasts memory changes; primary reads via `thoughtbox_search` without blocking |
| Different models per agent | Edge function env var picks Haiku/Sonnet; primary whatever the user runs |

## What's already shipped (verified live `2026-04-20`)

From migration `20260408033928_add_hub_tables_vectors_pgmq_realtime.sql`:

- `pgmq` extension, plus `pg_cron` and `pg_net`
- Queues: `thought_processing`, `entity_processing`, `session_closing`
- Triggers: `trg_thought_insert_enqueue` on `public.thoughts`, `trg_entity_insert_enqueue` on `public.entities`
- RPC wrappers (service-role only): `pgmq_read_queue`, `pgmq_archive_queue_message`
- Vault-backed cron invocation helpers: `invoke_process_thought_queue_from_vault`, `schedule_process_thought_queue`
- Edge functions deployed:
  - `process-thought-queue` — currently broadcasts + archives (skeleton sleep-time worker)
  - `tb-branch` — branch-scoped thought writer (deployed 2026-04-20 in this session)

Applied migrations on the hosted Thoughtbox project are in sync with the repo (verified via `supabase migrations list --linked`).

## The deltas to build

Each delta is bounded, independently useful, and ships without blocking the others.

### Delta 1 — Evolution-check worker

Extend `supabase/functions/process-thought-queue/index.ts`. On each dequeued thought message:

1. Fetch the last N prior thoughts in the session (or top-K by embedding similarity once embeddings ship).
2. Call Haiku with the evolution-check prompt (`thoughtbox://prompts/evolution-check`) — classify each prior as `UPDATE` or `NO_UPDATE`.
3. For `UPDATE` classifications, insert revision thoughts via the existing `isRevision: true, revisesThought: <n>` path.
4. Archive the queue message.

Cost model: ~$0.001–0.005 per insert with Haiku classifier. Expected latency: seconds, tolerable because async.

Delta size: ~150–250 lines. Existing function already handles queue + auth; only the classifier logic is new.

### Delta 2 — Session-closing trigger and worker

The `session_closing` pgmq queue already exists from migration `20260408033928`. The trigger that fires it is missing.

Add a trigger:

```sql
CREATE OR REPLACE FUNCTION public.enqueue_session_closing()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pgmq
AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status <> 'closed' THEN
    PERFORM pgmq.send('session_closing', jsonb_build_object('session_id', NEW.id));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_session_close_enqueue
  AFTER UPDATE OF status ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_session_closing();
```

Add `supabase/functions/process-session-closing/index.ts` that drains the queue and, per session: runs `session.analyze`, calls `session.extractLearnings`, creates a `Session Digest` knowledge entity with observations linking back to the source thoughts.

### Delta 3 — Skill-reflection worker (the `skill-evolution` primitive)

Triggered from `session_closing` or as its own queue. Two-stage per Letta Skill Learning (Dec 2025):

1. **Reflection**: Sonnet reads the session trajectory; produces a structured report — did the agent solve the task; what went well; what failure modes surfaced; which existing skills were used or missed.
2. **Skill update**: for each skill flagged as relevant, either (a) add an observation to the existing skill knowledge entity + open a GitHub PR to update the corresponding `.claude/skills/<name>/SKILL.md`, or (b) flag a new-skill candidate to a `pending_skills` table for human review.

This operationalizes the user's "skill-evolution" concept. Skills stay as `.md` files, git-managed, with PR-gated updates (respecting the L1 + CODEOWNERS governance from SPEC-SEVEN-LAYER-ARCHITECTURE.md).

### Delta 4 — Drift scanner (cron)

Scheduled via `pg_cron` every hour or nightly. Scans knowledge graph and filesystem-mirrored state for:

- Orphan entities (no relations)
- Stale observations (last_updated > N days without corroboration)
- ADRs in `.adr/staging/` older than 60 days
- Rules in `.claude/rules/` that haven't fired in N days (requires fire-rate telemetry)

Opens a tracking issue or writes `evolution_candidate` observations for user review. Closes the cleanup loop that the repo's history lacks (0 rejected ADRs out of 18, per research).

### Delta 5 — Embeddings and HNSW (deferred in migration header)

Ship the deferred embedding work from SUPABASE-INTELLIGENCE.md:

- `thoughts.embedding VECTOR(384)` — gte-small
- `knowledge_entities.embedding VECTOR(384)`
- `knowledge_observations.embedding VECTOR(384)`
- HNSW indexes for fast ANN similarity search
- Edge function helpers for embedding generation

With embeddings, delta 1 pre-filters prior thoughts by similarity, reducing per-insert classifier cost and enabling semantic retrieval for delta 3. A smoke test for gte-small embeddings is already in `supabase/functions/process-thought-queue/smoke_gte_small.ts` (untracked; see PR #266).

## `pg_cron` schedule map

- **Every 5 minutes** — drain pgmq queues: `SELECT public.schedule_process_thought_queue()` (helper already exists; needs to be called once to register the job).
- **Hourly** — drift scanner (delta 4).
- **Nightly** — session digests + skill reflections on sessions closed in the last 24 hours (delta 2 + 3).
- **Weekly** — knowledge-graph health check; assumption verification (once `assumptions` registry ships).

## Positioning and product frame

Letta's sleep-time compute ships as part of their primary+sleep-time agent pair inside the Letta runtime. Thoughtbox Sleep-Time runs as a model-agnostic substrate on Supabase. Claude Code, Cursor, Codex, any MCP-compatible harness connects as the primary; the sleep-time loop happens on Supabase regardless of which primary is active. This is a differentiated positioning: Letta needs you on Letta; Thoughtbox Sleep-Time runs behind whatever agent harness the user already chose.

## Non-goals

- Replacing Claude Code or any other agent harness. Primary agent remains user's choice.
- Replicating all of Letta's feature set. Target: async memory evolution + skill reflection + drift cleanup. Not multi-agent orchestration, not tool registries, not agent types.
- Delivering perfect governance. Goal: move governance out of friction category into search-space-narrowing category per SPEC-EVOLUTION-CHECK-GENERALIZED.md.

## First-slice scope (one focused week)

1. **Delta 1** (1–2 days): extend `process-thought-queue` with evolution-check classifier.
2. **Delta 2** (1 day): add `trg_session_close_enqueue` trigger + `process-session-closing` edge function.
3. **Delta 4 minimal** (0.5 day): schedule `drift-scanner` for stale `.adr/staging/` via `pg_cron`. Open GitHub issue on match.

After this slice: the first useful sleep-time loop runs on prod Supabase. Evolution-check on every thought. Session digests on every close. Stale ADRs surface automatically. Verify before expanding.

## Risks

- Cost at scale — evolution-check on every thought multiplies Haiku calls with session volume. Sample data: 108 thoughts in this research session × $0.003 ≈ $0.32. At 1,000 thoughts/day, ~$3/day. Manageable but worth monitoring.
- Classifier drift — the evolution-check prompt may need tuning for FP/FN rate. Mitigation: run evaluation on a labeled subset before go-live.
- Silent failure of the async pipeline — a queue backlog could accumulate without the user noticing. Mitigation: add a monitoring query on `pgmq.meta` counters + alert if backlog > N.
- Trigger interaction with existing code paths — the session_closing trigger must not fire on workspace-isolation boundaries or during migration rollbacks. Mitigation: add explicit `WHEN` clause plus integration tests.

## Open questions

- How is the edge function authenticated to call external LLM APIs (Anthropic)? Vault-stored API key, rotated how?
- For Delta 3 skill PRs: bot identity vs user identity? See seven-layer L1 discussion of agent-identity separation.
- When embeddings ship, which model — `gte-small` (384-d, local), OpenAI `text-embedding-3-small`, Voyage? Cost and quality tradeoffs.
- Do we need a `skills` table or is knowledge graph sufficient to represent skill entities? Letta uses filesystem-backed `.md` files; we'd mirror in knowledge graph and write-through to filesystem.

## References

- Letta Sleep-Time Compute: https://www.letta.com/blog/sleep-time-compute
- Letta Skill Learning: https://www.letta.com/blog/skill-learning
- Letta paper: arXiv 2504.13171
- XSkill paper: arXiv 2603.12056v2
- Thoughtbox evolution-check prompt: `thoughtbox://prompts/evolution-check`
- Stripe Minions Part 2 (blueprint engine as analog): https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents-part-2
- Migration: `supabase/migrations/20260408033928_add_hub_tables_vectors_pgmq_realtime.sql`
- Existing design doc: `supabase/SUPABASE-INTELLIGENCE.md` (untracked; see PR #266)
- Knowledge entity: `letta-sleep-time-compute-reference-architecture` (`6d3e0bbb-0026-4279-8af8-f4416cdaa143`)
