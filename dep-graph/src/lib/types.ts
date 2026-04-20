export type ToolkitSlug = "googlesuper" | "github";

export type Confidence = "high" | "medium" | "low";

export type SemanticClass =
  | "identifier"
  | "locator"
  | "person_input"
  | "content_input"
  | "filter"
  | "pagination"
  | "config"
  | "unknown";

export type FieldRecord = {
  path: string;
  name: string;
  required: boolean;
  description?: string;
  primitiveType?: string;
  canonicalResource?: string;
  semanticClass: SemanticClass;
  confidence: Confidence;
  evidence: string[];
};

export type ToolRecord = {
  slug: string;
  toolkit: ToolkitSlug;
  name: string;
  description: string;
  inputFields: FieldRecord[];
  outputFields: FieldRecord[];
  entityHints: string[];
};

export type GraphNode =
  | { id: string; kind: "tool"; label: string; toolkit: string; slug: string }
  | { id: string; kind: "resource"; label: string; resourceType: string };

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
  kind: "requires" | "produces";
  resourceType: string;
  confidence: Confidence;
  evidence: string[];
};

export type ToolPlanHint = {
  toolSlug: string;
  requiredResources: Array<{
    resourceType: string;
    acquisition: "produced_by_tools" | "user_or_external";
    producerToolSlugs: string[];
  }>;
};

export type LowConfidenceCandidate = {
  toolSlug: string;
  toolkit: ToolkitSlug;
  kind: "requires" | "produces";
  path: string;
  resourceType: string;
  confidence: Confidence;
  evidence: string[];
};

export type GraphArtifact = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type GraphBuildResult = {
  graph: GraphArtifact;
  lowConfidenceCandidates: LowConfidenceCandidate[];
  toolPlanHints: ToolPlanHint[];
  summary: {
    generatedAt: string;
    toolCount: number;
    resourceCount: number;
    edgeCount: number;
    toolkitCounts: Record<ToolkitSlug, number>;
    edgesByKind: Record<GraphEdge["kind"], number>;
    edgesByConfidence: Record<Confidence, number>;
    lowConfidenceCandidateCount: number;
    userOrExternalResourceCount: number;
    userOrExternalResources: string[];
  };
};

export type RawToolRecord = {
  slug: string;
  name: string;
  description?: string;
  human_description?: string;
  input_parameters?: unknown;
  output_parameters?: unknown;
  toolkit?: { slug?: string; name?: string };
  version?: string;
  tags?: string[];
  [key: string]: unknown;
};

export type ToolkitSnapshot = {
  toolkit: ToolkitSlug;
  fetchedAt: string;
  pageSize: number;
  pagesFetched: number;
  totalTools: number;
  pageCursors: string[];
  detailFetchCount: number;
  bulkToolsMissingOutputSchema: number;
  items: RawToolRecord[];
};
