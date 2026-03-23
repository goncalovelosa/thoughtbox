Perfect! Now I have a comprehensive picture. Let me compile the audit report.

## HIERARCHICAL CONTROLLER ARCHITECTURE AUDIT

Based on systematic search through `src/`, `.claude/skills/`, `.claude/hooks/`, and `.claude/agents/`, here is the audit against the control-theoretic ideal.

---

## EXISTS (with file paths and what it does)

### **1. FAST REFLEX LAYER — Hook-Based Policy Enforcement**

**Blocking safety mechanisms (PreToolUse hooks):**

- **`.claude/hooks/pre_tool_use.sh:1-150`** — Enforces five blocking policies at reflex speed:
  - Lines 14-31: Dangerous `rm -rf` detection (pattern matching before execution)
  - Lines 33-50: `.env` file write blocking (secrets protection)
  - Lines 60-77: `.claude/` directory modification blocking (prevents agents from disabling safety)
  - Lines 87-104: Destructive Write to memory-bearing files (CLAUDE.md, AGENTS.md)
  - Lines 106-137: Protected directory deletion guard (specs/, docs/, self-improvement/)
  
  **Pattern**: Reflex-layer gatekeeping. No planning needed—explicit conditions trigger immediate exit codes.

- **`.claude/hooks/ulysses_enforcer.sh:1-49`** — Surprise-escalation circuit breaker (fast layer):
  - Lines 11-20: If `reflect-required` sentinel exists, block all except reading/reflection (lines 17-36)
  - Lines 38-48: Escalates to REFLECT when consecutive surprises hit threshold
  
  **Pattern**: Surprise register (S) gates entire action space. Fast decision: S=2 → block → wait for reflect.

- **`.claude/hooks/bead_workflow_enforcer.sh:1-96`** — Seven-step bead workflow gating:
  - Lines 18-50 (RULE 1): Blocks work if validation pending (step 7 pause enforcement)
  - Lines 52-68 (RULE 2): No code changes without hypothesis stated (step 2→3 gate)
  - Lines 70-81 (RULE 3): No batch bead closes (step 6 serialization)
  - Lines 84-93 (RULE 4): No close without tests passing since edit (step 4→6 gate)
  
  **Pattern**: State machine enforcement via file sentinels (`.claude/state/bead-workflow/*.json`). Fast checks gate forward progress.

### **2. PROTOCOL STATE MACHINES — Theseus & Ulysses**

**Theseus Protocol (refactoring boundary-locking):**

- **`src/protocol/theseus-tool.ts:1-190`** — Tool wrapper exposing FSM operations:
  - `init` (line 59): Declares scope, creates session
  - `visa` (line 71): Applies for out-of-scope expansion (adds friction to prevent drift)
  - `checkpoint` (line 84): Submits diff for Cassandra audit (adversarial evaluation)
  - `outcome` (line 98): Records test pass/fail (feedback loop)
  - `status` (line 110): Shows B counter state
  - `complete` (line 117): Terminal state transition

- **`src/protocol/types.ts:1-110`** — State definitions:
  - Lines 9-12: `TheseusTerminal = 'complete' | 'audit_failure' | 'scope_exhaustion'` (terminal states)
  - Lines 39-45: `ProtocolScope` tracks initial vs. visa-granted files
  - Lines 47-54: `ProtocolVisa` records friction-inducing scope requests
  - Lines 56-64: `ProtocolAudit` records Cassandra evaluations

- **`.claude/skills/theseus-protocol/SKILL.md:1-95`** — Operationalizes protocol as closed-loop option:
  - Initiation condition: Agent declares scope and testing intent
  - Termination condition: One of three terminal states (`complete`, `audit_failure`, `scope_exhaustion`)
  - Failure signatures: Cassandra rejection patterns; B counter exceeding visa limit
  - Recovery branches: Visa re-application; scope splitting

**Ulysses Protocol (surprise-gated debugging):**

- **`src/protocol/ulysses-tool.ts:1-189`** — Tool wrapper exposing surprise-driven FSM:
  - `init` (line 59): Starts debugging session with problem & constraints
  - `plan` (line 71): Primary + pre-committed recovery step (mandatory recovery mechanism)
  - `outcome` (line 84): Assesses surprise (expected/unexpected-favorable/unexpected-unfavorable)
  - `reflect` (line 97): Forms falsifiable hypothesis when S=2 (severity=major)
  - `status` (line 109): Shows S register, active step, surprise count
  - `complete` (line 116): Terminal state transition

- **`src/protocol/types.ts:19-27`** — Ulysses state:
  - Lines 20-22: `UlyssesTerminal = 'resolved' | 'insufficient_information' | 'environment_compromised'`
  - Lines 100-104: `UlyssesOutcomeInput` with assessment + severity (S register control)
  - Lines 106-109: `ReflectInput` requiring hypothesis + falsification criteria

- **`.claude/skills/ulysses-protocol/SKILL.md:1-120`** — Closed-loop option definition:
  - Initiation: Problem + constraints known
  - Plan phase: Primary step + pre-committed recovery (dual action)
  - Outcome assessment: Surprise severity (1=minor/S=1, 2=major/S=2)
  - S=0 state: Record checkpoint (known-good)
  - S=1 state: Execute pre-committed recovery
  - S=2 state: REFLECT required (hypothesis + falsification)
  - Termination: Resolved, insufficient_information, or environment_compromised

### **3. CLOSED-LOOP SKILLS WITH INITIATION & TERMINATION**

All workflow skills in `.claude/skills/workflow*/` define:

- **`.claude/skills/workflow/SKILL.md:1-110`** — 8-stage conductor:
  - Initiation: Ideation confirms proceed (line 18: "User confirms proceed")
  - Each stage has explicit gate conditions (lines 16-25)
  - Termination: Stage 8 (Reflection) closes workflow
  - Pre-conditions checked before each dispatch (lines 73-88: gate enforcement)

- **`.claude/skills/workflows-plan/SKILL.md:1-150`** — Receding-horizon planning (Stage 3):
  - Initiation: Spec & ADR exist from Stage 2 (lines 14-21)
  - Planning loop: Read spec → Decompose → Identify risks → Write plan → Get approval (lines 25-102)
  - Pre-conditions verified at start; gates enforced between stages
  - Termination: Plan file written; user approves; state updated (lines 133-138)

- **`.claude/skills/workflows-work/SKILL.md`** — Implementation dispatch (Stage 4):
  - Each sub-task is a reusable closed-loop option with acceptance criteria
  - Dependency ordering ensures logical sequencing
  - Tests gate advancement (implicit via gate check)

### **4. PROGRESSIVE DISCLOSURE AS CONTROL MECHANISM**

- **`src/hub/hub-handler.ts:34-150`** — Three-stage access control:
  - Lines 34-38: `getDisclosureStage()` classifies every operation
  - Stage 0 (lines 63-96): Register, list_workspaces, quick_join — no agent needed
  - Stage 1 (lines 108-140): whoami, create_workspace, join_workspace, get_profile_prompt — registered agents only
  - Stage 2 (lines 142-150+): Problem/proposal/consensus ops — workspace membership required
  
  **Pattern**: Mode selection based on disclosure stage. Each stage gates access to more privileged operations.

- **`src/hub/hub-types.ts:195-212`** — Stage operation mapping:
  - `STAGE_OPERATIONS[0]`: 3 operations (register, list, quick_join)
  - `STAGE_OPERATIONS[1]`: 4 operations (whoami, create, join, profile)
  - `STAGE_OPERATIONS[2]`: 17 operations (problems, proposals, consensus, channels)
  
  **Pattern**: Progressive disclosure enforced at dispatcher level. Stages represent operating modes with explicit capability boundaries.

### **5. MODE SELECTION & CONTROLLER SWITCHING**

- **`src/server-factory.ts:162-188`** — Mode dispatch via `thoughtbox_gateway`:
  - Lines 167-188: THOUGHTBOX_INSTRUCTIONS document recommended workflow with mode sequencing
  - Step 2: Bind root or choose project (scope selection)
  - Step 3: Choose start_new (new work) vs load_context (resume) — mode selection
  - Step 4: Call cipher (state enrichment)
  - Step 5: Use thought operations (reasoning layer)
  
  **Pattern**: Client-side mode selection. Gateway routes based on operation type.

- **`.claude/hooks/post_tool_use.sh`** — Mode-dependent logging:
  - Hooks dispatch based on tool outcome to update state machines (ulysses_state_writer.sh, bead_workflow_state_writer.sh)

### **6. KNOWLEDGE GRAPH & OBSERVATION INTEGRATION**

- **`src/protocol/theseus-tool.ts:146-188`** — Bridging protocol to knowledge:
  - Lines 163-187: `bridgeKnowledge()` persists terminal states as entities
  - Creates Insight entity with `terminalState` property
  - Links to session via `protocol_session_id`
  
  **Pattern**: Closed-loop observations. Protocol completion feeds knowledge graph for meta-agent analysis.

- **`src/protocol/ulysses-tool.ts:162-188`** — Same pattern for Ulysses:
  - Terminal states create Insight entities with protocol session references

---

## PARTIAL (exists but incomplete — what's missing)

### **1. Medium-Speed Receding-Horizon Planning**

**What exists**: Workflow conductor (`.claude/skills/workflow/SKILL.md`) sequences 8 stages. Each stage has pre/post conditions.

**What's missing**:
- **No active replanning after observation**: The workflow conducts forward but doesn't replan mid-stage if conditions change. Example: Stage 4 (implementation) doesn't monitor for environment changes (e.g., main branch advances) and adjust task ordering. It only checks once at transition (Stage 4→5 special logic, line 93-97).
- **No scoring of candidate action sequences**: The planner decomposes tasks but doesn't score multiple decomposition strategies or rank by expected information gain. Decomposition is done once, not compared.
- **No explicit "observe → score → commit first action → replan" loop**: The workflow is sequential and deterministic, not MPC-like. Each stage completes; next stage begins. No mid-stage replanning.

**Where to add**: New stage skill could implement `workflows-replan` that monitors main branch, issues, and test results, reordering remaining work if environment changed. Or extend `workflow` conductor to check for conflicts between Stage 4→5.

### **2. Fast Reflex Layer — Incomplete Coverage**

**What exists**: Five safety policies in `pre_tool_use.sh`, surprise escalation in `ulysses_enforcer.sh`, bead workflow rules in `bead_workflow_enforcer.sh`.

**What's missing**:
- **No tool failure injection/recovery**: Hooks detect policy violations but don't handle *tool execution failures* (e.g., Bash command returns non-zero). Current system blocks policy violations; it doesn't catch and recover from outcome failures.
- **No interrupt/timeout handling**: No hook monitors tool execution duration. If a tool hangs or loops, no reflex circuit breaker kills it.
- **No parse error recovery**: If a tool returns malformed JSON (e.g., MCP tool response), no hook catches and suggests recovery.

**Where to add**: 
- New `post_tool_use.sh` hook to monitor exit codes and invoke recovery rules (e.g., "if test fails, auto-rerun with verbose flag").
- Timeout monitor in `pre_tool_use.sh` or new hook (e.g., "if Bash command takes >30s, kill and escalate").

### **3. Skill Failure Signatures & Recovery Branches**

**What exists**: 
- Protocol skills (Theseus, Ulysses) define terminal states.
- Bead workflow defines escalation (reflect required).

**What's missing**:
- **No generic skill failure signature catalog**: Each skill implicitly knows when to terminate, but there's no unified pattern for "skill failed due to X, try recovery Y."
- **No cross-skill failure propagation**: If a sub-agent skill fails, does it trigger a specific recovery in the parent? Current system: sub-agent summaries are reviewed; failures block advancement. No automatic retry or escalation routing.

**Where to add**: 
- New skill framework documenting: Initiation conditions, Termination conditions, Failure signatures (explicit error patterns), Recovery branches (what to do on each signature).
- New `.claude/agents/failure-router.md` that examines failed work summaries and routes to recovery agents (e.g., retry, escalate, decompose differently).

### **4. MPC-Style Candidate Action Scoring**

**What exists**: Workflow planning decomposes tasks. Hub operations rank by disclosure stage. Protocol sessions have state transitions with audit/approval.

**What's missing**:
- **No scoring function for candidate action sequences**: The planner writes one plan. It doesn't generate 3 alternative decompositions and score them by:
  - Risk (how many hypothesis violations could happen?)
  - Information gain (which decomposition tests hypotheses fastest?)
  - Reversibility (which sequence can be unwound cheapest?)
- **No commit-only-first-action semantics**: MPC proposes [a1, a2, a3, ...], commits only a1, observes, replans. Current system commits whole stage and executes.

**Where to add**: 
- New skill: `workflows-multiplan` that generates 3 alternative task orderings, scores them on ADR hypotheses, selects one. Stores alternatives in state for later use if selected plan fails.
- Extend `workflow` conductor: After planning, show 3 candidate plans; user selects; Stage 4 only commits to first task, not all.

---

## ABSENT (not found anywhere)

### **1. Explicit Layer Terminology in Code**

- No `SlowLayer`, `MediumLayer`, `FastLayer` classes/interfaces in `src/`.
- No explicit "fast reflex," "medium-speed planner," "slow mission layer" architecture document.
- **Where it should go**: New ADR (e.g., `ADR-CTL-01-hierarchical-control-architecture.md`) documenting the three layers, their decision loops, and integration points.

### **2. Dedicated Planner Component (Medium Speed)**

- `workflows-plan` is a skill, not a persistent planner object. It runs once per workflow, writes a plan file, and stops.
- No `PlannerClass` that maintains candidate plans, scores them, and replans on observation.
- **Where it should go**: New `src/planner/` directory with:
  - `Planner` interface: `plan(goals, constraints) → Plan[]`, `score(candidate, hypotheses) → number`, `selectAndCommit(plan) → Action`
  - `MpcPlanner` implementation: Maintains rolling horizon, replans on observation.
  - Integration point: New skill `workflows-mpc-loop` that invokes planner in a loop.

### **3. Explicit Failure Recovery Registry**

- No centralized mapping of "failure signature → recovery handler."
- Protocols have terminal states; bead workflow has escalation to reflect. But no unified registry.
- **Where it should go**: 
  - New file: `src/control/failure-recovery-registry.ts` with:
    ```ts
    interface FailureSignature { pattern: string; severity: 'reflex' | 'medium' | 'slow'; }
    interface RecoveryBranch { signature: FailureSignature; handler: string; escalateTo?: string; }
    const RECOVERY_BRANCHES: RecoveryBranch[] = [
      { signature: { pattern: 'test-failure', severity: 'reflex' }, handler: 'retry-with-verbose' },
      { signature: { pattern: 'scope-drift', severity: 'medium' }, handler: 'request-visa' },
      { signature: { pattern: 'hypothesis-refuted', severity: 'slow' }, handler: 'reflect' },
    ];
    ```
  - New skill: `workflows-failure-recovery` that consults registry and routes failures.

### **4. Tool Failure Injection & Chaos Testing**

- No hook or agent tests tool execution robustness.
- No chaos monkey that simulates tool failures and verifies recovery.
- **Where it should go**: 
  - New test suite: `src/control/chaos-testing.test.ts` that injects failures and verifies recovery paths.
  - New hook: `.claude/hooks/chaos-inject.sh` (optional, for deliberate testing) to inject random failures.

### **5. Observable State of Control Layers**

- No single place to query "what layer is active now? What's the current S register? What's the current disclosure stage?"
- State is scattered: S register in `.claude/state/ulysses/`, disclosure stage computed at runtime, B counter in Supabase.
- **Where it should go**: 
  - New endpoint: `thoughtbox_gateway { operation: "control_state" } → { layer: 'fast'|'medium'|'slow', mode: string, stateRegisters: {...} }`
  - New resource template in server-factory: "Control State Dashboard" showing live state.

### **6. Explicit Initiation & Termination Condition Catalog**

- Theseus/Ulysses define termination states but no structured catalog comparing them.
- No unified interface like `ClosedLoopOption { initiate: () => bool, terminate: () => TerminalState, failures: FailureSignature[] }`
- **Where it should go**: 
  - New file: `src/control/closed-loop-options.ts` defining the interface and all options (theseus, ulysses, all workflow stages, all bead workflow phases).
  - Auto-generated skill catalog from this file.

---

## ARCHITECTURE NOTES (where new components should go)

### **Directory Structure for Hierarchical Control**

```
src/control/
├── layers/
│   ├── reflex-layer.ts          # Fast decision circuits (hooks + immediate gates)
│   ├── medium-planner.ts         # MPC-style receding-horizon planner
│   └── slow-mission-layer.ts     # Long-horizon goal decomposition
├── state-machines/
│   ├── protocol-fsm.ts           # Shared FSM primitives (states, transitions)
│   ├── theseus-fsm.ts            # Theseus state machine
│   ├── ulysses-fsm.ts            # Ulysses state machine
│   ├── bead-workflow-fsm.ts       # Bead 7-step FSM
│   └── workflow-fsm.ts           # 8-stage workflow FSM
├── failure-recovery/
│   ├── failure-registry.ts       # Failure signature → recovery mapping
│   ├── recovery-branches.ts      # Recovery handlers
│   └── escalation-router.ts      # Escalation logic
├── observability/
│   ├── control-state.ts          # Observable control state (layers, modes, registers)
│   └── control-dashboard.ts      # Dashboard resource for live state
└── types.ts                      # Unified control architecture types

.claude/skills/
├── control-state-dashboard/
│   └── SKILL.md                  # Query current layer, mode, state registers
├── failure-recovery-guide/
│   └── SKILL.md                  # Consult failure registry, execute recovery
└── workflows-mpc-loop/
    └── SKILL.md                  # MPC planner with mid-stage replanning

.adr/accepted/ (or staging/)
└── ADR-CTL-01-hierarchical-control-architecture.md  # Formal design document
```

### **Key Integration Points**

1. **Reflex → Medium**: When S=2 in Ulysses, reflex layer blocks action; medium planner should be invoked to reflect and replan.
2. **Medium → Slow**: When replanning detects major scope change, medium planner escalates to slow mission layer for re-decomposition.
3. **Slow → Medium**: When slow layer picks a new mode (e.g., "switch from refactor to debug"), medium planner generates new short-horizon plan.
4. **Observability**: Control state resource template exposes current layer, mode, registers, and active FSM state.

### **Naming Conventions**

- Layers: `<layer>-layer.ts` (reflex, medium, slow)
- FSMs: `<option>-fsm.ts` (protocol, workflow, bead)
- Recovery: `<failure-type>-recovery.ts` or unified registry
- Skills for control: `control-<operation>`, `<protocol>-protocol`, `workflow-<stage>`

---

## SUMMARY TABLE

| Element | Status | File(s) | Completeness |
|---------|--------|---------|--------------|
| **Fast reflex layer** | EXISTS | `.claude/hooks/pre_tool_use.sh`, `ulysses_enforcer.sh`, `bead_workflow_enforcer.sh` | 70% (missing tool failure recovery, timeouts, parse error handling) |
| **Protocol state machines** | EXISTS | `src/protocol/theseus-tool.ts`, `ulysses-tool.ts`, `types.ts` | 95% (full FSM semantics implemented) |
| **Closed-loop skills** | EXISTS | `.claude/skills/workflow/`, `theseus-protocol/`, `ulysses-protocol/` | 85% (skills define initiation/termination but no failure signatures catalog) |
| **Progressive disclosure** | EXISTS | `src/hub/hub-handler.ts`, `hub-types.ts` | 90% (three-stage gates implemented; observability missing) |
| **Medium-speed planner** | PARTIAL | `.claude/skills/workflows-plan/SKILL.md` | 40% (one-shot planning; no replanning, no scoring, no MPC) |
| **Mode selection** | EXISTS | `src/server-factory.ts`, hub dispatch | 70% (stages exist; no explicit mode object or switching logic) |
| **Failure signatures** | PARTIAL | Protocol skills have terminal states; bead workflow has escalation | 50% (no unified registry, no recovery routing) |
| **Observability** | ABSENT | — | 0% (no control-state endpoint, no dashboard) |
| **Explicit layer architecture** | ABSENT | — | 0% (no code-level layer objects, no formal document) |
| **MPC candidate scoring** | ABSENT | — | 0% (no multi-plan generation, no scoring) |
| **Tool failure handling** | ABSENT | — | 0% (no post-execution recovery hooks) |
