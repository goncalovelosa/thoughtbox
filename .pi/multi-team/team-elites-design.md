# TEAM-Elites: Quality-Diversity Evolution for Multi-Agent Teams

> MAP-Elites over team blueprints, powered by lettabot + Thoughtbox Hub
>
> Design session: Thoughtbox `73e3d3f7-3958-4a08-b6c1-7493bf887be1` (17 thoughts, 1 branch)

---

## 1. Vision

Lettabot today is a single-agent, single-conversation bot with a FIFO message queue. TEAM-Elites transforms it into an **evolutionary multi-agent system** where:

- A **MAP-Elites archive** stores diverse, high-performing team blueprints
- Each **niche** is a (channel x domain) pair — e.g., "telegram-coding" or "slack-research"
- **Variation operators** produce new team configurations
- **Selection pressure** comes from the Hub's proposal-review-merge cycle
- The system **self-improves** over generations, discovering teams optimized for each niche

The end state: an archive of team blueprints forming a Pareto front of quality-diversity tradeoffs, viewable in Thoughtbox Observatory.

---

## 2. Prior Art

| System | Year | Level | Key Mechanism | Gap |
|--------|------|-------|---------------|-----|
| **CycleQD** (Sakana, ICLR 2025) | 2025 | Model weights | QD with model-merging crossover + SVD mutation | Operates at weight level, not team composition |
| **Darwin Godel Machine** (Clune+Sakana, ICLR 2026) | 2026 | Agent code | Self-improving agent archive, open-ended exploration | Single-agent self-modification, not team evolution |
| **AI Scientist v2** (Sakana) | 2025 | Research workflow | Agentic tree search, review-as-fitness | Standalone system, not embedded in coordination substrate |
| **LoongFlow** | Dec 2025 | Code search | MAP-Elites + multi-island LLM evolution | Code generation focus, no agent teams |
| **QED** | 2020 | Robot swarms | Quality-Environment-Diversity for fault recovery | Robot controllers, not LLM agents |

**What's novel in TEAM-Elites:**
- Evolves **team composition** (agents + skills + prompts + coordination strategy) — a level of abstraction above weights or code
- The **coordination substrate itself** (Hub) serves as the evolutionary archive — no separate archive needed
- **Reasoning-enriched archive**: stores phenotype + fitness + full reasoning chain + attribution (enables meta-learning)
- **Review-as-selection** is embedded in the coordination protocol, not bolted on

---

## 3. Core Mapping: Hub as QD Runtime

The central insight: **Thoughtbox Hub already IS a quality-diversity runtime.** Every QD primitive maps to an existing Hub operation with zero new primitives needed.

```
MAP-Elites Concept          Hub Primitive              How It Works
─────────────────────────── ────────────────────────── ──────────────────────────────────
Archive                     Workspace                  One workspace per TEAM-Elites run
Niche / Cell                Problem                    Title = niche label, description = behavior descriptor
Behavior Descriptor         Problem metadata           Channel + domain + style dimensions
Candidate Solution          Proposal                   Blueprint serialized in proposal description
Fitness Evaluation          Review                     Multi-agent reviews → ensemble fitness score
Selection (archive update)  merge_proposal()           Merge creates main-chain thought with attribution
Stepping-stone Transfer     Channel messages           post_message() with thought refs across niches
Archive-best Decision       ConsensusMarker            mark_consensus() marks current elite per niche
Niche Dependencies          Problem dependencies       add_dependency() models stepping-stone order
Ready Niches                ready_problems()           Returns niches whose deps are satisfied
Variation Workspace         Branch (via claim_problem)  Agent forks branch from main chain to explore
```

### The Branching-as-Variation Insight

In standard MAP-Elites, variation = random mutation/crossover. In TEAM-Elites:

1. **Variation = Branching**: Agent forks a reasoning branch from the main chain. On this branch, it designs a modified team blueprint. The branch IS the variation workspace.
2. **Evaluation = Branch Execution**: The team blueprint is instantiated and tested on the branch.
3. **Submission = Proposal**: Agent creates a Proposal linking the branch to the target niche.
4. **Selection = Review + Merge**: Reviewers evaluate. If fitness > current elite, coordinator merges.
5. **Knowledge Transfer = Branch Refs**: Agents reference successful branches from other niches via thought refs. This IS stepping-stone transfer.

The merge operation (`proposals.ts:117-134`) creates a thought on the MAIN chain with agent attribution. Every successful variation leaves a permanent trace. The archive stores not just solutions — it stores the **reasoning that led to them**.

---

## 4. Genome: TeamBlueprint

```typescript
interface TeamBlueprint {
  // Identity
  id: string;
  name: string;
  generation: number;
  parentIds: string[];           // Lineage tracking

  // Team composition
  agents: AgentConfig[];         // 1–5 agents per team
  coordinationStrategy: 'sequential' | 'parallel' | 'debate' | 'pipeline';

  // Niche targeting
  niche: {
    channel: ChannelId | 'multi-channel';
    domain: 'coding' | 'research' | 'scheduling' | 'communication' | 'general';
    style?: 'concise' | 'detailed' | 'conversational' | 'technical' | 'creative';
  };

  // Fitness record
  fitness: {
    composite: number;           // Weighted aggregate [0,1]
    taskCompletion: number;
    reviewScore: number;
    reasoningDepth: number;
    consensusSpeed: number;
    costEfficiency: number;
    userSatisfaction?: number;   // Optional: real user feedback
  };

  // Hub references
  workspaceId: string;
  problemId: string;
  proposalId?: string;
  consensusMarkerId?: string;
}

interface AgentConfig {
  role: 'coordinator' | 'contributor' | 'reviewer' | 'specialist';
  model: string;
  systemPrompt: string;
  skills: SkillsConfig;
  memoryBlocks: Array<{ label: string; value: string }>;
}
```

Genome size: ~5–20 parameters per agent x 1–5 agents + coordination strategy + niche targeting = manageable search space.

---

## 5. Variation Operators

Six operators, each using Hub primitives:

| # | Operator | Mechanism | Hub Expression |
|---|----------|-----------|----------------|
| 1 | **Skill Mutation** | Add/remove/swap skills between agents | Modified SkillsConfig in proposal |
| 2 | **Role Mutation** | Reassign coordinator/contributor/reviewer | Restructured AgentConfig[] in proposal |
| 3 | **Prompt Crossover** | LLM-based blend of two elite system prompts | References two parent blueprints via thought refs |
| 4 | **Strategy Mutation** | Change coordination mode (sequential → debate, etc.) | Architecture change described in proposal |
| 5 | **Team Size Mutation** | Add or remove agents (min 1, max 5) | New/removed AgentConfig entries |
| 6 | **Model Mutation** | Swap agent model tier (haiku ↔ sonnet ↔ opus) | Budget-aware: higher cost penalized unless quality compensates |

**Variation schedule**: Each generation applies 1–3 operators (probabilistic). Crossover requires 2 parents from the archive. Mutations require 1 parent.

---

## 6. Fitness Function

```
fitness(blueprint) = w1*taskCompletion + w2*reviewScore + w3*reasoningDepth
                   + w4*consensusSpeed + w5*costEfficiency
```

Default weights: `w1=0.35, w2=0.25, w3=0.15, w4=0.10, w5=0.15`

| Component | Range | How Measured | Hub Signal |
|-----------|-------|-------------|------------|
| **Task Completion** | [0,1] | Fraction of test prompts with acceptable responses (LLM-as-judge) | Automated test harness |
| **Review Score** | [0,1] | Average verdict: approve=1.0, comment=0.5, request-changes=0.0 | `proposal.reviews[].verdict` |
| **Reasoning Depth** | [0,1] | Normalized thought count on working branch | `thoughtStore.getThoughtCount()` |
| **Consensus Speed** | [0,1] | `1 - (time_to_consensus / max_allowed_time)` | `problem.createdAt` → first `ConsensusMarker` |
| **Cost Efficiency** | [0,1] | `1 - (cost / budget_ceiling)` | Token usage tracking |

**Elite replacement rule**: New candidate replaces current elite in niche IFF composite fitness > current elite. Ties broken by cost efficiency.

---

## 7. Evolutionary Loop

One full generation on Hub:

```
┌─────────────────────────────────────────────────────────────────────┐
│ GENERATION N                                                        │
│                                                                     │
│  1. INITIALIZE (once)                                               │
│     Hub: create_workspace → create_problem per niche → add deps     │
│                                                                     │
│  2. SELECT PARENTS                                                  │
│     Hub: ready_problems() → pick random ready niche                 │
│     If elite exists: use as parent. If empty: random blueprint.     │
│     Crossover: second parent from adjacent niche.                   │
│                                                                     │
│  3. VARIATE                                                         │
│     Hub: claim_problem() → creates branch from main chain           │
│     Apply 1–3 variation operators to parent blueprint.              │
│     Record reasoning via thoughts on branch.                        │
│                                                                     │
│  4. EVALUATE                                                        │
│     createAgent() for each agent in blueprint.                      │
│     Send niche-appropriate test messages. Collect responses.        │
│     Compute fitness components.                                     │
│                                                                     │
│  5. SUBMIT                                                          │
│     Hub: create_proposal(blueprint + fitness, sourceBranch, niche)  │
│                                                                     │
│  6. REVIEW                                                          │
│     Hub: review_proposal() by 2+ reviewers                         │
│     Validate: well-formed, plausible scores, exceeds current elite. │
│                                                                     │
│  7. SELECT                                                          │
│     IF approved AND fitness > elite:                                │
│       Hub: merge_proposal() → main-chain merge thought              │
│       Hub: mark_consensus('elite-[niche]', mergeThoughtNumber)      │
│     ELSE: rejected (branch preserved as stepping stone)             │
│                                                                     │
│  8. TRANSFER                                                        │
│     Hub: post_message() to adjacent niches with insights            │
│     Reference specific thoughts from successful variations.         │
│                                                                     │
│  9. REPEAT from step 2.                                             │
└─────────────────────────────────────────────────────────────────────┘
```

**Termination**: Configurable — N generations, time budget, or fitness plateau detection.

**Schedule**: Cron job every 6 hours (`0 */6 * * *`) via CronService.

---

## 8. Architecture

### New Files (6)

| File | Purpose |
|------|---------|
| `lettabot/src/core/swarm-store.ts` | Multi-agent registry. Extends Store pattern with SwarmRegistry (agents[], blueprints[], generation, hubAgentId). Backward compatible: `mode: 'single'` behaves like original Store. |
| `lettabot/src/core/swarm-manager.ts` | Top-level orchestrator. Manages N agent instances, routes messages, drives evolutionary loop. |
| `lettabot/src/core/hub-client.ts` | MCP HTTP client for Thoughtbox Hub. JSON-RPC calls to `localhost:1731/mcp`. Persists `mcp-session-id` header. |
| `lettabot/src/core/niche-matcher.ts` | Message → niche classification. Channel dimension from `msg.channel`, domain from keyword heuristics + LLM fallback. |
| `lettabot/src/cron/evolution.ts` | EvolutionEngine class. Implements variation, evaluation, selection. Called by CronService. |
| `lettabot/src/core/types.ts` | Extend with TeamBlueprint, FitnessScores, NicheDescriptor, SwarmRegistry types. |

### Modified Files (2)

| File | Change |
|------|--------|
| `lettabot/src/core/bot.ts` | Add swarm mode routing in `handleMessage()`. Replace single `processing` mutex with per-agent queues. Fallback to original single-agent path when `mode: 'single'`. |
| `lettabot/src/cron/service.ts` | Add evolution cron job scheduling. CronService already supports dynamic job creation — just add the evolution job at startup. |

### Component Diagram

```
                    ┌──────────────────────────────────────────────┐
                    │                  LettaBot                    │
                    │                                              │
  Inbound ──────►   │  handleMessage() ──► NicheMatcher            │
  Messages          │       │                    │                 │
                    │       │              match(msg)               │
                    │       ▼                    │                 │
                    │  SwarmStore ◄──────── niche ──► best agent   │
                    │  (registry)                        │         │
                    │       │                            ▼         │
                    │       │                    processMessage()   │
                    │       │                    (per-agent queue)  │
                    └───────┼──────────────────────────────────────┘
                            │
                    ┌───────┼──────────────────────────────────────┐
                    │       ▼           CronService                │
                    │  EvolutionEngine                             │
                    │       │                                      │
                    │  selectParents() ──► variate() ──► evaluate()│
                    │       │                                │     │
                    │       ▼                                ▼     │
                    │  HubClient ────────────────── Thoughtbox Hub │
                    │  (MCP HTTP)     register, workspace, problem,│
                    │                 claim, proposal, review,     │
                    │                 merge, consensus, channel    │
                    └──────────────────────────────────────────────┘
```

---

## 9. Key Constraints Discovered

### Hub Coordinator Identity
Re-registering with Thoughtbox Hub creates a new `agentId`. Only the original workspace creator has `coordinator` role (required for `create_problem`, `merge_proposal`). **The SwarmStore must persist `hubAgentId`** across restarts.

Workaround verified in smoke test: store the coordinator's agentId on first registration, reuse on subsequent startups. If the workspace is lost, re-initialize from scratch.

### Lettabot Single-Agent Bottleneck
`bot.ts:48` uses a single `processing = false` mutex. The `Store` class (`store.ts`) persists a single `agentId` + `conversationId`. Both must be extended for multi-agent:
- Store → SwarmStore (N agent entries)
- Single mutex → per-agent message queues
- `createAgent()` from `@letta-ai/letta-code-sdk` already supports N agents natively

### Backward Compatibility
SwarmStore with `mode: 'single'` preserves exact original behavior. Existing `lettabot-agent.json` auto-migrates to SwarmRegistry format. Zero breaking changes for existing users.

---

## 10. Hub Smoke Test Results

Full lifecycle verified on live Thoughtbox Hub:

```
register("TEAM-Elites-Coordinator", COORDINATOR)  → agentId: c761a7d3
create_workspace("team-elites-archive")           → workspaceId: b314a732
create_problem("niche:telegram-coding")           → problemId: d734dc28
create_problem("niche:slack-research")            → problemId: c8897e71
claim_problem(telegram-coding, "gen0-*")          → branchFromThought: 0
create_proposal("Gen-0 candidate")                → proposalId: 7375c151

register("TEAM-Elites-Reviewer", ARCHITECT)       → agentId: b3646a7b
join_workspace(b314a732)                          → joined as contributor
review_proposal(approve, "baseline accepted")     → review: 4f225f08

post_message("Gen-0 baseline established...")     → messageId: d1fdfa8f

merge_proposal (requires original coordinator)    → CONFIRMED: only coordinator can merge
```

All operations functional. Coordinator identity constraint confirmed and documented.

---

## 11. Niche Grid

Initial 2D grid: Channel x Domain = 25 niches.

```
              coding    research   scheduling   communication   general
telegram        ●          ●           ●             ●            ●
slack           ●          ●           ●             ●            ●
discord         ●          ●           ●             ●            ●
whatsapp        ●          ●           ●             ●            ●
signal          ●          ●           ●             ●            ●
```

Expand to 3D (+ response style) as archive fills: 25 → 125 niches.

Stepping-stone dependencies: `multi-channel` niches depend on single-channel niches being filled first.

---

## 12. Implementation Phases

### Phase 1: Agent Registry (SwarmStore)
Replace singleton Store with multi-agent registry. Auto-migrate existing config. Persist Hub coordinator identity.

### Phase 2: Hub Integration (HubClient)
MCP HTTP client. Startup: register → workspace → seed niches. Session persistence.

### Phase 3: Evolutionary Loop (EvolutionEngine)
Variation operators, fitness evaluation, selection. Cron-driven: every 6 hours.

### Phase 4: Message Router (NicheMatcher + bot.ts)
Inbound message → niche classification → best-fit agent. Per-agent queues replace single mutex.
