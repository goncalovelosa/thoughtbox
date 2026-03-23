Excellent. Now I have a clear picture. Let me compile my findings into a comprehensive audit report.

## AUDIT REPORT: Human Interaction as Optimal Intervention

Based on systematic search across src/, .claude/skills/, .claude/hooks/, agentic-dev-team/, and supporting documentation, here is the control-theoretic audit:

---

## EXISTS (implemented, with file:line references)

### 1. **Escalation Thresholds (Clearly Defined)**
- **Location**: `agentic-dev-team/agentic-dev-team-spec.md:32-46`
- **What it does**: Defines 8 explicit escalation criteria (scope change, prioritization conflict, external dependency failure, timeline impact, irreversible action, cost exceeding budget, repeated failure >3 attempts, shippability assessment)
- **Mechanism**: Escalation happens ONLY when one of these thresholds is met. Everything below is autonomous.
- **Evidence**: All agents must check against these thresholds before proceeding autonomously

### 2. **Escalation Message Format (Structured)**
- **Location**: `agentic-dev-team/agentic-dev-team-spec.md:367-401`
- **Schema**: `EscalationToChiefAgentic` with required fields:
  - Situation (summary, impact, root cause, what was tried)
  - Options (minimum 2, each with label, description, tradeoff, time, risk)
  - Recommendation (if applicable)
- **What it does**: Frames escalation as a structured *decision request*, not an open question
- **Control property**: User receives options with tradeoffs pre-computed, not raw situation

### 3. **User Approval Gates at Workflow Stages**
- **Stage 1 Ideation**: `.claude/skills/workflow-ideation/SKILL.md:36-65`
  - Asks 4 structured questions (Desired Outcomes, Realistic Outcomes, Alignment, Opportunity Cost)
  - User must approve before proceeding to Stage 2
  - Gate: Answer to 3d is not "confident no"
  
- **Stage 2 HDD Phase 1**: `.claude/skills/hdd/SKILL.md:188-191`
  - Research agent produces hypotheses
  - **Checkpoint**: Present summary + draft hypotheses, wait for approval
  - Gate: At least one SOFT hypothesis with evidence-backed context, user approved
  
- **Stage 2 HDD Phase 2**: `.claude/skills/hdd/SKILL.md:299-303`
  - Staging agent produces spec + ADR
  - **Checkpoint**: Present both docs, wait for approval
  - Gate: Both files exist, all sections complete, user approved
  
- **Stage 3 Planning**: `.claude/skills/workflows-plan/SKILL.md:102-118`
  - Plan is decomposed into tasks
  - **Checkpoint**: Present plan summary with task list, ask user to approve
  - Gate: User approves plan before implementation begins

- **Stage 4 Implementation (Tournament)**: `.claude/skills/hdd/SKILL.md:373-375`
  - Multiple agents produce competing implementations
  - **Checkpoint**: Present elegance comparison, recommendation
  - **Gate**: "You MUST WAIT FOR USER APPROVAL before selecting a winner and merging"

- **Stage 6 Revision (Escalation)**: `.claude/skills/workflow-revision/SKILL.md:87-111`
  - After 3 failed iterations, escalate with options
  - **Checkpoint**: Present unresolved findings + 4 options (A-D)
  - Gate: User approves decision on how to proceed

### 4. **Sampling/Elicitation (MCP Primitive for Autonomous Critique)**
- **Location**: `src/sampling/handler.ts:1-151`
- **What it does**: Implements MCP `sampling/createMessage` to request external LLM critique WITHOUT user intervention
- **Mechanism**: Can check client capabilities first (line 149: "Capability detection happens automatically during MCP initialization handshake")
- **Use case**: Autonomous thought critique loop for reasoning quality improvement
- **Control property**: Only triggered when capability is available; graceful fallback if unsupported (line 104-106)

### 5. **Explanation Generation from State**
- **Location**: `.claude/skills/workflow-ideation/SKILL.md:36-111` (context gathering before asking)
- **What it does**: Before asking user questions, agent:
  - Reads accepted ADRs to build domain context
  - Searches compound learnings for prior experience
  - Checks open issues for related work
  - THEN presents analysis before each question
- **Control property**: User gets context-informed explanation, not blank question. Agent shows its reasoning first.

### 6. **Diff/Consequences/Rollback in Revision**
- **Location**: `.claude/skills/workflow-revision/SKILL.md:23-34`
- **What it does**: When review finds issues:
  - Classifies findings by type (claim failure, test gap, spec divergence, ADR conflict, style)
  - Each finding category gets specific remediation approach
  - If ADR conflict: presents 4 reconciliation dispositions with explanations (STILL VALID, NEEDS AMENDMENT, SUPERSEDED, INVALIDATED)
- **Partial**: Reports *types* of findings but does NOT explicitly generate code diffs before asking user to approve fixes

### 7. **User Model (Implicit, Not Tracked)**
- **Location**: `src/hub/hub-types.ts:1-276`
- **What it tracks**: AgentIdentity (name, role, profile), WorkspaceAgent (status, lastSeenAt, currentWork)
- **What it does NOT track**: User preferences, risk tolerance, urgency signals, decision pattern history
- **Limitation**: No persistent user model for decision history or preference learning

### 8. **Beads Workflow Pause Gate (Step 7)**
- **Location**: `.claude/skills/bead-workflow/SKILL.md` (referenced in AGENTS.md)
- **What it does**: Step 7 of bead lifecycle is "user validation" before closing
- **Gate requirement**: "If you can't explain what the test proved, you haven't validated" — bead cannot close without evidence

### 9. **Approval Checkpoint Formatting**
- **Stage 3 Plan approval**: `.claude/skills/workflows-plan/SKILL.md:102-116`
  ```
  PLAN READY FOR REVIEW
  ======================
  
  <title>
  Tasks: N | Files: N | Risks: N flagged
  
  [task list with 1-line summaries]
  
  Approve this plan? (The conductor will dispatch /workflows-work to execute it)
  ```
- **Property**: Summarizes impact in headline metrics (task count, file count, risk count), lists specific work units
- **Does NOT include**: Predicted consequences, rollback story, before/after diffs

### 10. **AskUserQuestion MCP Primitive (Not Used in Codebase)**
- **Grep result**: Only 3 file matches for `AskUserQuestion` / `elicit`
- **Location**: `src/hub/hub-types.ts:263` (elicitation capability detection)
- **Status**: Capability is *detected* but never *invoked* in application code
- **Meaning**: System can ask user questions via MCP protocol but chooses not to in implementation

---

## PARTIAL (exists but incomplete — what's missing)

### 1. **Value of Information Computation (NOT IMPLEMENTED)**
- **What's missing**: There is NO code that computes whether asking the user is cheaper than trying another sensor/tool
- **Pattern observed**: Gate enforcement is *threshold-based* (is this an escalation criterion?), not *information-value-based* (is user input the only reliable sensor?)
- **Example gap**: When a spec assumption fails, agent escalates immediately. No code checks "could we test this ourselves more cheaply?"
- **Where it should be**: Before any escalation, before any checkpoint, before any approval request

### 2. **Diff/Consequences/Rollback Story in Approvals (Partial)**
- **What exists**: 
  - Revision findings are classified (claim failure vs. test gap vs. spec divergence)
  - ADR reconciliation dispositions are documented with explanations
- **What's missing**:
  - No structured generation of "before/after code diff" before asking approval
  - No "predicted consequences" section (what breaks if we accept this? what changes in dependent systems?)
  - No explicit "rollback story" (how do we undo if this decision is wrong?)
- **Impact**: User makes approval decisions without seeing concrete impact in code terms
- **Example**: Stage 6 escalation (workflow-revision/SKILL.md:91-109) presents 4 options (A-D) but none of them say "choosing B means files X,Y,Z change like [diff], which affects downstream systems in [ways], rollback involves [steps]"

### 3. **Continuous User Model Tracking (NOT IMPLEMENTED)**
- **What exists**: 
  - Agent profiles (MANAGER, ARCHITECT, DEBUGGER, SECURITY, RESEARCHER, REVIEWER) in `.claude/skills/`
  - Static role assignment at startup
- **What's missing**:
  - NO tracking of which decisions the user makes
  - NO learning from user decision patterns
  - NO representation of user risk tolerance, urgency, or preferences over time
  - NO "this user chose option B last time in similar situation" heuristic
- **Where it should live**: `.claude/state/user-model.json` or Supabase `user_preferences` table (not currently implemented)

### 4. **Explanation Generated from Controller State (Partial)**
- **What exists**:
  - Workflow state file (`.workflow/state.json`) tracks stage, completion time, artifacts
  - ADR reconciliation flags are recommended dispositions
  - HDD state (`.hdd/state.json`) tracks hypotheses and reconciliation flags
- **What's missing**:
  - No code that reads controller state and generates explanations *before presenting to user*
  - No "here's why we're asking now" section derived from why the threshold was crossed
  - Example: If escalating due to "repeated failure >3", system should say "Attempted [approach 1], failed because [reason]. Attempted [approach 2], failed because [reason]. Attempted [approach 3], failed because [reason]. Here's why a 4th attempt likely won't work..."
- **Current pattern**: Escalation says "what was tried" but not the *analytical reasoning* for why more tries won't help

### 5. **Bead Workflow Pause Gate (Exists but Not Enforced)**
- **Location**: `.claude/skills/bead-workflow/SKILL.md` (skill documentation, not hooked)
- **What's missing**: 
  - No code in `.claude/hooks/` that prevents bead closure without evidence
  - The rule is documented in the skill, but there's no `pre_tool_use.sh` check that blocks `bd close` without validation
  - Gate exists as prose, not as automated enforcement
- **Current state**: Manual discipline required; agent can close bead without evidence

---

## ABSENT (not found anywhere)

### 1. **Pre-Approval Risk Analysis**
- NO code that:
  - Lists what could go wrong if we approve this decision
  - Quantifies likelihood/severity of each risk
  - Proposes mitigations
- **Current approach**: Present options, ask user to decide. Don't pre-analyze risks.

### 2. **Approval Request with Exact Code Diff**
- NO code that:
  - Generates `git diff` of proposed changes
  - Shows line-by-line impact
  - Highlights semantic changes vs. formatting
- **Current approach**: Approval is for plan/spec/ADR level. Code-level diffs only after review phase.

### 3. **Predicted Consequences Section in Escalations**
- NO code that:
  - Specifies which other systems/features would be affected
  - Lists files that would need to change downstream
  - Estimates rework burden in dependent areas
- **Example**: Scope change escalation should say "if we add feature X, these N other components need updates: [list with impact estimates]"

### 4. **Belief State Representation**
- NO data structure that tracks:
  - System's uncertainty about what the user wants
  - Confidence levels in assumptions
  - Open questions that need user input vs. those that can be resolved by probing
- **Would live in**: `.claude/state/belief-state.json` (doesn't exist)

### 5. **Cost/Benefit Analysis Before Asking**
- NO code that:
  - Estimates cost of asking user (context switch, decision latency)
  - Estimates cost of autonomous action (risk of wrong choice)
  - Computes which is cheaper
  - Only escalates if asking is justified
- **Current approach**: Hard thresholds (escalate if scope change), not information-theoretic (should I ask?)

### 6. **User Decision Audit Log**
- NO persistent record of:
  - Which decisions the user made at each escalation
  - What the system recommended vs. what user chose
  - How often user overrides agent recommendation
  - Patterns in override decisions
- **Would live in**: `.claude/state/decision-log.jsonl` (doesn't exist)

### 7. **Automatic Explanation Grounding in Observation**
- NO code that:
  - Grounds explanations in actual measurement/observation ("we ran the test 3 times, here are the results")
  - Distinguishes between "we assume" vs. "we measured"
  - Cites evidence for every claim in escalation
- **Current approach**: Escalation includes "what_has_been_tried" but not "here's the evidence that trying again won't help"

### 8. **Graceful Degradation When Approval is Slow**
- NO code that:
  - Continues autonomous work on unblocked tasks while waiting for user approval
  - Times out escalation if user doesn't respond in N hours
  - Provides alternative path if approval is indefinitely delayed
- **Current assumption**: User approval comes promptly. No timeout handling.

---

## ARCHITECTURE NOTES (where new components should go)

### 1. **Information Value Computation Layer**
**Location**: Create `src/control-theoretic/information-value.ts`

**Responsibility**: Before escalating or requesting approval, compute:
- Cost of user input (latency, context switch cost)
- Cost of autonomous action (risk × impact of wrong choice)
- Availability of alternative sensors (can we test this ourselves?)

**Interface**:
```typescript
interface InformationValueDecision {
  shouldAskUser: boolean;
  reasoning: string; // explain why asking is/isn't justified
  alternatives?: string[]; // what we tried instead
  timeout?: number; // how long to wait before autonomous fallback
}

async function computeValueOfInformation(
  situation: EscalationSituation,
  userModel?: UserPreferences
): Promise<InformationValueDecision>
```

### 2. **Code Diff Generator for Approvals**
**Location**: Create `src/control-theoretic/approval-formatter.ts`

**Responsibility**: When presenting an approval request, include:
- Exact git diff of proposed changes (or link to pre-computed diff)
- Consequences table (what breaks, what needs rework, effort estimate)
- Rollback story (how to undo if needed)

**Interface**:
```typescript
interface ApprovalRequest {
  decision: string;
  options: Array<{
    label: string;
    diff: string; // git diff format
    consequences: Consequence[];
    rollbackSteps: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }>;
  recommendation?: string;
  deadline?: ISO8601;
}
```

### 3. **Belief State Tracking**
**Location**: Create `src/control-theoretic/belief-state.ts`

**Responsibility**: Track what the system is uncertain about:
- User preferences (what do they care about?)
- Assumption confidence (how sure are we this external API actually works?)
- Open questions (what do we need to know before proceeding?)

**Persistence**: `.claude/state/belief-state.json` or Supabase table

**Interface**:
```typescript
interface BeliefState {
  userPreferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    decisionStyle: 'fast' | 'deliberate';
    escalationThreshold: 'early' | 'late';
  };
  assumptions: Array<{
    claim: string;
    confidence: 0-1;
    testable: boolean;
    verifiedAt?: ISO8601;
  }>;
  openQuestions: string[];
  decidedAt: ISO8601[];
}
```

### 4. **Pre-Approval Evidence Synthesizer**
**Location**: Create `src/control-theoretic/evidence-synthesizer.ts`

**Responsibility**: Before asking user to approve anything, ground the request in evidence:
- "We tested hypothesis H1. Results: [data]"
- "We measured cost: [number] tokens"
- "We tried approach A, B, C. A failed because [reason], B failed because [reason], C succeeded because [reason]"

### 5. **Bead Workflow Enforcement Hook**
**Location**: `.claude/hooks/bead-close-validation.sh` (enhance existing)

**Responsibility**: Pre-bead-close check that prevents closure without validation evidence

**Rule**: `bd close` fails if:
- No tests written for the work
- No test output/evidence in comment
- No hypothesis validation (if this was ADR work)

**Exit code**: 2 (blocks operation)

### 6. **Escalation Message Validator**
**Location**: `.claude/hooks/escalation-validator.sh`

**Responsibility**: Before presenting escalation to user, validate it conforms to spec:
- Escalation type is in enum
- Situation has summary + impact + root_cause + what_was_tried
- Options array has minimum 2 entries
- Each option has label, description, tradeoff, time, risk
- Recommendation is present (if applicable)

**Exit code**: 0 (OK) or 2 (blocks if malformed)

### 7. **User Decision Audit Log (Persistent)**
**Location**: Create `.claude/state/decision-log.jsonl`

**Schema**:
```json
{
  "timestamp": "ISO8601",
  "escalationId": "UUID",
  "escalationType": "scope_change|...",
  "systemRecommendation": "option A",
  "userDecision": "option B",
  "rationale": "user's explanation",
  "outcome": "pending|success|failure|rollback",
  "outcomeSummary": "what actually happened"
}
```

**Maintenance**: Read this log before asking user similar decision again; offer pattern recognition ("last time you chose B in a similar situation")

---

## SUMMARY TABLE

| Control-Theoretic Component | Status | Evidence | Gap |
|---|---|---|---|
| **Escalation Thresholds** | EXISTS | agentic-dev-team-spec.md:32-46 | Threshold-based, not information-value-based |
| **Escalation Format** | EXISTS | agentic-dev-team-spec.md:367-401 | No pre-computed consequences |
| **Approval Gates** | EXISTS | Multiple skills (ideation, hdd, workflow-*) | No code diffs before approval |
| **User Checkpoints** | EXISTS | Across all workflow stages | Timing not optimized by information value |
| **Elicitation Primitive** | EXISTS (detected) | src/hub/hub-types.ts:263 | Never invoked in app code |
| **Explanation from State** | PARTIAL | workflow-ideation gathers context first | No analytical reasoning synthesis |
| **User Model** | ABSENT | hub-types tracks agent state, not user | No tracking of preferences/patterns |
| **Belief State** | ABSENT | --- | No representation of uncertainty |
| **Risk Analysis** | ABSENT | --- | No pre-approval risk breakdown |
| **Code Diffs** | ABSENT | --- | No git diffs in approval requests |
| **Consequences** | PARTIAL | Reconciliation dispositions documented | Not quantified, not in code terms |
| **Rollback Story** | ABSENT | --- | No rollback steps in approval format |
| **Value of Information** | ABSENT | --- | No computation before asking |
| **Decision Audit** | ABSENT | --- | No log of user choices & outcomes |
| **Bead Gate Enforcement** | ABSENT (as code) | Documented in skill prose | No pre-close hook |

---

## PARAGON ASSESSMENT

The codebase implements **structured escalation** (thresholds, format, stage gates) but does NOT implement **control-theoretic optimal intervention**. The system asks the user too often at defined thresholds, not when user input is the most valuable sensor. It presents decisions without consequences, diffs, or rollback paths. It does not learn from user decisions or track belief state. Explanations are not grounded in evidence; they are rationales reconstructed after the fact.

**The human interaction is rule-governed (escalate at N thresholds), not optimal (escalate when value of information exceeds cost).**
