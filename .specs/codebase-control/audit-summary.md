# Control-Theoretic Codebase Audit — Summary

**Date:** 2026-03-22
**Method:** 12 parallel sub-agents, each auditing one subsystem against the GPT-5.4 Pro paragon description
**Scope:** src/, .claude/, .specs/, supabase/, agentic-dev-team/

## Subsystem Scoreboard

| # | Subsystem | EXISTS | PARTIAL | ABSENT | Assessment |
|---|-----------|--------|---------|--------|------------|
| 1 | Task Specification | 3 | 7 | 10 | ~25% — No goal compiler, no task contracts |
| 2 | Belief State | 6 | 5 | 7 | ~30% — ThoughtData has structure, no unified BeliefState |
| 3 | World Model | 3 | 5 | 7 | ~25% — State machines exist, no tool contracts or learned models |
| 4 | Controller Architecture | 6 | 4 | 6 | ~50% — Strong reflex layer (hooks), no MPC planner |
| 5 | Safety Shield | 8 | 4 | 7 | ~45% — Strong pre-action gates, no post-action verification |
| 6 | Memory Architecture | 5 | 6 | 7 | ~35% — Working + episodic exist, no write gating or compaction |
| 7 | Anti-Instability | 10 | 4 | 5 | ~60% — Best coverage; Ulysses, Theseus, bead workflow, circuit breakers |
| 8 | Execution Runtime | 8 | 8 | 10 | ~35% — Core loop exists but no candidate scoring, budget, or control actions |
| 9 | Learning & Evaluation | 6 | 7 | 12 | ~25% — Specs complete (80%), implementation thin (20-40%) |
| 10 | Telemetry & Observability | 8 | 7 | 7 | ~45% — Strong event emission, no replay engine or cost attribution |
| 11 | Multi-Agent & Meta-Control | 11 | 5 | 6 | ~55% — Hub is mature, meta-controller entirely absent |
| 12 | Human Interaction | 10 | 5 | 8 | ~40% — Structured escalation exists, no value-of-information |

## What the Codebase Has (Strengths)

### Anti-Instability (best coverage)
- Ulysses surprise register (S=0→1→2→REFLECT) with hook enforcement
- Theseus B counter with 2-fail hard reset
- Bead workflow 7-step state machine with hypothesis gate
- Circuit breakers with half-open recovery (5 failures → 60s cooldown)
- Regression detection via rolling baseline (20-session window)

### Multi-Agent Coordination (Hub)
- Workspace isolation, agent identity, profile-based specialization
- Problem decomposition with dependency tracking (readyProblems/blockedProblems)
- Proposals, reviews, consensus markers
- Channel-based async communication with resource notifications
- Progressive disclosure (3-stage capability gates)

### Safety Gates (Pre-Action)
- PreToolUse hooks block: rm -rf, force push, .env writes, .claude/ modification
- Protocol enforcement: Theseus scope locks, Ulysses reflect gates
- Read-before-write guard with import dependency checking
- Bead workflow blocks code without hypothesis, close without tests

### Persistence & Provenance
- Append-only thought storage with Merkle chain (contentHash, parentHash)
- Multi-agent attribution (agentId, agentName on every thought)
- Audit manifests auto-generated at session close
- Knowledge graph with temporal validity (valid_from, valid_to, superseded_by)
- Fire-and-forget event emission (ThoughtEmitter + JSONL events)

### MCP Primitives
- Sampling/createMessage (server→client inference loopback) — working
- Resource notifications (sendResourceUpdated) — working for hub events
- Task infrastructure (experimental) — working for hub operations
- Streamable HTTP transport with per-session isolation

## What the Codebase Lacks (Critical Gaps)

### 1. Goal Compiler (Task Specification)
No mechanism to compile "fix bug X" into a typed task contract with:
- Goals, terminal conditions, deadlines
- Soft costs (token, time, user burden, privacy risk)
- Hard constraints, approval boundaries
- Observability requirements ("I cannot know X")
- Controllability diagnostics ("I cannot affect Y")
- Allowed actuators (tool whitelist)

### 2. Unified Belief State
No single container for what the system believes, partitioned into:
- World state, task state, user state, self state, actuator state, safety state
- Each fact with confidence, provenance, freshness, contradiction set
- No Observer module that fuses tool outputs, telemetry, and receipts

### 3. Meta-Controller
No runtime system that decides:
- Which model to use (Haiku/Sonnet/Opus)
- One-shot vs structured search vs sampling
- Whether to invoke verifier
- Whether to ask user vs probe autonomously
- How much compute to spend now vs later
- Currently: these decisions are in markdown skills and escalation specs, not executable code

### 4. MPC-Style Planning
No receding-horizon planner that:
- Generates candidate action sequences
- Scores them against objectives and constraints
- Commits only the first action
- Observes result and replans
- Currently: workflow conductor executes stages sequentially, no replanning

### 5. Post-Action Verification
No system that:
- Snapshots state before action
- Issues command
- Verifies state actually changed as predicted
- Computes residual (expected vs realized)
- Downgrades model/tool reliability on mismatch
- Currently: post_tool_use.sh logs git operations only

### 6. Write Gating & Memory Compaction
No gates on memory writes:
- No novelty filtering (every thought persisted unconditionally)
- No utility threshold (low-confidence thoughts stored same as high)
- No session compaction or observation deduplication
- No forgetting policy or TTL enforcement

### 7. Learning Subsystem
Specs exist (15 SIL specs) but implementation is thin:
- No metric store or aggregation pipeline
- No baseline computation or regression detection in CI
- No A/B test runner
- No offline trajectory analysis
- No failure attribution (which subsystem failed?)
- LangSmith dependency installed but unused

### 8. Value of Information
No computation before human interaction:
- Escalation is threshold-based ("if scope change → ask")
- No cost/benefit analysis ("is asking cheaper than trying?")
- No user model (preferences, risk tolerance, decision patterns)
- No decision audit log (what user chose, what system recommended)

## Architecture Recommendation

The audits converge on a single structural gap: **there is no control layer between the MCP tools and the agent's reasoning.** The codebase has excellent primitives (persistence, events, protocols, hub) but no orchestration layer that compiles tasks, maintains belief state, plans actions, verifies results, and learns.

Proposed directory structure for the missing layer:

```
src/control/
├── specs/          # Task contracts, goals, constraints
├── state/          # Belief state, observer, uncertainty
├── planning/       # MPC planner, mode selection, candidate scoring
├── safety/         # Unified action gate, impact estimation, verification
├── memory/         # Write gating, retrieval ranking, compaction
├── learning/       # Trajectory analysis, failure attribution, adaptation
├── stability/      # Oscillation detection, progress monitoring
├── meta/           # Model selection, cognition budget, inference modes
└── diagnostics/    # Observability/controllability checks
```

## Individual Audit Reports

Full reports from each sub-agent are available at:

1. [Task Specification](./audits/01-task-specification.md)
2. [Belief State](./audits/02-belief-state.md)
3. [World Model](./audits/03-world-model.md)
4. [Controller Architecture](./audits/04-controller.md)
5. [Safety Shield](./audits/05-safety.md)
6. [Memory Architecture](./audits/06-memory.md)
7. [Anti-Instability](./audits/07-anti-instability.md)
8. [Execution Runtime](./audits/08-execution-runtime.md)
9. [Learning & Evaluation](./audits/09-learning-evaluation.md)
10. [Telemetry & Observability](./audits/10-telemetry.md)
11. [Multi-Agent & Meta-Control](./audits/11-multi-agent.md)
12. [Human Interaction](./audits/12-human-interaction.md)
