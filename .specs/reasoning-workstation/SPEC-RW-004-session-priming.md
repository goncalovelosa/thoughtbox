# SPEC-RW-004: Session Priming — Warm Starts from Prior Knowledge

**Status:** Draft
**Priority:** P2 — Reduces cold-start cost for multi-session research
**Target:** `thoughtbox-staging`
**Research basis:** Context Window Management (Zylos 2026-03-31), Hot/Warm/Cold Memory Architecture (Arun Baby 2026), Effective Harnesses for Long-Running Agents (Anthropic Engineering), PlugMem (Microsoft Research 2026)

## Problem

When an agent starts a new Thoughtbox session, it starts cold — no awareness of relevant prior sessions, knowledge entities, or extracted learnings. The agent must manually search for context (`session_search`, `knowledge.listEntities`) or rely on the human to provide it.

Research on context management shows that cold starts are "catastrophic for task-oriented agents" (Anthropic). The warm-start pattern — loading compressed state from prior work — dramatically improves both quality and efficiency.

## Desired Outcome

A `session_prime` operation that, given a topic or set of tags, automatically retrieves and summarizes relevant prior context (sessions, knowledge entities, learnings) into a compact briefing that fits in the agent's hot memory.

## Design

### 1. New operation: `session_prime`

Add to session operations in `src/sessions/tool.ts`:

```typescript
session_prime: {
  title: "Prime Session",
  description: "Generate a warm-start briefing by searching prior sessions, knowledge entities, and extracted learnings for context relevant to the current task.",
  inputSchema: {
    query: z.string().describe("Topic or task description to prime for"),
    tags: z.array(z.string()).optional().describe("Tags to filter relevant sessions"),
    max_tokens: z.number().optional().default(2000).describe("Maximum size of the briefing (in approximate tokens)"),
    include: z.object({
      sessions: z.boolean().optional().default(true),
      knowledge: z.boolean().optional().default(true),
      learnings: z.boolean().optional().default(true),
    }).optional()
  }
}
```

### 2. Priming pipeline (new file: `src/sessions/priming.ts`)

```typescript
interface PrimingBriefing {
  summary: string;           // Compact narrative briefing
  relevantSessions: Array<{
    id: string;
    title: string;
    thoughtCount: number;
    topInsight: string;      // Most relevant thought from session
  }>;
  relevantEntities: Array<{
    id: string;
    name: string;
    type: string;
    latestObservation: string;
  }>;
  openQuestions: string[];    // Unresolved items from prior sessions
  contradictions: string[];  // Active CONTRADICTS relations on relevant entities
}

async function primeSession(
  query: string,
  tags: string[] | undefined,
  maxTokens: number,
  include: { sessions: boolean; knowledge: boolean; learnings: boolean },
  sessionHandler: SessionHandler,
  knowledgeStorage: KnowledgeStorage,
): Promise<PrimingBriefing>;
```

### 3. Priming algorithm

**Step 1: Gather candidates**
- Search sessions via `session_search(query)` → top 5 by relevance
- If tags provided, also `session_list({ tags })` → top 5 by recency
- Search knowledge entities via name/label substring match → top 10
- Deduplicate

**Step 2: Extract highlights**
For each relevant session:
- Get the final `belief_snapshot` thought (if any) — this is the session's conclusion
- Get any `decision_frame` thoughts — these are key choices
- Get extracted learnings (if previously computed)

For each relevant entity:
- Get the most recent observation
- Get any CONTRADICTS relations (unresolved tensions)

**Step 3: Compose briefing**
Assemble into a structured briefing, respecting `max_tokens`:
1. One-paragraph summary of what's known about the topic
2. Key sessions (title + top insight, 2-3 sentences each)
3. Key entities (name + latest observation)
4. Open questions (from sessions that ended with low confidence or unresolved branches)
5. Active contradictions (CONTRADICTS relations)

Token budget allocation:
- Summary: 30% of max_tokens
- Sessions: 30%
- Entities: 20%
- Questions + Contradictions: 20%

### 4. Integration with session creation

When creating a new session, optionally auto-prime:

In `src/sessions/handlers.ts`, add an optional `prime` parameter to session creation flow. When the first thought of a session includes `sessionTags`, and those tags match existing sessions, auto-include a priming briefing in the thought response.

This is OPT-IN — the agent or prompt must request priming. It should not happen silently.

### 5. Briefing format

The briefing is returned as structured data AND as a formatted string (for easy inclusion in agent context):

```markdown
## Prior Context Briefing

**Topic:** agentic reasoning

### Known Sessions (3 relevant)
- **"Agentic Reasoning Research for Thoughtbox"** (166 thoughts, Apr 9)
  Key finding: The bottleneck on agent capability is cognitive infrastructure, not model intelligence.
- **"Mythos Preview: Opportunity Spaces"** (59 thoughts, Apr 8)
  Key finding: Security posture analysis for Thoughtbox deployment.

### Key Concepts
- **Library Theorem** (Insight): Indexed external memory has O(log N) retrieval. Exponential advantage compounds.
- **Context Rot** (Insight): Performance degrades at 25-50% of context capacity.

### Open Questions
- Is there an optimal thought type distribution for different task categories?
- Does the compounding value follow a predictable mathematical curve?

### Unresolved Contradictions
- None currently.
```

## Files to modify

| File | Change |
|------|--------|
| `src/sessions/priming.ts` | New file — priming pipeline |
| `src/sessions/tool.ts` | Add `session_prime` operation to catalog |
| `src/sessions/handlers.ts` | Implement `primeSession`, wire to tool handler |
| `src/code-mode/sdk-types.ts` | Add `prime` to `tb.session` interface |

## Acceptance criteria

- [ ] `session_prime` with a query returns a structured briefing with relevant sessions, entities, and open questions
- [ ] Briefing respects `max_tokens` budget (approximate, not exact)
- [ ] Tags-based filtering surfaces tagged sessions
- [ ] Empty knowledge graph returns a minimal briefing ("No prior context found")
- [ ] Briefing includes active CONTRADICTS relations as "unresolved contradictions"
- [ ] Performance acceptable (< 3 seconds for a graph with 1000 entities and 100 sessions)

## Non-goals

- Embedding-based semantic search (keyword/tag matching for now)
- Automatic priming on every session start (opt-in only)
- Priming from external sources (only Thoughtbox-internal knowledge)
