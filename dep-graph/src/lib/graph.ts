import type {
  Confidence,
  FieldRecord,
  GraphBuildResult,
  GraphEdge,
  GraphNode,
  LowConfidenceCandidate,
  ToolPlanHint,
  ToolRecord,
} from "./types";

const DEFAULT_EDGE_CONFIDENCES: Confidence[] = ["high", "medium"];

function toolNodeId(slug: string) {
  return `tool:${slug}`;
}

function resourceNodeId(resourceType: string) {
  return `resource:${resourceType}`;
}

function shouldIncludeField(field: FieldRecord) {
  return (
    typeof field.canonicalResource === "string" &&
    !["pagination", "config", "filter"].includes(field.semanticClass)
  );
}

function makeEdgeId(kind: GraphEdge["kind"], left: string, right: string) {
  return `${kind}:${left}:${right}`;
}

export function buildGraph(
  tools: ToolRecord[],
  edgeConfidences: Confidence[] = DEFAULT_EDGE_CONFIDENCES
): GraphBuildResult {
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();
  const lowConfidenceCandidates: LowConfidenceCandidate[] = [];

  const toolkitCounts = {
    googlesuper: tools.filter((tool) => tool.toolkit === "googlesuper").length,
    github: tools.filter((tool) => tool.toolkit === "github").length,
  };

  for (const tool of tools) {
    nodeMap.set(toolNodeId(tool.slug), {
      id: toolNodeId(tool.slug),
      kind: "tool",
      label: tool.slug,
      toolkit: tool.toolkit,
      slug: tool.slug,
    });

    const attachField = (field: FieldRecord, kind: GraphEdge["kind"]) => {
      if (!field.canonicalResource || !shouldIncludeField(field)) {
        return;
      }

      if (!edgeConfidences.includes(field.confidence)) {
        lowConfidenceCandidates.push({
          toolSlug: tool.slug,
          toolkit: tool.toolkit,
          kind,
          path: field.path,
          resourceType: field.canonicalResource,
          confidence: field.confidence,
          evidence: field.evidence,
        });
        return;
      }

      nodeMap.set(resourceNodeId(field.canonicalResource), {
        id: resourceNodeId(field.canonicalResource),
        kind: "resource",
        label: field.canonicalResource,
        resourceType: field.canonicalResource,
      });

      const from =
        kind === "requires"
          ? resourceNodeId(field.canonicalResource)
          : toolNodeId(tool.slug);
      const to =
        kind === "requires"
          ? toolNodeId(tool.slug)
          : resourceNodeId(field.canonicalResource);

      edgeMap.set(makeEdgeId(kind, from, to), {
        id: makeEdgeId(kind, from, to),
        from,
        to,
        kind,
        resourceType: field.canonicalResource,
        confidence: field.confidence,
        evidence: field.evidence,
      });
    };

    for (const field of tool.inputFields) {
      attachField(field, "requires");
    }

    for (const field of tool.outputFields) {
      attachField(field, "produces");
    }
  }

  const edges = [...edgeMap.values()].sort((left, right) => left.id.localeCompare(right.id));
  const nodes = [...nodeMap.values()].sort((left, right) => left.id.localeCompare(right.id));

  const producersByResource = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.kind !== "produces") {
      continue;
    }

    const toolSlug = edge.from.replace(/^tool:/, "");
    const toolSlugs = producersByResource.get(edge.resourceType) ?? [];
    toolSlugs.push(toolSlug);
    toolSlugs.sort();
    producersByResource.set(edge.resourceType, [...new Set(toolSlugs)]);
  }

  const toolPlanHints: ToolPlanHint[] = tools.map((tool) => {
    const requiredResources = [
      ...new Map(
        tool.inputFields
          .filter(
            (field) =>
              shouldIncludeField(field) &&
              field.canonicalResource &&
              edgeConfidences.includes(field.confidence)
          )
          .map((field) => [field.canonicalResource!, field])
      ).values(),
    ]
      .map((field) => {
        const producerToolSlugs = producersByResource.get(field.canonicalResource!) ?? [];
        return {
          resourceType: field.canonicalResource!,
          acquisition:
            producerToolSlugs.length > 0 ? "produced_by_tools" : "user_or_external",
          producerToolSlugs,
        };
      })
      .sort((left, right) => left.resourceType.localeCompare(right.resourceType));

    return {
      toolSlug: tool.slug,
      requiredResources,
    };
  });

  const resourceNodes = nodes.filter((node): node is Extract<GraphNode, { kind: "resource" }> => node.kind === "resource");
  const userOrExternalResources = resourceNodes
    .map((node) => node.resourceType)
    .filter((resourceType) => (producersByResource.get(resourceType) ?? []).length === 0)
    .sort();

  const edgesByKind = {
    requires: edges.filter((edge) => edge.kind === "requires").length,
    produces: edges.filter((edge) => edge.kind === "produces").length,
  };

  const edgesByConfidence = {
    high: edges.filter((edge) => edge.confidence === "high").length,
    medium: edges.filter((edge) => edge.confidence === "medium").length,
    low: edges.filter((edge) => edge.confidence === "low").length,
  };

  return {
    graph: { nodes, edges },
    lowConfidenceCandidates: lowConfidenceCandidates.sort((left, right) =>
      `${left.toolSlug}:${left.kind}:${left.resourceType}`.localeCompare(
        `${right.toolSlug}:${right.kind}:${right.resourceType}`
      )
    ),
    toolPlanHints: toolPlanHints.sort((left, right) => left.toolSlug.localeCompare(right.toolSlug)),
    summary: {
      generatedAt: new Date().toISOString(),
      toolCount: tools.length,
      resourceCount: resourceNodes.length,
      edgeCount: edges.length,
      toolkitCounts,
      edgesByKind,
      edgesByConfidence,
      lowConfidenceCandidateCount: lowConfidenceCandidates.length,
      userOrExternalResourceCount: userOrExternalResources.length,
      userOrExternalResources,
    },
  };
}
