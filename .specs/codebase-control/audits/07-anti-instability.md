Perfect. Now let me compile my findings into a structured report. I have a comprehensive picture of the anti-instability machinery.

## Audit Report: Anti-Instability Machinery and Failure Detection

This codebase implements a sophisticated, multi-layered system for detecting and dampening instability in agentic systems. Below is the structured inventory:

---

## EXISTS (with file paths and mechanisms)

### 1. Surprise-Gated Debugging Protocol (Ulysses)
**Files:** `src/protocol/ulysses-tool.ts`, `src/protocol/handler.ts:450-727`, `.claude/skills/ulysses-protocol/SKILL.md`

**Mechanism:** S-register (surprise state machine) with automatic escalation:
- **S=0**: Plan phase (expected)
- **S=1**: Recovery phase (single surprise, consecutive_surprises counter increments)
- **S=2**: Reflect phase (automatic trigger at: severity=2 OR consecutive_surprises>=2)
- Surprise register: last 3 surprises tracked with severity (1=minor, 2=major) and timestamps (handler.ts:620-623)
- **Mandatory REFLECT gating** (lines 677-682): S=2 blocks all tool use except reading, `bd` commands, and REFLECT itself (ulysses_enforcer.sh:18-36)
- **State reset on REFLECT**: S→0, consecutive_surprises→0, hypothesis recorded (handler.ts:690-695)

**Hooks enforcing escalation:**
- `ulysses_state_writer.sh` (lines 24-76): Detects failures (exit_code≠0, vitest FAIL, supabase reset failure), increments surprise_count
- `ulysses_enforcer.sh` (lines 2-48): Blocks work when reflect-required sentinel exists

### 2. Red-Green Test Cycle with Hard Reset (Theseus Protocol for refactoring stability)
**Files:** `src/protocol/theseus-tool.ts`, `src/protocol/handler.ts:97-447`, `.claude/skills/theseus-protocol/SKILL.md`

**Mechanism:** B counter (boundary state) with dual-failure reset:
- **B=0**: Clean state (tests passing)
- **B=1**: One test failure (one repair attempt allowed)
- **B=2**: Two consecutive test failures → **automatic `git reset --hard`** to last checkpoint (handler.ts:333-352)
- test_fail_count increments on failures; resets to 0 on pass or checkpoint approval (handler.ts:254-268, 311-328)
- **Hard reversibility**: No shadow state — if two repairs fail in sequence, the entire change is rolled back (handler.ts:348-352: "git reset --hard to last checkpoint")

**State persistence:** Supabase protocol_sessions table with JSON state tracking B, test_fail_count, checkpoints

### 3. Bead Workflow Enforcer (7-step hypothesis-gated process)
**Files:** `.claude/hooks/bead_workflow_enforcer.sh`, `.claude/hooks/bead_workflow_state_writer.sh`, `.claude/skills/bead-workflow/SKILL.md`

**Mechanism:** State-machine gates blocking work at each phase:

| Step | Gate | Enforcer Block |
|------|------|---|
| 1. Claim | (claim bead) | Sets `current-bead.json` |
| 2. Hypothesize | No code without hypothesis | `bead_workflow_enforcer.sh:56-68`: blocks Edit/Write to src/ if hypothesis_stated=false |
| 3. Implement | Code edit resets tests gate | Deletes `tests-passed-since-edit` sentinel |
| 4. Test | Tests must pass | Enforcer:66-74: sets sentinel only on clean pass |
| 5. Validate | (state result out loud) | User-facing checkpoint |
| 6. Close | No close without tests | Enforcer:87-92: blocks `bd close` if `tests-passed-since-edit` missing |
| 7. Pause | No next work until user confirms | Enforcer:21-50: blocks Edit/Write/Bash while `pending-validation.json` exists |

**Ulysses escalation bridge:** If test_fail_count reaches 2 during a bead (ulysses_state_writer.sh:49-76), reflect-required sentinel written → enforcer blocks all work

### 4. Circuit Breaker with Half-Open Recovery
**Files:** `src/evaluation/trace-listener.ts:44-47, 313-338`, `src/evaluation/online-monitor.ts:46-51, 298-326`

**Mechanism:**
- **CIRCUIT_THRESHOLD:** 5 consecutive failures
- **CIRCUIT_COOLDOWN_MS:** 60,000ms (60 seconds)
- **States:**
  - **Closed**: Normal operation, failureCount=0
  - **Open**: Skip all calls when failureCount>=5 and Date.now() < circuitOpenUntil
  - **Half-open**: After cooldown expires, reset failureCount to 0 and retry once
- **Fire-and-forget safety**: All LangSmith/trace calls are async-without-await; failures logged but never propagated (trace-listener.ts:141-150)

**Applied to:** 
- LangSmithTraceListener (session→thought tracing to observability system)
- OnlineMonitor (scoring production sessions for regression detection)

### 5. Regression Detection via Rolling Baseline
**Files:** `src/evaluation/online-monitor.ts:52-56, 203-258`

**Mechanism:**
- **Rolling window size:** 20 sessions (configurable)
- **Baseline requirement:** 10+ scored sessions before alerting (minSamplesForBaseline)
- **Anomaly detection:** Metric < (mean - 2σ) → regression alert; metric > (mean + 2σ) → informational anomaly
- **Alert deduplication:** 30-minute cooldown per metric (alertCooldowns Map, isAlertCoolingDown:277-285)
- **Cold-start safe:** No alerts until baseline established

**Metrics tracked:** Session quality scores (memory, reasoning, behavior) from tiered evaluators (online-monitor.ts:165-178)

### 6. Evaluation Gates (Tiered + Behavioral Contracts)
**Files:** `src/observatory/evaluation-gatekeeper.ts`, `src/evaluation/online-monitor.ts`

**Mechanism:**
- **Three-tier evaluation:** Smoke → Regression → Real-world (gatekeeper.ts:7-12)
- **Behavioral contracts:** VARIANCE, CONTENT_COUPLED, TRACE_EXISTS, LLM_JUDGES (gatekeeper.ts:35)
- **Block on failure:** Integration blocked until all tiers and contracts pass (gatekeeper.ts:105)
- **Cost tracking:** Total cost of evaluation captured to prevent evaluation runaway

### 7. Action Masking via Pre-Tool-Use Hooks
**Files:** `.claude/hooks/pre_tool_use.sh`, `.claude/hooks/ulysses_enforcer.sh`, `.claude/hooks/bead_workflow_enforcer.sh`

**Blocked actions during instability:**
- When reflect-required sentinel exists (ulysses_enforcer.sh:18-36): Read/Glob/Grep/bd/Skill allowed; all work blocked
- When pending-validation sentinel exists (bead_workflow_enforcer.sh:21-50): Read/Glob/Grep/bd/test commands allowed; Edit/Write/Bash work blocked
- Dangerous operations always blocked (pre_tool_use.sh): `rm -rf`, write to `.env`, write to `.claude/hooks` or `.claude/settings`

### 8. Hysteresis via Multi-Gate Confirmation
**Files:** All state files in `.claude/state/bead-workflow/`, `.claude/state/ulysses/`

**Mechanism:** Step 7 (pause) requires explicit user action (`touch validation-confirmed`) to clear pending-validation gate — prevents accidental rapid mode switching or oscillation between hypothesis refinement cycles. Not a pure hysteresis but a **confirmation pause** between state transitions.

### 9. Progress Monitoring (Checkpoints & Terminal States)
**Files:** `src/protocol/handler.ts`, `src/protocol/types.ts`

**Mechanism:**
- **Theseus checkpoints:** Approved audits create checkpoint snapshots (handler.ts:608-611, 254-268)
- **Ulysses checkpoints:** Created on expected outcomes (handler.ts:608-611)
- **Terminal states enforce progression:** 
  - Theseus: complete, audit_failure, scope_exhaustion
  - Ulysses: resolved, insufficient_information, environment_compromised
  - Cannot loop within a state—must reach terminal
- **Hypothesis genealogy:** Tracked across all hypotheses (handler.ts:694: hypotheses array grows monotonically)

### 10. Surprise Severity Stratification
**Files:** `src/protocol/ulysses-tool.ts:14-16`, `src/protocol/handler.ts:614-642`

**Mechanism:**
- Severity 1 (minor): Accumulates until 2 consecutive → S=2
- Severity 2 (flagrant): Immediate S=2 without waiting for consecutive count (handler.ts:625-628)
- Prevents "slow boil" illusion — agent can't accumulate many minor surprises without escalation

---

## PARTIAL (exists but incomplete — what's missing)

### 1. Mode Flapping Detection
**Current state:** Ulysses escalates on 2 surprises; bead closes gate user until confirmation. **Missing:** Explicit detection of oscillatory patterns (e.g., "hypothesis 3 on same bead", "claimed 5 times on same bead"). 

**Gap:** No counter-based block preventing repeated claim-hypothesize-surprise cycles on the same bead within a session. Could benefit from:
- Max hypothesis count per bead before declaring insufficient_information
- Oscillation detection hook that triggers after N cycles of claim→surprise→reflect on same bead

### 2. Explicit Cooldown/Backoff for Retry Budgets
**Current state:** Circuit breaker uses cooldown; Theseus uses B counter for 2-fail reset. **Missing:** Exponential backoff for retried operations. Currently:
- First retry: immediate
- Second failure: hard reset
- No intermediate "wait 10s before retry" phase

**Gap:** Could reduce thrashing if LangSmith/supabase are flaky by adding graduated backoff before circuit opens.

### 3. Cross-Session State Coupling Detection
**Current state:** Each protocol session is isolated (workspace scoping, protocol_sessions table). **Missing:** Detection of "agent applies same fix to multiple beads in same session" → suggests hypothesis was stale or bead scope was wrong.

**Gap:** No hook analyzing closed bead history within a session to flag patterns like "Closed 3 beads in a row with same fix".

### 4. Automatic Oscillation Dampening
**Current state:** Surprise counter increments; reflects resets it. **Missing:** Hysteresis or deadband that prevents immediate re-planning after a reflect.
- Current: REFLECT → S=0 → immediate PLAN allowed
- Missing: "Wait 30s" or "Require reading 2 files before next PLAN"

**Gap:** Could prevent tight loops where agent reflects, plans identically, and surprises again.

---

## ABSENT (not found anywhere)

### 1. Confirmation Spiral Detection
No mechanism detects when an agent asks the user the same clarifying question 3+ times in one session. Would need:
- Track user_prompt_submit events with hash of question
- Block identical questions after 2 asks
- Currently missing: no question deduplication

### 2. Tool Thrashing Detection
No counter for "ran the same tool with the same arguments N times in sequence without different result". Example:
- Bash: `bash scripts/test.sh` (FAIL) → `bash scripts/test.sh` (FAIL) → `bash scripts/test.sh` (FAIL) ❌ should escalate

**Current surrogate:** Test failures count as surprises, but only after crossing threshold. No explicit detection of repeated identical commands.

### 3. Manifest Memory Errors
No detector for "agent claims fact contradicted by visible state". Example:
- "I changed handler.ts to return X" but Read shows it still returns Y
- Would need: Track all agent claims in assertions and compare to file state on next Read
- Currently missing: No assertion tracking system

### 4. Resource Exhaustion Guards
No monitor for token budget, API rate limits, or inference cost runaway. Example:
- 100 LangSmith trace calls in 5 minutes → should circuit
- 10k evaluations overnight without progress → should pause
- Currently missing: No cost/token accounting outside of evaluation gatekeeper

### 5. Live Validation via Claude Agent SDK
Referenced in memory (`tb-99h P3`) but not yet implemented. Would provide:
- Real-time validation of agent outputs against spec
- Behavioral contract checking at inference time (not post-hoc)
- **Status:** Deferred, not in codebase

---

## ARCHITECTURE NOTES (where new components should go)

### 1. New Anti-Instability Layer: Mode Oscillation Detector
**Location:** New file `src/protocol/oscillation-detector.ts`

Should implement:
```typescript
class OscillationDetector {
  private claimHistory: Map<string, { count: number; resetAt: number }>;
  private reflectHistory: Map<string, number>; // timestamp of last reflect
  
  detectBeadCycling(beadId: string, action: 'claim' | 'reflect'): boolean {
    // If same bead claimed 3x within 10 minutes → flag oscillation
    // If reflect called 2x within 5 minutes → flag tight loop
  }
}
```

**Hook location:** `PreToolUse` gate in `.claude/hooks/` — call before allowing next PLAN after REFLECT

### 2. Cross-Bead Pattern Analyzer
**Location:** New file `src/hub/cross-bead-analyzer.ts` (integrates with Hub for multi-bead visibility)

Should implement:
```typescript
class CrossBeadAnalyzer {
  async flagDuplicateFixPatterns(closedBeads: ProtocolSession[]): Promise<string[]> {
    // Compare diffs across closed beads in same session
    // Return list of "likely identical fixes on different beads"
  }
}
```

**Hook location:** `PostToolUse` after `bd close` — emit warning if pattern detected

### 3. Graduated Backoff Registry
**Location:** Extend `src/evaluation/trace-listener.ts` and `src/evaluation/online-monitor.ts`

Currently both use:
```typescript
// Now:
if (this.failureCount >= 5) { circuitOpen }

// Should be:
const backoffMs = [100, 500, 2000, 10000, 60000][this.failureCount];
await sleep(backoffMs); // retry after backoff
if (stillFailing) { circuitOpen }
```

**Integration:** Extract to new `src/resilience/graduated-backoff.ts` class

### 4. Hypothesis Debt Tracker
**Location:** New file `src/protocol/hypothesis-debt.ts`

Should track:
```typescript
interface HypothesisDiversity {
  sessionId: string;
  beadId: string;
  hypothesisChain: string[]; // Full history of hypotheses on this bead
  uniqueCount: number;
  repetitionRatio: number; // 0.8 = 80% of hypotheses are duplicates
}
```

**Hook location:** Bead close hook — flag if repetitionRatio > 0.7

### 5. Question Deduplication in User Prompts
**Location:** Extend `.claude/hooks/user_prompt_submit.sh`

Current: `assumption-tracker.sh` captures assumptions
**Missing:** Hash of question text → block if seen 3+ times in session

```bash
# In user_prompt_submit.sh:
question_hash=$(echo "$prompt" | sha256sum | cut -d' ' -f1)
questions_seen=$(grep -c "$question_hash" .claude/state/questions-asked.log 2>/dev/null || echo 0)
if [[ $questions_seen -ge 3 ]]; then
  echo "BLOCKED: This question has been asked 3 times. Reformulate." >&2
  exit 1
fi
```

---

## Summary: Completeness Assessment

**Strong coverage:**
- ✅ Surprise escalation (Ulysses)
- ✅ Hard reset on repeated failures (Theseus)
- ✅ Multi-gate workflow enforcement (Bead)
- ✅ Circuit breaker with half-open recovery
- ✅ Regression detection via baselines
- ✅ Action masking (tool gating)

**Weak/missing coverage:**
- ⚠️ Cross-session pattern detection (detect agent re-solving same problem)
- ❌ Tool thrashing detection (identical tool calls in sequence)
- ❌ Confirmation spiral detection (repeated user questions)
- ❌ Manifest memory error detection (agent claims vs visible state)
- ❌ Resource exhaustion guards (token/cost budget)

**Architecture quality:**
- State machines are durable (Supabase-backed), not ephemeral
- Hooks enforce gates before action, not after (PreToolUse is primary, PostToolUse writes state)
- Escalation is deterministic and recoverable (S=0→1→2, B=0→1→reset)
- No timeouts or waits (all time-based cooldowns use explicit sentinels + expiry timestamps)
