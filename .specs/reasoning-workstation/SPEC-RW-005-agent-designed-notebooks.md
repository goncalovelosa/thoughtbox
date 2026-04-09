# SPEC-RW-005: Agent-Designed Custom Notebooks via Template Composition

**Status:** Draft
**Priority:** P2 — Enables Horizon 3 (Cognitive Evolution)
**Target:** `thoughtbox-staging`
**Research basis:** ADAS — Automated Design of Agentic Systems (Hu et al. 2024), Srcbook .src.md format, Code-to-Think/Think-to-Code (EMNLP 2025), PlugMem prescriptive knowledge (Microsoft Research 2026)

## Problem

Thoughtbox notebooks currently use a fixed set of templates (if any) and are designed by humans. Agents can add/modify cells within existing notebooks but cannot design new notebook architectures from scratch. This limits notebooks to what humans anticipated agents would need.

Research on Automated Design of Agentic Systems (ADAS) shows that a meta-agent can compose characteristics from a library of existing designs to create novel, more effective agent architectures. Applied to Thoughtbox notebooks: agents should be able to design custom cognitive tools by composing features from existing notebook templates.

## Desired Outcome

1. A **template library** of annotated notebook designs stored in the knowledge graph
2. A **notebook_design** operation where the agent specifies what cognitive affordance it needs
3. The agent receives a composed `.src.md` notebook that it can instantiate and run
4. Successful designs are added back to the template library

## Design

### 1. Template library (knowledge graph entities)

Each notebook template is stored as a `Workflow` entity in the knowledge graph:

```typescript
// Entity
{
  name: "template-session-analyzer",
  type: "Workflow",
  label: "Session Quality Analyzer Notebook",
  properties: {
    notebook_template: true,
    affordances: ["session-analysis", "confidence-tracking", "quality-metrics"],
    inputs: ["sessionId"],
    outputs: ["quality_report"],
    cell_count: 4,
    language: "typescript",
    src_md: "# Session Quality Analyzer\n\n## Setup\n```typescript ...",
    fitness: 0.85,                // Effectiveness score (0-1)
    usage_count: 12,
    last_used: "2026-04-09T10:00:00Z"
  }
}
```

Key properties:
- `affordances`: Tags describing what cognitive functions this notebook provides
- `inputs` / `outputs`: Interface description
- `src_md`: The complete notebook content in .src.md format
- `fitness`: Effectiveness score, updated based on usage outcomes

### 2. Seed templates

Ship with 3-5 seed templates that demonstrate the pattern:

| Template | Affordances | Description |
|----------|-------------|-------------|
| `template-data-analyzer` | data-analysis, computation | Analyze data with statistical functions |
| `template-session-analyzer` | session-analysis, quality-metrics | Compute session quality metrics |
| `template-hypothesis-tester` | hypothesis-testing, verification | Test a hypothesis with structured evaluation |
| `template-knowledge-scanner` | knowledge-graph, gap-analysis | Scan KG for gaps and opportunities |
| `template-literature-processor` | literature-review, entity-extraction | Process a paper URL into KG entities |

These are stored as `.src.md` files in `src/notebook/templates/` and loaded into the knowledge graph on first boot.

### 3. New operation: `notebook_design`

Add to notebook operations in `src/notebook/tool.ts`:

```typescript
notebook_design: {
  title: "Design Custom Notebook",
  description: "Design a new notebook by composing features from existing templates. Specify the cognitive affordance you need and receive a composed .src.md notebook.",
  inputSchema: {
    goal: z.string().describe("What cognitive task should this notebook perform?"),
    affordances: z.array(z.string()).describe("Desired capabilities (e.g., 'session-analysis', 'hypothesis-testing')"),
    inputs: z.array(z.string()).optional().describe("Expected input parameters"),
    outputs: z.array(z.string()).optional().describe("Expected output format"),
    base_templates: z.array(z.string()).optional().describe("Specific template entity names to compose from"),
  }
}
```

### 4. Composition algorithm (new file: `src/notebook/designer.ts`)

The design process mirrors ADAS Meta Agent Search:

```typescript
async function designNotebook(
  goal: string,
  affordances: string[],
  inputs: string[] | undefined,
  outputs: string[] | undefined,
  baseTemplates: string[] | undefined,
  knowledgeStorage: KnowledgeStorage,
): Promise<{
  src_md: string;
  composedFrom: string[];       // Template names used
  newAffordances: string[];     // Affordances of the result
}>
```

**Step 1: Select templates**
- If `base_templates` provided, load those
- Otherwise, query knowledge graph for `Workflow` entities where `notebook_template: true` and `affordances` overlap with requested affordances
- Select top 3 by (affordance overlap * fitness score)

**Step 2: Extract components**
Parse each template's `.src.md` content into cells. Tag each cell with the affordance it provides (from the template's metadata).

**Step 3: Compose**
- Include all cells tagged with requested affordances
- Resolve dependencies (if cell B imports from cell A, include both)
- Generate a new setup cell that accepts the specified inputs
- Generate a new output cell that formats the specified outputs
- Assemble into a valid `.src.md` document

**Step 4: Validate**
- Parse the composed `.src.md` to ensure it's structurally valid
- Check that all imports resolve
- Return the composed notebook

Note: Step 3 (compose) may produce a notebook that needs manual refinement by the agent. The design is a **starting point**, not a guaranteed working notebook. The agent can then use `notebook_update_cell` to refine.

### 5. Template registration (feedback loop)

After using a custom notebook successfully, the agent can register it as a new template:

```typescript
notebook_register_template: {
  title: "Register Notebook as Template",
  description: "Add a successful custom notebook to the template library for future reuse.",
  inputSchema: {
    notebook_id: z.string(),
    name: z.string(),
    label: z.string(),
    affordances: z.array(z.string()),
    inputs: z.array(z.string()),
    outputs: z.array(z.string()),
  }
}
```

This creates a `Workflow` entity in the knowledge graph with the notebook's exported `.src.md` as the `src_md` property.

### 6. Template fitness tracking

When a notebook is used (via `notebook_run_cell`), check if it was created from a template. If so, increment the template's `usage_count`. If the agent records a positive `action_report` referencing the notebook, increase the template's `fitness` score.

This creates evolutionary pressure: useful templates get higher fitness, surface more often in design queries, and contribute more to future compositions.

## Files to modify

| File | Change |
|------|--------|
| `src/notebook/designer.ts` | New file — notebook composition engine |
| `src/notebook/templates/` | New directory — seed template .src.md files |
| `src/notebook/tool.ts` | Add `notebook_design` and `notebook_register_template` operations |
| `src/notebook/types.ts` | Add `NotebookDesignResult` type |
| `src/code-mode/sdk-types.ts` | Add `design` and `registerTemplate` to `tb.notebook` interface |

## Acceptance criteria

- [ ] 3-5 seed templates loaded into knowledge graph on first boot
- [ ] `notebook_design` with affordances returns a composed `.src.md` notebook
- [ ] Composed notebook is structurally valid (parseable, cells in correct order)
- [ ] `notebook_register_template` creates a Workflow entity with the notebook content
- [ ] Template fitness increases with successful usage
- [ ] Agent can design, instantiate, run, and register a custom notebook end-to-end

## Non-goals

- LLM-assisted notebook generation (pure template composition for now; LLM-generated cells are a future enhancement)
- GCP/cloud instantiation (local execution only in this iteration)
- Automatic validation that the composed notebook produces correct results
- Cross-workspace template sharing (within one workspace only)

## Future directions (not in scope)

- **LLM-augmented design**: Use the MCP sampling API to have the model generate custom cells that fill gaps between template components
- **Cloud instantiation**: Deploy designed notebooks to GCP Cloud Run for persistent execution
- **Template evolution**: Genetic algorithm over the template library — mutate, crossover, select by fitness
- **Template marketplace**: Share templates across Thoughtbox instances
