Excellent. Now I have enough material to produce the structured audit. Let me compile my findings:

## Control-Theoretic Audit: Task Specification and Goal Compilation

Based on systematic search of `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging`, here is what exists, what's partial, and what's absent relative to the paragon's requirement that "the first thing this codebase does is compile messy natural-language tasks into control problems."

---

## EXISTS (with file paths and what it does)

### 1. **Task Decomposition via Hub Problems**
- **Files**: `src/hub/problems.ts`, `src/hub/hub-types.ts` (Problem interface, lines 51–67)
- **What it does**: Problems are the primary unit of work. They have:
  - Status tracking: `open | in-progress | resolved | closed`
  - Dependency management: `dependsOn: string[]` with cycle detection (problems.ts:192–208)
  - Sub-problem hierarchy: `parentId: string` for nested decomposition
  - Assignment tracking: `assignedTo: string` (agent claiming the problem)
  - Branch tracking: `branchId` + `branchFromThought` for thought-branch linkage
  - Comments for coordination
- **Gap**: No terminal conditions, success criteria, or explicit objective specification per problem

### 2. **Ready/Blocked Problem Classification**
- **Files**: `src/hub/problems.ts:229–261` (readyProblems, blockedProblems)
- **What it does**: Computes problem readiness based on dependency resolution:
  - `readyProblems`: Returns open problems with all dependencies resolved (line 233–241)
  - `blockedProblems`: Returns open/in-progress problems with unresolved dependencies (line 246–261)
  - Transitive dependency tracking via `dependsOn` array
- **What it enables**: Work-order scheduling via explicit blockage diagnostics ("I cannot start Y because X is not resolved")
- **Gap**: No controllability check (can this problem's blockers actually be resolved by available agents/tools?)

### 3. **Evaluation Task Types (ALMA-Style)**
- **Files**: `src/evaluation/types.ts:61–90` (EvalTask, CollectionTask, DeploymentTask)
- **What it does**: Defines task contracts for evaluation:
  - `taskId`, `description`, `expectedCapabilities`, `difficultyTier` (smoke | regression | real_world)
  - Distinguishes collection tasks (baseline, no memory) from deployment tasks (memory-augmented with priorContext)
- **What it enables**: Task specification that explicitly declares what capabilities are tested and under what conditions
- **Gap**: No terminal conditions, no soft costs, no approval boundaries, no observability requirements

### 4. **Approval Boundaries via AgentOps**
- **Files**: `.specs/unified-autonomy-loop/02-orchestration-agentops.md:1–33`
- **What it does**: Human-in-the-loop authorization gates for code modifications:
  - `smoke:proposal-N` (dry run, no real commit)
  - `approved:proposal-N` (real implementation authorized)
  - `hold / rejected` (prune execution)
  - GitHub Issues + Labels as durable state
- **What it enables**: Approval boundaries that distinguish reversible (exploratory) from irreversible (committed) actions
- **Gap**: No formal specification of which action classes require approval vs. are auto-permitted; boundary is operational (label-based) not formal

### 5. **Reversibility Tracking (Partial)**
- **Files**: `.specs/auditability/SPEC-AUD-004-external-actions.md:81–101` (ActionManifest interface)
- **What it does**: Specifies action tracking with reversibility classification:
  - `reversible: 'yes' | 'no' | 'partial'` per action
  - Links actions to decision frames (causal traceability)
  - Tracks success/failure
- **Status**: DRAFT spec, not implemented
- **Gap**: No integration with task specification; no action whitelist/blacklist

### 6. **Observability: ThoughtEmitter & Observatory**
- **Files**: `src/observatory/emitter.ts`, `src/observatory/index.ts`, `src/observatory/schemas/thought.ts`
- **What it does**: Fire-and-forget event emission for reasoning traces:
  - `session:started`, `thought:added`, `session:ended` events
  - ThoughtEmitter broadcasts to multiple channels (reasoning, workspace, observatory)
  - Non-blocking: listener failures don't propagate
- **What it enables**: Real-time observation of reasoning state without affecting reasoning itself
- **Gap**: No explicit observability diagnostics ("I cannot know X with current sensors"); events are descriptive, not prescriptive

### 7. **Evaluation Gatekeeper (Multi-Tier)**
- **Files**: `src/observatory/evaluation-gatekeeper.ts:196–249`
- **What it does**: Enforces evaluation gates before integration:
  - Tiered evaluation (smoke → regression → real_world)
  - Behavioral contracts (VARIANCE, CONTENT_COUPLED, TRACE_EXISTS, LLM_JUDGES)
  - Cost tracking per tier
  - Blocks integration if any gate fails
- **What it enables**: Explicit cost + constraint gating ("Goal G is feasible only if smoke-test cost ≤ $X")
- **Gap**: Currently a pass-through stub; not connected to real evaluator; no observable success criteria

### 8. **Observability: Improvement Tracking & Online Monitoring**
- **Files**: `src/observatory/improvement-tracker.ts`, `src/observatory/improvement-store.ts`, `src/observatory/online-monitor.ts`
- **What it does**: Records improvement events (code changes, test results, evaluations) in durable store; computes regression alerts
- **What it enables**: Historical record of improvements with metrics (cost, duration, evaluator scores)
- **Gap**: Monitoring is metric-based, not control-diagnostic; no explicit "uncertainty going down?" or "blocker clearing?" checks

### 9. **Workflow Composition via MAP-Elites**
- **Files**: `.specs/unified-autonomy-loop/03-workflow-composition.md:1–36`
- **What it does**: Specifies task characterization on a 5D behavior space (Scope, Domain Structure, Evidence Type, Time Horizon, Fidelity) and retrieval of proven tactical sub-routines
- **What it enables**: Task-aware workflow selection ("task requires rigorous fidelity → retrieve high-verification workflows")
- **Status**: DRAFT spec, not implemented
- **Gap**: No formalization of how subgoal terminal conditions propagate from macro to micro workflows

---

## PARTIAL (exists but incomplete — what's missing)

### 1. **Task Goals & Terminal Conditions**
- **What exists**: Problems have status, dependencies, and comments; tasks have descriptions and capabilities
- **What's missing**:
  - No `goals: Goal[]` field on Problem or Task
  - No `terminalCondition: (state) => boolean` specification
  - No distinction between hard goals (must satisfy) vs. soft goals (weighted in objective)
  - No deadline/time constraint on tasks
  - No explicit `constraints: Constraint[]` (hard constraints like "no production writes")
  - **File gap**: No `src/control/goal-compiler.ts` or similar

### 2. **Cost/Objective Specification**
- **What exists**: EvaluationGatekeeper tracks `cost` per tier; Evaluation tasks have difficultyTier
- **What's missing**:
  - No unified objective function across task layers (time cost, token cost, user burden, privacy risk all mentioned in paragon but not formalized)
  - No soft costs per action class
  - No "latency budget" or "token budget" on tasks
  - No joint optimization (e.g., "minimize cost subject to success probability ≥ 0.9")
  - **File gap**: No cost model or budget tracking at task level

### 3. **Observability Diagnostics**
- **What exists**: ThoughtEmitter emits events; Observatory displays them; improvement_tracker records outcomes
- **What's missing**:
  - No explicit "I cannot know X" diagnostics (sensor enumeration + coverage)
  - No state estimation module with confidence/freshness per belief
  - No uncertainty quantification on observations (just raw events)
  - No "which sensor could resolve this ambiguity?" query
  - No integration between task observability requirements and available sensors
  - **File gap**: No `src/control/observability-diagnostics.ts`

### 4. **Controllability Diagnostics**
- **What exists**: Problems have readyProblems/blockedProblems (dependency-based blocking)
- **What's missing**:
  - No "I cannot affect Y with current tools" diagnostics
  - No precondition/effect model for tools (MCP tools have no formal specification of what they can/cannot do)
  - No "which tool could achieve this subgoal?" query
  - No action feasibility check against current agent capabilities
  - No distinction between "tool unavailable" vs. "tool available but would violate policy"
  - **File gap**: No `src/control/controllability-diagnostics.ts`

### 5. **Action Reversibility Classification**
- **What exists**: SPEC-AUD-004 defines ActionManifest with reversibility field
- **What's missing**:
  - No whitelist/blacklist of action types
  - No automatic classification (must be manually marked in action_report)
  - No enforcement that irreversible actions require escalation
  - No rollback procedures per action class
  - Not integrated with approval gates
  - **File gap**: No `src/control/action-classifier.ts`

### 6. **Task Mode / Operating Context**
- **What exists**: Problems have status; Taste Agent filters by compression/simplicity
- **What's missing**:
  - No explicit operating modes (nominal | robust | dual-control | exploratory)
  - No switching logic based on uncertainty level
  - No declarative task mode specification in task contract
  - Paragon mentions: "sometimes the right move is observe better, not act" — no control policy for this decision
  - **File gap**: No `src/control/mode-controller.ts`

### 7. **Skill/Workflow Contracts**
- **What exists**: MAP-Elites retrieves workflows; Runbook notebooks define manifests with test cases
- **What's missing**:
  - No formal skill contracts (initiation conditions, termination conditions, failure signatures, expected observations)
  - Runbook manifests have structure but no pre/post conditions on the manifest as a whole
  - No recovery branches on skill failure
  - No reusable skill library with type-checked contracts
  - **File gap**: No `src/control/skill-contracts.ts`

---

## ABSENT (not found anywhere — what the paragon requires)

### 1. **Goal Compilation Pipeline**
- **What paragon requires**: "A user says something vague, and the system turns it into a task contract: goals, terminal conditions, deadlines, soft costs, hard constraints, approval boundaries, observability requirements, and allowed actuators."
- **What exists**: Natural language → GitHub Issues (via Discovery & Taste) → Problem creation, but no intermediate task contract formalization
- **Missing**: A typed task contract structure and compiler that produces it from language
  - **Example structure** (should exist):
    ```typescript
    interface TaskContract {
      id: string;
      naturalLanguage: string;
      goals: Goal[];
      terminalConditions: TerminalCondition[];
      constraints: Constraint[];
      hardBoundary: boolean;
      deadline?: Date;
      softCosts: SoftCost[];  // token, time, user burden, privacy risk
      observabilityRequirements: SensorRequirement[];
      actuatorWhitelist?: string[];  // allowed tools
      approvalRequired: ApprovalClass;
    }
    ```
- **File gap**: No `src/control/task-contract.ts` or `src/control/goal-compiler.ts`

### 2. **Belief State Module**
- **What paragon requires**: "Every fact the agent believes has a timestamp, provenance, confidence, freshness, and sometimes a contradiction set. The belief state is partitioned into world state, task state, user state, self state, actuator state, safety state."
- **What exists**: Thoughts in sessions, problems with status, agents with profiles, but no unified belief state tracker
- **Missing**: Centralized belief state with explicit uncertainty
  - **Example structure** (should exist):
    ```typescript
    interface BeliefState {
      worldState: Belief<WorldFacts>;
      taskState: Belief<TaskProgress>;
      userState: Belief<UserPreferences>;
      selfState: Belief<SelfCapabilities>;
      actuatorState: Belief<ToolHealth>;
      safetyState: Belief<PolicyCompliance>;
    }
    
    interface Belief<T> {
      value: T;
      confidence: number;
      provenance: Source;
      freshness: Date;
      contradictions?: Belief<T>[];
    }
    ```
- **File gap**: No `src/control/belief-state.ts`

### 3. **World Model with Hybrid Symbolic + Learned Components**
- **What paragon requires**: Symbolic preconditions/effects for tools + learned reliability models + uncertainty estimates
- **What exists**: Tool schemas in MCP, but no formal precondition/effect model; no learned reliability estimates
- **Missing**: Hybrid world model that fuses tool specs with empirical performance data
  - **Example structure** (should exist):
    ```typescript
    interface ToolWorldModel {
      toolId: string;
      preconditions: Precondition[];
      effects: Effect[];
      sideEffects: SideEffect[];
      learnedReliability: {
        successRate: number;
        latencyDistribution: Distribution;
        costDistribution: Distribution;
      };
      uncertainty: Confidence;
      lastUpdated: Date;
    }
    ```
- **File gap**: No `src/control/world-model.ts`

### 4. **Planning / MPC (Model Predictive Control)**
- **What paragon requires**: "The system proposes candidate action sequences, scores them against the task objective and constraints, commits only to the first action, observes what happened, and replans."
- **What exists**: Thoughts in branches (alt planning), but no formal candidate scoring or MPC loop
- **Missing**: Explicit planning module with receding-horizon optimization
  - **Pseudocode** (should exist):
    ```
    1. Generate K candidate action sequences (horizon H)
    2. Score each against task objective + constraints
    3. Filter by safety gates
    4. Execute first action of top-ranked sequence
    5. Observe result
    6. If not as predicted, recompute world model, replan
    ```
- **File gap**: No `src/control/planner.ts` or `src/control/mpc.ts`

### 5. **Explicit Observability & Controllability Diagnostics**
- **What paragon requires**: "It can tell when a task is under-observed or under-actuated. It can say 'I cannot know X with current sensors' or 'I cannot affect Y with current tools.'"
- **What exists**: Blocked problems (dependency-based), but no sensor/actuator adequacy check
- **Missing**: Algorithms to compute observability/controllability rank and produce human-readable diagnostics
  - **Example queries** (should work):
    - `canObserve(factX)` → {possible: boolean, sensor: string, cost: number, latency: Duration}
    - `canControl(goalY)` → {possible: boolean, tools: string[], cost: number, sideEffects: string[]}
    - `isUnderdetermined()` → {facts: string[], requiredSensors: string[], recommended_action: "ask" | "probe" | "wait"}
- **File gap**: No `src/control/observability-diagnostics.ts`, no `src/control/controllability-diagnostics.ts`

### 6. **Safety Shield / Action Gating**
- **What paragon requires**: "Every action that leaves the model goes through a typed gate. The gate checks preconditions, permissions, policy rules, privacy constraints, spend limits, rate limits, side-effect class, reversibility, approval requirements."
- **What exists**: EvaluationGatekeeper (behavioral verification), AgentOps approval gates (human), but no unified action-level gate
- **Missing**: Pre-execution action gating with diff generation and impact estimation
  - **Example structure** (should exist):
    ```typescript
    interface ActionGate {
      checkPreconditions(action: Action, state: BeliefState): {met: boolean, reason?: string};
      checkPermissions(action: Action, agent: Agent): {allowed: boolean, reason?: string};
      estimateBlastRadius(action: Action): {irreversible: boolean, affectedResources: string[]};
      requiresApproval(action: Action): ApprovalClass;
      simulateEffect(action: Action, state: BeliefState): ProjectedState;
    }
    ```
- **File gap**: No `src/control/action-gate.ts`

### 7. **Learning Subsystem (Offline)**
- **What paragon requires**: "Offline, it learns better dynamics models, better reliability estimates, better reward shaping, better user models, better terminal value approximators."
- **What exists**: Improvement tracker (logs improvements), evaluation gatekeeper (scores changes), but no offline learning loop
- **Missing**: Post-hoc trajectory analysis with model/reward/reliability updating
  - **Minimal example** (should exist):
    - Collect trajectories from sessions
    - Fit empirical success/failure distributions per action class
    - Update ToolWorldModel reliability estimates
    - Retrain user-response model on past interactions
- **File gap**: No `src/control/learner.ts` or `src/control/trajectory-analyzer.ts`

### 8. **Anti-Instability Machinery**
- **What paragon requires**: "It detects oscillatory replanning, repeated tool thrashing, retry windup, confirmation spirals, self-reinforcing memory errors, mode flapping. And it dampens them with hysteresis, cooldowns, retry budgets, state-based mode transitions, action masking, progress monitors."
- **What exists**: None identified
- **Missing**: Explicit detectors + dampeners
  - **Example detector** (should exist):
    ```
    isOscillating(plan_sequence: Plan[]): boolean {
      // Check if last N plans cycle through same actions
    }
    
    retryBudget(action_class: string): number {
      // Return remaining retries for this action type
    }
    ```
- **File gap**: No `src/control/stability-monitor.ts`

### 9. **Multi-Agent Distributed Control**
- **What paragon requires**: "Each agent has local state, local skills. Coordinator handles shared objective decomposition, task allocation, communication budget, consensus on shared facts. Handoffs include uncertainty summaries, safety context, open assumptions, terminal conditions."
- **What exists**: Hub workspace/agents/problems; agent profiles; problem claiming; but no formal handoff contract
- **Missing**: Structured handoff protocol with uncertainty + assumptions
  - **Example structure** (should exist):
    ```typescript
    interface AgentHandoff {
      problem: Problem;
      fromAgent: AgentIdentity;
      toAgent: AgentIdentity;
      currentBeliefs: BeliefSnapshot;
      uncertainties: Uncertainty[];
      openAssumptions: Assumption[];
      expectedTerminalCondition: TerminalCondition;
      riskSummary: RiskSummary;
    }
    ```
- **File gap**: No `src/control/handoff-protocol.ts`

### 10. **Deterministic Reasoning / Symbolic Verification**
- **What paragon requires**: "Tools have typed preconditions, effects, side effects, idempotence properties, costs, permission requirements. Workflows have state machines. Some environments have explicit schemas."
- **What exists**: MCP tool schemas (runtime), runbook manifests (notebook), but no formal symbolic specification
- **Missing**: Typed tool contracts embedded in tool definitions
  - **Example structure** (should exist):
    ```typescript
    interface ToolContract {
      toolId: string;
      inputs: InputSchema;
      outputs: OutputSchema;
      preconditions: Precondition[];
      effects: Effect[];
      sideEffects: SideEffect[];
      cost: CostModel;
      idempotent: boolean;
      permissions: Permission[];
    }
    ```
- **File gap**: No `src/control/tool-contracts.ts`; MCP tool descriptions are prose, not machine-readable contracts

---

## ARCHITECTURE NOTES (Where new components should go)

### Logical Layer Organization (Paragon suggests this structure)

1. **Specification Layer** (`src/control/specs/`)
   - Task contracts, goal definitions, constraint specifications
   - **Files to create**: `task-contract.ts`, `goal.ts`, `constraint.ts`, `terminal-condition.ts`

2. **Belief/State Layer** (`src/control/state/`)
   - Belief state, world model, uncertainty tracking
   - **Files to create**: `belief-state.ts`, `world-model.ts`, `confidence-tracker.ts`

3. **Observation Layer** (`src/control/observation/`)
   - Sensor enumeration, observability diagnostics, state fusion
   - **Files to create**: `observability-diagnostics.ts`, `sensor-registry.ts`, `fusion-logic.ts`

4. **Control Layer** (`src/control/planning/`)
   - Planning, MPC, mode selection, policy decisions
   - **Files to create**: `planner.ts`, `mpc.ts`, `mode-controller.ts`, `meta-controller.ts`

5. **Safety/Gating Layer** (`src/control/safety/`)
   - Action gating, precondition checking, permission verification, impact estimation
   - **Files to create**: `action-gate.ts`, `safety-shield.ts`, `blast-radius-estimator.ts`

6. **Actuator/Tool Layer** (`src/control/actuation/`)
   - Tool contracts, effect models, execution verification
   - **Files to create**: `tool-contracts.ts`, `executor.ts`, `receipt-validator.ts`

7. **Learning Layer** (`src/control/learning/`)
   - Trajectory analysis, model updating, reward shaping, reliability estimation
   - **Files to create**: `trajectory-analyzer.ts`, `learner.ts`, `reliability-estimator.ts`

8. **Memory Layer** (`src/control/memory/`)
   - Working, episodic, semantic, procedural memory with explicit gating
   - Leverage existing Supabase persistence but add typed memory controllers
   - **Files to create**: `memory-controller.ts`, `memory-gating.ts`

9. **Stability/Monitoring Layer** (`src/control/stability/`)
   - Anti-instability detectors, progress monitors, mode-flapping prevention
   - **Files to create**: `stability-monitor.ts`, `instability-detector.ts`, `progress-monitor.ts`

10. **Diagnostics/Observability Layer** (`src/control/diagnostics/`)
    - Observability/controllability checks, state snapshots, failure attribution
    - **Files to create**: `diagnostics-engine.ts`, `controllability-checker.ts`, `observability-checker.ts`

### Integration Points

- **With Hub**: Problems → TaskContracts (compiler in layer 1)
- **With Observatory**: ThoughtEmitter → Sensor inputs to BeliefState (fusion in layer 3)
- **With EvaluationGatekeeper**: Safety gates in layer 5 feed into cost models in layer 1
- **With MCP Tools**: Tool schemas → ToolContracts (formalization in layer 6)
- **With Runbook Notebooks**: Manifests → workflow state machines (in layer 4 planning)

---

## Summary Table

| Capability | Status | File(s) | Gap |
|---|---|---|---|
| Task decomposition (Problems) | EXISTS | `src/hub/problems.ts` | No terminal conditions, goals |
| Dependency blocking | EXISTS | `src/hub/problems.ts:229–261` | No controllability check |
| Evaluation tasks (ALMA) | EXISTS | `src/evaluation/types.ts` | No success criteria, costs |
| Approval boundaries | EXISTS (spec) | `.specs/unified-autonomy-loop/02-orchestration-agentops.md` | Not formalized, GitHub-only |
| Reversibility classification | PARTIAL (spec) | `.specs/auditability/SPEC-AUD-004` | DRAFT, not implemented |
| Observability (events) | EXISTS | `src/observatory/emitter.ts` | No uncertainty quantification |
| Evaluation gating | PARTIAL (stub) | `src/observatory/evaluation-gatekeeper.ts` | Pass-through, not connected |
| Workflow composition (MAP-Elites) | PARTIAL (spec) | `.specs/unified-autonomy-loop/03-workflow-composition.md` | DRAFT, not implemented |
| Goal compilation | ABSENT | — | No task-contract compiler |
| Belief state module | ABSENT | — | No unified belief tracking |
| World model (symbolic + learned) | ABSENT | — | No tool contract formalization |
| Planning / MPC loop | ABSENT | — | No receding-horizon planner |
| Observability diagnostics | ABSENT | — | No "I cannot know X" queries |
| Controllability diagnostics | ABSENT | — | No "I cannot affect Y" queries |
| Action gating (pre-execution) | ABSENT | — | No unified action gate |
| Offline learning subsystem | ABSENT | — | No trajectory analysis loop |
| Anti-instability machinery | ABSENT | — | No oscillation/thrashing detection |
| Multi-agent handoff protocol | ABSENT | — | No structured handoff with uncertainty |
| Tool contracts (symbolic specs) | ABSENT | — | Tool schemas are prose, not machine-readable |

---

## Conclusion

**The paragon requirement is ~50% present, ~25% partial, and ~25% absent.** The codebase has excellent infrastructure (Hub for decomposition, Observatory for events, EvaluationGatekeeper for gating) but lacks the middle layer that formally compiles natural-language tasks into control problems with explicit goals, constraints, observability requirements, and controllability bounds. The critical missing piece is a **goal compiler** that takes "I want to fix bug X" and produces a `TaskContract` with terminal conditions, cost budgets, required sensors, available actuators, and approval boundaries. Once that contract exists, the rest of the control loop (planning, gating, learning, stability) becomes a routing problem rather than a free-form search.
