# Reasoning Workstation Specification Suite

Specs derived from a 166-thought deep research session on agentic reasoning (session `880b76fa`), covering 30+ paradigms across 8 research categories. These specs implement the highest-impact findings for Thoughtbox as a "reasoning workstation for AI agents."

**Target codebase:** `thoughtbox-staging`

## Specs

| Spec | Priority | Summary | Key research |
|------|----------|---------|--------------|
| [SPEC-RW-001](./SPEC-RW-001-merge-topology.md) | P1 | Merge topology for thought graphs | Fork-Merge Patterns, Graph-of-Thought |
| [SPEC-RW-002](./SPEC-RW-002-adaptive-session-guide.md) | P1 | Adaptive guide with reasoning quality recommendations | EMNLP 2025 reasoning quality, MAPE-K, Dual Process |
| [SPEC-RW-003](./SPEC-RW-003-serendipity-queries.md) | P2 | Bisociative knowledge graph discovery | Koestler bisociation, BISON, UoT |
| [SPEC-RW-004](./SPEC-RW-004-session-priming.md) | P2 | Warm-start briefings from prior knowledge | Context management, PlugMem, Anthropic harnesses |
| [SPEC-RW-005](./SPEC-RW-005-agent-designed-notebooks.md) | P2 | Agent-designed custom notebooks via template composition | ADAS (Hu 2024), Srcbook, cognitive evolution |

## Implementation order

**Phase 1 (P1):** SPEC-RW-001 + SPEC-RW-002 — These enhance the core reasoning loop. Merge completes the graph topology; adaptive guide makes the tool actively helpful. Both are moderate-effort changes to existing code paths.

**Phase 2 (P2):** SPEC-RW-003 + SPEC-RW-004 — These add new capabilities. Serendipity queries differentiate the knowledge graph; session priming reduces cold-start cost. Both are new files with clean interfaces.

**Phase 3 (P2, larger scope):** SPEC-RW-005 — Agent-designed notebooks is the most ambitious spec. Depends on a stable template library and the seed templates being right. Start with the seed templates and the registration flow; the composition engine can be iterated.

## Research corpus

Supporting research papers are crawled to `.research/papers/`:
- `agentic-reasoning-frameworks-survey.md` (240KB)
- `agentic-ai-architectures-taxonomies.md` (93KB)
- `long-chain-of-thought-survey.md` (92KB)
- `metacognition-self-monitoring-adaptive-control.md` (42KB)
- `ralph-wiggum-metacognitive-loop.md` (22KB)
- `ai-agent-reasoning-patterns-2026.md` (21KB)
- `agent-reflection-self-evaluation-patterns.md` (13KB)
- `adas-srcbook-custom-notebooks-research.md` (25KB)

## Theoretical foundations

1. **Library Theorem** (Mainen 2026): Indexed external memory has exponential advantage over sequential
2. **Extended Mind Thesis** (Clark & Chalmers 1998): Cognitive tools are part of the cognitive system
3. **Writing Is Thinking** (Flower & Hayes 1981): Externalizing thought generates understanding
4. **Society of Thought** (Agüera y Arcas 2026): Models spontaneously simulate multi-perspective debate
5. **Adaptive Compute** (Snell et al. ICLR 2025): More thinking helps, but adaptively
