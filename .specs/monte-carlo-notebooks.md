# SPEC: Monte Carlo Simulation Notebooks

**Status:** Draft
**Priority:** P2 — Strategic reasoning capability
**Target:** `thoughtbox/src/notebook/`
**Depends on:** SPEC-RW-005 (Agent-Designed Custom Notebooks)

## Problem

Agents reasoning about strategy under uncertainty lack a way to quantify outcomes. An agent can reason qualitatively ("conversion rates might be 2-5%") but cannot run thousands of simulations to produce probability distributions, percentile bounds, or sensitivity rankings. This limits strategic reasoning to intuition where computation would be more useful.

Thoughtbox notebooks already execute JavaScript/TypeScript in isolated environments with dependency management. Monte Carlo simulation is a natural extension: the agent writes simulation code in notebook cells, runs it, and references the quantified results in subsequent thoughts.

## What Already Exists

The notebook module (`thoughtbox/src/notebook/`) provides:

- **Cell types**: title, markdown, package.json, code (JS/TS)
- **Execution**: Code cells run via Node.js (JS) or tsx (TS) in isolated temp directories, with stdout/stderr capture and 30s timeout
- **Dependencies**: `package.json` cell + `pnpm install` via `notebook_install_deps`
- **Templates**: One template exists (`sequential-feynman`), loaded from `templates.generated.ts` with placeholder substitution (`[TOPIC]`, `[DATE]`, `[LANGUAGE]`)
- **Encoding**: `.src.md` format (markdown with metadata header, code fences for cells)
- **Operations**: create, list, load, add_cell, update_cell, run_cell, install_deps, list_cells, get_cell, export — dispatched through a single `notebook` MCP tool

No probability distribution libraries, iteration helpers, or result aggregation patterns exist. Agents must build everything from scratch each time they want to simulate.

## Design

### 1. Seed Template: `monte-carlo-strategy`

A new template registered in `templates.generated.ts` that provides scaffolded cells for running Monte Carlo simulations. The agent customizes the variable definitions and model logic; the simulation infrastructure is pre-built.

Template structure (8 cells):

| # | Type | Filename | Purpose |
|---|------|----------|---------|
| 1 | title | — | "Monte Carlo Strategy Simulation: [TOPIC]" |
| 2 | markdown | — | Simulation parameters documentation |
| 3 | package.json | package.json | Dependencies (jstat, simple-statistics) |
| 4 | code | distributions.ts | Probability distribution helpers |
| 5 | code | model.ts | Simulation model (agent customizes this) |
| 6 | code | simulate.ts | Monte Carlo loop with seed control |
| 7 | code | analyze.ts | Result aggregation and percentile tables |
| 8 | code | report.ts | Text-based visualization (histograms, sensitivity) |

### 2. Probability Distributions (`distributions.ts`)

Use the `jstat` npm package for standard distributions. The template cell wraps jstat in a typed interface the agent can use without learning the jstat API:

```typescript
import jStat from "jstat";

export const dist = {
  // Continuous
  normal: (mean: number, stddev: number) =>
    () => jStat.normal.sample(mean, stddev),
  uniform: (min: number, max: number) =>
    () => jStat.uniform.sample(min, max),
  triangular: (min: number, mode: number, max: number) =>
    () => jStat.triangular.sample(min, mode, max),
  lognormal: (mu: number, sigma: number) =>
    () => jStat.lognormal.sample(mu, sigma),
  beta: (alpha: number, beta: number) =>
    () => jStat.beta.sample(alpha, beta),

  // Discrete
  poisson: (lambda: number) =>
    () => jStat.poisson.sample(lambda),
  binomial: (n: number, p: number) =>
    () => jStat.binomial.sample(n, p),

  // Utility: clamp a sampler to [min, max]
  clamp: (sampler: () => number, min: number, max: number) =>
    () => Math.max(min, Math.min(max, sampler())),

  // Utility: fixed value (no uncertainty)
  fixed: (value: number) => () => value,
};
```

This gives agents a composable toolkit. Each distribution function returns a zero-argument sampler, so the model code reads naturally: `const visitors = trafficSampler()`.

**Why jstat over custom implementations:** jstat is a mature library (10+ years, 1.4k GitHub stars) with correct implementations of 20+ distributions. Rolling custom distributions is error-prone for non-trivial cases (triangular, beta, lognormal). The dependency cost is ~150KB unpacked — acceptable for a notebook that already runs `pnpm install`.

**Alternative considered:** `simple-statistics` is lighter but lacks distribution sampling. Include it alongside jstat for the aggregation/percentile functions, which are cleaner than jstat's API for summary statistics.

### 3. Simulation Model (`model.ts`)

The agent-customizable cell. The template provides a typed skeleton:

```typescript
import { dist } from "./distributions.ts";

// --- VARIABLES: Define uncertain inputs ---
export interface SimulationVariables {
  // Agent fills these in. Example:
  weeklyTraffic: number;
  conversionRate: number;
  revenuePerCustomer: number;
}

// --- SAMPLERS: Map variables to distributions ---
export const samplers: Record<
  keyof SimulationVariables,
  () => number
> = {
  weeklyTraffic: dist.normal(500, 150),
  conversionRate: dist.beta(2, 50),
  revenuePerCustomer: dist.lognormal(3.5, 0.8),
};

// --- MODEL: Compute outcome from one sample ---
export function runOneIteration(): {
  variables: SimulationVariables;
  outcome: number;
} {
  const variables: SimulationVariables = {} as SimulationVariables;
  for (const [key, sampler] of Object.entries(samplers)) {
    (variables as any)[key] = sampler();
  }

  // Agent defines the model logic here
  const outcome =
    variables.weeklyTraffic *
    variables.conversionRate *
    variables.revenuePerCustomer;

  return { variables, outcome };
}
```

The agent's job is to:
1. Define the `SimulationVariables` interface (what varies)
2. Assign distributions to each variable (what uncertainty looks like)
3. Write the model function (how variables combine into an outcome)

### 4. Simulation Loop (`simulate.ts`)

Runs N iterations with optional seed for reproducibility:

```typescript
import { runOneIteration } from "./model.ts";

// --- CONFIG ---
const N = 10_000;
const SEED: number | null = null; // Set for reproducibility

// --- RUN ---
interface SimResult {
  variables: Record<string, number>;
  outcome: number;
}

const results: SimResult[] = [];
for (let i = 0; i < N; i++) {
  results.push(runOneIteration());
}

// Write results to stdout as JSON for downstream cells
console.log(JSON.stringify({ n: N, results }));
```

**Seed control:** JavaScript's `Math.random()` cannot be seeded. For reproducible simulations, the template's `package.json` includes `seedrandom`. When `SEED` is set, the distributions cell patches `Math.random` at import time:

```typescript
import seedrandom from "seedrandom";
if (globalThis.__MONTE_CARLO_SEED != null) {
  Math.random = seedrandom(String(globalThis.__MONTE_CARLO_SEED));
}
```

This is a pragmatic trade-off: it globally patches `Math.random`, which is fine in an isolated notebook environment. jstat uses `Math.random` internally, so this is the only way to seed it without forking the library.

**Timeout considerations:** The default 30s execution timeout in `execution.ts` is sufficient for 10,000 iterations of typical models. For 100,000+ iterations or complex models, the agent can split into batches across multiple cells or increase the timeout (requires a code change in execution.ts, not addressed in this spec).

### 5. Result Aggregation (`analyze.ts`)

Reads simulation output and computes summary statistics:

```typescript
import ss from "simple-statistics";

// In practice, this cell reads from a shared file or
// the simulate.ts cell writes to a JSON file in the
// notebook directory. See "Cell Data Passing" below.

interface AnalysisReport {
  n: number;
  outcome: {
    mean: number;
    median: number;
    stddev: number;
    percentiles: Record<string, number>;
    min: number;
    max: number;
  };
  sensitivity: Array<{
    variable: string;
    correlation: number;
    impact: string; // "high" | "medium" | "low"
  }>;
}

function analyze(results: SimResult[]): AnalysisReport {
  const outcomes = results.map((r) => r.outcome);

  // Percentile table
  const pctiles = [5, 10, 25, 50, 75, 90, 95];
  const percentiles: Record<string, number> = {};
  for (const p of pctiles) {
    percentiles[`p${p}`] = ss.quantile(outcomes, p / 100);
  }

  // Sensitivity: Spearman rank correlation of each
  // variable against the outcome
  const varNames = Object.keys(results[0].variables);
  const sensitivity = varNames.map((name) => {
    const varValues = results.map((r) => r.variables[name]);
    const corr = ss.sampleCorrelation(varValues, outcomes);
    const absCorr = Math.abs(corr);
    return {
      variable: name,
      correlation: corr,
      impact: absCorr > 0.5 ? "high" : absCorr > 0.2 ? "medium" : "low",
    };
  });

  // Sort by absolute correlation descending
  sensitivity.sort(
    (a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)
  );

  return {
    n: results.length,
    outcome: {
      mean: ss.mean(outcomes),
      median: ss.median(outcomes),
      stddev: ss.standardDeviation(outcomes),
      percentiles,
      min: ss.min(outcomes),
      max: ss.max(outcomes),
    },
    sensitivity,
  };
}
```

### 6. Text-Based Visualization (`report.ts`)

Notebook cells capture stdout. Since there is no graphical rendering pipeline, visualizations are text-based — designed to be readable by both agents and humans in terminal output.

**Histogram (ASCII):**

```
Revenue Distribution (10,000 iterations)
─────────────────────────────────────────
  $0-$500    ████████░░░░░░░░░░░░  18.3%
  $500-$1k   ████████████████░░░░  32.1%
  $1k-$2k    ██████████████████░░  28.7%
  $2k-$5k    ████████░░░░░░░░░░░░  15.4%
  $5k-$10k   ██░░░░░░░░░░░░░░░░░░   4.2%
  $10k+      ░░░░░░░░░░░░░░░░░░░░   1.3%
```

**Percentile table:**

```
Outcome Percentiles
─────────────────────
  P5:   $127
  P10:  $234
  P25:  $589
  P50:  $1,247  (median)
  P75:  $2,891
  P90:  $5,432
  P95:  $8,103

  Mean: $2,156 | Std Dev: $3,201
```

**Sensitivity ranking:**

```
Sensitivity Analysis (Spearman ρ)
─────────────────────────────────
  conversionRate       ρ=0.72  ████████████████████  HIGH
  weeklyTraffic        ρ=0.58  ██████████████░░░░░░  HIGH
  revenuePerCustomer   ρ=0.31  ████████░░░░░░░░░░░░  MEDIUM
```

This text output is the primary interface. The agent reads it directly from cell output and incorporates the numbers into reasoning.

### 7. Cell Data Passing

Notebooks execute cells independently (each `run_cell` spawns a new Node process). Cells cannot share in-memory state. Two patterns for passing data between cells:

**Pattern A: File-based (recommended).** The simulate cell writes results to a JSON file in the notebook's temp directory. The analyze cell reads from the same file. The notebook's `cwd` is stable across cells.

```typescript
// simulate.ts — end of file
import { writeFileSync } from "fs";
writeFileSync("results.json", JSON.stringify({ n: N, results }));
console.log(`Wrote ${N} results to results.json`);

// analyze.ts — start of file
import { readFileSync } from "fs";
const { results } = JSON.parse(readFileSync("results.json", "utf8"));
```

**Pattern B: Self-contained cells.** Combine simulation + analysis in a single cell. Simpler but produces longer cells that are harder to iterate on.

The template uses Pattern A. The `simulate.ts` cell writes to `results.json`, and both `analyze.ts` and `report.ts` read from it.

### 8. Integration with Thought Sessions

The value of Monte Carlo in Thoughtbox is the feedback loop: agent reasons qualitatively, runs simulation to quantify, then reasons about the quantified results. This loop uses existing capabilities — no new protocol needed.

**Workflow:**

1. Agent records a thought: "Hypothesis: with 500 weekly visitors and 2-4% conversion, revenue after 8 weeks should be $5k-$15k. Wide range — let me simulate."
2. Agent creates a Monte Carlo notebook from the template (or customizes an existing one).
3. Agent edits `model.ts` with specific variables and distributions.
4. Agent runs cells: install_deps -> simulate -> analyze -> report.
5. Agent reads the report cell output.
6. Agent records a follow-up thought: "Simulation (N=10,000) shows P50=$8,200, P90=$14,100. 23% chance of exceeding $15k. Conversion rate is the dominant variable (rho=0.72). Should focus GTM effort on conversion optimization over traffic."

**What makes this work without new protocol:**
- `notebook_run_cell` already returns stdout in the tool response
- The agent can read cell output via `notebook_get_cell` (output field)
- Thoughts are free-text — the agent naturally references simulation results
- The notebook persists as an artifact linked to the session

**Knowledge graph integration (future, not in scope):** Store simulation summaries as entities with `type: "SimulationResult"` and relations to the thoughts that produced them. This enables agents to query past simulations ("What did I assume about conversion rates last time?").

### 9. Template Registration

Add `monte-carlo-strategy` to the template system:

1. Create the `.src.md` template file in `src/notebook/templates/`
2. Run `scripts/embed-templates.ts` to regenerate `templates.generated.ts`
3. Update the `template` enum in `tool.ts` and `operations.ts` to include `monte-carlo-strategy`

The template uses placeholders:
- `[TOPIC]` — simulation title (from notebook `title` arg)
- `[DATE]` — creation date
- `[LANGUAGE]` — always `typescript` (statistical libraries need types)

## Example: 8-Week GTM Plan Simulation

This demonstrates the complete workflow an agent would follow. The agent is reasoning about a go-to-market strategy for Thoughtbox and wants to quantify outcomes under uncertainty.

### Agent's model.ts customization

```typescript
import { dist } from "./distributions.ts";

export interface SimulationVariables {
  weeklyOrgTraffic: number;    // visitors/week to thoughtbox.dev
  signupRate: number;           // % of visitors who create account
  activationRate: number;       // % of signups who connect MCP
  conversionRate: number;       // % of activated users who pay
  monthlyPrice: number;         // $/month (fixed at $29 for now)
  weeklyEnergyHours: number;    // founder hours available/week
  churnRateMonthly: number;     // % of paying users who cancel/month
}

export const samplers = {
  // Traffic: starts low, grows. Model as week-by-week.
  weeklyOrgTraffic: dist.triangular(200, 400, 800),
  signupRate: dist.beta(3, 60),          // ~4.8% mean, wide spread
  activationRate: dist.beta(5, 10),      // ~33% mean
  conversionRate: dist.beta(2, 30),      // ~6.3% mean
  monthlyPrice: dist.fixed(29),
  weeklyEnergyHours: dist.clamp(
    dist.normal(25, 8), 5, 45            // realistic founder hours
  ),
  churnRateMonthly: dist.beta(2, 40),   // ~4.8% mean
};

// Simulate 8 weeks of GTM execution
export function runOneIteration() {
  const vars: SimulationVariables = {} as any;
  for (const [k, s] of Object.entries(samplers)) {
    (vars as any)[k] = s();
  }

  let totalPaying = 0;
  let totalRevenue = 0;
  let cumSignups = 0;

  for (let week = 1; week <= 8; week++) {
    // Traffic grows ~5% per week from content/SEO
    const weekTraffic = vars.weeklyOrgTraffic * (1 + 0.05 * week);
    const newSignups = weekTraffic * vars.signupRate;
    const activated = newSignups * vars.activationRate;
    const newPaying = activated * vars.conversionRate;

    // Apply monthly churn (weekly approximation)
    const weeklyChurn = 1 - Math.pow(1 - vars.churnRateMonthly, 0.25);
    totalPaying = totalPaying * (1 - weeklyChurn) + newPaying;

    cumSignups += newSignups;
    totalRevenue += totalPaying * vars.monthlyPrice / 4; // weekly rev
  }

  // Energy constraint: if hours < 15, marketing suffers
  const energyPenalty = vars.weeklyEnergyHours < 15 ? 0.6 : 1.0;
  totalRevenue *= energyPenalty;

  return {
    variables: vars,
    outcome: totalRevenue,
    // Extra outputs for richer analysis
    meta: {
      finalPayingUsers: totalPaying,
      totalSignups: cumSignups,
      revenuePerHour: totalRevenue / (vars.weeklyEnergyHours * 8),
    },
  };
}
```

### Expected report output

```
GTM Plan: 8-Week Revenue Simulation (N=10,000)
═══════════════════════════════════════════════

Revenue Distribution
────────────────────
  $0-$100      ██████████░░░░░░░░░░  22.1%
  $100-$300    ████████████████░░░░  31.4%
  $300-$700    ██████████████░░░░░░  24.8%
  $700-$1500   ██████░░░░░░░░░░░░░░  13.2%
  $1500-$3000  ███░░░░░░░░░░░░░░░░░   6.1%
  $3000+       █░░░░░░░░░░░░░░░░░░░   2.4%

Revenue Percentiles
────────────────────
  P5:    $23
  P10:   $52
  P25:   $142
  P50:   $341    (median)
  P75:   $798
  P90:   $1,621
  P95:   $2,487

  Mean: $571 | Std Dev: $892

Sensitivity Analysis (Spearman rho)
────────────────────────────────────
  conversionRate     rho=0.68  ████████████████████  HIGH
  signupRate         rho=0.54  ██████████████░░░░░░  HIGH
  activationRate     rho=0.47  ████████████░░░░░░░░  MEDIUM
  weeklyOrgTraffic   rho=0.41  ██████████░░░░░░░░░░  MEDIUM
  weeklyEnergyHours  rho=0.22  ██████░░░░░░░░░░░░░░  MEDIUM
  churnRateMonthly   rho=-0.18 █████░░░░░░░░░░░░░░░  LOW

Key Findings
────────────
  - 50% chance revenue exceeds $341 in 8 weeks
  - 10% chance revenue exceeds $1,621
  - Conversion rate is the single biggest lever (rho=0.68)
  - Signup rate is #2 — landing page optimization matters
  - Energy hours matter but less than funnel metrics
  - Churn has low impact over 8 weeks (too short for churn to compound)
```

### Agent's follow-up thought

> Simulation results (N=10,000): median 8-week revenue is $341, not $5k-$15k as I estimated qualitatively. My initial estimate was off by 10-40x because I didn't account for the multiplicative funnel — each conversion stage compounds the loss. The dominant levers are conversion rate (rho=0.68) and signup rate (rho=0.54). Traffic volume ranks 4th. This means the first GTM priority should be conversion optimization (pricing page, onboarding flow, activation triggers), not traffic acquisition. Writing content for SEO is lower priority than reducing friction in the signup-to-payment pipeline.

## Dependencies

| Package | Version | Size | Purpose |
|---------|---------|------|---------|
| `jstat` | ^1.9.6 | ~150KB | Probability distribution sampling |
| `simple-statistics` | ^7.8.5 | ~80KB | Percentiles, correlation, summary stats |
| `seedrandom` | ^3.0.5 | ~15KB | Reproducible random seeds |

All three are well-maintained, have no native dependencies, and work in Node.js ESM. Total added weight is ~245KB unpacked — negligible for a notebook environment.

## Files to Modify

| File | Change |
|------|--------|
| `src/notebook/templates/monte-carlo-strategy.src.md` | New file — the template in .src.md format |
| `src/notebook/templates.generated.ts` | Regenerated — adds `monte-carlo-strategy` template |
| `src/notebook/tool.ts` | Update template enum to include `monte-carlo-strategy` |
| `src/notebook/operations.ts` | Update template enum in create operation schema |
| `scripts/embed-templates.ts` | Verify it picks up new template (may work automatically) |

## Acceptance Criteria

- [ ] `notebook_create` with `template: "monte-carlo-strategy"` produces a valid notebook with 8 cells
- [ ] Running cells in order (install_deps -> distributions -> model -> simulate -> analyze -> report) produces correct output
- [ ] Report cell output includes histogram, percentile table, and sensitivity ranking
- [ ] Agent can customize `model.ts` cell and re-run simulation with different variables
- [ ] `seedrandom` seed produces identical results across runs when set
- [ ] Template placeholder substitution works for `[TOPIC]`, `[DATE]`, `[LANGUAGE]`

## Non-Goals

- Graphical visualization (charts, plots) — text output is sufficient for agent consumption; graphical rendering requires a browser runtime
- Parallel simulation (Web Workers) — 10,000 iterations completes in <1s single-threaded for typical models
- Persistent simulation databases — results live in the notebook's temp directory
- Custom distribution definitions — agents can write arbitrary JS; the template distributions cover common cases
- Multi-model comparison in a single notebook — agents can create multiple notebooks
- Real-time streaming of simulation progress — batch execution is fine

## Future Directions (not in scope)

- **Scenario comparison notebooks**: Template variant that runs the same model under 2-3 named scenarios (optimistic, base, pessimistic) and compares distributions side by side
- **Time-series simulation**: Week-by-week or month-by-month simulation with state carried forward (the GTM example does this manually; a dedicated template could standardize it)
- **Knowledge graph storage**: Persist simulation summaries as entities with relations to the thoughts that motivated them, enabling historical simulation queries
- **Graphical output**: If notebooks gain a rendering pipeline (e.g., via SPEC-RW-005 notebook_design), generate SVG histograms and tornado charts
- **Bayesian updating**: Update prior distributions with observed data from previous weeks, re-run simulation with tighter posteriors
- **Agent-automated sensitivity sweeps**: Agent automatically varies one input at a time to build tornado charts without manual iteration
