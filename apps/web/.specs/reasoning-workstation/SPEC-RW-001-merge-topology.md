# SPEC-RW-001: Merge Topology for Thought Graphs

**Status:** Draft
**Priority:** P1 — Completes the graph-of-thought topology
**Target:** `thoughtbox-staging`
**Research basis:** Fork-Merge Patterns (Zylos Research 2026-03-10), Graph-of-Thought (Besta et al. 2024), Belief Merging (SEP)

## Problem

Thoughtbox supports chain (sequential `thoughtNumber`) and tree (via `branchFromThought`) topologies but has no **merge** operation. An agent that branches to explore two hypotheses cannot formally reunite those branches into a synthesis thought. The missing merge means Thoughtbox's thought graph is a tree, not a full DAG — limiting the Graph-of-Thought and fork-merge patterns that the research literature identifies as essential for complex reasoning.

## Desired Outcome

A thought can declare multiple parent thoughts from different branches, creating a DAG merge point. Session analysis recognizes merge points and reports convergence metrics.

## Design

### 1. New field on ThoughtData

Add `mergeFrom` to `ThoughtData` in `src/persistence/types.ts`:

```typescript
// Existing branching fields:
branchFromThought?: number;
branchId?: string;

// New merge field:
mergeFrom?: Array<{
  thoughtNumber: number;
  branchId?: string;
}>;
```

`mergeFrom` is an array because a synthesis thought may integrate insights from 2+ branches. Each entry identifies a source thought (by number and optional branchId).

### 2. Validation rules (in `src/thought/operations.ts`)

- `mergeFrom` entries must reference thoughts that **exist** in the session
- A thought with `mergeFrom` must NOT also have `branchFromThought` (merge and branch are separate operations)
- `mergeFrom` entries should reference thoughts from **different** branches or the main chain (merging within the same branch is a revision, not a merge)

### 3. ThoughtNode update (in `src/persistence/types.ts`)

```typescript
interface ThoughtNode {
  // ... existing fields ...
  mergeOrigins: string[] | null;  // IDs of source nodes being merged
}
```

### 4. Session analysis update (in `src/sessions/handlers.ts`)

`analyzeSession` should report:
- `mergeCount`: Number of merge thoughts in the session
- `convergenceScore`: Ratio of branches that terminate in a merge (vs abandoned/open)
- Update `linearityScore` calculation: merges reduce linearity less than branches (they represent convergence, which is structurally positive)

### 5. Tool schema update (in `src/thought/tool.ts`)

Add `mergeFrom` to `thoughtToolInputSchema`:

```typescript
mergeFrom: z.array(z.object({
  thoughtNumber: z.number(),
  branchId: z.string().optional()
})).optional()
  .describe("Merge insights from multiple branches. Each entry references a parent thought.")
```

### 6. Export update (in `src/sessions/handlers.ts`)

`session_export` (markdown format) should render merge thoughts with explicit attribution:

```markdown
### Thought 25 (Merge from branches: hypothesis-a#12, hypothesis-b#8)
**Type:** belief_snapshot
**Confidence:** high

Synthesizing the two hypotheses: ...
```

## Files to modify

| File | Change |
|------|--------|
| `src/persistence/types.ts` | Add `mergeFrom` to `ThoughtData`, `mergeOrigins` to `ThoughtNode` |
| `src/thought/tool.ts` | Add `mergeFrom` to input schema |
| `src/thought/operations.ts` | Validate `mergeFrom` references, wire into ThoughtNode |
| `src/thought-handler.ts` | Handle merge in `processThought`, update `next` arrays on source nodes |
| `src/sessions/handlers.ts` | Update `analyzeSession` for merge metrics, update `exportSession` for merge rendering |
| `supabase/migrations/` | Add `merge_from` JSONB column to `thoughts` table |

## Acceptance criteria

- [ ] A thought with `mergeFrom: [{thoughtNumber: 5, branchId: "a"}, {thoughtNumber: 8, branchId: "b"}]` is saved successfully
- [ ] Validation rejects `mergeFrom` entries referencing non-existent thoughts
- [ ] `session_analyze` reports `mergeCount` and `convergenceScore`
- [ ] `session_export` renders merge attribution in markdown output
- [ ] Existing sessions without merges are unaffected (backward compatible)

## Non-goals

- Automatic merge conflict detection (the agent decides what to synthesize)
- CRDT-style automatic merge (too complex for this iteration)
- Merge across sessions (merges are within a single session)
