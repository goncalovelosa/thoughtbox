# Specification Suite Summary — Runs UI Gap Analysis

## Origin

The `.interleaved-thinking/final-answer.md` analysis identified a fundamental gap between Thoughtbox Code Mode (programmatic JS queries against sessions) and the web UI (sequential browsing). For a 150-thought session, an agent can answer "what were the decisions?" in one API call; a human must scroll through all 150 thoughts.

## Specs Produced

| Spec | Priority | Features | Status |
|------|----------|----------|--------|
| SPEC-001 | P0 | Thought type filter chips + session summary card | Validated + amended |
| SPEC-002 | P1 | Full-text search with match count + highlighting | Validated + amended (CC-3: search target fix) |
| SPEC-003 | P2 | Phase/chapter navigation + cross-session tag filtering | Validated + amended (B2: orphan headers, I4: phases in decisions view) |
| SPEC-004 | P3 | Decision timeline view + session export | Validated + amended (I3: search highlighting passthrough) |
| SPEC-PIPELINE | -- | Canonical explorer state + filter pipeline + toolbar layout | Created to resolve B1 |

## Validation Results

### Blockers Resolved
- **B1**: `filteredRows` pipeline conflict (3 incompatible rewrites) → resolved by SPEC-PIPELINE canonical definition
- **B2**: Orphan phase headers when type filters hide all thoughts → resolved by hiding empty phases

### High Issues Resolved
- **CC-1**: `ThoughtDisplayType` not exported → prerequisite added to SPEC-PIPELINE
- **CC-2**: `SessionSummaryVM` missing `tags` → SPEC-001 sources from raw session data
- **CC-3**: Search scope regression (rawThought vs searchIndexText) → SPEC-002 amended to use searchIndexText

### Medium Issues Resolved
- **I1**: Toolbar layout → unified in SPEC-PIPELINE
- **I2**: Match count ambiguity → clarified: counts reflect type-filtered set
- **I3**: Search highlighting in decisions view → SPEC-004 amended
- **I4**: Phases button in decisions view → SPEC-003 amended

## Implementation Order

```
Prerequisites: Export ThoughtDisplayType from view-models.ts
       |
       v
   SPEC-002 (search) ──> SPEC-001 (type filters) ──> SPEC-004 (decisions view)
       |                                                      |
       |  (can parallelize with:)                             |
       +── SPEC-003 tag filtering (different page)            |
       +── SPEC-003 phase detection (pure function)           |
       +── SPEC-004 export formatters (pure functions)        |
                                                              v
                                            Integration: phases + export in toolbar
```

## Agent Teams Recommendation

### Implementation Team Structure

**Serial workstream** (shared pipeline, one teammate at a time):
- SPEC-002 → SPEC-001 → SPEC-004 decision view

**Parallel workstream** (independent files, Agent Team with 3 teammates):
- Teammate A: SPEC-003 tag filtering (sessions index page)
- Teammate B: SPEC-004 export formatters + dropdown (pure functions)
- Teammate C: SPEC-003 phase detection algorithm + tests (pure function)

**Integration pass** (after both workstreams merge):
- Phase headers into timeline (depends on pipeline from serial workstream)
- Export button into toolbar (depends on toolbar layout from serial workstream)

### Where Agent Teams > Subagents
- **Implementation**: teammates can discuss shared type shapes and flag conflicts
- **Review**: reviewers can challenge each other's findings on cross-spec interactions
- **Testing**: test writer can coordinate with implementers on fixture data

### Where Subagents > Agent Teams
- **Spec design** (this phase): specs are independent, no inter-agent discussion needed
- **Single-spec implementation**: SPEC-002 alone doesn't benefit from team coordination

## Next Steps

1. Create beads issues for each spec + prerequisite
2. Implement prerequisites (ThoughtDisplayType export)
3. Start serial workstream: SPEC-002 → SPEC-001
4. Launch parallel workstream for pure functions (phase detection, export formatters, tag filtering)
5. Integration pass after both merge
