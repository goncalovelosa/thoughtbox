# SPEC-RW-003: Serendipity Queries for Bisociative Knowledge Discovery

**Status:** Draft
**Priority:** P2 — Unique differentiator for creative reasoning
**Target:** `thoughtbox-staging`
**Research basis:** Bisociation (Koestler 1964), Bisociative Networks (EU FP7 BISON), Universe of Thoughts (Suzuki 2025, Boden's Framework), Computational Serendipity (Corneli et al. 2020)

## Problem

Thoughtbox's knowledge graph supports traversal via `graph_traverse` (BFS from a start entity, filtered by relation type). This finds **expected** connections — entities linked through known relation chains. It cannot find **unexpected** connections — entities that are conceptually distant but share structural similarities, or that bridge otherwise disconnected clusters.

Bisociation (Koestler, 1964) — the collision of two normally unrelated conceptual frames — is the primary mechanism of creative insight. The knowledge graph has the DATA for bisociative discovery (entities from different domains, typed relations), but no OPERATION that exploits it.

## Desired Outcome

A new `graph_serendipity` operation on the knowledge graph that finds surprising cross-domain connections, bridge entities, and structural analogies.

## Design

### 1. New operation: `graph_serendipity`

Add to the knowledge tool operations in `src/knowledge/tool.ts`:

```typescript
graph_serendipity: {
  title: "Serendipity Query",
  description: "Find surprising connections in the knowledge graph. Identifies bridge entities between disconnected clusters, concepts with cross-domain relations, and structural analogies.",
  inputSchema: {
    mode: z.enum(['bridges', 'cross_domain', 'analogies', 'contradictions']),
    seed_entity_id: z.string().optional(),  // Start from a specific entity
    limit: z.number().optional().default(5),
  }
}
```

### 2. Four serendipity modes

**Mode: `bridges`**
Find entities that connect otherwise disconnected regions of the graph.

Algorithm:
1. Compute connected components (ignoring the candidate entity)
2. Entities whose removal increases the component count are bridges
3. Rank by: number of components they bridge x diversity of entity types in those components

Implementation: Simple BFS-based articulation point detection on the entity-relation graph. The knowledge graph is small enough (hundreds to low thousands of entities) that this is trivially fast.

**Mode: `cross_domain`**
Find entities that have relations to entities of DIFFERENT types.

Algorithm:
1. For each entity, compute the set of types of its neighbors (via any relation)
2. Entities connected to the most DISTINCT neighbor types are cross-domain connectors
3. Rank by type diversity of neighbors

Example result: "Entity 'context-rot' (type: Insight) connects to 'hot-warm-cold-memory' (type: Concept), 'library-theorem' (type: Insight), and 'adaptive-reasoning-effort' (type: Concept) — bridging 2 distinct types"

**Mode: `analogies`**
Find structural analogies: pairs of entities (A, B) where A's relation pattern to its neighbors resembles B's relation pattern.

Algorithm:
1. For each entity, compute a "relation fingerprint": sorted list of (relation_type, neighbor_type) pairs
2. Find entity pairs with high fingerprint similarity but low direct connectivity
3. These are structural analogies: A relates to its neighbors the same way B relates to its neighbors, but A and B aren't directly connected

Example: "Entity 'theseus-refactoring' and 'ulysses-debugging' have similar relation patterns (both DEPENDS_ON a protocol, both have EXTRACTED_FROM sessions) — they're structural analogues."

**Mode: `contradictions`**
Surface unresolved tensions in the knowledge graph.

Algorithm:
1. Find all CONTRADICTS relations
2. For each, check whether a resolution exists (a third entity that has MERGED_FROM or SUPERSEDES relation to both)
3. Return unresolved contradictions, ranked by the importance_score of the contradicting entities

### 3. Storage implementation

All four modes operate on the in-memory graph loaded from existing storage. No new storage needed.

In `src/knowledge/storage.ts` (for filesystem) and `src/knowledge/supabase-storage.ts`:

```typescript
interface KnowledgeStorage {
  // ... existing methods ...

  // New: Load full graph for serendipity computation
  loadFullGraph(): Promise<{
    entities: Entity[];
    relations: Relation[];
  }>;
}
```

For filesystem: already loads from JSONL, just expose the full set.
For Supabase: `SELECT * FROM entities WHERE workspace_id = $1` + same for relations. Acceptable for graphs < 10K entities.

### 4. Serendipity engine (new file: `src/knowledge/serendipity.ts`)

Pure functions operating on entity/relation arrays:

```typescript
function findBridges(entities: Entity[], relations: Relation[], limit: number): SerendipityResult[];
function findCrossDomain(entities: Entity[], relations: Relation[], limit: number): SerendipityResult[];
function findAnalogies(entities: Entity[], relations: Relation[], limit: number): SerendipityResult[];
function findUnresolvedContradictions(entities: Entity[], relations: Relation[], limit: number): SerendipityResult[];

interface SerendipityResult {
  type: 'bridge' | 'cross_domain' | 'analogy' | 'contradiction';
  entities: Array<{ id: string; name: string; type: string }>;
  explanation: string;  // Human-readable description of why this is surprising
  score: number;        // 0-1, higher = more surprising
}
```

### 5. Seed entity support

When `seed_entity_id` is provided, restrict the search to the neighborhood of that entity (2-hop radius). This focuses serendipity on a specific area of interest rather than the entire graph.

## Files to modify

| File | Change |
|------|--------|
| `src/knowledge/serendipity.ts` | New file — serendipity engine (4 mode functions) |
| `src/knowledge/tool.ts` | Add `graph_serendipity` operation to catalog and handler |
| `src/knowledge/storage.ts` | Add `loadFullGraph()` to FileSystemKnowledgeStorage |
| `src/knowledge/supabase-storage.ts` | Add `loadFullGraph()` to SupabaseKnowledgeStorage |
| `src/knowledge/types.ts` | Add `SerendipityResult` type |
| `src/code-mode/sdk-types.ts` | Add `serendipity` to `tb.knowledge` interface |

## Acceptance criteria

- [ ] `graph_serendipity` with mode `bridges` returns entities that connect disconnected graph regions
- [ ] `graph_serendipity` with mode `cross_domain` returns entities with diverse neighbor types
- [ ] `graph_serendipity` with mode `analogies` returns structurally similar but unconnected entity pairs
- [ ] `graph_serendipity` with mode `contradictions` returns unresolved CONTRADICTS relations
- [ ] `seed_entity_id` restricts results to the entity's neighborhood
- [ ] Performance acceptable for graphs up to 5,000 entities (< 1 second)
- [ ] Results include human-readable explanations

## Non-goals

- Embedding-based semantic similarity (pure graph structure for now)
- Real-time serendipity notifications (query-based, not push)
- Cross-workspace serendipity (within one workspace only)
