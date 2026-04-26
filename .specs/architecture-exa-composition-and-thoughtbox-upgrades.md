# Architecture: Representation, Composition, and Thoughtbox Upgrades Derived from Exa

**Status**: Research notes / design input (not yet staged ADR)
**Priority**: Mixed — near-term punch list is P2; long-term roadmap is post-wedge
**Source**: Thoughtbox session `d22d77ce-a27a-4f60-9fb9-a5a6190adee4` (100 thoughts, 2026-04-22)
**Source material**:
- Exa, [Composing a Search Engine](https://exa.ai/blog/composing-a-search-engine) (Canon architecture)
- Exa, [Deep Max](https://exa.ai/blog/deep-max)
- Exa, [WebCode](https://exa.ai/blog/webcode)

---

## Abstract

This document summarizes a structured exploration of how Exa's three 2026 posts on search composition, agentic retrieval, and grounded coding-agent evaluation inform Thoughtbox's evolution. The exploration produced three orthogonal quality dimensions for any information substrate, a small number of cross-cutting design insights, a near-term punch list of cheap additive upgrades, and a longer-term architectural roadmap toward what the user has termed the "cognition kernel" vision. Nothing in this document blocks current shipping work; all proposals are backwards-compatible additions that can be sequenced after the Stripe-gated signup launch.

---

## Context

The exploration was framed by the user's observation that *"the representation and presentation of data affects your ability to identify where the correct information is and how it should be ordered"* — a claim about the substrate, not about search engines specifically. Exa's three posts were chosen not for their surface topic (web retrieval) but for the general primitives they articulate: explicit graph composition with totality (Canon), pointer-to-data with token-efficient representation (Deep Max), and discriminative groundedness evaluation separate from generative correctness (WebCode).

The Thoughtbox evolution context: the user plans to turn Thoughtbox into the sole state-mutating interface for agents (the "remote control versus rabbit ears" framing), with thoughts, notebook cells, eventual code changes (ts-morph), and multi-agent hub coordination all routed through typed primitives. This document translates Exa's insights into concrete proposals for that trajectory.

---

## Three Quality Dimensions

Exa's three posts, read together, decompose into three orthogonal quality dimensions applicable to any information substrate:

### 1. Structural Totality (Canon)

**Definition**: Every possible outcome of every operation is explicitly handled; the graph/store is closed, not leaky. From Canon: *"Canon graphs specify what happens for every outcome of every node, so you can't ship a graph with unhandled outcomes."*

**Thoughtbox gap today**: Consumers of the knowledge graph's relation types (`BUILDS_ON`, `DEPENDS_ON`, `RELATES_TO`) are not forced to exhaustively handle them. The Theseus and Ulysses protocols' `state_json` field is typed `Record<string, unknown>`, which is an explicit escape hatch where totality breaks.

**Remediation direction**: Specific per-state-type schemas for protocol state transitions; discriminated unions for observation kinds; exhaustive-match enforcement at consumer sites.

### 2. Representational Economy (Deep Max)

**Definition**: Signal preserved, chrome shed; pointers to fuller data rather than fuller data inline. From Deep Max: *"highlights guide the model to the right pages; full crawls back the final answer."*

**Thoughtbox gap today**: A session with 167 thoughts surfaces heavy when recalled. Observation bodies are unbounded inline text. The KG stores content rather than pointing to it, so the graph inflates with corpus size.

**Remediation direction**: Symbolic pointers resolvable at read time; short-form pointer representations of thoughts and observations for scanning; hybrid index-plus-hot-cache architecture for the KG.

### 3. Groundedness (WebCode)

**Definition**: The information that's surfaced must be the information that's actually being used, verified discriminatively ("does context X contain the answer?") rather than generatively ("did the model produce the right answer from X?"). From WebCode: correctness scores cluster near 86% across search providers while groundedness scores "exhibit much higher variance, better isolating capability differences."

**Thoughtbox gap today**: No way to tell whether recalled thoughts actually influenced an agent's current action, versus being decorative. The agent's claim that it drew on prior reasoning is unverifiable.

**Remediation direction**: Citation fields on thoughts (`citesThoughtIds`, `citesEntityIds`); eventual ablation-based evaluation ("would the action still have been taken if the cited thoughts were replaced with null/noise?"); grounded-rerank as a retrieval ordering dimension.

---

## Key Design Insights

### Insight 1: Citations + symbolic pointers + late-binding collapse into a single abstraction

Citations to prior thoughts, symbolic pointers like `entity:WorkspaceBoundary/observation:latest`, and late-bound references that resolve at read time are all instances of the same underlying shape: **typed references to content that resolve at read time**. Building one mechanism — the symbolic pointer resolver with optional version pinning — powers several apparent features at once: citation-driven provenance queries, cross-session symbolic references, Deep-Max-style pointer-to-full-content retrieval, and git-like version-pinned references where precision matters.

This is the single highest-leverage mechanism identified in the session. It unlocks groundedness tooling, late-binding (your past reasoning stays anchored to current concepts without going stale), and pointer-based memory hierarchy simultaneously.

### Insight 2: "Agent-native database" is the Goldilocks positioning

Between "workflow tool" (too small, not defensible as a category) and "operating system for agents" (too grand, uncheckable at pre-launch scale), the framing **agent-native database with typed cognition primitives** is concrete enough to pitch today and expansive enough to grow into the longer-term cognition kernel framing.

The positioning stacks: *wedge pitch* uses database; *category pitch* uses cognition kernel; each new capability the user ships moves Thoughtbox one step along the path from database to kernel. Defensible against known landmarks (vector DBs, graph DBs, document DBs) that VCs understand.

### Insight 3: Novel API shapes cost agents disproportionately

Agents reuse training-data patterns; novel shapes force per-call learning. The current Thoughtbox API mixes canonical shapes (KG CRUD, session list/get/export — well-grounded in training data) with novel ones (`tb.theseus({operation: 'start', ...})`, observability tool dispatch, protocol state-machine operations).

**Every entry in `.claude/rules/mcp-gotchas.md` is effectively API debt** — a place where the current shape departs from training-data-canonical patterns. The file is load-bearing today *as a compensation for that debt*. A refactor target: map each gotcha entry to a canonical redesign (e.g., `tb.theseus({operation})` → `tb.theseus.start()`) and deprecate the novel form.

### Insight 4: Four-plane substrate is the cleaner articulation of "Thoughtbox as remote control"

The user's single-remote-control framing factorizes into **four typed write surfaces** plus one read surface:

- **Thought plane**: committing understanding (thoughts, entities, observations, relations)
- **Notebook plane**: executing computation (cells, outputs, file artifacts)
- **Code plane** (future, via ts-morph): changing project state
- **Hub plane**: multi-agent coordination (proposals, channels, consensus)
- **Observatory plane**: read-only view over all four, producing the structured ledger

Cross-plane typed references (a thought cites a notebook cell; a notebook cell produces an observation; a hub proposal cites a thought as justification) unify the system without collapsing distinctions. This is a structurally cleaner articulation of the "single remote control" vision — one remote, four plane-typed buttons, each internally coherent.

### Insight 5: Prior art exists for the architectural commitments

Thoughtbox's long-term shape has identifiable predecessors that contribute legitimate grounding to the thesis rather than forcing it to be invented from scratch:

- **Andy Clark / David Chalmers, "The Extended Mind" (1998)**: cognition extends into the environment through tool use; the substrate is part of cognition, not external to it.
- **Ed Hutchins, *Cognition in the Wild* (distributed cognition)**: same claim for teams and artifacts.
- **Ted Nelson, Project Xanadu (1965-)**: typed links, transclusion, bidirectional references, versioned addressability — commercially failed because humans wouldn't author with sufficient structural discipline; agents will, if the substrate demands it.
- **Dennis & Van Horn (1966), Mark Miller's object-capability work**: no ambient authority, all state mutation through named capabilities — directly maps onto Thoughtbox-as-sole-write-surface.
- **Unix / Plan 9**: small orthogonal primitives compose into arbitrary workflows; "everything is a file" generalizes cleanly. Model for plane design.

---

## Near-Term Punch List (2-3 focused days, post-launch)

Ordered by value-per-cost. All additions are backwards-compatible.

### 1. Observation kinds
Add a `kind` field to observations with a string-literal-union type. Starter vocabulary: `quote`, `derivation`, `claim`, `counterexample`, `code-reference`, `decision`, `measurement`.

Downstream benefits: filtered retrieval (`give me only counterexamples for entity X`); structured export; per-kind rendering; future kind-specific metadata.

**Cost**: Low. Single migration + schema change + small handler updates.
**Value**: Medium. Unlocks filtered retrieval with no cost to existing consumers.

### 2. Citation fields on thoughts
Add `citesThoughtIds: string[]` and `citesEntityIds: string[]` arrays to the thought schema.

Make citations required for specific thought types (`decision_frame` must cite evidence; `action_report` must cite authorization; `assumption_update` must cite prior/new-state observations). The runtime rejects non-compliant thoughts — no per-agent discipline required.

**Cost**: Low-medium. Schema change + type-specific validation.
**Value**: High. Enables provenance DAG queries, downstream groundedness tooling, and staleness-flagging when ancestor thoughts are revised.

### 3. Canonical symbolic pointer format
Define one format: `session:<uuid>/thought:<n>`, `entity:<name>/observation:<id>`, `entity:<name>/observation:latest` for late binding.

Ship a resolver helper (`tb.pointer.resolve(pointerString)`) and a formatter (`tb.pointer.format(sessionId, thoughtNum)`). No schema change required — pointers are strings that appear in thought content and citation fields.

**Cost**: Low. Convention + two helper functions.
**Value**: Medium-high as the foundation for Insight 1.

### 4. Canonical API shape refactor for protocol tools
`tb.theseus({operation: 'start', ...})` → `tb.theseus.start(...)`. Same for Ulysses, observability, and any other novel-shape dispatchers.

Backwards-compatible: keep the old form working with a deprecation warning for one release; switch internal consumers to the new form; remove the old form after a grace period.

**Cost**: Medium. Touches every caller of the novel-shape tools, but mechanically simple.
**Value**: High for agent ergonomics. Every entry in `mcp-gotchas.md` that gets retired is a compounding reduction in future agent errors.

### 5. Structured markdown session export
Preserve thought type markers, render citations as clickable references, include confidence/options/decision metadata inline. The current markdown export loses structure that the JSON export preserves but humans can't read.

**Cost**: Low. Single export-formatter change.
**Value**: Medium. Session artifacts become shareable and readable without sacrificing structural integrity.

---

## Long-Term Roadmap (post-wedge, when capital and time allow)

### 1. Corpus-entity pattern
A new KG entity kind `Corpus` representing a typed pointer to an externally-indexed content source: codebases, documentation sites, databases, PDF collections. Each Corpus declares its native query interface (grep, vector search, URL fetch, SQL). A higher-level `tb.corpus.query(corpusId, query)` resolves the pointer and fans out to the native API.

This makes Thoughtbox a **meta-retrieval layer** — Canon's retrieval-node pattern but with each "node" being a KG-resident pointer rather than a hardcoded provider.

### 2. Grounded evaluation via ablation
Runtime instrumentation: when an agent produces a thought citing prior thoughts/entities, log the citation graph with the action. Offline evaluator: replay the step with citations replaced by null/noise/random other-session thoughts; check whether the action changes. Load-bearing thoughts are grounded; decorative citations are not.

Expensive to implement correctly. Depends on citations being required at strategic thought types (near-term item 2).

### 3. Federated ledger
Cipher-based cross-Thoughtbox-instance exchange. Individual teams run private instances; opt-in publish subsets to a public graph; retain full control over what syndicates. Analog: ActivityPub / Matrix / ATProtocol, but for machine cognition artifacts.

Unblocks the user's civilizational-scale ledger vision without demanding centralization. Adoption architecture, not just technical architecture.

### 4. Four-plane unification with cross-plane references
Thought / notebook / code / hub planes with typed cross-references. Observatory as integrated read surface. Each plane has its own totality obligations.

This is the concrete articulation of the "Thoughtbox is the remote control" vision at the level of implementation, not just metaphor.

### 5. Active environment
Writes that trigger capability-surface changes for future agent calls. The canonical example: after the claim-page user-boundary bug, a write records a new invariant; future calls to state-changing authenticated operations surface a constraint the agent must satisfy. Memory as changed-environment, implemented at the substrate layer.

This is the strongest version of the user's thesis — memory that shapes the environment rather than being retrieved from it.

---

## Premature Ideas (explicitly deferred)

Several compelling ideas surfaced that should *not* be acted on soon:

- **Primitive factoring to `record(plane, type, content, refs)` + `query(plane, filters, projection)`**: minimal and elegant, but backwards-incompatible. Wait for an explicit API v2.
- **Typed AST observation bodies**: structurally preserving code/tables/references within observation content. Powerful at scale; over-engineered before data volume justifies the authoring cost.
- **OS-for-agents framing**: accurate as long-term positioning, but implementation is years out. Pitch-worthy, not implement-worthy in the current cycle.
- **Expanded relation-type vocabulary** (`CONTRADICTS`, `SUPPORTS`, `REFINES`, `REPLACES`, `CAUSED_BY`, `SOLVES`, `INSTANCE_OF`): richer semantics but forces agents to pick at authoring time. Wait until `RELATES_TO` demonstrably fails at specific queries.

The pattern: **minimum viable structure now**; defer middle-of-the-curve structuring; the largest commitments wait for data to force the decision.

---

## Failure Modes for Citations-First Approach

If citations become the foundation for provenance and groundedness (near-term item 2), three failure modes are worth anticipating:

1. **Agents skip optional citations** → citation graph stays sparse, provenance queries are useless. **Mitigation**: required at strategic thought types, enforced structurally, not via discipline.
2. **Agents over-cite to appear thorough** → citation graph is dense and uninformative. **Mitigation**: cap citations per thought at a reasonable number (3-5), with the cap forcing prioritization.
3. **Citations become the next piece of infrastructure that decays under time pressure** → same pattern as every prior optional guardrail. **Mitigation**: same as for (1) — mandatory at type-level, not optional.

All three mitigations converge on the same principle: enforcement at the substrate, not at the agent.

---

## Open Architectural Questions

Surfaced by the exploration but not resolved:

1. **KG as content store vs. index over external content vs. hybrid** — the pragmatic answer is hybrid (thought 17 in the source session), but the balance point between inlined observations and pointer-to-external depends on empirical retrieval patterns that don't yet exist at scale.
2. **How narrow the cognitive-primitive set should be** — two primitives (record, query) are formally sufficient; five to ten are probably ergonomically better. The design decision sits between minimalism and agent-readability.
3. **Federation protocol specifics** — if cipher is the wire format, what's the handshake? The trust model? The subscription semantics? All TBD.
4. **Groundedness cost** — ablation-based measurement is computationally expensive. At what scale does the value justify the cost?

---

## Meta-observation on the Process

The 100-thought session that produced this document demonstrated a genuinely different mode of Thoughtbox use than debugging sessions. Debugging has a natural termination (bug fixed); design synthesis is open-ended and benefits from the explicit thought budget as a stopping mechanism.

Discovery density: roughly 15 genuine insights over 100 thoughts — a healthy rate. Key discoveries clustered around unexpected collapses of apparent-separate concepts (citations ↔ symbolic pointers ↔ late-binding; API shapes ↔ training-data patterns ↔ agent error rates). These were not findable by looking at any single source or surface in isolation; they required the three Exa primitives next to the current Thoughtbox shape next to the training-data hypothesis all at once.

The exercise validates the broader Thoughtbox thesis: externalized structured reasoning over well-chosen source material surfaces connections that ad-hoc reasoning misses.

---

## Source Session Reference

- **Session ID**: `d22d77ce-a27a-4f60-9fb9-a5a6190adee4`
- **Thought count**: 100
- **Type distribution**: 97 reasoning, 2 belief_snapshot, 1 decision_frame
- **Export path** (internal): `/root/.thoughtbox/exports/d22d77ce-a27a-4f60-9fb9-a5a6190adee4-2026-04-23T00-50-40-443Z.json`
- **Audit flags**: one decision-without-action gap at thought 17 (A/B/C hybrid architectural fork — noted as a future decision, not a current one).

Key thought numbers for quick navigation of the source session:
- 2-8: Three-dimensions framework established
- 14-17: Architectural fork between content-store / pure-index / hybrid KG
- 29-30: Canon-flavored state-machine typing for Theseus/Ulysses
- 35-37: Symbolic pointers with versioning
- 38-40: Corpus-entity pattern
- 44-46: Citations collapse + Xanadu-for-agents framing
- 56-58: Four-plane substrate model; OS-for-agents positioning
- 66-69: Agent-native-database positioning arc
- 79-84: Canonical-API-shape insight and mcp-gotchas-as-debt
- 91-92: Distilled near-term punch list + long-term roadmap
- 93-95: Three most surprising discoveries of the session
