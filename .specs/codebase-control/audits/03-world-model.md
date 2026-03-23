Excellent! Now I have comprehensive data. Let me write the audit report:

## WORLD MODEL AUDIT REPORT

### EXISTS (with file paths and what it does)

#### SYMBOLIC METADATA (Limited)

1. **Tool Annotations (readonly, destructive, idempotent hints)**
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/init/tool.ts:36-40` — Tool annotations object on `INIT_TOOL`
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/protocol/theseus-tool.ts:39-43` — Tool annotations on `THESEUS_TOOL`
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/protocol/ulysses-tool.ts:39-43` — Tool annotations on `ULYSSES_TOOL`
   - **What it does**: Each tool exports a boolean hint (readOnlyHint, destructiveHint, idempotentHint) but these are static, unvalidated declarations with no runtime enforcement or planning use

2. **State Machines (Protocol Sessions)**
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/protocol/handler.ts:95-374` — Theseus protocol state machine (init → visa → checkpoint → outcome → complete)
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/protocol/handler.ts:449-798` — Ulysses protocol state machine (init → plan → outcome → reflect → complete)
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/init/state-manager.ts:15-206` — Connection stage state machine (STAGE_1_UNINITIALIZED → STAGE_2_INIT_STARTED → STAGE_3_FULLY_LOADED)
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/init/types.ts:133-140` — InitState enum (entry, project-selection, task-selection, aspect-selection, context-loaded, new-work)
   - **What it does**: Explicit finite state machines with state transitions, but no formal specification of preconditions, guards, or effects; transitions enforced procedurally, not declaratively

3. **Session State Tracking**
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/protocol/handler.ts:254-276` — Theseus B counter and test_fail_count tracking
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/protocol/handler.ts:459-668` — Ulysses S (surprise) register with consecutive_surprises, active_step, checkpoints
   - **What it does**: Implicit reliability models encoded in session state (B tracks failed attempts, S tracks surprise escalation), but no explicit framework for planning under different uncertainty regimes

#### LEARNED MODELS & UNCERTAINTY

1. **Confidence Scoring (Learned)**
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/references/anchor-resolver.ts:15-87` — Multi-strategy anchor resolution with confidence scores (0.0–1.0)
   - Lines 59-78: Three strategies with confidence assignments: alias (1.0), tag (0.95), title overlap (0.60–0.90)
   - Lines 97-98: Qualification threshold (≥0.60 confidence required)
   - **What it does**: Learned resolution model predicting whether a semantic anchor points to a session; confidence used for filtering, not for planning trade-offs

2. **Cost Tracking (Learned)**
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/observatory/evaluation-gatekeeper.ts:64-85` — Tiered evaluation result with cost tracking per tier, total cost accumulation
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/observatory/improvement-tracker.ts:33-49` — Phase cost accumulator (discovery, filter, experiment, evaluate, integrate) with total cost tracking
   - Lines 94-98: getTotalCost() and getCurrentPhaseCosts() methods
   - **What it does**: Learned cost model tracking evaluation expenses; not integrated into planning decisions, used only for observability

3. **Importance Score (Entity Metrics)**
   - `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/knowledge/types.ts:40-44` — Entity importance_score computed from access_count, centrality, recency
   - **What it does**: Heuristic importance metric for entities, but no decision-theoretic use (no value-of-information calculation, no prioritization of learning actions)

---

### PARTIAL (exists but incomplete — what's missing)

1. **Tool Preconditions & Effects**
   - **Present**: Tool descriptions in `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/tool-descriptions.ts:51-172` mention "what will happen next" (predictive descriptions)
   - **Missing**: 
     - No formal specification of preconditions (what must be true before tool can run)
     - No formal specification of effects (side effects, state changes, postconditions)
     - No executable precondition checks at dispatch time
     - No effect validators or contract assertions

2. **Latency Models**
   - **Present**: Cost tracking includes `duration_ms` in `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/observatory/evaluation-gatekeeper.ts:70`
   - **Missing**:
     - No learned latency predictor per tool
     - No latency-aware scheduling
     - No timeout models or latency uncertainty bounds

3. **Tool Reliability Models**
   - **Present**: Protocol state machines track failures (B counter for failed repairs, test_fail_count)
   - **Missing**:
     - No per-tool success/failure rate tracking
     - No learned tool reliability distributions
     - No fallback strategy selection based on reliability
     - No exploration vs. exploitation trade-off using reliability estimates

4. **Dual-Control (Nominal vs. Robust vs. Information-Seeking)**
   - **Completely absent**: 
     - No representation of planning mode (nominal, robust, dual-control)
     - No mechanism to plan actions that trade achievement for learning
     - No value-of-information calculation
     - No decision between "greedy best tool" vs. "less certain tool that yields learning"

5. **Uncertainty Representation**
   - **Present**: Confidence scores (0.0–1.0) for anchor resolution
   - **Missing**:
     - No Bayesian network or probabilistic model of tool success
     - No uncertainty propagation through action sequences
     - No representation of aleatoric vs. epistemic uncertainty
     - No decision under uncertainty (minimax, expected utility, robust optimization)

---

### ABSENT (not found anywhere)

1. **Formal Tool Metadata Schema**
   - No typed tool precondition/effect definitions
   - No cost, latency, or permission declarations separate from description text
   - No machine-readable tool specifications for automatic planner use

2. **Workflow State Machines with Guards**
   - State machines exist but are implicit (enforced in handler logic)
   - No formal spec (Harel, TLA+, or similar) describing valid transition sequences
   - No automatic verification of guard conditions

3. **Value-of-Information Models**
   - No calculation of expected information gain from actions
   - No trade-off between immediate task achievement and long-term learning

4. **Residual Models for Symbolic Layer Gaps**
   - No learned predictors for outcomes symbolic layer cannot predict
   - No uncertainty bounds on symbolic predictions

5. **Exploration-Exploitation Mechanisms**
   - No multi-armed bandit formulation
   - No Thompson sampling, UCB, or other bandit algorithm
   - No mechanisms to prioritize novel tools/strategies for learning

6. **Learned User-Response Models**
   - No model of how users respond to different levels of automation/transparency
   - No latency vs. control trade-off

7. **Learned Plan Quality Models**
   - No predictor of whether a plan will succeed
   - No ranking of alternative plans by predicted success rate

---

### ARCHITECTURE NOTES (where new components should go)

#### 1. **Tool Metadata Registry** → `/src/tool-metadata/`
   - Define `ToolMetadata` interface with preconditions, effects, costs, idempotence, permissions
   - Implement `ToolMetadataRegistry` for runtime lookup
   - Integrate with server-factory.ts tool registration flow
   - Reference: `/src/server-factory.ts:369-412` (registerExplicitTool macro) — extend to validate preconditions on dispatch

#### 2. **World Model Planner** → `/src/world-model/`
   - Implement `SymbolicWorldModel` with:
     - Tool state (precondition/effect facts)
     - Workflow state machines (from `/src/protocol/handler.ts` pattern)
   - Implement `LearnedWorldModel` with:
     - Tool reliability model (success rates per tool)
     - Latency predictor
     - Importance/value scorer
   - Implement `PlanningMode` enum: NOMINAL, ROBUST, DUAL_CONTROL
   - Implement planner that switches modes based on uncertainty

#### 3. **Reliability Tracker** → `/src/observatory/reliability-tracker.ts`
   - Track per-tool call success/failure counts
   - Maintain running estimate of P(success | tool, context)
   - Hook into existing `/src/observatory/emitter.ts` for event flow
   - Reference: `/src/observatory/improvement-tracker.ts:33-49` (cost accumulator pattern)

#### 4. **Uncertainty Quantifier** → `/src/world-model/uncertainty.ts`
   - Compute confidence bounds on tool outcomes
   - Integrate with anchor resolver's confidence scoring (`/src/references/anchor-resolver.ts`)
   - Propagate uncertainty through action sequences

#### 5. **Dual-Control Planner** → `/src/world-model/dual-control.ts`
   - Given action options, compute:
     - Expected task achievement (nominal mode)
     - Worst-case guarantee (robust mode)
     - Information gain from executing each action (epistemic value)
   - Trade-off function: how much task achievement to sacrifice for learning?

#### 6. **Integration Points**

   a. **server-factory.ts** (lines 162–2042)
      - Currently: tool registration with static annotations
      - Add: precondition checks before tool dispatch (line 385–400 in registerExplicitTool)
      - Add: effect tracking after tool success/failure

   b. **protocol/handler.ts** (lines 21–817)
      - Currently: Theseus/Ulysses state machines hardcoded
      - Add: Extract to `StateTransitionValidator` using metadata registry
      - Add: Effect handlers that update symbolic world model

   c. **observatory/emitter.ts**
      - Currently: Emits generic tool/thought events
      - Add: Per-tool success/failure events for reliability tracking

   d. **init/state-manager.ts** (lines 79–206)
      - Currently: Tracks connection stages
      - Add: Hook to `SymbolicWorldModel` for precondition checks on stage transitions

---

### CONTROL-THEORETIC ASSESSMENT

**Symbolic Layer: 40% Complete**
- State machines exist and work (Theseus/Ulysses protocols, init flow)
- Tool annotations exist but are static, unvalidated hints
- Missing: preconditions, effects, permissions as executable constraints
- Missing: formal specification of state transition validity

**Learned Layer: 25% Complete**
- Confidence scoring for anchor resolution
- Cost tracking for improvement cycles
- Missing: per-tool reliability models
- Missing: latency predictors
- Missing: user response models
- Missing: plan quality predictors

**Dual-Control: 0% Complete**
- No representation of planning modes (nominal/robust/information-seeking)
- No mechanism to trade task achievement for learning value
- No value-of-information calculations

**Planning Integration: 5% Complete**
- Cost/latency tracked but not used in planning decisions
- Confidence scores computed but only used for filtering, not prioritization
- World state updated procedurally, not declaratively

**Risk**: System is **reactive** (respond to state changes) rather than **deliberative** (plan sequences of actions under uncertainty). New agents cannot automatically discover tool semantics, cannot plan robustly under uncertainty, and cannot learn adaptively by trading achievement for information.
