# Verification Framework for Dependency Graph Correctness

## Status

Specification — describes formal properties that any correct dependency graph
**must** satisfy, with testable assertions.

---

## 1. What "Correct" Means

A dependency graph is correct iff:

1. **Soundness:** every edge represents a real data-flow relationship.
2. **Completeness:** every real data-flow relationship is represented.
3. **Classification accuracy:** parameter source labels (user / tool / either)
   match ground truth.

Perfect completeness requires knowing all possible tool outputs, which is
unknowable from schemas alone. We therefore verify soundness rigorously and
measure completeness against known baselines.

---

## 2. Structural Invariants (Must Always Hold)

These are **necessary conditions** for correctness. Any violation is a bug.

### Invariant 1: Bipartite Consistency

> Every edge connects a tool node to a resource node. No tool-tool or
> resource-resource edges exist.

```typescript
function verifyBipartiteConsistency(graph: GraphArtifact): string[] {
  const violations: string[] = [];
  const nodeKinds = new Map(
    graph.nodes.map((n) => [n.id, n.kind])
  );

  for (const edge of graph.edges) {
    const fromKind = nodeKinds.get(edge.from);
    const toKind = nodeKinds.get(edge.to);

    if (!fromKind) {
      violations.push(`Edge ${edge.id}: 'from' node ${edge.from} not in graph`);
      continue;
    }
    if (!toKind) {
      violations.push(`Edge ${edge.id}: 'to' node ${edge.to} not in graph`);
      continue;
    }

    if (edge.kind === "requires") {
      // resource → tool
      if (fromKind !== "resource" || toKind !== "tool") {
        violations.push(
          `Edge ${edge.id}: 'requires' edge must go resource→tool, got ${fromKind}→${toKind}`
        );
      }
    } else if (edge.kind === "produces") {
      // tool → resource
      if (fromKind !== "tool" || toKind !== "resource") {
        violations.push(
          `Edge ${edge.id}: 'produces' edge must go tool→resource, got ${fromKind}→${toKind}`
        );
      }
    }
  }

  return violations;
}
```

### Invariant 2: No Dangling References

> Every edge endpoint must reference a node that exists in the graph.

(Covered by the `fromKind`/`toKind` checks above.)

### Invariant 3: Unique Edge IDs

> No two edges share the same ID.

```typescript
function verifyUniqueEdgeIds(graph: GraphArtifact): string[] {
  const seen = new Set<string>();
  const dupes: string[] = [];
  for (const edge of graph.edges) {
    if (seen.has(edge.id)) {
      dupes.push(`Duplicate edge ID: ${edge.id}`);
    }
    seen.add(edge.id);
  }
  return dupes;
}
```

### Invariant 4: Every Resource Node Has At Least One Edge

> A resource node with zero edges is dead weight — it should not be in the
> graph.

```typescript
function verifyNoOrphanResources(graph: GraphArtifact): string[] {
  const connectedNodes = new Set<string>();
  for (const edge of graph.edges) {
    connectedNodes.add(edge.from);
    connectedNodes.add(edge.to);
  }
  return graph.nodes
    .filter((n) => n.kind === "resource" && !connectedNodes.has(n.id))
    .map((n) => `Orphan resource node: ${n.id}`);
}
```

### Invariant 5: Edge-Resource Type Consistency

> An edge's `resourceType` must match the `resourceType` of the resource node
> it connects to.

```typescript
function verifyResourceTypeConsistency(graph: GraphArtifact): string[] {
  const violations: string[] = [];
  const resourceTypes = new Map(
    graph.nodes
      .filter((n): n is Extract<GraphNode, { kind: "resource" }> => n.kind === "resource")
      .map((n) => [n.id, n.resourceType])
  );

  for (const edge of graph.edges) {
    const resourceNodeId =
      edge.kind === "requires" ? edge.from : edge.to;
    const nodeResourceType = resourceTypes.get(resourceNodeId);

    if (nodeResourceType && nodeResourceType !== edge.resourceType) {
      violations.push(
        `Edge ${edge.id}: resourceType '${edge.resourceType}' ≠ node resourceType '${nodeResourceType}'`
      );
    }
  }
  return violations;
}
```

### Invariant 6: Noise Exclusion

> No resource node should represent a pagination, config, or filter concept.

```typescript
const NOISE_RESOURCES = new Set([
  "page", "per_page", "limit", "cursor", "offset", "sort", "order",
  "direction", "page_size", "max_results", "account_id", "auth_config_id",
  "connected_account_id", "session_id", "include_archived",
  "include_spam_trash", "include_body", "dry_run", "verbose", "force",
]);

function verifyNoiseExclusion(graph: GraphArtifact): string[] {
  return graph.nodes
    .filter((n) => n.kind === "resource" && NOISE_RESOURCES.has(n.resourceType))
    .map((n) => `Noise resource leaked into graph: ${n.resourceType}`);
}
```

---

## 3. Semantic Correctness Tests (Ground Truth Edges)

These edges are derived from the assignment readme and domain knowledge. They
**must** appear in any correct graph.

### 3.1 Required Edges (True Positives)

```typescript
const REQUIRED_EDGES: Array<{
  description: string;
  kind: "requires" | "produces";
  toolSlug: string;
  resourceType: string;
}> = [
  // From readme example 1: GMAIL_REPLY_TO_THREAD needs thread_id from GMAIL_LIST_THREADS
  {
    description: "GMAIL_LIST_THREADS produces gmail.thread.id",
    kind: "produces",
    toolSlug: "GMAIL_LIST_THREADS",
    resourceType: "gmail.thread.id",
  },
  {
    description: "GMAIL_REPLY_TO_THREAD requires gmail.thread.id",
    kind: "requires",
    toolSlug: "GMAIL_REPLY_TO_THREAD",
    resourceType: "gmail.thread.id",
  },
  // From readme example 2: contacts → email → send
  {
    description: "GOOGLE_CONTACTS_FIND_CONTACT produces email.address",
    kind: "produces",
    toolSlug: "GOOGLE_CONTACTS_FIND_CONTACT",
    resourceType: "email.address",
  },
  {
    description: "GMAIL_SEND_EMAIL requires email.address",
    kind: "requires",
    toolSlug: "GMAIL_SEND_EMAIL",
    resourceType: "email.address",
  },
  // GitHub basic chain
  {
    description: "GITHUB_LIST_ISSUES produces github.issue.number",
    kind: "produces",
    toolSlug: "GITHUB_LIST_ISSUES",
    resourceType: "github.issue.number",
  },
];

function verifyRequiredEdges(graph: GraphArtifact): string[] {
  const missing: string[] = [];

  for (const req of REQUIRED_EDGES) {
    const toolNodeId = `tool:${req.toolSlug}`;
    const exists = graph.edges.some((edge) => {
      if (edge.kind !== req.kind || edge.resourceType !== req.resourceType) {
        return false;
      }
      return req.kind === "produces"
        ? edge.from === toolNodeId
        : edge.to === toolNodeId;
    });

    if (!exists) {
      missing.push(`MISSING required edge: ${req.description}`);
    }
  }

  return missing;
}
```

### 3.2 Forbidden Edges (Known False Positives)

These are edges that a naive implementation might produce but are incorrect:

```typescript
const FORBIDDEN_EDGES: Array<{
  description: string;
  kind: "requires" | "produces";
  toolSlug: string;
  resourceType: string;
}> = [
  // Pagination tokens should never be resource nodes
  {
    description: "No tool should produce/require a 'page' resource",
    kind: "produces",
    toolSlug: "*",  // wildcard
    resourceType: "page",
  },
  {
    description: "No tool should produce/require a 'per_page' resource",
    kind: "requires",
    toolSlug: "*",
    resourceType: "per_page",
  },
];

function verifyForbiddenEdges(graph: GraphArtifact): string[] {
  const violations: string[] = [];

  for (const forbidden of FORBIDDEN_EDGES) {
    const matches = graph.edges.filter((edge) => {
      if (edge.resourceType !== forbidden.resourceType) return false;
      if (edge.kind !== forbidden.kind) return false;
      if (forbidden.toolSlug === "*") return true;
      const toolNodeId = `tool:${forbidden.toolSlug}`;
      return forbidden.kind === "produces"
        ? edge.from === toolNodeId
        : edge.to === toolNodeId;
    });

    for (const match of matches) {
      violations.push(`FORBIDDEN edge found: ${forbidden.description} (${match.id})`);
    }
  }

  return violations;
}
```

---

## 4. Statistical Sanity Checks

These are not pass/fail — they are range checks that flag anomalies.

### 4.1 Density Check

```typescript
function checkDensity(graph: GraphArtifact): { density: number; warning?: string } {
  const toolCount = graph.nodes.filter((n) => n.kind === "tool").length;
  const edgeCount = graph.edges.length;
  const density = edgeCount / (toolCount * toolCount);

  return {
    density,
    warning:
      density > 0.10 ? `Density ${density.toFixed(4)} is suspiciously high — likely overclaiming`
      : density < 0.001 ? `Density ${density.toFixed(4)} is suspiciously low — likely missing edges`
      : undefined,
  };
}
```

### 4.2 Hub Node Check

LIST and SEARCH tools should have high out-degree (they produce entities
consumed by many other tools).

```typescript
function checkHubNodes(graph: GraphArtifact): string[] {
  const warnings: string[] = [];
  const outDegree = new Map<string, number>();

  for (const edge of graph.edges) {
    if (edge.kind === "produces") {
      outDegree.set(edge.from, (outDegree.get(edge.from) ?? 0) + 1);
    }
  }

  const listSearchTools = graph.nodes.filter(
    (n) => n.kind === "tool" && /\b(LIST|SEARCH|FIND|GET)\b/.test(n.label)
  );

  for (const tool of listSearchTools) {
    const degree = outDegree.get(tool.id) ?? 0;
    if (degree === 0) {
      warnings.push(
        `Hub candidate '${tool.label}' has zero 'produces' edges — missing output inference?`
      );
    }
  }

  return warnings;
}
```

### 4.3 Cross-Toolkit Edge Check

At least some edges should cross toolkit boundaries (e.g., Google Contacts →
Gmail). Zero cross-toolkit edges means the graph treats the toolkits as
completely independent — likely incorrect.

```typescript
function checkCrossToolkitEdges(
  graph: GraphArtifact,
  tools: ToolRecord[]
): { count: number; warning?: string } {
  const toolToolkit = new Map(tools.map((t) => [`tool:${t.slug}`, t.toolkit]));

  // For each resource, find which toolkits produce it and which require it
  const producerToolkits = new Map<string, Set<string>>();
  const consumerToolkits = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    if (edge.kind === "produces") {
      const toolkit = toolToolkit.get(edge.from);
      if (toolkit) {
        const set = producerToolkits.get(edge.resourceType) ?? new Set();
        set.add(toolkit);
        producerToolkits.set(edge.resourceType, set);
      }
    } else {
      const toolkit = toolToolkit.get(edge.to);
      if (toolkit) {
        const set = consumerToolkits.get(edge.resourceType) ?? new Set();
        set.add(toolkit);
        consumerToolkits.set(edge.resourceType, set);
      }
    }
  }

  // A cross-toolkit flow exists when a resource has producers from toolkit A
  // and consumers from toolkit B (A ≠ B)
  let count = 0;
  for (const [resourceType, producers] of producerToolkits) {
    const consumers = consumerToolkits.get(resourceType);
    if (!consumers) continue;
    for (const p of producers) {
      for (const c of consumers) {
        if (p !== c) count++;
      }
    }
  }

  return {
    count,
    warning: count === 0
      ? "Zero cross-toolkit resource flows — toolkits appear completely isolated"
      : undefined,
  };
}
```

---

## 5. Reachability Proof

The strongest verification is **reachability from user inputs**: can the graph
explain how to reach every tool from things a human can provide?

### 5.1 AND-OR Reachability Algorithm

```typescript
type ReachabilityResult = {
  reachableTool: Map<string, boolean>;
  reachableResource: Map<string, boolean>;
  unreachableTools: string[];
  unreachableResources: string[];
};

function computeReachability(
  graph: GraphArtifact,
  userProvidableResources: Set<string>
): ReachabilityResult {
  // Initialize: resource nodes that are user-providable start as reachable
  const reachableResource = new Map<string, boolean>();
  const reachableTool = new Map<string, boolean>();

  for (const node of graph.nodes) {
    if (node.kind === "resource") {
      reachableResource.set(node.id, userProvidableResources.has(node.resourceType));
    } else {
      reachableTool.set(node.id, false);
    }
  }

  // Build adjacency structures
  // For each tool: which resource nodes does it require?
  const toolRequires = new Map<string, string[]>();
  // For each resource: which tools produce it?
  const resourceProducers = new Map<string, string[]>();

  for (const edge of graph.edges) {
    if (edge.kind === "requires") {
      // edge.from = resource, edge.to = tool
      const list = toolRequires.get(edge.to) ?? [];
      list.push(edge.from);
      toolRequires.set(edge.to, list);
    } else {
      // edge.from = tool, edge.to = resource
      const list = resourceProducers.get(edge.to) ?? [];
      list.push(edge.from);
      resourceProducers.set(edge.to, list);
    }
  }

  // Fixpoint iteration
  let changed = true;
  while (changed) {
    changed = false;

    // OR-nodes (resources): reachable if any producer is reachable
    for (const [resourceId, producers] of resourceProducers) {
      if (reachableResource.get(resourceId)) continue;
      if (producers.some((toolId) => reachableTool.get(toolId))) {
        reachableResource.set(resourceId, true);
        changed = true;
      }
    }

    // AND-nodes (tools): reachable if all required resources are reachable
    for (const node of graph.nodes) {
      if (node.kind !== "tool") continue;
      if (reachableTool.get(node.id)) continue;

      const requires = toolRequires.get(node.id) ?? [];
      // A tool with no requires edges is trivially reachable
      const allSatisfied =
        requires.length === 0 ||
        requires.every((resId) => reachableResource.get(resId));

      if (allSatisfied) {
        reachableTool.set(node.id, true);
        changed = true;
      }
    }
  }

  const unreachableTools = graph.nodes
    .filter((n) => n.kind === "tool" && !reachableTool.get(n.id))
    .map((n) => n.label);

  const unreachableResources = graph.nodes
    .filter((n) => n.kind === "resource" && !reachableResource.get(n.id))
    .map((n) => n.label);

  return {
    reachableTool,
    reachableResource,
    unreachableTools,
    unreachableResources,
  };
}
```

### 5.2 Interpretation

- **Unreachable tools** are either (a) truly impossible to execute without
  missing integrations, or (b) indicate gaps in entity type inference (some
  producer tool's output wasn't classified).
- A **high unreachable fraction** (> 50%) strongly suggests the entity type
  inference or output inference is incomplete.
- **Zero unreachable tools** with a non-trivial graph confirms the graph is
  "plan-complete" — every tool has a viable execution path.

### 5.3 Minimum Plan Depth

Once reachability is computed, the **minimum plan depth** for each tool can be
derived by layer assignment:

```typescript
function computeLayerDepth(
  graph: GraphArtifact,
  userProvidableResources: Set<string>
): Map<string, number> {
  const depth = new Map<string, number>();

  // Resources that are user-provided are at depth 0
  for (const node of graph.nodes) {
    if (node.kind === "resource" && userProvidableResources.has(node.resourceType)) {
      depth.set(node.id, 0);
    }
  }

  // Build adjacency (same as reachability)
  const toolRequires = new Map<string, string[]>();
  const resourceProducers = new Map<string, string[]>();
  for (const edge of graph.edges) {
    if (edge.kind === "requires") {
      const list = toolRequires.get(edge.to) ?? [];
      list.push(edge.from);
      toolRequires.set(edge.to, list);
    } else {
      const list = resourceProducers.get(edge.to) ?? [];
      list.push(edge.from);
      resourceProducers.set(edge.to, list);
    }
  }

  // BFS-like layering
  let changed = true;
  while (changed) {
    changed = false;

    // Tool depth = max(depth of required resources) + 1
    for (const node of graph.nodes) {
      if (node.kind !== "tool") continue;
      if (depth.has(node.id)) continue;

      const requires = toolRequires.get(node.id) ?? [];
      if (requires.length === 0) {
        depth.set(node.id, 0);
        changed = true;
        continue;
      }

      const reqDepths = requires.map((r) => depth.get(r));
      if (reqDepths.every((d) => d !== undefined)) {
        depth.set(node.id, Math.max(...(reqDepths as number[])) + 1);
        changed = true;
      }
    }

    // Resource depth = min(depth of producer tools) + 1
    // (OR semantics: take the shallowest producer)
    for (const [resourceId, producers] of resourceProducers) {
      if (depth.has(resourceId)) continue;

      const prodDepths = producers
        .map((t) => depth.get(t))
        .filter((d) => d !== undefined) as number[];

      if (prodDepths.length > 0) {
        depth.set(resourceId, Math.min(...prodDepths) + 1);
        changed = true;
      }
    }
  }

  return depth;
}
```

**Expected:** most tools should be at depth 0–4. A tool at depth > 6 suggests
an unusually long prerequisite chain worth manual inspection.

---

## 6. Consistency Between Graph and ToolPlanHints

The `toolPlanHints` array is a derived artifact. It must be consistent with the
graph:

```typescript
function verifyPlanHintConsistency(
  graph: GraphArtifact,
  hints: ToolPlanHint[]
): string[] {
  const violations: string[] = [];

  // Build producer map from graph
  const graphProducers = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (edge.kind !== "produces") continue;
    const toolSlug = edge.from.replace(/^tool:/, "");
    const set = graphProducers.get(edge.resourceType) ?? new Set();
    set.add(toolSlug);
    graphProducers.set(edge.resourceType, set);
  }

  for (const hint of hints) {
    for (const req of hint.requiredResources) {
      const graphProd = graphProducers.get(req.resourceType) ?? new Set();

      if (req.acquisition === "produced_by_tools" && graphProd.size === 0) {
        violations.push(
          `Hint for ${hint.toolSlug}: claims '${req.resourceType}' is produced_by_tools, ` +
          `but graph has zero producers for it`
        );
      }

      if (req.acquisition === "user_or_external" && graphProd.size > 0) {
        violations.push(
          `Hint for ${hint.toolSlug}: claims '${req.resourceType}' is user_or_external, ` +
          `but graph has ${graphProd.size} producers: [${[...graphProd].join(", ")}]`
        );
      }

      // Producer lists should match
      const hintProdSet = new Set(req.producerToolSlugs);
      if (req.acquisition === "produced_by_tools") {
        const missing = [...graphProd].filter((s) => !hintProdSet.has(s));
        const extra = [...hintProdSet].filter((s) => !graphProd.has(s));
        if (missing.length > 0) {
          violations.push(
            `Hint for ${hint.toolSlug}: missing producers for '${req.resourceType}': [${missing.join(", ")}]`
          );
        }
        if (extra.length > 0) {
          violations.push(
            `Hint for ${hint.toolSlug}: extra producers for '${req.resourceType}': [${extra.join(", ")}]`
          );
        }
      }
    }
  }

  return violations;
}
```

---

## 7. The Projection Invariant

If we compute the projected tool-tool matrix D = R × Pᵀ, it must be consistent
with the bipartite graph:

> For any two tools tᵢ, tⱼ: D[i][j] > 0 iff there exists at least one
> resource type e such that tⱼ has a "produces" edge to e AND tᵢ has a
> "requires" edge from e.

This is a tautology by construction, but verifying it catches bugs in the
matrix building code.

```typescript
function verifyProjectionConsistency(
  graph: GraphArtifact,
  R: number[][],
  P: number[][],
  D: number[][],
  toolIndex: Map<string, number>,
  entityIndex: Map<string, number>
): string[] {
  const violations: string[] = [];

  // Build ground truth from graph
  const toolToolEdges = new Map<string, Set<string>>();
  const producerOfResource = new Map<string, Set<string>>();
  const consumerOfResource = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    if (edge.kind === "produces") {
      const toolSlug = edge.from.replace(/^tool:/, "");
      const set = producerOfResource.get(edge.resourceType) ?? new Set();
      set.add(toolSlug);
      producerOfResource.set(edge.resourceType, set);
    } else {
      const toolSlug = edge.to.replace(/^tool:/, "");
      const set = consumerOfResource.get(edge.resourceType) ?? new Set();
      set.add(toolSlug);
      consumerOfResource.set(edge.resourceType, set);
    }
  }

  // For each (consumer, producer) pair, check D matches graph
  for (const [consumerSlug, consumerIdx] of toolIndex) {
    for (const [producerSlug, producerIdx] of toolIndex) {
      const matrixValue = D[consumerIdx][producerIdx];

      // Count shared resources from graph
      let sharedCount = 0;
      for (const [resourceType, producers] of producerOfResource) {
        const consumers = consumerOfResource.get(resourceType);
        if (consumers?.has(consumerSlug) && producers.has(producerSlug)) {
          sharedCount++;
        }
      }

      if (matrixValue !== sharedCount) {
        violations.push(
          `D[${consumerSlug}][${producerSlug}] = ${matrixValue}, ` +
          `but graph shows ${sharedCount} shared resource types`
        );
      }
    }
  }

  return violations;
}
```

---

## 8. Full Verification Suite

```typescript
function runFullVerification(
  graph: GraphArtifact,
  tools: ToolRecord[],
  hints: ToolPlanHint[],
  userProvidableResources: Set<string>
): {
  passed: string[];
  failed: string[];
  warnings: string[];
} {
  const passed: string[] = [];
  const failed: string[] = [];
  const warnings: string[] = [];

  function check(name: string, violations: string[]) {
    if (violations.length === 0) {
      passed.push(name);
    } else {
      failed.push(`${name}: ${violations.length} violation(s)`);
      for (const v of violations) {
        failed.push(`  - ${v}`);
      }
    }
  }

  function warn(name: string, items: string[]) {
    for (const item of items) {
      warnings.push(`${name}: ${item}`);
    }
  }

  // Structural invariants
  check("Bipartite consistency", verifyBipartiteConsistency(graph));
  check("Unique edge IDs", verifyUniqueEdgeIds(graph));
  check("No orphan resources", verifyNoOrphanResources(graph));
  check("Resource type consistency", verifyResourceTypeConsistency(graph));
  check("Noise exclusion", verifyNoiseExclusion(graph));

  // Semantic correctness
  check("Required edges present", verifyRequiredEdges(graph));
  check("Forbidden edges absent", verifyForbiddenEdges(graph));

  // Derived artifact consistency
  check("Plan hint consistency", verifyPlanHintConsistency(graph, hints));

  // Statistical checks
  const density = checkDensity(graph);
  if (density.warning) warnings.push(`Density: ${density.warning}`);

  warn("Hub nodes", checkHubNodes(graph));

  const crossToolkit = checkCrossToolkitEdges(graph, tools);
  if (crossToolkit.warning) warnings.push(crossToolkit.warning);

  // Reachability
  const reachability = computeReachability(graph, userProvidableResources);
  if (reachability.unreachableTools.length > 0) {
    const fraction =
      reachability.unreachableTools.length /
      graph.nodes.filter((n) => n.kind === "tool").length;

    if (fraction > 0.5) {
      failed.push(
        `Reachability: ${(fraction * 100).toFixed(0)}% of tools are unreachable — ` +
        `entity type inference is likely incomplete`
      );
    } else {
      warnings.push(
        `Reachability: ${reachability.unreachableTools.length} tool(s) unreachable: ` +
        `[${reachability.unreachableTools.slice(0, 10).join(", ")}${reachability.unreachableTools.length > 10 ? ", ..." : ""}]`
      );
    }
  } else {
    passed.push("Reachability: all tools reachable from user inputs");
  }

  return { passed, failed, warnings };
}
```

---

## 9. Property-Based Tests (Generative)

For any well-formed set of `ToolRecord` inputs, the following must hold:

### Property 1: Monotonicity

> Adding a new tool to the input set can only **add** nodes and edges to the
> graph, never remove existing ones. (Assuming the new tool doesn't change
> the classification of existing tools' parameters.)

### Property 2: Idempotence

> Building the graph from the same input twice produces identical output.

### Property 3: Symmetry of Entity Types

> If resource type *e* appears in the graph, it must have either at least one
> "produces" edge OR be in the `userOrExternalResources` list. A resource with
> zero produces edges and not in the user-provided list is a classification
> error.

### Property 4: Evidence Non-Emptiness

> Every edge has at least one evidence string. This is structural — the
> `classifyField` function always adds evidence.

These can be tested with a property-based testing framework (e.g., fast-check):

```typescript
import { fc } from "fast-check";

// Generate random tool records
const arbitraryTool = fc.record({
  slug: fc.string({ minLength: 1, maxLength: 30 }),
  toolkit: fc.constantFrom("googlesuper", "github"),
  // ... other fields
});

test("idempotence", () => {
  fc.assert(
    fc.property(fc.array(arbitraryTool, { minLength: 1 }), (tools) => {
      const result1 = buildGraph(normalizeSnapshots(tools));
      const result2 = buildGraph(normalizeSnapshots(tools));
      expect(result1.graph).toEqual(result2.graph);
    })
  );
});
```

---

## 10. Summary: What Each Test Catches

| Test | Catches |
|------|---------|
| Bipartite consistency | Implementation bugs in edge construction |
| Required edges | Missing entity type rules or broken output inference |
| Forbidden edges | Noise leaking into graph (pagination, config) |
| Density check | Overclaiming (too dense) or underclaiming (too sparse) |
| Hub node check | Missing heuristic output inference for LIST/SEARCH tools |
| Cross-toolkit edges | Toolkit isolation (missed cross-service dependencies) |
| Reachability | Incomplete entity type coverage; dead tools |
| Plan hint consistency | Drift between graph and derived artifacts |
| Projection invariant | Bugs in matrix construction (if implemented) |
| Idempotence | Non-determinism in classification |
| Evidence non-emptiness | Gaps in reasoning transparency |
