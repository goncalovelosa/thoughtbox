import type { GraphArtifact, ToolPlanHint, ToolRecord } from "./types";

const NOISE_RESOURCES = new Set([
  "page",
  "per_page",
  "limit",
  "cursor",
  "offset",
  "sort",
  "order",
  "direction",
  "page_size",
  "max_results",
  "account_id",
  "auth_config_id",
  "connected_account_id",
  "session_id",
  "include_archived",
  "include_spam_trash",
  "include_body",
  "dry_run",
  "verbose",
  "force",
]);

const REQUIRED_CHECKS = [
  {
    description: "A thread-list/get style Google tool produces gmail.thread.id",
    check: (graph: GraphArtifact) =>
      graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "gmail.thread.id" &&
          /THREAD/.test(edge.from)
      ),
  },
  {
    description: "A reply-to-thread style Google tool requires gmail.thread.id",
    check: (graph: GraphArtifact) =>
      graph.edges.some(
        (edge) =>
          edge.kind === "requires" &&
          edge.resourceType === "gmail.thread.id" &&
          /REPLY_TO_THREAD/.test(edge.to)
      ),
  },
  {
    description: "A Google lookup tool produces email.address and consumes person.name or search.query",
    check: (graph: GraphArtifact) => {
      const lookupProducerTools = new Set(
        graph.edges
          .filter(
            (edge) =>
              edge.kind === "produces" &&
              edge.resourceType === "email.address" &&
              /GOOGLESUPER/.test(edge.from)
          )
          .map((edge) => edge.from)
      );

      return [...lookupProducerTools].some((toolId) =>
        graph.edges.some(
          (edge) =>
            edge.kind === "requires" &&
            edge.to === toolId &&
            (edge.resourceType === "person.name" || edge.resourceType === "search.query")
        )
      );
    },
  },
  {
    description: "A send-email style Google tool requires email.address",
    check: (graph: GraphArtifact) =>
      graph.edges.some(
        (edge) =>
          edge.kind === "requires" &&
          edge.resourceType === "email.address" &&
          /SEND_EMAIL/.test(edge.to)
      ),
  },
  {
    description: "A GitHub issue list/get style tool produces github.issue.number",
    check: (graph: GraphArtifact) =>
      graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "github.issue.number" &&
          /(ISSUES_LIST|LIST_ISSUES|ISSUES_GET|GET_AN_ISSUE|ISSUE)/.test(edge.from)
      ),
  },
];

const FORBIDDEN_EDGES = [
  {
    description: "No edge should use the resource type 'page'",
    kind: "produces" as const,
    toolSlug: "*",
    resourceType: "page",
  },
  {
    description: "No edge should use the resource type 'per_page'",
    kind: "requires" as const,
    toolSlug: "*",
    resourceType: "per_page",
  },
];

const USER_PROVIDABLE_RESOURCE_TYPES = new Set([
  "email.address",
  "email.subject",
  "email.body",
  "person.name",
  "search.query",
  "github.repo.owner",
  "github.repo.name",
  "github.issue.title",
  "github.issue.body",
  "github.org.name",
  "github.user.login",
  "github.team.slug",
  "github.codespace.name",
  "github.package.name",
]);

function setMapValue<K, V>(map: Map<K, Set<V>>, key: K, value: V) {
  const current = map.get(key) ?? new Set<V>();
  current.add(value);
  map.set(key, current);
}

function getNodeKinds(graph: GraphArtifact) {
  return new Map(graph.nodes.map((node) => [node.id, node.kind]));
}

function verifyBipartiteConsistency(graph: GraphArtifact) {
  const violations: string[] = [];
  const nodeKinds = getNodeKinds(graph);

  for (const edge of graph.edges) {
    const fromKind = nodeKinds.get(edge.from);
    const toKind = nodeKinds.get(edge.to);

    if (!fromKind) {
      violations.push(`Edge ${edge.id}: missing 'from' node ${edge.from}`);
      continue;
    }

    if (!toKind) {
      violations.push(`Edge ${edge.id}: missing 'to' node ${edge.to}`);
      continue;
    }

    if (edge.kind === "requires" && (fromKind !== "resource" || toKind !== "tool")) {
      violations.push(
        `Edge ${edge.id}: requires edge must be resource->tool, got ${fromKind}->${toKind}`
      );
    }

    if (edge.kind === "produces" && (fromKind !== "tool" || toKind !== "resource")) {
      violations.push(
        `Edge ${edge.id}: produces edge must be tool->resource, got ${fromKind}->${toKind}`
      );
    }
  }

  return violations;
}

function verifyUniqueEdgeIds(graph: GraphArtifact) {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const edge of graph.edges) {
    if (seen.has(edge.id)) {
      duplicates.push(`Duplicate edge id '${edge.id}'`);
    }
    seen.add(edge.id);
  }

  return duplicates;
}

function verifyNoOrphanResources(graph: GraphArtifact) {
  const connected = new Set<string>();
  for (const edge of graph.edges) {
    connected.add(edge.from);
    connected.add(edge.to);
  }

  return graph.nodes
    .filter((node) => node.kind === "resource" && !connected.has(node.id))
    .map((node) => `Orphan resource node '${node.id}'`);
}

function verifyResourceTypeConsistency(graph: GraphArtifact) {
  const resourceTypes = new Map(
    graph.nodes
      .filter((node): node is Extract<(typeof graph.nodes)[number], { kind: "resource" }> => node.kind === "resource")
      .map((node) => [node.id, node.resourceType])
  );

  const violations: string[] = [];
  for (const edge of graph.edges) {
    const resourceNodeId = edge.kind === "requires" ? edge.from : edge.to;
    const nodeResourceType = resourceTypes.get(resourceNodeId);
    if (nodeResourceType && nodeResourceType !== edge.resourceType) {
      violations.push(
        `Edge ${edge.id}: resourceType '${edge.resourceType}' does not match node resourceType '${nodeResourceType}'`
      );
    }
  }

  return violations;
}

function verifyNoiseExclusion(graph: GraphArtifact) {
  return graph.nodes
    .filter((node) => node.kind === "resource" && NOISE_RESOURCES.has(node.resourceType))
    .map((node) => `Noise resource leaked into graph: '${node.resourceType}'`);
}

function verifyRequiredEdges(graph: GraphArtifact) {
  const missing: string[] = [];

  for (const required of REQUIRED_CHECKS) {
    if (!required.check(graph)) {
      missing.push(`Missing required edge pattern: ${required.description}`);
    }
  }

  return missing;
}

function verifyForbiddenEdges(graph: GraphArtifact) {
  const violations: string[] = [];

  for (const forbidden of FORBIDDEN_EDGES) {
    const matches = graph.edges.filter((edge) => {
      if (edge.kind !== forbidden.kind || edge.resourceType !== forbidden.resourceType) {
        return false;
      }

      if (forbidden.toolSlug === "*") {
        return true;
      }

      const toolNodeId = `tool:${forbidden.toolSlug}`;
      return forbidden.kind === "produces"
        ? edge.from === toolNodeId
        : edge.to === toolNodeId;
    });

    for (const match of matches) {
      violations.push(`Forbidden edge found: ${forbidden.description} (${match.id})`);
    }
  }

  return violations;
}

function buildProjection(graph: GraphArtifact) {
  const toolIds = graph.nodes
    .filter((node): node is Extract<(typeof graph.nodes)[number], { kind: "tool" }> => node.kind === "tool")
    .map((node) => node.id);

  const producersByResource = new Map<string, Set<string>>();
  const consumersByResource = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    if (edge.kind === "produces") {
      setMapValue(producersByResource, edge.resourceType, edge.from);
    } else {
      setMapValue(consumersByResource, edge.resourceType, edge.to);
    }
  }

  const directed = new Map<string, Set<string>>();
  const undirected = new Map<string, Set<string>>();
  const weighted = new Map<string, number>();

  for (const toolId of toolIds) {
    directed.set(toolId, new Set());
    undirected.set(toolId, new Set());
  }

  for (const [resourceType, producers] of producersByResource.entries()) {
    const consumers = consumersByResource.get(resourceType) ?? new Set<string>();
    for (const producer of producers) {
      for (const consumer of consumers) {
        if (producer === consumer) {
          continue;
        }
        directed.get(producer)?.add(consumer);
        undirected.get(producer)?.add(consumer);
        undirected.get(consumer)?.add(producer);

        const key = `${consumer}|${producer}`;
        weighted.set(key, (weighted.get(key) ?? 0) + 1);
      }
    }
  }

  return { toolIds, directed, undirected, weighted, producersByResource, consumersByResource };
}

function countConnectedComponents(toolIds: string[], adjacency: Map<string, Set<string>>) {
  const visited = new Set<string>();
  let count = 0;

  for (const toolId of toolIds) {
    if (visited.has(toolId)) {
      continue;
    }
    count += 1;
    const stack = [toolId];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current)) {
        continue;
      }
      visited.add(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return count;
}

function checkDensity(graph: GraphArtifact) {
  const toolCount = graph.nodes.filter((node) => node.kind === "tool").length;
  const density = toolCount <= 1 ? 0 : graph.edges.length / (toolCount * toolCount);

  return {
    density,
    warning:
      density > 0.1
        ? `Density ${density.toFixed(4)} is suspiciously high`
        : density < 0.001
          ? `Density ${density.toFixed(4)} is suspiciously low`
          : undefined,
  };
}

function checkHubNodes(graph: GraphArtifact) {
  const outDegree = new Map<string, number>();
  for (const edge of graph.edges) {
    if (edge.kind === "produces") {
      outDegree.set(edge.from, (outDegree.get(edge.from) ?? 0) + 1);
    }
  }

  return graph.nodes
    .filter(
      (node) => node.kind === "tool" && /\b(LIST|SEARCH|FIND|GET)\b/.test(node.label)
    )
    .filter((node) => (outDegree.get(node.id) ?? 0) === 0)
    .map((node) => `Hub candidate '${node.label}' has zero produces edges`);
}

function checkCrossToolkitEdges(graph: GraphArtifact, tools: ToolRecord[]) {
  const toolToolkit = new Map(tools.map((tool) => [`tool:${tool.slug}`, tool.toolkit]));
  const producerToolkits = new Map<string, Set<string>>();
  const consumerToolkits = new Map<string, Set<string>>();

  for (const edge of graph.edges) {
    if (edge.kind === "produces") {
      const toolkit = toolToolkit.get(edge.from);
      if (toolkit) {
        setMapValue(producerToolkits, edge.resourceType, toolkit);
      }
    } else {
      const toolkit = toolToolkit.get(edge.to);
      if (toolkit) {
        setMapValue(consumerToolkits, edge.resourceType, toolkit);
      }
    }
  }

  let count = 0;
  for (const [resourceType, producers] of producerToolkits.entries()) {
    const consumers = consumerToolkits.get(resourceType);
    if (!consumers) {
      continue;
    }
    for (const producer of producers) {
      for (const consumer of consumers) {
        if (producer !== consumer) {
          count += 1;
        }
      }
    }
  }

  return {
    count,
    warning:
      count === 0
        ? "Zero cross-toolkit resource flows detected"
        : undefined,
  };
}

function verifyPlanHintConsistency(graph: GraphArtifact, hints: ToolPlanHint[]) {
  const graphProducers = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (edge.kind !== "produces") {
      continue;
    }
    setMapValue(graphProducers, edge.resourceType, edge.from.replace(/^tool:/, ""));
  }

  const violations: string[] = [];
  for (const hint of hints) {
    for (const requirement of hint.requiredResources) {
      const graphProducerSet = graphProducers.get(requirement.resourceType) ?? new Set<string>();
      const hintProducerSet = new Set(requirement.producerToolSlugs);

      if (requirement.acquisition === "produced_by_tools" && graphProducerSet.size === 0) {
        violations.push(
          `Hint for ${hint.toolSlug}: '${requirement.resourceType}' claims produced_by_tools but graph has zero producers`
        );
      }

      if (requirement.acquisition === "user_or_external" && graphProducerSet.size > 0) {
        violations.push(
          `Hint for ${hint.toolSlug}: '${requirement.resourceType}' claims user_or_external but graph has producers`
        );
      }

      if (requirement.acquisition === "produced_by_tools") {
        const missing = [...graphProducerSet].filter((producer) => !hintProducerSet.has(producer));
        const extra = [...hintProducerSet].filter((producer) => !graphProducerSet.has(producer));

        if (missing.length > 0) {
          violations.push(
            `Hint for ${hint.toolSlug}: missing producers for '${requirement.resourceType}': ${missing.join(", ")}`
          );
        }

        if (extra.length > 0) {
          violations.push(
            `Hint for ${hint.toolSlug}: extra producers for '${requirement.resourceType}': ${extra.join(", ")}`
          );
        }
      }
    }
  }

  return violations;
}

function computeReachability(graph: GraphArtifact, userProvidableResources: Set<string>) {
  const reachableResource = new Map<string, boolean>();
  const reachableTool = new Map<string, boolean>();
  const toolRequires = new Map<string, string[]>();
  const resourceProducers = new Map<string, string[]>();

  for (const node of graph.nodes) {
    if (node.kind === "resource") {
      reachableResource.set(node.id, userProvidableResources.has(node.resourceType));
    } else {
      reachableTool.set(node.id, false);
    }
  }

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

  let changed = true;
  while (changed) {
    changed = false;

    for (const [resourceId, producers] of resourceProducers.entries()) {
      if (reachableResource.get(resourceId)) {
        continue;
      }
      if (producers.some((toolId) => reachableTool.get(toolId))) {
        reachableResource.set(resourceId, true);
        changed = true;
      }
    }

    for (const node of graph.nodes) {
      if (node.kind !== "tool" || reachableTool.get(node.id)) {
        continue;
      }
      const requiredResources = toolRequires.get(node.id) ?? [];
      const allSatisfied =
        requiredResources.length === 0 ||
        requiredResources.every((resourceId) => reachableResource.get(resourceId));

      if (allSatisfied) {
        reachableTool.set(node.id, true);
        changed = true;
      }
    }
  }

  return {
    reachableTool,
    reachableResource,
    unreachableTools: graph.nodes
      .filter((node) => node.kind === "tool" && !reachableTool.get(node.id))
      .map((node) => node.label)
      .sort(),
    unreachableResources: graph.nodes
      .filter((node) => node.kind === "resource" && !reachableResource.get(node.id))
      .map((node) => node.label)
      .sort(),
  };
}

function computeLayerDepth(graph: GraphArtifact, userProvidableResources: Set<string>) {
  const depth = new Map<string, number>();
  const toolRequires = new Map<string, string[]>();
  const resourceProducers = new Map<string, string[]>();

  for (const node of graph.nodes) {
    if (node.kind === "resource" && userProvidableResources.has(node.resourceType)) {
      depth.set(node.id, 0);
    }
  }

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

  let changed = true;
  while (changed) {
    changed = false;

    for (const node of graph.nodes) {
      if (node.kind !== "tool" || depth.has(node.id)) {
        continue;
      }

      const requiredResources = toolRequires.get(node.id) ?? [];
      if (requiredResources.length === 0) {
        depth.set(node.id, 0);
        changed = true;
        continue;
      }

      const requiredDepths = requiredResources.map((resourceId) => depth.get(resourceId));
      if (requiredDepths.every((value) => value !== undefined)) {
        depth.set(node.id, Math.max(...(requiredDepths as number[])) + 1);
        changed = true;
      }
    }

    for (const [resourceId, producers] of resourceProducers.entries()) {
      if (depth.has(resourceId)) {
        continue;
      }

      const producerDepths = producers
        .map((toolId) => depth.get(toolId))
        .filter((value): value is number => value !== undefined);

      if (producerDepths.length > 0) {
        depth.set(resourceId, Math.min(...producerDepths) + 1);
        changed = true;
      }
    }
  }

  return depth;
}

function runFullVerification(
  graph: GraphArtifact,
  tools: ToolRecord[],
  hints: ToolPlanHint[],
  userProvidableResources: Set<string>
) {
  const passed: string[] = [];
  const failed: string[] = [];
  const warnings: string[] = [];

  const check = (name: string, violations: string[]) => {
    if (violations.length === 0) {
      passed.push(name);
      return;
    }

    failed.push(`${name}: ${violations.length} violation(s)`);
    for (const violation of violations) {
      failed.push(`  - ${violation}`);
    }
  };

  check("Bipartite consistency", verifyBipartiteConsistency(graph));
  check("Unique edge ids", verifyUniqueEdgeIds(graph));
  check("No orphan resources", verifyNoOrphanResources(graph));
  check("Resource type consistency", verifyResourceTypeConsistency(graph));
  check("Noise exclusion", verifyNoiseExclusion(graph));
  check("Required edges present", verifyRequiredEdges(graph));
  check("Forbidden edges absent", verifyForbiddenEdges(graph));
  check("Plan hint consistency", verifyPlanHintConsistency(graph, hints));

  const density = checkDensity(graph);
  if (density.warning) {
    warnings.push(`Density: ${density.warning}`);
  } else {
    passed.push(`Density within expected range (${density.density.toFixed(4)})`);
  }

  const hubWarnings = checkHubNodes(graph);
  warnings.push(...hubWarnings.map((warning) => `Hub nodes: ${warning}`));

  const crossToolkit = checkCrossToolkitEdges(graph, tools);
  if (crossToolkit.warning) {
    warnings.push(crossToolkit.warning);
  } else {
    passed.push(`Cross-toolkit flows detected (${crossToolkit.count})`);
  }

  const reachability = computeReachability(graph, userProvidableResources);
  const unreachableFraction =
    graph.nodes.filter((node) => node.kind === "tool").length === 0
      ? 0
      : reachability.unreachableTools.length /
        graph.nodes.filter((node) => node.kind === "tool").length;

  if (reachability.unreachableTools.length === 0) {
    passed.push("Reachability: all tools reachable from user inputs");
  } else if (unreachableFraction > 0.5) {
    failed.push(
      `Reachability: ${(unreachableFraction * 100).toFixed(0)}% of tools are unreachable from user inputs`
    );
  } else {
    warnings.push(
      `Reachability: ${reachability.unreachableTools.length} unreachable tools (sample: ${reachability.unreachableTools
        .slice(0, 10)
        .join(", ")})`
    );
  }

  return { passed, failed, warnings, reachability };
}

export function buildVerificationReport(
  tools: ToolRecord[],
  graph: GraphArtifact,
  hints: ToolPlanHint[]
) {
  const userProvidableResources = new Set<string>(USER_PROVIDABLE_RESOURCE_TYPES);
  const projection = buildProjection(graph);
  const directedEdgeCount = [...projection.directed.values()].reduce(
    (sum, neighbors) => sum + neighbors.size,
    0
  );
  const isolatedTools = projection.toolIds.filter(
    (toolId) =>
      (projection.directed.get(toolId)?.size ?? 0) === 0 &&
      (projection.undirected.get(toolId)?.size ?? 0) === 0
  );

  const suite = runFullVerification(graph, tools, hints, userProvidableResources);
  const depth = computeLayerDepth(graph, userProvidableResources);

  return {
    generatedAt: new Date().toISOString(),
    projectedToolGraph: {
      nodeCount: projection.toolIds.length,
      edgeCount: directedEdgeCount,
      edgeDensity:
        projection.toolIds.length <= 1
          ? 0
          : directedEdgeCount / (projection.toolIds.length * (projection.toolIds.length - 1)),
      connectedComponents: countConnectedComponents(projection.toolIds, projection.undirected),
      isolatedToolFraction:
        projection.toolIds.length === 0 ? 0 : isolatedTools.length / projection.toolIds.length,
      isolatedToolsSample: isolatedTools.slice(0, 25).map((toolId) => toolId.replace(/^tool:/, "")),
    },
    userProvidableResources: [...userProvidableResources].sort(),
    knownExampleChecks: Object.fromEntries(
      REQUIRED_CHECKS.map((required) => [
        required.description,
        !suite.failed.some((failure) => failure.includes(required.description)),
      ])
    ),
    reachability: {
      unreachableTools: suite.reachability.unreachableTools,
      unreachableResources: suite.reachability.unreachableResources,
      unreachableFraction:
        graph.nodes.filter((node) => node.kind === "tool").length === 0
          ? 0
          : suite.reachability.unreachableTools.length /
            graph.nodes.filter((node) => node.kind === "tool").length,
      maxDepth: Math.max(...depth.values(), 0),
    },
    suite: {
      passed: suite.passed,
      failed: suite.failed,
      warnings: suite.warnings,
    },
  };
}
