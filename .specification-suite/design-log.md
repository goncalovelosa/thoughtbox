# Design Log — Runs UI Gap Analysis

## Source Analysis
Input: `.interleaved-thinking/final-answer.md`

The analysis identified a fundamental information-availability gap between Thoughtbox Code Mode (programmatic JS queries against sessions) and the web UI (sequential click-through browsing). For a 150-thought session, an agent can answer "what were the decisions?" in one API call; a human must scroll through all 150 thoughts.

## Spec Decomposition

4 specs designed in parallel via subagents (not Agent Teams — specs are independent, no inter-agent communication needed):

| Spec | Priority | Features | Files Touched |
|------|----------|----------|---------------|
| SPEC-001 | P0 | Type filter chips + Session summary card | toolbar, explorer, page.tsx |
| SPEC-002 | P1 | Full-text search + match highlighting | toolbar, explorer, thought-row, thought-card |
| SPEC-003 | P2 | Phase navigation + cross-session tag filters | timeline, index-controls, table-shell |
| SPEC-004 | P3 | Decision timeline view + session export | explorer, detail-header, new components |

## Agent Teams Analysis

### Where Agent Teams Add Value

**Implementation of SPEC-001** (strongest candidate):
- Teammate A: SummaryCard component + server-side computation
- Teammate B: Filter chips + state integration
- Teammate C: Test coverage
- Rationale: Different files, shared type definitions. Teams can discuss the summary data shape.

**Implementation of SPEC-003**:
- Teammate A: Phase detection + PhaseHeader (detail page)
- Teammate B: Tag filter UI (index page)
- Rationale: Different route groups, zero file overlap.

**Implementation of SPEC-004**:
- Teammate A: DecisionTimelineView
- Teammate B: Export button + formatters
- Rationale: Explicitly independent features.

**Review phase** (ideal for Teams):
- Teammate 1: Spec-vs-codebase validation
- Teammate 2: Cross-spec consistency
- Teammate 3: Implementation feasibility
- Rationale: Reviewers benefit from inter-agent discussion.

### Where Subagents Are Better
- **Spec design** (this phase): independent work, no communication needed
- **SPEC-002 implementation**: sequential data flow through component tree

### Where Neither Helps
- View model type changes: single-file edits to `view-models.ts` should be done in one session to avoid merge conflicts
