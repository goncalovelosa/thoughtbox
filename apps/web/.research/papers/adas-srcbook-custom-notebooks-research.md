# ADAS + Srcbook: Agent-Designed Custom Notebooks

Research report on the intersection of Automated Design of Agentic Systems (ADAS) and the Srcbook .src.md notebook format, with a synthesis on how AI agents could design custom cognitive notebooks at runtime.

Date: 2026-04-09

---

## 1. ADAS: Automated Design of Agentic Systems

**Paper**: Shengran Hu, Cong Lu, Jeff Clune. "Automated Design of Agentic Systems." ICLR 2025 (Outstanding Paper at NeurIPS 2024 Open-World Agent Workshop). [arXiv:2408.08435](https://arxiv.org/abs/2408.08435)

**Code**: [github.com/ShengranHu/ADAS](https://github.com/ShengranHu/ADAS) (Apache 2.0, ~1550 stars)

### 1.1 Core Thesis

Hand-designed agentic systems (Chain-of-Thought, Self-Reflection, Toolformer, etc.) will eventually be replaced by *learned* systems, just as hand-crafted features were replaced by learned features in deep learning. ADAS defines a research area focused on automatically creating powerful agentic system designs, including inventing novel building blocks and combining them in new ways.

### 1.2 The ADAS Framework

Every ADAS method decomposes into three components:

| Component | Description |
|---|---|
| **Search space** | What kinds of agents can be represented? Prompts only? Fixed graph structures? Full code? |
| **Search algorithm** | How is the space explored? Random search, RL, evolutionary methods, LLM-driven search? |
| **Evaluation function** | How is a candidate agent scored? Accuracy, cost, latency, safety? |

The key insight: since programming languages are Turing-complete, using **code as the search space** theoretically enables learning any possible agentic system -- novel prompts, tool use, workflows, and arbitrary combinations.

### 1.3 Meta Agent Search Algorithm

Meta Agent Search is the concrete ADAS algorithm presented in the paper. It is a meta-agent (powered by a strong LLM like GPT-4o) whose job is not to solve tasks directly but to **write Python code** for new agents that solve them.

**The loop:**

1. **Archive initialization**: Seed with a small set of baseline agent designs (Chain-of-Thought, Self-Consistency, Self-Refine/Reflexion, LLM Debate, Quality-Diversity). Each is stored as a JSON object with `thought`, `name`, `code`, `fitness`, and `generation` fields.

2. **Meta-agent proposes a new agent**: The meta-agent receives the full archive as context and generates a new `forward()` function in Python. The prompt includes the utility API (`LLMAgentBase`, `Info` namedtuple, `run_examples_and_get_feedback`, `get_test_output_from_code`), all previously discovered agents with their fitness scores, and examples of common implementation mistakes.

3. **Reflexion loop**: After generating a candidate, the meta-agent reflects twice:
   - **Reflexion 1**: Assess interestingness vs. archive, check for implementation mistakes, suggest improvements. Critical thinking is explicitly prompted.
   - **Reflexion 2**: Revise code using the "wrong implementation examples" catalog.

4. **Evaluate the candidate**: Execute the generated `forward()` function against validation tasks. If accuracy is near zero, debug up to 3 times via error feedback to the meta-agent.

5. **Archive update**: Append the new agent (with fitness score and generation number) to the archive. The archive grows monotonically -- no pruning.

6. **Repeat** for N generations (default 25).

### 1.4 How the Archive Works

The archive is a JSON array of agent records:

```json
{
  "thought": "Insights, overall idea, implementation steps...",
  "name": "Agent Name",
  "code": "def forward(self, taskInfo): ...",
  "fitness": "median accuracy [95% CI]",
  "generation": 7
}
```

The archive serves dual purposes:
- **Memory**: The meta-agent sees ALL previous discoveries in its prompt context, learning from both successes and failures.
- **Stepping stones**: Intermediate agents that are not the best performers can still introduce useful tricks (ensemble voting, expert roles, feedback loops) that later designs recombine.

The initial archive contains 5 canonical designs:
- **Chain-of-Thought**: Single LLM with step-by-step reasoning + code generation
- **Self-Consistency (CoT-SC)**: N parallel CoT agents with high temperature, final ensemble decision
- **Self-Refine (Reflexion)**: Iterative refinement using `run_examples_and_get_feedback`
- **LLM Debate**: Multiple agents with different roles (Puzzle Designer, Expert Logician) debate across rounds
- **Quality-Diversity**: Generate diverse solutions, sort by correctness, ensemble top results

### 1.5 Composition Mechanism

The meta-agent composes new designs through several mechanisms observable in the code:

1. **Pattern recombination**: The prompt shows all archived agents, so the meta-agent can mix elements (e.g., take the expert-role pattern from Debate and the feedback loop from Reflexion).

2. **Novel structural inventions**: Discovered agents include designs humans hadn't tried, such as:
   - Hierarchical decomposition (break problem into sub-problems, assign to specialized experts, integrate)
   - Visual representation generation + verification + reasoning chains
   - Human-like feedback simulation + multi-expert advisory panels + iterative refinement
   - Cross-agent critique (each expert critiques others' work before refinement)

3. **Standardized interface**: All agents implement `forward(self, taskInfo) -> answer` using `LLMAgentBase` for LLM calls and `Info` namedtuples for data passing. This shared interface makes composition tractable.

### 1.6 What Makes the Search Space Tractable

Despite the Turing-complete code space being infinite, several constraints keep search practical:

- **Standardized API**: Agents must use `LLMAgentBase`, `Info`, `run_examples_and_get_feedback`, and `get_test_output_from_code`. This constrains the vocabulary.
- **~100 lines per agent**: The `forward()` function is kept compact and readable.
- **Archive as context**: The growing archive provides strong priors for generation, preventing random code exploration.
- **Error catalog**: The prompt includes 10 specific "wrong implementation examples" that prevent common mistakes.
- **Two-round reflexion**: Self-critique before evaluation reduces wasted compute on broken agents.
- **Debug loop**: Up to 3 attempts to fix evaluation errors via error feedback.

### 1.7 Results

- **Outperforms hand-designed baselines** across all tested domains: ARC (pattern reasoning), DROP (reading comprehension), MGSM (math), MMLU (multi-domain knowledge), GPQA (graduate-level science).
- **Progressive improvement**: Performance increases over generations as the archive grows.
- **Transfer across domains**: Agents discovered on math tasks outperform or match baselines when transferred to reading, science, and other domains without modification.
- **Transfer across models**: Agents discovered with GPT-3.5 maintain advantages when run with GPT-4 or Claude.
- **Limitations**: On very hard science questions, the bottleneck is the base model's knowledge, not the agent design. Most experiments are QA-style single-step tasks, not long-horizon interactive environments.

---

## 2. Srcbook and the .src.md Format

**Repository**: [github.com/srcbookdev/srcbook](https://github.com/srcbookdev/srcbook) (~3450 stars, Apache 2.0)

**Status**: Not under active development as of 2025. The hosted version pivoted to [getmocha.com](https://getmocha.com). The notebook product may be revived.

### 2.1 What Srcbook Is

Srcbook is a TypeScript-centric notebook that runs locally on Node.js. It provides:
- A web UI for editing and running TypeScript/JavaScript notebooks
- Full npm ecosystem access (any npm package can be imported)
- AI-assisted coding (OpenAI, Anthropic, or local models)
- Export to `.src.md` format for version control and sharing
- Mermaid diagramming support

### 2.2 The .src.md Format

The `.src.md` format is a valid Markdown file that encodes a notebook's cells, metadata, and dependencies. It is designed to be human-readable, git-diffable, and renderable by any Markdown viewer.

**Structure of a .src.md file:**

```markdown
<!-- srcbook:{"language":"typescript","tsconfig.json":{...}} -->

# Notebook Title

###### package.json

```json
{
  "dependencies": {
    "lodash": "4.17.21"
  }
}
```

Some markdown description here.

## Section Heading

More markdown content with **formatting**, `inline code`, lists, etc.

###### index.mts

```typescript
import _ from 'lodash';
const result = _.chunk([1, 2, 3, 4, 5], 2);
console.log(result);
```

Explanation of what the code does.

###### analysis.mts

```typescript
import { result } from './index.mts';
// Further processing...
```
```

### 2.3 Cell Types

The format defines four cell types, distinguished by Markdown syntax:

| Cell Type | Markdown Syntax | Purpose |
|---|---|---|
| **Title** | `# Heading` (h1) | Notebook title. Exactly one required, must be first. |
| **Package.json** | `###### package.json` followed by a JSON code block | Dependencies declaration. At most one. |
| **Code** | `###### filename.mts` followed by a fenced code block | Executable code cell. Language inferred from filename extension. |
| **Markdown** | Any other Markdown content (h2-h5, paragraphs, lists, etc.) | Documentation, explanation, narrative. |

Key conventions:
- **h6 (`######`) is reserved** for code cell filenames. Any h6 heading must be followed by a code block.
- Code blocks that are NOT preceded by an h6 heading are rendered as Markdown (non-executable code examples).
- The metadata comment `<!-- srcbook:{"language":"javascript"} -->` must be the first line.
- For TypeScript notebooks, `tsconfig.json` can be embedded in the metadata.

### 2.4 Encoding/Decoding

The format has a clean encode/decode pipeline (implemented in `packages/api/srcmd/`):

**Decoding** (`.src.md` -> cells):
1. Parse Markdown into tokens using `marked` lexer
2. Extract metadata from the `<!-- srcbook:{...} -->` HTML comment
3. Group tokens: h1 -> title, h6 -> filename (expect code block next), code after h6 -> code cell, everything else -> markdown cell
4. Validate: exactly one h1, at most one package.json, every h6 followed by a code block
5. Convert to cell objects with `id`, `type`, `source`/`text`, `filename`, `language`, `status`

**Encoding** (cells -> `.src.md`):
1. Emit metadata comment
2. Emit title as h1
3. Emit package.json as h6 + JSON code block
4. For each remaining cell: code cells as h6 + fenced code block, markdown cells as raw text
5. Join with double newlines, ensure single trailing newline

Two encoding modes:
- **Inline**: Code is embedded directly in the Markdown (for export/sharing)
- **External**: Code cells are links to files on disk (`[filename.mts](./src/filename.mts)`)

### 2.5 Runtime Architecture

From the HN discussion and source code:

- Each notebook is a directory on disk under `~/.srcbook/srcbooks/`
- Code cells are actual files in the directory, executed by the local Node.js runtime
- The `.src.md` format is the serialization/export format; the directory is the runtime format
- No Python dependency, no Jupyter kernel protocol
- Dependencies are managed via `package.json` with standard npm install
- Execution happens in Node.js processes (not in the browser), giving access to filesystem, databases, network, etc.

### 2.6 Comparison to Jupyter

| Aspect | Jupyter | Srcbook |
|---|---|---|
| Format | `.ipynb` (JSON, not git-friendly) | `.src.md` (Markdown, git-friendly) |
| Runtime | Kernel protocol (heavy) | Direct Node.js execution (lightweight) |
| Language | Python-first, JS support is second-class | TypeScript/JavaScript-first |
| Dependencies | pip/conda (complex) | npm via package.json (standard) |
| Rendering | Requires Jupyter/nbviewer | Any Markdown renderer |
| State | In-memory kernel state | File-based (each cell is a file) |

### 2.7 Language Support

- **JavaScript** (`.mjs` files, `"language":"javascript"`)
- **TypeScript** (`.mts` files, `"language":"typescript"`, with embedded `tsconfig.json`)

No other languages are supported. The runtime is exclusively Node.js.

---

## 3. Synthesis: Agent-Designed Custom Notebooks at Runtime

### 3.1 The Core Idea

Combine ADAS's meta-agent pattern with Srcbook's `.src.md` format to create a system where an AI agent designs custom cognitive notebooks at runtime. The agent does not just fill in templates -- it invents new notebook structures with novel combinations of cognitive affordances, then materializes them as executable `.src.md` files.

### 3.2 Architecture

```
+------------------+     +------------------+     +------------------+
|  Template        |     |  Meta-Notebook   |     |  Notebook        |
|  Archive         |---->|  Agent           |---->|  Runtime         |
|  (.src.md files  |     |  (designs new    |     |  (instantiates   |
|   + metadata)    |     |   notebooks)     |     |   and executes)  |
+------------------+     +------------------+     +------------------+
        ^                         |
        |                         |
        +---- fitness feedback ---+
```

### 3.3 The Template Archive

Analogous to ADAS's archive of discovered agents, the system maintains a library of notebook templates. Each template is a `.src.md` file annotated with metadata:

```json
{
  "name": "Data Analysis Pipeline",
  "affordances": ["tabular-data", "visualization", "statistical-testing"],
  "fitness": { "task_completion": 0.85, "user_satisfaction": 0.72 },
  "generation": 3,
  "thought": "Combines data loading, cleaning, and analysis in a linear pipeline with intermediate visualizations."
}
```

The archive starts with seed templates:

| Template | Affordances |
|---|---|
| **Computation Notebook** | Numerical computation, step-by-step derivation, code execution with output capture |
| **Data Analysis Notebook** | Data loading, transformation, visualization (mermaid/chart), summary statistics |
| **Research Exploration** | Web search integration, source citation, hypothesis tracking, evidence collection |
| **Simulation Notebook** | Parameter definition, model execution, output comparison, sensitivity analysis |
| **Decision Analysis** | Options enumeration, criteria weighting, scoring matrix, recommendation |

### 3.4 The Meta-Notebook Agent

The meta-notebook agent mirrors Meta Agent Search but operates on notebook structures instead of `forward()` functions. Given a task description, it:

1. **Reads the archive** of existing notebook templates with their affordances and fitness scores
2. **Selects useful characteristics** from multiple templates (e.g., "I need the data loading pattern from Data Analysis, the hypothesis tracking from Research Exploration, and a new simulation loop that neither provides")
3. **Designs a new notebook** by writing a complete `.src.md` file that combines selected affordances with novel structural inventions
4. **Reflexion**: Reviews the design for coherence, checks that cells reference each other correctly, validates the package.json dependencies
5. **Emits the notebook** as a `.src.md` string

The agent's output is not just "filled-in blanks" -- it is a structurally novel notebook. Like ADAS's discovered agents that invented expert panels and cross-critique patterns humans hadn't tried, the meta-notebook agent can invent cognitive structures like:

- **Adversarial analysis cells**: One code cell generates a claim, another generates counterarguments, a third synthesizes
- **Progressive refinement loops**: A sequence of cells that each refine the previous cell's output using different evaluation criteria
- **Multi-perspective analysis**: Parallel analysis cells that examine the same data through different lenses (statistical, visual, semantic), with a synthesis cell
- **Checkpoint-and-branch**: Cells that save intermediate state and fork into alternative analysis paths

### 3.5 The .src.md Format as the Representation Language

The `.src.md` format is well-suited for this application because:

1. **Agent-readable and agent-writable**: It is plain Markdown text. Any LLM can read, understand, and generate it. No binary format or complex serialization.

2. **Structurally constrained**: The h6-for-code-cells convention, mandatory metadata comment, and package.json cell provide just enough structure to be parseable while remaining flexible.

3. **Self-documenting**: Markdown cells between code cells serve as the agent's "reasoning trace" -- explaining what each step does and why, making the notebook interpretable.

4. **Dependency management is declarative**: The package.json cell explicitly declares what libraries the notebook needs. The meta-agent can compose dependency lists from template libraries.

5. **Files as cells**: Each code cell is a named file (`analysis.mts`, `model.mts`), enabling import/export relationships between cells. This is more powerful than Jupyter's implicit shared namespace -- the meta-agent can design modular notebook architectures.

### 3.6 Runtime Instantiation

The runtime takes a generated `.src.md` and:

1. **Decodes** it using the Srcbook parsing pipeline (metadata extraction, token grouping, cell conversion)
2. **Creates a working directory** with the package.json and code files
3. **Installs dependencies** via `npm install`
4. **Executes cells** in order (or in dependency order based on imports)
5. **Captures outputs** and feeds them back to the agent or user
6. **Reports fitness** (task completion, error count, output quality) back to the archive

### 3.7 Tractability of the Search Space

The same principles that make ADAS's Meta Agent Search tractable apply here:

| ADAS Constraint | Notebook Analog |
|---|---|
| Standardized API (`LLMAgentBase`, `Info`) | Standardized cell types (title, package.json, code, markdown) |
| ~100 lines per `forward()` | Bounded notebook size (e.g., max 10 code cells, max 50 lines per cell) |
| Archive as context | Template archive as context for generation |
| Error catalog | Common notebook anti-patterns (circular imports, missing dependencies, undefined variables) |
| Two-round reflexion | Design review + dependency check before instantiation |

### 3.8 Concrete Example

Task: "Analyze the correlation between API response times and error rates from this CSV file, and recommend whether to add a cache layer."

The meta-notebook agent, reading the archive, might compose:

```markdown
<!-- srcbook:{"language":"typescript"} -->

# API Performance Analysis

###### package.json

```json
{
  "dependencies": {
    "papaparse": "5.4.1",
    "simple-statistics": "7.8.3"
  }
}
```

## Data Loading

Load and validate the CSV data.

###### load-data.mts

```typescript
import Papa from 'papaparse';
import { readFileSync } from 'fs';

const raw = readFileSync('./api-metrics.csv', 'utf-8');
const parsed = Papa.parse(raw, { header: true, dynamicTyping: true });

export const records = parsed.data.filter(
  (r: any) => r.response_time_ms != null && r.is_error != null
);

console.log(`Loaded ${records.length} records`);
```

## Statistical Analysis

Compute correlation and test significance.

###### correlation.mts

```typescript
import { records } from './load-data.mts';
import {
  sampleCorrelation,
  linearRegression,
  linearRegressionLine
} from 'simple-statistics';

const times = records.map((r: any) => r.response_time_ms);
const errors = records.map((r: any) => r.is_error ? 1 : 0);

export const correlation = sampleCorrelation(times, errors);
export const regression = linearRegression(
  times.map((t: number, i: number) => [t, errors[i]])
);

console.log(`Correlation: ${correlation.toFixed(4)}`);
console.log(`Slope: ${regression.m.toFixed(6)}, Intercept: ${regression.b.toFixed(4)}`);
```

## Cache Impact Model

Estimate the effect of a cache layer on error rates.

###### cache-model.mts

```typescript
import { records } from './load-data.mts';
import { correlation, regression } from './correlation.mts';

const p50 = records
  .map((r: any) => r.response_time_ms)
  .sort((a: number, b: number) => a - b);
const medianTime = p50[Math.floor(p50.length / 2)];

const cacheHitRate = 0.7;
const cachedResponseTime = 5;
const effectiveMedian =
  cacheHitRate * cachedResponseTime +
  (1 - cacheHitRate) * medianTime;

const currentErrorRate =
  records.filter((r: any) => r.is_error).length / records.length;
const projectedErrorRate = Math.max(
  0,
  currentErrorRate + regression.m * (effectiveMedian - medianTime)
);

export const recommendation = {
  correlation,
  currentErrorRate,
  projectedErrorRate,
  reductionPercent:
    ((currentErrorRate - projectedErrorRate) / currentErrorRate * 100),
  recommend: projectedErrorRate < currentErrorRate * 0.8
};

console.log(JSON.stringify(recommendation, null, 2));
```

## Recommendation

###### recommend.mts

```typescript
import { recommendation } from './cache-model.mts';

const verdict = recommendation.recommend
  ? `ADD CACHE: Projected ${recommendation.reductionPercent.toFixed(1)}% error reduction.`
  : `SKIP CACHE: Projected error reduction (${recommendation.reductionPercent.toFixed(1)}%) is below the 20% threshold.`;

console.log(verdict);
```
```

This notebook was not copied from any single template. It combines:
- Data loading patterns (from Data Analysis template)
- Statistical computation (from Computation template)
- Modeling/simulation (from Simulation template)
- Decision logic (from Decision Analysis template)
- A novel "cache impact model" cell that none of the templates contained

### 3.9 Open Questions and Risks

1. **Evaluation function**: ADAS evaluates agents on task accuracy. What is the evaluation function for notebooks? Possible signals: does the notebook execute without errors, does the output answer the question, does the user find it useful, is the structure clear?

2. **Composability limits**: ADAS agents are ~100 lines with a fixed interface. Notebooks are more complex -- they have inter-cell dependencies, external data inputs, and side effects. The search space is larger and harder to validate statically.

3. **Safety**: ADAS already warns about executing untrusted model-generated code. A runtime that instantiates agent-designed notebooks needs sandboxing (filesystem access, network access, resource limits).

4. **Archive growth**: ADAS appends every agent to the archive without pruning. For notebooks, the archive could grow large. Some form of curation or summarization may be needed to keep context length manageable.

5. **Stale dependencies**: Generated package.json files reference specific npm versions. A long-lived archive needs dependency version management.

6. **Beyond TypeScript**: The Srcbook format only supports JavaScript/TypeScript. For domains requiring Python (data science, ML), the format would need extension or an alternative runtime.

---

## 4. Key Takeaways

1. **ADAS proves that meta-agents can design novel, high-performing agent architectures** by programming in code, using an ever-growing archive of previous discoveries as context. The designs transfer across domains and models.

2. **The .src.md format is a lightweight, agent-friendly notebook representation** -- plain Markdown with structural conventions for code cells, dependencies, and metadata. It is parseable, git-diffable, and executable.

3. **The combination is natural**: An ADAS-style meta-agent can design custom `.src.md` notebooks at runtime by composing cognitive affordances from a template archive. The notebook format provides the right balance of structure (parseable cell types, dependency management) and flexibility (arbitrary code, arbitrary narrative).

4. **The key architectural decisions** for such a system are:
   - How to define and measure "fitness" for notebooks (not just accuracy, but usability, clarity, correctness)
   - How to constrain the search space (max cells, max lines, required cell types, import validation)
   - How to manage the template archive (curation, summarization, version control)
   - How to sandbox execution of agent-generated notebooks

---

## Sources

- Hu, S., Lu, C., & Clune, J. (2024). Automated Design of Agentic Systems. arXiv:2408.08435. https://arxiv.org/abs/2408.08435
- ADAS project page: https://www.shengranhu.com/ADAS/
- ADAS source code: https://github.com/ShengranHu/ADAS
- Srcbook repository: https://github.com/srcbookdev/srcbook
- Srcbook .src.md format implementation: `packages/api/srcmd/` in the Srcbook repo
- Srcbook HN discussion: https://news.ycombinator.com/item?id=41291700
- Praful John. "When AI Starts Designing Its Own Agents." Medium, Dec 2025. https://medium.com/@praful.john2409/when-ai-starts-designing-its-own-agents-a-gentle-dive-into-adas-and-meta-agent-search-b8986f3e5912
