# Formal Model for Composio Tool Dependency Graphs

## Status

Specification — describes the mathematical model underlying `src/lib/graph.ts` and
`src/lib/normalize.ts`, and proposes extensions that exploit it.

---

## 1. Problem Statement

Given a set of tools **T** drawn from two Composio toolkits (Google Super,
GitHub), each with typed input and output parameters, construct a graph that
answers three questions for every tool *t*:

1. Which of *t*'s inputs **must come from a human** (user-provided)?
2. Which can be **satisfied by calling another tool first** (tool-provided)?
3. When a parameter is tool-provided, **which tools can produce it**, and are
   there multiple options (OR-semantics)?

The graph must be visualized and accompanied by per-parameter reasoning.

---

## 2. Mathematical Model

### 2.1 Definitions

| Symbol | Meaning |
|--------|---------|
| **T** = {t₁, …, tₙ} | Set of tools (Composio actions) |
| **E** = {e₁, …, eₖ} | Set of **entity types** (canonical resource identifiers: `gmail.thread.id`, `github.issue.number`, `email.address`, …) |
| **In(t)** | Input signature: set of (parameter, entity-type, required?) triples |
| **Out(t)** | Output signature: set of (field, entity-type) pairs |
| **U** ⊂ **E** | Entity types that a human can directly provide (`search.query`, `email.body`, `person.name`, …) |

### 2.2 The Bipartite Entity Graph (foundation)

The natural intermediate representation is a **bipartite graph** B = (T ∪ E, F):

```
        requires              produces
  e ─────────────→ t    t ─────────────→ e
  (resource node)  (tool node)    (tool node)  (resource node)
```

Every edge in the current implementation (`GraphEdge` with `kind: "requires"` or
`kind: "produces"`) is exactly one arc in this bipartite graph. The viewer
already renders it this way — tool nodes (round-rectangle) linked to resource
nodes (circle) via directed colored edges.

### 2.3 The Projected Tool-Tool Graph (derived)

The tool-to-tool dependency graph **G** = (T, D) is the **2-hop projection** of B
through entity types:

```
D[i,j] = |{ e ∈ E : e ∈ Out(tⱼ) ∧ e ∈ In(tᵢ) }|
```

Equivalently, define two |T|×|E| indicator matrices:

- **R** (requires): `R[t,e] = 1` iff tool *t* has an input of entity type *e*
- **P** (produces): `P[t,e] = 1` iff tool *t* outputs entity type *e*

Then:

```
D = R × Pᵀ
```

Each non-zero entry `D[i,j]` means "tool j can satisfy at least one of tool i's
inputs." The value counts how many distinct entity types flow from j to i.

**Complexity:** O(|T|² × |E|), but with sparse matrices (most tools touch 2–5
entity types) this is effectively O(|T| × avg_degree²). For 500 tools and ~20
entity types, the projection is trivial.

### 2.4 AND-OR Semantics

The bipartite graph carries **AND-OR logic** that the projected graph loses:

- **AND at tool nodes:** tool *t* is executable only when **all** its required
  inputs are satisfied.
- **OR at resource nodes:** a required input of entity type *e* is satisfied if
  **any** producer tool for *e* has been executed, or *e* ∈ U (user-provided).

This is an **AND-OR graph** — the formalism from AI planning (cf. Nilsson 1980,
AO* search). It is the correct semantic model for this problem.

```
           AND                           OR
     ┌──────────────┐            ┌──────────────┐
     │  TOOL NODE   │            │ RESOURCE NODE│
     │              │            │              │
     │ all required │            │ any producer │
     │ inputs must  │◄───────────│ suffices, or │
     │ be satisfied │  requires  │ user-provided│
     └──────────────┘            └──────────────┘
           │                           ▲
           │ produces                  │ requires
           ▼                           │
     ┌──────────────┐            ┌──────────────┐
     │ RESOURCE NODE│            │  TOOL NODE   │
     └──────────────┘            └──────────────┘
```

### 2.5 Reachability

Define **reachable(v)** bottom-up:

```
reachable(e) = (e ∈ U)  ∨  ∃ t ∈ producers(e) : reachable(t)     [OR node]
reachable(t) = ∀ e ∈ required_inputs(t) : reachable(e)            [AND node]
```

Computable in **O(|V| + |E|)** via fixpoint iteration. The set of reachable
tools given user inputs U is precisely the set of tools an agent can eventually
execute.

**This is already implicitly computed** by `toolPlanHints` in the current
codebase — each hint classifies required resources as `produced_by_tools` or
`user_or_external`. Making the reachability explicit would add a boolean
`reachable` flag per tool and expose dead tools (unreachable from any user
input).

---

## 3. The Core Sub-Problem: Entity Type Inference

The entire model assumes a function:

```
entity_type : (parameter_name, description, tool_context) → E ∪ {⊥}
```

where ⊥ means "not a classifiable entity." The quality of the graph is
**bounded entirely** by the quality of this function.

### 3.1 Current Implementation (Tier 1–2 Heuristics)

`normalize.ts` implements a deterministic classifier using:

1. **Exact name matching** — field name lookups against known aliases
   (`thread_id` → `gmail.thread.id`, `owner` → `github.repo.owner`).
2. **Context-scoped classification** — entity hints derived from tool
   slug/name/description constrain which rules fire (e.g., `id` only maps to
   `google.drive.file.id` when the tool is in a drive context).
3. **Noise filtering** — pagination, config, and filter fields are excluded via
   name-based deny lists.
4. **Heuristic output inference** — when a tool's raw output schema lacks useful
   fields, synthetic output fields are generated based on entity hints and
   verb detection (list/get/search/create).

This is a **rule-based system with context gating**. It achieves high precision
on well-named parameters but has limited recall on:
- Parameters with non-standard names
- Cross-service entity equivalences
- Entity types not in the hardcoded alias tables

### 3.2 Proposed Extensions

#### Tier 3: Embedding-Based Clustering

Embed all parameter (name, description) pairs using a sentence transformer.
Cluster with cosine similarity threshold θ. Each cluster defines an entity type
implicitly.

**Formal objective:** find partition P = {E₁, …, Eₖ} of parameters that
maximizes intra-cluster similarity while penalizing cluster count:

```
maximize  Σᵢ avg_sim(Eᵢ) - λk
```

Threshold θ controls precision-recall tradeoff. Sweep θ ∈ [0.5, 0.95], measure
edge count and verify readme examples survive at each point. The knee of the
curve is the optimal θ.

#### Tier 4: LLM-Verified Classification

Use the OpenRouter LLM to verify heuristic classifications. Batch by entity
type: "Given these tools and parameters all classified as `gmail.thread.id`,
verify each classification."

Design constraint: LLM calls should be **refinement**, not primary
classification. The heuristic tiers establish a baseline; the LLM catches false
positives and identifies non-obvious cross-service edges.

### 3.3 The Decomposition Theorem

> **Theorem:** The dependency graph G = (T, D) factors uniquely as G = π(B)
> where B is the bipartite entity graph and π is the 2-hop projection through
> shared entity types. The quality of G depends entirely on the entity type
> assignment function.

**Proof sketch:** Each edge in D exists iff there is a shared entity type in E.
The entity type assignment determines E and therefore determines B and therefore
determines D = R × Pᵀ. QED.

**Implication:** All effort should go into improving entity type inference.
Graph construction is mechanical once entity types are correct.

---

## 4. Relationship to AI Planning

The dependency graph is isomorphic to a **STRIPS planning graph** (Blum &
Furst 1997, GraphPlan):

| This system | STRIPS / GraphPlan |
|-------------|-------------------|
| Tool | Operator / Action |
| Required input parameter | Precondition |
| Output field | Effect / Add-list |
| Entity type | Proposition |
| User-provided input | Initial state |
| Target tool execution | Goal state |

GraphPlan constructs alternating layers of propositions and actions:

```
Layer 0:  user-providable entity types (search.query, person.name, ...)
Layer 1:  tools enabled by layer 0 (GOOGLE_CONTACTS_FIND_CONTACT, GMAIL_LIST_THREADS, ...)
Layer 2:  new entity types produced (email.address, gmail.thread.id, ...)
Layer 3:  tools enabled by layers 0 ∪ 2 (GMAIL_SEND_EMAIL, GMAIL_REPLY_TO_THREAD, ...)
...
```

The **number of layers** is the minimum sequential depth to reach any tool.
This is a strong quality metric for the graph — realistic workflows should
require 2–4 layers.

### 4.1 Minimum Execution Plan

Given target tool *t* and user inputs *U*, the minimum execution plan is the
smallest AND-OR subtree rooted at *t* with all leaves in *U*. This is solvable
via **AO\* search** (Nilsson 1980) — a generalization of A* to AND-OR graphs.

Cost function options:
- Unit cost (minimize number of tool calls)
- Latency-weighted (minimize total API time)
- Reliability-weighted (prefer high-confidence edges)

---

## 5. Graph-Theoretic Properties and Validation

### 5.1 Expected Structural Properties

| Property | Expected value | Diagnostic if violated |
|----------|---------------|----------------------|
| Density (edges / nodes²) | < 0.05 | Overclaiming if higher |
| Connected components | 1–3 | Missing cross-service edges if > 3 |
| LIST/SEARCH out-degree | >> 1 | These are hub nodes; low out-degree suggests missing output inference |
| Action tool in-degree | >> 1 | SEND/DELETE/UPDATE need many inputs; low means missing classifications |
| Max graph depth (layers) | 2–5 | Deeper suggests chains; shallower suggests flat graph |
| Isolated tools (degree 0) | < 10% | Most tools should connect to something |

### 5.2 Validation Against Known Examples

From the assignment readme, these edges **must** exist:

1. `GMAIL_LIST_THREADS` --produces--> `gmail.thread.id` --requires--> `GMAIL_REPLY_TO_THREAD`
2. `GOOGLE_CONTACTS_FIND_CONTACT` --produces--> `email.address` --requires--> `GMAIL_SEND_EMAIL`
3. `GOOGLE_CONTACTS_FIND_CONTACT` --requires--> `person.name` (user-provided input)

The test suite (`test/pipeline.test.ts`) already verifies these.

### 5.3 Transitive Reduction — When NOT to Apply

The raw dependency graph should **not** be transitively reduced. If tool A
directly produces an entity that tool C requires, the edge A→C is valid even if
A→B→C also exists — they represent different data flows.

Transitive reduction is only appropriate when computing a **minimum execution
ordering** (which tools must run in what sequence), not for the data-flow graph
itself.

### 5.4 SCC Condensation

Strongly connected components (tools that are mutually dependent) can be
condensed into "tool groups." The condensed DAG reveals hierarchical structure.
Computable in O(V + E) via Tarjan's algorithm. Useful for visualization
(collapsing dense clusters) but the raw graph should be preserved.

---

## 6. Classification of Parameters

Every parameter gets exactly one classification:

| Source class | Meaning | Graph effect | Examples |
|-------------|---------|-------------|----------|
| `ALWAYS_TOOL` | Only obtainable from another tool's output | Creates `requires` edge | `thread_id`, `file_id`, `issue_number` |
| `ALWAYS_USER` | Only a human can provide this | Leaf node, no upstream edge | `email.body`, `search.query`, message content |
| `EITHER` | Can come from a tool OR from the user | Edge exists but resource node also marked user-providable | `email.address`, `repo.owner` |
| `SYSTEM` | Handled by infrastructure (auth, config) | Excluded from graph | `account_id`, `auth_config_id`, pagination tokens |

The current codebase maps these as:
- `identifier` / `locator` → `ALWAYS_TOOL` or `EITHER`
- `content_input` / `person_input` → `ALWAYS_USER` or `EITHER`
- `pagination` / `config` → `SYSTEM` (excluded via `shouldIncludeField`)
- `filter` → `SYSTEM` (excluded)

### 6.1 The EITHER Category Is Critical

The readme's second example ("send email tool needs an email; if you give a name
it should fetch from contacts") demonstrates that `email.address` is an EITHER
parameter: the user might type it directly, or it can be resolved from a contact
name via `GOOGLE_CONTACTS_FIND_CONTACT`.

The graph must represent both paths. Currently this is handled implicitly — the
`email.address` resource node has producer edges (from contact tools) AND the
`userOrExternalResources` list in the summary captures resources with zero
producers. Resources with producers are "EITHER" if they could also be
user-typed.

An explicit `userProvidable: boolean` flag on resource nodes would make this
clearer.

---

## 7. The Matrix View — Implementation Sketch

For the projected tool-tool graph, the matrix formulation gives a clean
implementation path:

```typescript
type EntityIndex = Map<string, number>;  // entity type → column index
type ToolIndex = Map<string, number>;    // tool slug → row index

function buildRequiresMatrix(
  tools: ToolRecord[],
  entityIndex: EntityIndex,
  toolIndex: ToolIndex
): number[][] {
  const R = Array.from({ length: tools.length }, () =>
    new Array(entityIndex.size).fill(0)
  );
  for (const tool of tools) {
    const row = toolIndex.get(tool.slug)!;
    for (const field of tool.inputFields) {
      if (field.canonicalResource && field.required) {
        const col = entityIndex.get(field.canonicalResource);
        if (col !== undefined) R[row][col] = 1;
      }
    }
  }
  return R;
}

function buildProducesMatrix(
  tools: ToolRecord[],
  entityIndex: EntityIndex,
  toolIndex: ToolIndex
): number[][] {
  const P = Array.from({ length: tools.length }, () =>
    new Array(entityIndex.size).fill(0)
  );
  for (const tool of tools) {
    const row = toolIndex.get(tool.slug)!;
    for (const field of tool.outputFields) {
      if (field.canonicalResource) {
        const col = entityIndex.get(field.canonicalResource);
        if (col !== undefined) P[row][col] = 1;
      }
    }
  }
  return P;
}

// D = R × Pᵀ  →  D[i][j] = number of shared entity types
function projectDependencyMatrix(R: number[][], P: number[][]): number[][] {
  const n = R.length;
  const D = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let e = 0; e < R[0].length; e++) {
        D[i][j] += R[i][e] * P[j][e];
      }
    }
  }
  return D;
}
```

This produces the same edges as the current bipartite graph when projected, but
makes structural analysis trivial (eigenvalues, clustering coefficients,
PageRank on the projected graph).

---

## 8. Metrics and Quality Rubric

| Dimension | Weight | Measurement |
|-----------|--------|-------------|
| **Correctness** | 40% | Known-edge recall (readme examples), false-positive rate (spot-check 20 random edges) |
| **Completeness** | 25% | Tool coverage (% with ≥1 edge), entity type coverage, cross-service edge count |
| **Classification quality** | 15% | Accuracy of user/tool/either distinction on a sample |
| **Reproducibility** | 10% | Same code + same API data → same graph; intermediate artifacts cached |
| **Presentation** | 10% | Graph readable at 2 scales (overview + neighborhood); reasoning per edge |

### 8.1 Automated Checks (implementable)

```
assertions:
  - readme_examples_present:
      GMAIL_LIST_THREADS produces gmail.thread.id: true
      GMAIL_REPLY_TO_THREAD requires gmail.thread.id: true
      GOOGLE_CONTACTS_FIND_CONTACT produces email.address: true
      GMAIL_SEND_EMAIL requires email.address: true

  - structural:
      edge_density < 0.05: true
      connected_components <= 3: true
      isolated_tool_fraction < 0.10: true
      max_layer_depth in [2, 6]: true

  - noise_exclusion:
      pagination_fields_in_graph: false
      config_fields_in_graph: false
```

---

## 9. Relationship to Current Codebase

| Concept in this spec | Implementation in codebase |
|---------------------|---------------------------|
| Entity type *e* | `canonicalResource` field on `FieldRecord` |
| Entity type inference | `classifyField()` in `normalize.ts` |
| Bipartite graph B | `GraphArtifact` with `"requires"` and `"produces"` edges |
| AND-OR reachability | Partially in `toolPlanHints` (`produced_by_tools` vs `user_or_external`) |
| Noise exclusion (SYSTEM params) | `shouldIncludeField()` filtering `pagination`, `config`, `filter` |
| Heuristic output inference | `inferHeuristicOutputs()` in `normalize.ts` |
| Projected D = R × Pᵀ | Not implemented (viewer shows bipartite graph directly) |
| Confidence tiers | `Confidence` type (`high`, `medium`, `low`) with evidence arrays |

### 9.1 What the Codebase Already Does Well

- **Bipartite representation is correct.** The graph stores tool↔resource edges,
  not tool→tool edges. This preserves full semantic information.
- **Evidence chains.** Every classification carries an `evidence: string[]`
  explaining why. This is exactly what the rubric dimension "reasoning
  transparency" requires.
- **Noise filtering.** Pagination, config, and filter fields are excluded.
- **Test coverage of known examples.** The test suite verifies the readme's
  concrete dependency chains.

### 9.2 Gaps to Address

1. **No explicit reachability computation.** `toolPlanHints` partially covers
   this but doesn't compute transitive reachability or identify dead tools.
2. **Heuristic output inference is limited.** Only covers a fixed set of entity
   types. Tools outside the hardcoded entity-hint map get no synthetic outputs.
3. **No projected (tool-tool) view.** The viewer shows the bipartite graph,
   which is correct but harder to read. A secondary projected view would let
   evaluators see "tool A depends on tool B" directly.
4. **Entity type coverage is bounded by alias tables.** Parameters with
   non-standard names (e.g., `conversation_id` as a synonym for `thread_id`)
   are missed.
5. **No `userProvidable` flag on resource nodes.** The `EITHER` classification
   isn't explicitly surfaced in the graph structure.

---

## 10. Proposed Extensions (Priority Order)

### P0: Reachability Analysis

Add a `reachable: boolean` flag to each tool node, computed via AND-OR fixpoint
from user-providable entity types. Surface unreachable tools as warnings —
they indicate either missing output inference or missing user-input
classification.

### P1: Projected Tool-Tool View

Compute D = R × Pᵀ and add a toggle in the viewer to show the projected graph.
This makes dependency chains visually obvious (direct tool→tool arrows).

### P2: Embedding-Based Entity Synonym Detection

Use sentence embeddings on (param_name, description) pairs. Merge clusters with
cosine similarity > θ into unified entity types. This catches synonyms like
`conversation_id ≈ thread_id` that the alias table misses.

### P3: Layer Depth Computation

Implement GraphPlan-style layering. Report the minimum sequential depth to reach
each tool from user inputs. Visualize as a left-to-right layered layout
(alternative to the current force-directed view).

### P4: LLM-Verified Classification

Batch ambiguous parameters (confidence = `low` or `medium`) and send to the
OpenRouter LLM for verification. Cache responses to ensure reproducibility.

---

## References

- Nilsson, N.J. (1980). *Principles of Artificial Intelligence.* — AND-OR
  graphs, AO* search.
- Blum, A. & Furst, M. (1997). "Fast planning through planning graph
  analysis." — GraphPlan algorithm.
- Murata, T. (1989). "Petri nets: Properties, analysis and applications." —
  Formal model of concurrent tool execution.
- Jensen, K. (1997). *Coloured Petri Nets.* — Extension with typed tokens
  (relevant if modeling actual data values flowing between tools).
