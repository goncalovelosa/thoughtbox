Perfect. Now I have a complete picture. Let me generate the comprehensive audit report:

## EXECUTION RUNTIME AUDIT — CONTROL-THEORETIC IDEAL

---

## EXISTS (with file paths and what it does)

### 1. **Tool Registration & Handler Flow**
**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/server-factory.ts:368-412`
- `registerExplicitTool` macro (lines 369-412): Wraps tool instances with standardized error handling
- Implements **progressive disclosure**: tools unlocked stage-by-stage (STAGE_0 → STAGE_1 → STAGE_2)
- Error handling: catches exceptions, wraps in `{ type: "text", isError: true }` format (lines 394-398)
- **Reception verification**: Tools return result shape `{ content, isError? }` verified before returning (lines 388-393)

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought/tool.ts:112-124`
- `ThoughtTool.handle()` is the entry point for thought execution
- Validates schema via Zod (line 50-91), injects agent context (lines 114-119)
- Delegates to `ThoughtHandler.processThought()` (line 123)

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:602-620`
- `processThought()` serializes through a **promise queue** (line 608) to prevent race conditions
- Queue recovery on failure (line 612): `.catch(() => undefined)` ensures queue continues
- Delegates to `_processThoughtImpl()` (line 613)

---

### 2. **Observation Ingestion & Belief State Update**
**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:622-920`
- `_processThoughtImpl()`: The core execution loop
  - **Step 1 - Ingest observations**: Validates input (line 627) via `validateThoughtData()`
  - **Step 2 - Update state**: Session auto-creation if needed (lines 647-684)
  - **Step 3 - Persistence**: All storage operations BEFORE in-memory update (lines 759-785)
    - Main chain: `storage.saveThought()` (line 768)
    - Branches: `storage.saveBranchThought()` (line 762)
    - Session metadata: `storage.updateSession()` (line 772)
  - **Step 4 - Check constraints**: Validates thoughtNumber ≤ totalThoughts (lines 629-631)
  - **Step 5 - Emit trajectory**: Observatory events (fire-and-forget, lines 789-845) + SIL-104 JSONL events (lines 849-868)

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:332-467`
- **Validation layer**: `validateThoughtData()` enforces discriminated union (thoughtType)
- **Structured metadata**: AUDIT-001 validation per thoughtType (lines 435-467)
  - `decision_frame`: requires `confidence` + exactly one selected option
  - `action_report`: requires `actionResult` with success/reversible/tool/target
  - `belief_snapshot`: requires non-empty `beliefs.entities`
  - `assumption_update`: requires `newStatus` ∈ {believed, uncertain, refuted}
  - `progress`: requires task + status ∈ {pending, in_progress, done, blocked}

---

### 3. **Autonomous Sampling Loop (Phase 3)**
**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/sampling/handler.ts:76-112`
- `requestCritique()`: Calls MCP `sampling/createMessage` (line 85)
- Model hint: claude-sonnet-4-5-20250929 with intelligencePriority=0.9 (lines 89-91)
- Error handling: catches -32601 (METHOD_NOT_FOUND) for graceful degradation (lines 104-107)
- Context: includes last 5 thoughts for local model conditioning (line 126)

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:871-908`
- Critique requested iff `critique=true` AND `samplingHandler` available (line 872)
- **Non-blocking**: Fire-and-forget pattern (line 894-898)
  - Persists critique in background; failures logged, never block thought
  - Error handler swallows -32601 (sampling not supported)

---

### 4. **Hook Dispatch Sequence**
**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/.claude/hooks/pre_tool_use.sh:1-150`
- **Pre-execution validation** (PreToolUse):
  - Blocks `rm -rf` patterns (lines 14-31)
  - Blocks `.env` writes (lines 34-57)
  - Blocks `.claude/hooks` and `.claude/settings` modifications (lines 60-85)
  - Blocks full-file Write to `CLAUDE.md`, `AGENTS.md` (lines 87-104)
  - Blocks deletions in `specs/`, `.specs/`, `docs/`, `self-improvement/` (lines 107-150)
- Exit code 2 = tool blocked; exit code 0 = allowed

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/.claude/hooks/post_tool_use.sh:1-48`
- **Post-execution logging** (PostToolUse):
  - Logs all `git` commands to `logs/git_operations.json` (lines 26-43)
  - Appends JSONL audit entry with tool, command, timestamp (lines 32-43)

---

### 5. **Transaction Semantics & Rollback**
**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:759-785`
- **Persist-first, then update in-memory** pattern (comment line 759-760):
  - If ANY persistence fails, in-memory state unchanged
  - Ensures consistency: filesystem source-of-truth
  - No explicit rollback — failure leaves disk state untouched, memory unchanged

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/persistence/filesystem-storage.ts` (Atomic writes)
- `atomicWriteJson()`: Write-to-temp, then atomic rename
- Used for all thought persistence (lines in filesystem-storage.ts)
- Prevents partial/corrupt writes on crash

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/protocol/handler.ts:71-91`
- **Protocol-level state machine**: Explicit `supersede` operation resets state on restart
  - Theseus: supersedes old session when new `init()` called (line 107)
  - Ulysses: supersedes old session when new `init()` called (line 457)
- State transitions atomic via Supabase RPC

---

### 6. **Receipt & Verification After Execution**
**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:1017-1110`
- **Response generation** (lines 1017-1110):
  - Default: minimal response with thoughtNumber + sessionId only (lines 1027-1042)
  - Verbose: full response with all metadata fields (lines 1045-1110)
  - Session closure: includes exportPath + auditManifest (lines 963-987)
  - Export failure: keeps session open to prevent data loss (lines 988-1014)

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:1017-1020`
- Formatted console output for human verification (line 1018-1019)
- Disabled via `disableThoughtLogging` config flag

---

### 7. **Trajectory Logging & Event Emission**
**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/events/event-emitter.ts:37-180`
- **SIL-104 Event Stream**: Emits JSONL events on:
  - `session_created` (line 81-87): sessionId, title, tags
  - `thought_added` (line 92-98): sessionId, thoughtNumber, wasAutoAssigned, thoughtPreview
  - `branch_created` (line 103-109): sessionId, branchId, fromThoughtNumber
  - `session_completed` (line 114-120): sessionId, finalThoughtCount, branchCount, auditManifest
  - `export_requested` (line 125-131): sessionId, exportPath, nodeCount

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:849-868`
- Emits events AFTER persistence succeeds (lines 849-868)
- Optional MCP session ID for client isolation (line 148)
- Configurable destination: stderr (default), stdout, or filepath (server-factory.ts:242-243)

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/observatory/emitter.ts`
- Parallel event stream: Observatory emitter (different from SIL-104)
- Emits to Observatory UI in real-time
- Fire-and-forget: errors swallowed (lines 843-844 in thought-handler)

---

### 8. **Escalation as Control Action**
**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:694-715`
- **Session integrity check** (lines 697-715):
  - Before persisting, verifies session still exists
  - If deleted (race condition), returns error response: `isError: true`
  - Session ID may have been corrupted — escalates user to start new session

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/thought-handler.ts:988-1014`
- **Auto-export failure escalation** (lines 988-1014):
  - If export fails, keeps session open (don't lose data)
  - Returns warning response with actionable message
  - User must manually export via `export_reasoning_chain` tool

**File**: `/Users/b.c.nims/dev/kastalien-research/thoughtbox-new/thoughtbox-staging/src/init/tool-handler.ts` (phase gates)
- Progressive disclosure: escalates "operation not available yet" when stage not reached
- Operations gated by ConnectionStage enum

---

## PARTIAL (exists but incomplete — what's missing)

### 1. **Explicit Model Reliability Estimation**
- **What exists**: Fixed hints for sampling (line 90, claude-sonnet-4-5-20250929)
- **What's missing**: 
  - No dynamic cost/latency estimation after sampling request
  - No ranking of alternative models based on observed performance
  - Cost budget enforcement before critique request
  - Fallback model selection on repeated timeout

### 2. **Explicit Cognition Budget Allocation**
- **What exists**: Hard-coded maxTokens=1000 for critique (line 95)
- **What's missing**:
  - No system-wide token counter across thought stream
  - No budget remaining calculation at each thought
  - No mode selection: "abort critique if budget < 1000" vs "use fallback model"
  - No horizon planning (how many thoughts before budget exhausted?)

### 3. **Operating Mode Selection**
- **What exists**: Single mode: always try to sample critique if handler available
- **What's missing**:
  - No explicit selection between: "high-confidence fast path", "uncertain path (sample)", "deferred path (batch later)"
  - No branching on confidence level to adjust sampling strategy
  - No mode switch based on remaining session budget

### 4. **Action Sequence Ranking & Safety Filtering**
- **What exists**: 
  - Single deterministic action: persist → emit → optionally critique → return
  - Hook pre-execution validation (blocks dangerous patterns)
- **What's missing**:
  - No candidate action generation (e.g., "skip critique OR critique OR batch critique")
  - No rank-ordering (e.g., "persist (highest safety) → emit → critique (lower safety, optional)")
  - No explicit safety filter stage between generation and execution
  - No dynamic reconsideration of action after partial failure

### 5. **Observability of Belief Uncertainty**
- **What exists**: 
  - Schema declares `confidence: 'high' | 'medium' | 'low'` (line 40, 80)
  - Stores in persistent thought data (line 747)
- **What's missing**:
  - No query operation: "get all uncertain beliefs from this session"
  - No uncertainty propagation: "if assumption_update refutes a belief, which downstream thoughts are affected?"
  - No contradiction detection: "two action_reports claim opposite outcomes for same tool"
  - No confidence aggregation: "overall session confidence = f(all thought confidences)"

### 6. **Abort / Wait / Defer as Legit Control Actions**
- **What exists**: 
  - Implicit defer: critique request is fire-and-forget (line 894)
  - Implicit wait: queueing via processingQueue (line 608)
- **What's missing**:
  - No explicit "abort thought" response when constraints violated
  - No "wait for prerequisite" (e.g., wait for session to complete before persisting next thought)
  - No "defer to batch" (collect thoughts, process later as transaction)
  - No user-facing operation: `{ operation: 'wait_for_event' }`

### 7. **Transactional Multi-Thought Sequences**
- **What exists**: Single-thought atomicity (persist then update in-memory)
- **What's missing**:
  - No multi-thought transaction: "batch thoughts 1-5 into single session persistence"
  - No rollback on constraint violation mid-sequence
  - No "all-or-nothing" semantics across multiple calls

### 8. **Constraint Violation Handling**
- **What exists**:
  - Validates thoughtNumber ≤ totalThoughts (line 629)
  - Validates branching: branchId requires branchFromThought (lines 352-359)
  - Validates structured fields per thoughtType (lines 435-467)
- **What's missing**:
  - No constraint about revision chain depth (e.g., can't revise a revision of a revision)
  - No constraint about branch count limits (DoS prevention)
  - No constraint about session duration (timeout)
  - No graceful degradation on constraint fail (e.g., "coerce totalThoughts up")

---

## ABSENT (not found anywhere)

### 1. **Explicit Local Model State**
- No `LocalModel` interface with methods: `estimate_cost()`, `estimate_latency()`, `get_prior_success_rate()`
- No history of sampling results to compute empirical success rate
- No calibration of model hints based on observed performance

### 2. **Explicit Horizon & Deadline Planning**
- No forward-looking window: "Given budget X and cost per thought Y, how many thoughts remain?"
- No deadline enforcement: "Stop accepting thoughts after time T"
- No graceful shutdown on approaching deadline

### 3. **Safety-Filter Stage**
- No intermediate representation between "candidate actions" and "executed actions"
- No explicit list: `candidateActions = [persist, emit, critique, return]`
- No ranking function: `rank(actions) → [safest ... riskiest]`
- No threshold: "only execute actions with safety_score ≥ threshold"

### 4. **Goal Progress Checking**
- No explicit `isGoalReached()` function separate from `shouldEnd()`
- No tracking of goal milestones (e.g., "goal = resolve authentication, milestone 1 = understand requirements")
- No adaptive re-planning on goal drift

### 5. **Explicit Control Actions as Data**
- No `ControlAction` type: `{ type: 'ask' | 'wait' | 'abstain' | 'defer' | 'escalate', reason: string, params?: {} }`
- No structured enum for legitimate non-execution outcomes
- No tool response that says "I'm waiting for event X" without executing anything

### 6. **Asynchronous Event Coordination**
- No subscriptions: "notify me when session X completes"
- No event channels: send/receive pattern for thought-to-thought coordination
- No condition variables: "block further thoughts until prerequisite thought arrives"

### 7. **Queryable Session State Machine**
- No `getSessionState(): { stage: 'initializing' | 'reasoning' | 'closing' | 'closed', ... }`
- No transition log: "session moved from initializing → reasoning at T1, reasoning → closing at T2"
- No state subscription: "alert me if session moves to error state"

### 8. **Distinguishing Observation Quality**
- No `observationQuality` field: Is this thought from direct execution or hearsay?
- No provenance tracking: Did the LLM reason this, or did a tool report it?
- No trust scoring: "This observation has 3 independent corroborations, trust=0.95"

### 9. **Explicit Conflict Resolution**
- No merge strategy when two branches reach incompatible conclusions
- No "winning branch" selection logic
- No contradiction detection across branches

### 10. **Rate Limiting & Backpressure**
- No token rate limiter on sampling requests
- No queue depth monitor: alert if queue exceeds N pending thoughts
- No client connection quota enforcement

---

## ARCHITECTURE NOTES (where new components should go)

### 1. **Add a `ControlLoop` Layer** (new file: `src/control-loop.ts`)
Sits ABOVE `ThoughtHandler`:
```typescript
interface ControlState {
  observedThought: ThoughtData;
  beliefState: BeliefSnapshot;  // derived from history + audit data
  uncertainties: Map<string, number>;  // entity → confidence
  goalProgress: number;  // %
  budgetRemaining: { tokens: number; time_ms: number };
  constraintsViolated: string[];
}

interface CandidateAction {
  type: 'persist' | 'emit' | 'sample_critique' | 'export_session' | 'defer' | 'escalate';
  safetyScore: 0..1;
  estimatedCost: { tokens: number; latency_ms: number };
  rationale: string;
}

class ControlLoop {
  async executeThought(input: ThoughtData): Promise<{
    realizedAction: ExecutedAction;
    stateAfter: ControlState;
    response: MCP_ToolResponse;
  }> {
    const state = await this.ingestObservation(input);
    const candidates = await this.generateCandidateActions(state);
    const ranked = this.rankBySafety(candidates);
    const filtered = this.safetyFilter(ranked);
    const action = filtered[0];
    const realized = await this.execute(action);
    return { realizedAction: realized, stateAfter: state, response };
  }
}
```

**Location**: Insert between `server-factory.ts` tool registration and `ThoughtHandler`

### 2. **Add a `ModelReliability` Tracker** (new file: `src/sampling/model-estimator.ts`)
- Track sampling success/timeout/cost
- Recommend models based on empirical performance
- Enforce budget before issuing requests

**Location**: Extend `sampling/handler.ts`

### 3. **Add a `SessionStateMachine`** (new file: `src/sessions/state-machine.ts`)
Explicit enum + transition log:
```typescript
enum SessionStage {
  Initializing = 0,
  Reasoning = 1,
  Closing = 2,
  Closed = 3,
  Error = 4,
}

interface SessionStateTransition {
  from: SessionStage;
  to: SessionStage;
  timestamp: Date;
  trigger: { type: string; ... };
}
```

**Location**: In `sessions/` package; plumb into `ThoughtHandler` state machine

### 4. **Add `Observability.queryConstraintViolations()`** (extend `thought-handler.ts`)
Method to list all active constraints + which are violated:
```typescript
queryConstraintViolations(): {
  constraints: Array<{ name: string; description: string; violated: boolean }>;
  recommendations: string[];
}
```

### 5. **Add `ControlAction` as First-Class Response Type**
Currently tool responses are error or success. Add:
```typescript
type ToolResponse = 
  | { type: 'success', content: [...] }
  | { type: 'error', content: [...] }
  | { type: 'wait', reason: string, blockingEvent: string }
  | { type: 'defer', reason: string, deferredUntil: Date }
  | { type: 'abstain', reason: string }
  | { type: 'escalate', reason: string, requiresUserDecision: true };
```

**Location**: New file `src/types/control-actions.ts`

### 6. **Add `EventCoordination` Layer** (new file: `src/events/coordination.ts`)
Channels for thought-to-thought signaling:
```typescript
class EventChannel {
  async waitFor(eventType: string, predicate?: (e) => boolean): Promise<Event>;
  async send(eventType: string, payload: any): Promise<void>;
}
```

**Location**: Extend `events/` package

### 7. **Add `BudgetMonitor`** (new file: `src/execution/budget-monitor.ts`)
Token counter + deadline timer:
```typescript
class BudgetMonitor {
  checkTokensRemaining(): number;
  checkTimeRemaining(): number;
  enforceDeadline(action: CandidateAction): boolean;
}
```

**Location**: New package `src/execution/`

### 8. **Extend `persistThought()` to Transactional Multi-Thought**
Currently single-thought atomic. Add:
```typescript
async persistThoughts(
  sessionId: string,
  thoughts: ThoughtData[],
  atomicity: 'single' | 'batch'
): Promise<{ persisted: ThoughtData[]; failed: Array<{ thought: ThoughtData; error: string }> }>;
```

**Location**: In `persistence/filesystem-storage.ts`

---

## SUMMARY TABLE

| Component | Status | File:Line | Evidence |
|-----------|--------|-----------|----------|
| **Tool registration & handler** | EXISTS | server-factory.ts:368-412 | registerExplicitTool macro with error wrapping |
| **Observation ingestion** | EXISTS | thought-handler.ts:622-920 | validateThoughtData() + session auto-create |
| **Belief state update** | PARTIAL | thought-handler.ts:759-785 | Persist-then-update, no uncertainty tracking |
| **Local model estimation** | ABSENT | — | No cost/latency/success estimation |
| **Cognition budget** | PARTIAL | sampling/handler.ts:95 | Fixed 1000 tokens, no budget enforcement |
| **Operating mode selection** | ABSENT | — | Single mode, no mode switching |
| **Candidate action generation** | ABSENT | — | No explicit generation stage |
| **Safety filtering** | PARTIAL | pre_tool_use.sh:1-150 | Pre-execution guards only; no mid-action filter |
| **Transaction semantics** | EXISTS | thought-handler.ts:759-785 | Atomic write-then-update, no rollback |
| **Receipt verification** | EXISTS | thought-handler.ts:1017-1110 | Response generation with verification |
| **Trajectory logging** | EXISTS | events/event-emitter.ts:37-180, thought-handler.ts:849-868 | JSONL events + Observatory events |
| **Escalation as control action** | PARTIAL | thought-handler.ts:694-715, 988-1014 | Error returns, no structured ControlAction |
| **Constraint violation handling** | PARTIAL | thought-handler.ts:332-467 | Schema validation; no graceful degradation |
| **Goal progress tracking** | ABSENT | — | No goal state, no milestones |
| **Asynchronous coordination** | ABSENT | — | No event channels, no subscriptions |
| **Session state machine** | ABSENT | — | Implicit state; no explicit enum |
| **Observation quality** | ABSENT | — | No provenance, no trust scoring |
| **Conflict resolution** | ABSENT | — | No branch merging, no contradiction detection |
| **Rate limiting** | ABSENT | — | No token rate limiter, no queue depth monitor |
