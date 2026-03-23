Perfect. I now have sufficient information to compile a comprehensive memory subsystem audit. Let me create the report:

---

## MEMORY SUBSYSTEM AUDIT REPORT

### EXECUTIVE SUMMARY

Thoughtbox has **substantial but incomplete** implementation of the four-class memory ideal. The codebase has strong foundations in **working memory** (active session state) and **episodic memory** (session persistence), moderate semantic memory infrastructure (knowledge graph), and almost no procedural memory or write gating. Provenance tracking is present but not enforced across all layers. Memory controllers exist implicitly but lack explicit governance.

---

## 1. WORKING MEMORY (Active Episode State)

### EXISTS

**Active Session State Handler**
- **File**: `src/thought-handler.ts`
- **What it does**: 
  - Maintains `thoughtHistory: ThoughtData[]` (in-memory) — all thoughts in active session
  - Maintains `branches: Record<string, ThoughtData[]>` — alternative reasoning paths
  - Manages `currentSessionId: string | null` — tracks which session is active
  - Processes thoughts serially via `processingQueue: Promise<void>` to prevent race conditions
  - Auto-assigns thought numbers and validates structural coherence (branching requires `branchFromThought`)
- **Key methods**: 
  - `processThought()` (lines 602-619) — serialized queue
  - `validateThoughtData()` (lines 332-429) — strict input validation
  - `restoreFromSession()` (lines 263-330) — restore state on reconnect (SIL-103)
  - `loadSession()` (lines 141-195) — hydrate in-memory state from storage

**Session Metadata Tracking**
- File: `src/thought-handler.ts:648-684`
- Auto-creates session on first thought, stores title/tags
- Updates `lastAccessedAt` on every access (line 186)
- Tracks `thoughtCount` and `branchCount` in session metadata (lines 771-775)

**Event Streaming** (SIL-104)
- File: `src/events/index.ts` (referenced at thought-handler.ts:17, 72)
- External event emitter for session lifecycle (`session_created`, `thought_added`, `branch_created`, `session_completed`)
- Fire-and-forget pattern — failures never affect main reasoning loop

### PARTIAL

**Thought Validation is Strict but Lacks Confidence Filtering**
- Validates `thoughtType` is required (line 385) — discriminated union with structured metadata
- Validates branching structure (lines 350-359)
- **MISSING**: No novelty check before write. Every thought is persisted regardless of uniqueness
- **MISSING**: No confidence-based filtering. Even low-confidence thoughts reach storage

**Sampling Integration (Critique as Working Memory Input)**
- File: `src/thought-handler.ts:871-908`
- When `critique: true`, async calls `samplingHandler.requestCritique()` 
- Passes last 5 non-branch thoughts as context (line 875)
- Returns critique as separate field in response (line 979)
- **PARTIAL**: Critique is persisted (line 895-899) but NOT integrated back into thought history — it's decorative metadata, not working memory

---

## 2. EPISODIC MEMORY (Session Storage, Exports, Trajectories)

### EXISTS

**Session Persistence Layer**
- **File**: `src/persistence/types.ts` — defines `ThoughtboxStorage` interface (lines 519-662)
- **Implementations**:
  - `src/persistence/filesystem-storage.ts` — Local file-based storage
  - `src/persistence/supabase-storage.ts` — Cloud backend (Supabase Postgres + Storage)
  - `src/persistence/in-memory.ts` — Volatile (tests/demos)

**Thought Storage** (Main Chain + Branches)
- `saveThought(sessionId, thought)` — persists single thought to main chain
- `saveBranchThought(sessionId, branchId, thought)` — persists to alternative branch
- `getThoughts(sessionId)` — retrieves full main chain
- `getAllThoughts(sessionId)` — main chain + all branches
- `getBranch(sessionId, branchId)` — specific branch

**Session Manifest** 
- File: `src/persistence/types.ts:318-330`
- Tracks all thought files and branches in JSON manifest
- Stores metadata (title, tags, timestamps)
- Version-controlled for schema evolution

**Linked Export Format** (Episodic Trajectory)
- File: `src/persistence/types.ts:262-280` — `SessionExport` type
- File: `src/persistence/export.ts` — Export implementation
- Converts flat thought list to doubly-linked node structure:
  - Each node has `prev` (single parent), `next` (array for branches)
  - Metadata includes `revisesNode` and `branchOrigin` for structure
  - Exported as JSON files with revision analysis
- Called at session close (line 637 in thought-handler.ts) and on-demand (line 214-245)

**Filesystem Integrity Validation**
- File: `src/thought-handler.ts:145-156`
- Validates session directory, manifest, and all thought files before loading
- Prevents data corruption from propagating
- Returns detailed error messages with recovery options

**Audit Manifest** (Session Retrospective)
- File: `src/persistence/types.ts:340-376` — `AuditManifest`
- Generated at session close (thought-handler.ts:922-932)
- Counts by thought type, decision confidence, action reversibility
- Tracks gaps (e.g., decision without action), assumption flips, critique overrides
- Embeds in exported session for forensics

**Thought Critique Persistence**
- File: `src/persistence/types.ts:152-159` — `critique` field in `ThoughtData`
- Stores text, model name, timestamp
- Updated via `updateThoughtCritique()` after sampling completes (thought-handler.ts:895-899)

### PARTIAL

**No Session Compaction or Pruning**
- Sessions are never compacted; full thought history is always loaded
- **File**: Searching for "compaction" yields only references to **Claude Code context compaction** (specs/continual-improvement/), not application-level memory compaction
- Sessions grow unbounded — no eviction policy for old thoughts

**Export-Only Trajectory Recording**
- Linked structure is computed ON EXPORT, not maintained in real-time
- **Missing**: Persistent linked node index. Each export rebuilds the graph.
- Sessions stored as flat JSONL per thought; tree structure exists only in-memory or during export

**No Session Forgetting or TTL**
- No `valid_to` or expiry on sessions
- Knowledge graph has TTL support (types.ts:35-38, 120-122) but not applied to sessions
- **Missing**: Policy for discarding old sessions or archiving to cold storage

---

## 3. SEMANTIC MEMORY (Knowledge Graph, Entities, Observations)

### EXISTS

**Knowledge Graph Storage Layer**
- **File**: `src/knowledge/types.ts` — Full type system (lines 1-350)
- **Storage interface** (lines 195-294):
  - `initialize()`, `setProject()` — lifecycle
  - Entity ops: `createEntity()`, `getEntity()`, `listEntities()`, `deleteEntity()`
  - Relation ops: `createRelation()`, `getRelationsFrom()`, `getRelationsTo()`, `deleteRelation()`
  - Observation ops: `addObservation()`, `getObservations()`
  - Query ops: `traverseGraph()`, `getStats()`

**Entity Types** (Semantic Concepts)
- File: `src/knowledge/types.ts:46-51`
- Types: `Insight`, `Concept`, `Workflow`, `Decision`, `Agent`
- Metadata: UUID, name, label, properties, visibility, temporal validity, access metrics
- **Provenance**: `created_by`, `created_at`, `updated_at` tracked (lines 30, 41)

**Relation Types** (Semantic Linkage)
- File: `src/knowledge/types.ts:82-91`
- `RELATES_TO`, `BUILDS_ON`, `CONTRADICTS`, `EXTRACTED_FROM`, `APPLIED_IN`, `LEARNED_BY`, `DEPENDS_ON`, `SUPERSEDES`, `MERGED_FROM`
- Directed edges with properties and provenance

**Observations** (Atomic Facts with Provenance)
- File: `src/knowledge/types.ts:111-123`
- Atomic statements attached to entities
- Track `source_session`, `added_by`, `added_at` (lines 115-117)
- Temporal validity: `valid_from`, `valid_to`, `superseded_by` (lines 120-122)

**Graph Traversal** (Retrieval via Semantic Links)
- File: `src/knowledge/types.ts:155-169`
- BFS from starting entity with configurable depth, relation type filtering, entity filters
- Returns connected entities and relations

**JSONL + SQLite Persistence** 
- File: `src/knowledge/types.ts:300-349` — Serialization types
- JSONL for durability (append-only facts)
- SQLite for fast indexing and queries
- `rebuildIndexFromJsonl()` method (line 293) — rebuild index on startup

**Knowledge Stats** 
- File: `src/knowledge/types.ts:178-185`
- Tracks entity counts by type, relation counts by type, observation counts
- Average observations per entity

### PARTIAL

**No Write Gating on Knowledge Graph**
- File: `src/knowledge/operations.ts` — create/add operations
- **MISSING**: No novelty check before creating entity
- **MISSING**: No utility or confidence threshold
- **MISSING**: No duplicate detection before relation creation
- Every call to `createEntity` or `addObservation` writes immediately

**No Retrieval Policy**
- Graph queries are simple BFS with optional filters
- **MISSING**: No ranking by importance, recency, or access frequency
- **MISSING**: No cache of hot entities
- **Missing**: No learned retrieval weights

**No Auto-Extraction from Sessions**
- File: `src/knowledge/types.ts:386-427` — `KnowledgePattern` interface (distinct from entities)
- Knowledge patterns are manually created, not auto-distilled from sessions
- **Missing**: Integration with session analysis or learnings extraction

**Temporal Validity Not Enforced**
- Types define `valid_from`, `valid_to` but searching for usage shows no runtime enforcement
- Expired facts are still returned in queries

### ARCHITECTURE NOTES

- Knowledge graph is **project-scoped** (types.ts:207) — separate graph per project
- No multi-agent knowledge merging across agents (only `created_by` tracking)
- Entity deduplication on `UNIQUE(name, type)` but can register same fact multiple times via observations (workaround for idempotency)

---

## 4. PROCEDURAL MEMORY (Skills, Prompts, Patterns, Learned Policies)

### EXISTS

**Skills Library** (Agent Instruction Manifests)
- **Files**: `.claude/skills/*/SKILL.md` (20+ skills)
- Skills define reusable workflows (e.g., `/workflow`, `/hdd`, `/diagram`, `/capture-learning`)
- Each skill has structured reasoning steps, gate points, and validation checkpoints
- Examples: `.claude/skills/workflow/SKILL.md`, `.claude/skills/hdd/SKILL.md`

**Agent Role Prompts** (Team Specializations)
- **Files**: `.claude/team-prompts/` (architect.md, debugger.md, researcher.md, reviewer.md, synthesizer.md, auditor.md)
- Role-based behavioral templates for multi-agent teams
- Each role defines decision-making heuristics and priority weighting

**Specialized Agents** (Learned Controllers)
- **Files**: `.claude/agents/` (20+ agents)
- Examples: `hub-manager.md`, `devils-advocate.md`, `silent-failure-hunter.md`, `regression-sentinel.md`, `research-taste.md`, `verification-judge.md`
- Each agent encodes domain-specific policy (e.g., "taste" agent for research direction)

**Critique System Prompt** (Learned Heuristic)
- File: `src/sampling/handler.ts:10-19`
- Encodes what "good critique" means: logical fallacies, assumptions, alternatives, edges, improvements
- Used whenever `critique: true` is requested

**Thoughtbox Cipher Logic** (Formal Knowledge)
- File: `src/multi-agent/cipher-extension.ts` (referenced at multi-agent/index.ts:22)
- Extended formal notation for multi-agent reasoning
- Encodes operators for claim derivation, conflict detection, logical composition

### PARTIAL

**No Learned Mutation or Adaptation Policies**
- Sampling uses fixed Sonnet hint and intelligence priority (src/sampling/handler.ts:89-92)
- **MISSING**: No adaptive model selection based on reasoning type
- **MISSING**: No learned token budgets
- **MISSING**: No feedback loop from critique quality to sampling parameters

**No Intra-Session Skill Refinement**
- Skills are static markdown files
- **MISSING**: No skill adaptation based on session performance
- **MISSING**: No pattern extraction from successful sessions to improve future workflows

**Prompts Not Version-Controlled in Main System**
- Skills and agents are markdown in `.claude/` — not part of core reasoning
- **MISSING**: System integration to update system prompts based on session analysis
- **MISSING**: A/B testing framework for prompt variants

**No Procedure Registry**
- No systematic catalog of "what procedures exist" accessible to agents at runtime
- Agents discover skills via documentation, not API

### ARCHITECTURE NOTES

- Procedural memory lives in **two places**: markdown skills/agents in `.claude/` (human-facing) and hardcoded prompts in `src/sampling/handler.ts`, `src/resources/` (system-facing)
- No unified representation; inconsistency risk if policies diverge

---

## 5. WRITE GATING (Novelty, Utility, Confidence Checks)

### ABSENT

**No Novelty Filter Before Thought Persistence**
- File: `src/thought-handler.ts:768-769`
- Every validated thought is persisted unconditionally
- **Missing**: Hash-based deduplication or semantic similarity check

**No Utility or Confidence Threshold for Storage**
- Thought validation checks `thoughtType` is present (line 385) but doesn't gate on confidence
- Confidence is metadata in `decision_frame` (line 470) but doesn't affect persistence
- **Missing**: Policy like "only persist decision_frame if confidence >= medium"

**No Prevalence-Based Filtering**
- If the same observation is added to an entity 10 times, all 10 are stored
- Knowledge graph stores duplicates as separate observations
- **Missing**: Prevalence counter; "merge if 3+ identical observations"

**No Learned Filtering Policy**
- No mechanism to learn which writes are "wasteful" and exclude them in future
- Memory quality evaluator (src/evaluation/evaluators/memory-quality.ts) measures context utilization but doesn't feedback to write gating

### ARCHITECTURE NOTES

- Gating would require:
  1. **Novelty detector** — hash-based or embedding-based deduplication
  2. **Confidence threshold oracle** — learn from session outcomes what confidence level predicts utility
  3. **Prevalence aggregator** — track observation frequency and suppress duplicates
  4. **Feedback loop** — session analysis → retrospective gating policy adjustment

---

## 6. RETRIEVAL POLICIES (Memory Finding, Ranking)

### EXISTS

**Session Filtering & Search**
- File: `src/persistence/types.ts:80-87` — `SessionFilter` interface
- Filters: tags, search by text, limit, offset, sort by (createdAt, updatedAt, title)
- Implementation: `src/sessions/operations.ts` — `session_search`, `session_list`
- Retrieval is **time-ordered** (most recent first) or by tag

**Knowledge Graph Traversal Retrieval**
- File: `src/knowledge/types.ts:155-169`
- BFS from entity with optional relation-type and entity-type filters
- Depth-limited (default 3)

**Thought Query by Number**
- File: `src/persistence/types.ts:610-613`
- Direct lookup: `getThought(sessionId, thoughtNumber)`
- Also: `getThoughts(sessionId)` — full main chain

### PARTIAL

**No Importance Ranking**
- Sessions are not ranked by "how valuable this session is"
- Knowledge entities have `importance_score` field (types.ts:43) but it's not computed or used in queries
- **Missing**: Rank by access frequency, link centrality, or downstream impact

**No Temporal Decay**
- Recent sessions weighted equally to year-old sessions
- Observations don't decay in utility over time
- **Missing**: Exponential decay of relevance

**No Content-Based Ranking**
- Search returns all matches; no semantic ranking
- **Missing**: Embed-based search or TF-IDF ranking

**Sampling Critique Uses Fixed Context**
- File: `src/sampling/handler.ts:125-132`
- Always passes last 5 thoughts, hardcoded
- **Missing**: Adaptive context selection (e.g., retrieve 5 most similar thoughts)

### ARCHITECTURE NOTES

- Retrieval is **structure-driven** (time, links) not **value-driven** (importance, relevance)
- No learning from "which retrieved memories were actually used" to improve future ranking

---

## 7. COMPACTION (Session Pruning, Memory Consolidation)

### ABSENT

**No Session Compaction**
- Sessions are never pruned or summarized
- Full history is always loaded into `thoughtHistory` array
- Long sessions become slow to restore (linear scan)

**No Thought Consolidation**
- Revisions are tracked (revisesThought field) but don't replace or hide the original
- Both revision and original are persisted separately
- **Missing**: "Mark thought as superseded, keep for provenance only, exclude from active retrieval"

**No Observation Aggregation**
- Multiple observations on same entity are stored separately
- **Missing**: "Merge 5 identical observations into 1 with count:5"

**No Policy for Archiving**
- Completed sessions stay in primary storage forever
- **Missing**: Move sessions older than 6 months to cold storage or compress

### ARCHITECTURE NOTES

- Compaction would be triggered by:
  1. Session close (retrospective consolidation)
  2. Storage size exceeding threshold (eviction)
  3. Scheduled maintenance (nightly)
  4. On-demand (user request)

---

## 8. PROVENANCE TRACKING

### EXISTS

**Comprehensive Attribution in Thoughts**
- File: `src/persistence/types.ts:99-159` (ThoughtData)
- `agentId`, `agentName` — who created it (lines 138-139)
- `timestamp` — ISO 8601 (line 110)
- `thoughtType` — category for auditability (line 113)

**Multi-Agent Thought Attribution** (ADR-005)
- File: `src/multi-agent/content-hash.ts` — Merkle chain
- Hash includes `agentId` and `timestamp` in chain
- Content-addressable verification: `verifyChain()` method
- Prevents thought tampering

**Entity Provenance**
- File: `src/knowledge/types.ts:30, 41` — `created_by`, `created_at`, `updated_at`
- Observation provenance (lines 115-117): `added_by`, `source_session`, `added_at`
- Relation provenance (line 79): `created_by`

**Session Audit Manifest**
- File: `src/persistence/types.ts:340-376` — `AuditManifest`
- Generated at close (AUDIT-003)
- Tracks decision confidence, action reversibility, critique override counts
- Includes `gaps` array with thought numbers of anomalies

**Session Export Metadata**
- File: `src/persistence/types.ts:262-280` — SessionExport
- Includes full session metadata and exportedAt timestamp
- Nodes preserve original ThoughtData (unchanged)

### PARTIAL

**Provenance Not Enforced Across API Boundaries**
- Hub (multi-agent coordination) stores `createdBy` on Problems, Proposals, Reviews (src/hub/hub-types.ts)
- But **no validation** that createdBy matches caller's agentId
- **Missing**: Access control check

**Provenance Not Queryable**
- No "show me all observations added by agent X" query
- No "show me all thoughts from sessions created before date Y" across projects
- **Missing**: Provenance-based filtering in retrieval APIs

**Compaction Loses Provenance Lineage**
- If observations are merged during compaction, which `added_by` wins?
- **Missing**: Decision rule (oldest, newest, consensus?)

### ARCHITECTURE NOTES

- Provenance is **recorded** (fields exist) but not **enforced** (no validation) or **leveraged** (not used in queries/decisions)

---

## 9. MEMORY CONTROLLERS (Who Decides What Gets Stored)

### EXISTS (Implicit, Not Explicit)

**ThoughtHandler as Working Memory Controller**
- File: `src/thought-handler.ts:54-88` (constructor, init, restoration)
- Decides: which session is active, when to auto-create session, when to export
- Gated by: `currentSessionId` state machine

**Sampler as Critique Controller**
- File: `src/sampling/handler.ts:63-112`
- Decides: when to invoke sampling, what model, what context
- Gated by: `critique: true` flag in thought

**Storage as Persistence Controller**
- File: `src/persistence/storage.ts` (abstract), `filesystem-storage.ts`, `supabase-storage.ts`
- Decides: where to write, directory structure, manifest format
- Gated by: implementation choice (filesystem vs Supabase)

**Session Exporter as Trajectory Controller**
- File: `src/persistence/export.ts`
- Decides: when to export, what format, destination
- Gated by: session close or explicit tool call

**Hub Workspace as Collaboration Memory Controller**
- File: `src/hub/workspace.ts`
- Decides: what problems/proposals agents can see, who can join
- Gated by: workspace membership

### ABSENT (No Explicit Governance)

**No Memory Policy Engine**
- No centralized rules for "write X only if novelty > threshold" or "cache Y for N days"
- **Missing**: `MemoryGovernor` or `PolicyEngine` class

**No Tiered Retention Scheduling**
- No distinction between hot, warm, cold storage
- **Missing**: TTL management per memory class

**No Cross-Layer Consistency**
- Thought validation is in ThoughtHandler
- Knowledge graph validation is in operations.ts
- Session validation is in storage.ts
- **Missing**: Unified policy enforcement layer

**No Agent-Specific Memory Limits**
- No quota per agent (e.g., "agent X can persist 1000 observations/day")
- **Missing**: Rate limiting or capacity controls

---

## 10. MISSING ARCHITECTURE

### Critical Gaps

1. **Write Gating System**
   - **What needed**: `MemoryWriteGate` evaluating (novelty, utility, confidence)
   - **Where**: Separate module `src/memory/write-gate.ts`
   - **Interface**: `canPersist(data, metadata) → {allowed: bool, reason?: string}`
   - **Trigger points**: Thought save, observation add, relation create

2. **Retrieval Ranker**
   - **What needed**: Rank retrieved memories by (recency, importance, relevance)
   - **Where**: `src/memory/retrieval-ranker.ts`
   - **Learning loop**: Track which retrieved items were used → adjust weights

3. **Compaction Engine**
   - **What needed**: Consolidate observations, supersede revisions, archive old sessions
   - **Where**: `src/memory/compaction.ts`
   - **Trigger**: Session close, size threshold, scheduled
   - **Policies**: Configurable per memory class

4. **Unified Memory Controller**
   - **What needed**: Central governor for all memory classes
   - **Where**: `src/memory/controller.ts`
   - **Responsibilities**: Enforce consistency, route writes/reads, apply policies

5. **Provenance Query Engine**
   - **What needed**: "Show me all facts from sessions where agent X was involved"
   - **Where**: `src/memory/provenance-query.ts`
   - **Filtering**: createdBy, created_at, visibility, valid_to

6. **Memory Quality Feedback Loop**
   - **What needed**: Session analysis → identify waste → update write gating
   - **Where**: `src/memory/learning-loop.ts`
   - **Integration**: Connects observatory quality metrics to write-gate policies

7. **TTL/Expiry Manager**
   - **What needed**: Enforce `valid_to` in knowledge graph, session archival
   - **Where**: `src/memory/expiry-manager.ts`
   - **Cron**: Run nightly to clean up expired observations

---

## 11. SUMMARY TABLE

| Memory Class | Status | Key Implementation | What's Missing |
|---|---|---|---|
| **Working** | Exists | ThoughtHandler in-memory state (thoughtHistory, branches, currentSessionId) | Confidence-based filtering before update; novelty dedup |
| **Episodic** | Exists | Persistent storage (FS/Supabase), linked export, audit manifest | Session compaction; forgetting policy; hot/cold tiering |
| **Semantic** | Partial | Knowledge graph entities/relations/observations, JSONL+SQLite | Write gating; importance ranking in retrieval; auto-extraction from sessions |
| **Procedural** | Partial | Skills, agents, role prompts in `.claude/`; critique system prompt | Learned mutations; in-session refinement; version control in core |
| **Write Gating** | Absent | — | Novelty detector; utility threshold oracle; feedback from quality metrics |
| **Retrieval** | Partial | Time/tag-based filtering, BFS graph traversal | Importance ranking; adaptive context; semantic ranking |
| **Compaction** | Absent | — | Session pruning; observation aggregation; archive policy |
| **Provenance** | Partial | agentId, createdBy, timestamps tracked | Enforcement at boundaries; queryability; handling in compaction |
| **Controllers** | Implicit | ThoughtHandler, Sampler, Storage, Exporter scattered | Unified governance engine; policy enforcement |

---

## 12. SPECIFIC FILE PATHS FOR IMPLEMENTATION

**Core files to modify/create**:
- `src/memory/write-gate.ts` (NEW)
- `src/memory/retrieval-ranker.ts` (NEW)
- `src/memory/compaction.ts` (NEW)
- `src/memory/controller.ts` (NEW)
- `src/memory/types.ts` (NEW)
- `src/thought-handler.ts` — integrate write-gate before line 768
- `src/persistence/types.ts` — extend ThoughtboxStorage interface with expiry methods
- `src/knowledge/operations.ts` — integrate write-gate before createEntity/addObservation
- `src/sampling/handler.ts` — parameterize model hint and context selection

**Test files**:
- `src/memory/__tests__/write-gate.test.ts`
- `src/memory/__tests__/compaction.test.ts`
- `src/memory/__tests__/controller.test.ts`

---

## 13. DISCOVERED ARCHITECTURAL RISKS

1. **Memory bloat unchecked** — long sessions load full history; no pruning → O(n) restore time
2. **Duplicate observations unbounded** — same fact added 100x stays 100x
3. **Critique is informational, not corrective** — critique suggestions don't feed back into reasoning state
4. **Provenance unvalidated** — agentId is self-declared; no access control
5. **Retrieval not learned** — context selection hardcoded; no signal from session success/failure feeding back to ranking
