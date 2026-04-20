# SPEC-RW-002: Adaptive Session Guide with Reasoning Quality Recommendations

**Status:** Draft
**Priority:** P1 — Transforms passive recording into active coaching
**Target:** `thoughtbox-staging`
**Research basis:** "What Makes a Good Reasoning Chain?" (EMNLP 2025), Adaptive Scaffolding (AAAI), MAPE-K autonomic control, Dual Process Theory for LLMs, Confidence Calibration (UF 2026)

## Problem

Thoughtbox's `session_analyze` returns structural statistics (linearity score, revision rate, thought density) but no **recommendations**. The `includeGuide` flag on thoughts returns a static usage guide. Neither adapts to the agent's current reasoning state.

Research shows that reasoning quality correlates with structural patterns (type diversity, confidence trajectory, branching at uncertainty). Agents under-utilize Thoughtbox capabilities (branching, knowledge graph, multi-agent attribution) because nothing prompts them to use these capabilities at the right moment.

## Desired Outcome

`session_analyze` returns actionable recommendations based on the current session's reasoning patterns. The thought tool's response includes contextual micro-nudges when patterns suggest the agent would benefit from a different approach.

## Design

### 1. Recommendation engine (new file: `src/sessions/recommendations.ts`)

A pure function that takes `SessionAnalysis` + recent thoughts and returns recommendations:

```typescript
interface SessionRecommendation {
  type: 'branch' | 'consolidate' | 'critique' | 'knowledge' | 'deepen' | 'conclude';
  trigger: string;       // What pattern triggered this recommendation
  suggestion: string;    // Human-readable recommendation
  priority: 'low' | 'medium' | 'high';
}

function generateRecommendations(
  analysis: SessionAnalysis,
  recentThoughts: ThoughtData[],  // last 10 thoughts
  knowledgeStats?: { entityCount: number; recentEntityCreations: number }
): SessionRecommendation[];
```

### 2. Recommendation heuristics

Based on reasoning quality research:

| Pattern detected | Recommendation | Priority |
|-----------------|----------------|----------|
| 30+ thoughts, 0 branches | "Consider branching to explore alternative approaches" | medium |
| Confidence declining for 5+ consecutive thoughts | "Confidence is declining — consider a belief_snapshot to consolidate understanding, or branch to try a different approach" | high |
| All thoughts are type `reasoning` (no type diversity after 20 thoughts) | "Consider a decision_frame to evaluate options, or a belief_snapshot to capture your current understanding" | medium |
| 0 knowledge entities created after 50+ thoughts | "Consider creating knowledge entities for key concepts — they persist across sessions" | low |
| 3+ assumption_updates with status `refuted` in last 10 thoughts | "Multiple assumptions refuted — consider a fundamental reframe" | high |
| Thought content similarity > 0.7 across 3+ consecutive thoughts (simple word overlap) | "Reasoning may be circular — consider branching or querying the knowledge graph for new connections" | high |
| Session has branches but no merge thoughts | "Open branches detected — consider merging insights from parallel explorations" | medium |
| 100+ thoughts with no extractLearnings | "Long session — consider extracting learnings to preserve key insights" | low |

### 3. Integration with `session_analyze`

Extend `SessionAnalysis` in `src/persistence/types.ts`:

```typescript
interface SessionAnalysis {
  // ... existing fields ...
  recommendations?: SessionRecommendation[];
}
```

In `src/sessions/handlers.ts`, after computing metrics, call `generateRecommendations()` and attach to the analysis result.

### 4. Micro-nudges in thought responses

In `src/thought-handler.ts`, after processing a thought, optionally include a brief nudge in the response:

```typescript
interface ThoughtResponse {
  // ... existing fields ...
  nudge?: string;  // One-line contextual suggestion
}
```

Nudges are generated from the same recommendation engine but limited to the **single highest-priority** recommendation. They appear only when priority is `high`. This avoids noise while surfacing critical pattern breaks.

Example nudge: `"Confidence declining — consider a belief_snapshot to reground."`

### 5. Similarity detection (lightweight)

For the circular reasoning heuristic, use simple word-overlap Jaccard similarity between consecutive thought texts. No embeddings needed:

```typescript
function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}
```

This is cheap (no external calls), deterministic, and sufficient for detecting repetitive reasoning.

## Files to modify

| File | Change |
|------|--------|
| `src/sessions/recommendations.ts` | New file — recommendation engine |
| `src/persistence/types.ts` | Add `recommendations` to `SessionAnalysis`, add `SessionRecommendation` type |
| `src/sessions/handlers.ts` | Call recommendation engine in `analyzeSession`, attach to result |
| `src/thought-handler.ts` | Add optional `nudge` to thought response, compute after each thought |
| `src/thought/tool.ts` | Include `nudge` in tool response schema |

## Acceptance criteria

- [ ] `session_analyze` returns `recommendations` array with typed, prioritized suggestions
- [ ] Recommendations fire correctly for each heuristic (tested with synthetic sessions)
- [ ] Thought responses include `nudge` only when a high-priority recommendation exists
- [ ] Recommendation engine is a pure function (testable without MCP)
- [ ] No performance impact on thought recording (recommendations computed lazily)

## Non-goals

- ML-based recommendation (pure heuristics for now)
- User-configurable thresholds (hardcoded, tunable later)
- Recommendations that block or alter the agent's reasoning (advisory only)
