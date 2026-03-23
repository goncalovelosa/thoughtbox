Perfect. I now have enough information. Let me compile the comprehensive audit report.

## TELEMETRY & OBSERVABILITY AUDIT REPORT

Based on systematic search of src/, .specs/, .claude/, and docs/, here is the detailed audit against the control-theoretic observability ideal:

---

## EXISTS (with file paths and what it does)

### Event Emission & Fire-and-Forget Architecture

**src/observatory/emitter.ts:1-446**
- `ThoughtEmitter` singleton — core event bus for observations without intrusion
- Fire-and-forget pattern: all emit calls synchronous, errors isolated via `safeEmit()` (line 421-434)
- Event types: `thought:added`, `thought:revised`, `thought:branched`, `session:started`, `session:ended`, `agent:spawned/active/idle/completed`, `task:created/updated/completed`, `improvement:event`, `hub:event`, `monitoring:alert` (lines 100-215)
- Listener safety: `hasListeners()` check (line 258-260) avoids emission work when no observers connected
- Integrates agentId + agentRole for multi-agent attribution (lines 101-107, 138-157)

**src/events/event-emitter.ts:1-203**
- `ThoughtboxEventEmitter` — JSONL event stream emission
- Destinations: stdout, stderr, file paths (lines 166-185)
- Configurable via env: `THOUGHTBOX_EVENTS_ENABLED`, `THOUGHTBOX_EVENTS_DEST` (line 196-200)
- Event types: `session_created`, `thought_added`, `branch_created`, `session_completed`, `export_requested` (lines 79-131)
- Used by SPEC-SIL-104 event stream

### Session State Snapshots & Thought Linking

**src/persistence/types.ts:40-210**
- `Session` metadata: id, title, tags, thoughtCount, branchCount, status, partitionPath, timestamps (lines 46-63)
- `ThoughtData` — full thought snapshot with structured `thoughtType` (lines 99-159):
  - `decision_frame` with confidence levels (lines 115-118)
  - `action_report` with success/reversibility/tool/target metadata (lines 120)
  - `belief_snapshot` with entity state and constraints (lines 122)
  - `assumption_update` with trigger/downstream tracking (lines 124)
  - `context_snapshot` with tools/model/constraints available (lines 126)
  - `progress` with status tracking (lines 128-132)
- `ThoughtNode` — doubly-linked list with tree structure for branches (lines 187-210)
- `RevisionMetadata` — revision chain tracking with depth/chainId for semantic versioning (lines 216-233)
- Merkle chain support: `contentHash`, `parentHash` (lines 145-146)
- Multi-agent attribution: agentId, agentName (lines 138-139)

### Audit Manifests & Gap Detection

**src/audit/manifest-generator.ts:1-286**
- `AuditData` type with comprehensive metrics (lines 13-59):
  - Thought counts by type (reasoning, decision_frame, action_report, belief_snapshot, assumption_update, context_snapshot, progress)
  - Decision analytics: total count, confidence distribution (lines 28-35)
  - Action analytics: success/fail, reversibility tracking (lines 37-44)
  - Assumption tracking: flips, currently-refuted count (lines 46-50)
  - **Gap detection**: `decision_without_action` (line 185), `critique_override` (line 217-241)
  - Critique addressing: generated vs addressed vs overridden (lines 54-58)
- `generateAuditData()` implementation (lines 250-266)
- `toAuditManifest()` transformation (lines 272-285) for session export

**src/persistence/types.ts:333-349** (AuditManifest)
- Auto-generated at session close (AUDIT-003 spec reference, line 275)
- Stored in `SessionExport.auditManifest` (line 276)

### Branch Diff & Multi-Agent Replay

**src/multi-agent/thought-diff.ts:1-168**
- `BranchDiff` structure: forkPoint, sharedThoughts, branchA/B, detected conflicts (lines 17-28)
- `computeBranchDiff()` — structural diff with conflict detection (lines 38-62)
- `renderTimeline()` — chronological multi-agent timeline with agent attribution (lines 80-110)
- `renderSplitDiff()` — side-by-side branch diff with fork point, shared context, agent labeling (lines 118-167)

### Session Export Format

**src/persistence/types.ts:260-280**
- `SessionExport` v1.0 schema with full node structure for replay
- Includes `auditManifest` for observability (line 276)
- Supports `revisionAnalysis` for semantic versioning (line 273)

### Real-Time Observatory UI & WebSocket

**src/observatory/server.ts:1-100+**
- `ObservatoryServer` — HTTP + WebSocket server
- REST endpoints: `/api/health`, `/api/sessions`, `/api/improvements`, `/api/scorecard` (lines 82-96)
- Hub REST API bridge: `/api/hub/workspaces/*` (lines 82-96)
- Integrates `ImprovementEventStore` (JSONL-based) (line 20)
- Integrates `ScorecardAggregator` for metrics computation (line 21)

**src/observatory/ws-server.ts** (inferred from config)
- WebSocket server for real-time event streaming
- Channel-based subscription pattern (reasoning, observatory, workspace channels)

**docs/docs-for-humans/observability.md:1-611**
- Complete user guide for Observatory UI (port 1729)
- WebSocket event structure documented (lines 42-94)
- Event types: `thought_added`, `thought_updated`, `branch_created`, `session_loaded`
- REST endpoints fully documented (lines 207-297)

**docs/observatory-architecture.md:1-200+**
- Architecture diagrams showing event push path (Diagrams 1-3)
- ThoughtEmitter → Channel routing → WebSocketServer → Browser flow
- Fire-and-forget design verified in "Critical Invariant" section (line 77-79)
- Session lifecycle sequence diagrams (lines 111-135)
- Hub event bridge flow (lines 138-154)
- REST pull path diagram (lines 158-199)

### Prometheus Integration & Metrics Exposition

**src/observability/prometheus-client.ts:1-141**
- `PrometheusClient` with instant & range query support (lines 70-96)
- Alerts fetching (line 101-103)
- Health check (line 115-124)
- Timeout handling (configurable, default 10s)

**src/observability/gateway-handler.ts:1-215**
- `ObservabilityGatewayHandler` — routes operations: health, metrics, metrics_range, sessions, session_info, alerts, dashboard_url
- Schema validation with Zod (lines 20-86)
- Operates without session initialization (line 3 comment)
- Fire-and-forget pattern for LangSmith integration (docs reference)

**docs/docs-for-humans/observability.md:110-463**
- Prometheus metrics documented: thoughtbox_thoughts_total, sessions_total, branches_total, revisions_total, critiques_total, session_duration_seconds, thoughts_per_session (lines 114-125)
- Alert rules provided (lines 429-463): HighThoughtRate, LongSession, HighBranchRate
- Full Docker Compose setup with Prometheus, Grafana, OTEL (lines 316-382)

### Hook Error Logging & Observability

**.claude/state/hook-errors.jsonl**
- JSONL event stream capturing hook failures
- Fields: ts (ISO 8601), hook (name), exit_code
- 382 entries from 2026-03-21 through 2026-03-22
- Tracks: track_file_access.sh (multiple exit codes: 127, 1, 5), post_tool_use.sh (exit code 5), assumption-tracker.sh, specsuite_post_tool_use.sh

### Self-Improvement Loop Event Tracking

**src/observatory/improvement-tracker.ts:1-100+**
- `ImprovementTracker` singleton for SIL observability
- Tracks lifecycle: startIteration → trackDiscovery/Filter/Experiment/Evaluation/Integration → endIteration
- Cost accumulation by phase (discovery, filter, experiment, evaluate, integrate)
- Emits via ThoughtEmitter as `improvement:event` (line 325-327 in emitter.ts)

**src/observatory/improvement-store.ts** (referenced, JSONL-based)
- Persistence for SIL events

### Evaluation & LangSmith Trace Integration

**src/evaluation/trace-listener.ts:1-100+**
- `LangSmithTraceListener` subscribes to ThoughtEmitter events
- Creates LangSmith runs with run hierarchy: Session → Thoughts
- Fire-and-forget with circuit breaker (5 failures → 60s cooldown, lines 43-47)
- Content redaction support (line 41)
- SPEC-EVAL-001 Layer 1 implementation

**.specs/SPEC-EVAL-001-unified-evaluation-system.md**
- 5-layer evaluation architecture
- Layer 1: Trace Everything (LangSmith)
- Layer 2: Evaluation Datasets (ALMA-style)
- Layer 3: Custom Evaluators (session quality, memory quality, DGM fitness)
- Layer 4: Experiment Runner
- Layer 5: Online Monitoring
- Specification verified through file existence

---

## PARTIAL (exists but incomplete — what's missing)

### 1. Prompt Versioning & Config Lineage
- **Status**: Not found in src/
- **Gap**: No versioned artifact store for prompts or config changes with contracts
- **Design needed**: Schema versioning for tool definitions, system prompts, evaluation criteria
- **Where to go**: `.specs/` or new `src/versioning/` module

### 2. Counterfactual Replay Capability
- **Status**: Branch diff + session export structure exists, but no replay/rewind engine
- **Found**: 
  - `SessionExport` format complete (src/persistence/types.ts)
  - `BranchDiff` for structural comparison (src/multi-agent/thought-diff.ts)
  - ThoughtNode doubly-linked list (src/persistence/types.ts)
- **Gap**: No mechanism to:
  - Load a prior state snapshot and replay from a decision point
  - Swap controllers/costs and re-simulate decisions
  - Compare expected vs realized transitions
- **Where to go**: New `src/replay/` module with StateReplay engine

### 3. Model Residual & Prediction Error Tracking
- **Status**: Not found
- **Gap**: No fields in ThoughtData for:
  - expectedValue vs actualValue (for decision frames)
  - model residuals (predicted vs realized outcomes)
  - surprise register (deviation from belief)
- **Where to go**: Extend ThoughtData with optional `prediction` field and scoring system

### 4. Cost & Budget Tracking (Beyond SIL)
- **Status**: Partial in ImprovementTracker (SIL phases only)
- **Gap**: No system-wide cost tracking for:
  - Token budgets across sessions
  - API call costs (LangSmith, Prometheus)
  - Compute resource usage
- **Where to go**: New `src/observability/cost-tracker.ts` with multi-dimension budget tracking

### 5. Regression Test Suite & Automated Baselines
- **Status**: Test structure exists (.eval/, benchmarks/), but no linked observability
- **Gap**: 
  - No automated baseline capture from Observatory
  - No regression detection pipeline comparing current vs historical metrics
  - No A/B test framework for controller changes
- **Where to go**: Integrate with LangSmith Datasets + Evaluators (SPEC-EVAL-001 Layer 3)

### 6. Real-Time Visualization Completeness
- **Status**: ObservatoryUI/HTML exists, but limited rendering
- **Found**: src/observatory/ui/observatory.html (basic UI)
- **Gap**: 
  - No belief state visualization
  - No assumption change timeline
  - No confidence score heatmaps
  - No decision/action outcome tracking UI
- **Where to go**: Extend observatory.html with D3/SVG rendering for belief evolution

### 7. Automated Guardrails & Safety Filter Visibility
- **Status**: EvaluationGatekeeper exists (stub), but no decision tracing
- **Gap**: No observability into:
  - Which safety policies rejected actions
  - Counterfactual analysis (what would have happened if safety was disabled)
  - Safety filter confidence/certainty
- **Where to go**: Instrument EvaluationGatekeeper with decision events

---

## ABSENT (not found anywhere)

### 1. Step-by-Step Replay Debugger
- **Not found**: No tool or UI for:
  - Breakpoints on thought numbers or confidence levels
  - Single-step execution
  - Watch expressions for belief state evolution
  - Conditional breakpoints (e.g., "break if decision_confidence < 0.5")

### 2. Assumption Lineage & Dependency Graphs
- **Not found**: While `assumption_update` type exists in ThoughtData, no graph structure for:
  - "Assumption X was triggered by observation at thought N"
  - "Refuting assumption A invalidates decisions D1, D2, D3"
  - Automatic downstream impact analysis

### 3. Versioned Prompt Registry with Regression Tests
- **Not found**: No artifact store for:
  - System prompt v1.0, v1.1, v2.0 (with contracts)
  - Tool definition versions
  - Auto-generated test cases from previous behavior

### 4. Real-Time Anomaly Detection Pipeline
- **Not found**: While Prometheus alerts exist (HighThoughtRate, LongSession), no:
  - Anomaly scoring (statistical deviation from session type baseline)
  - Automated experiment suggestions ("session is 3x slower than similar ones")
  - Hypothesis generation from deviations

### 5. Cost Attribution & Budget Enforcement
- **Not found**: No system for:
  - Per-tool API cost tracking
  - Token budget allocation by session/agent
  - Automatic throttling or early termination on budget overage

### 6. Distributed Trace Correlation
- **Not found**: While LangSmith integration exists, no:
  - Cross-service trace IDs (e.g., linking Thoughtbox thought to GCP subagent run)
  - OpenTelemetry semantic conventions enforcement
  - Automatic trace correlation by experiment ID

### 7. Blame Attribution & Audit Trails
- **Not found**: No structured audit of:
  - "Decision D at thought T was made by agent A with config C"
  - "Config change C caused regression R (detected by benchmark B)"
  - "Feedback loop F corrected assumption A at thought T"

---

## ARCHITECTURE NOTES (where new components should go)

### Recommended File Structure for Gaps

```
src/
├── observability/
│   ├── emitter.ts                (DONE)
│   ├── replay/
│   │   ├── state-snapshot.ts      (NEW: StateSnapshot schema + capture)
│   │   ├── replay-engine.ts       (NEW: Execute from snapshot with alt controller)
│   │   └── counterfactual.ts      (NEW: Compare branches with what-if)
│   ├── cost-tracker.ts            (NEW: Multi-dimension budget tracking)
│   ├── regression-detector.ts     (NEW: Baseline comparison + alerts)
│   └── ...existing files...
├── audit/
│   ├── manifest-generator.ts      (DONE)
│   ├── assumption-graph.ts        (NEW: Lineage & impact analysis)
│   └── blame-tracker.ts           (NEW: Change attribution)
├── versioning/
│   ├── prompt-registry.ts         (NEW: Versioned prompt store)
│   ├── config-lineage.ts          (NEW: Change history + contracts)
│   └── regression-suite.ts        (NEW: Linked to versioned artifacts)
└── evaluation/
    └── trace-listener.ts          (PARTIAL: LangSmith bridge exists)
```

### Integration Checkpoints

1. **Replay engine** should write snapshots at every thought (unless disabled), allowing recovery to any point
2. **Cost tracker** should integrate with `thoughtEmitter` to tag events with cost metadata
3. **Assumption graph** should materialize from stream of `assumption_update` events
4. **Regression detector** should consume both historical baseline and live metrics from Prometheus
5. **Prompt registry** should be queried by tool-handler, with version logged in every tool call event

### Observability Ideal vs Current State

| Component | Paragon Says | Current State | Gap |
|-----------|--------------|---------------|-----|
| **Belief state snapshots** | Every step inspectable | ThoughtData.beliefs optional | Need mandatory capture + UI |
| **Candidate plans** | Inspect rejected actions | Missing entirely | Add decision_rejected event type |
| **Safety filter decisions** | See why action was blocked | EvaluationGatekeeper is stub | Instrument with tracing |
| **Expected vs realized** | Model residuals visible | Assume/decision frames exist, but no outcome field | Add actionResult.expectedOutcome |
| **Counterfactual replay** | Re-run with different controller/cost | Structure exists, no engine | Build replay module |
| **Prompt contracts** | Versioned with regression tests | Prompts in .claude/skills/, no versioning | Add registry + contracts |
| **Config lineage** | Change traceability | Implicit in git, not in system | Add structured config_change events |
| **Step-by-step debugging** | Breakpoints, single-step | WebSocket UI exists, no debugger | Extend Observatory UI |

---

## SUMMARY

**Strong foundations exist:**
- Fire-and-forget event emission is properly designed (no backpressure, error isolation)
- Session structure supports snapshots + linking (ThoughtNode doubly-linked list, audit manifests)
- Real-time UI + metrics infrastructure (WebSocket, Prometheus, Grafana, LangSmith)
- Multi-agent attribution is wired through thoughtEmitter
- Gap detection in decision/action/critique cycles is implemented

**Critical gaps to close:**
1. Replay/counterfactual engine (structure exists, engine missing)
2. Cost tracking and budget enforcement
3. Assumption dependency graph
4. Prompt versioning + config lineage
5. Model residual / prediction error fields
6. Automated regression detection pipeline
7. Blame attribution audit trail

**Next phase:** Implement replay module, extend evaluation system (SPEC-EVAL-001 Layers 3-5), and add cost attribution to close the observability loop.
