# Spiral Detection

Self-monitor for implementation spirals. When detected, stop iterating and escalate or accept partial completion.

## State Checkpoint First

Before beginning any debugging or investigative task, verify the actual current state.
Previous actions may have silently mutated the system. You may be reasoning about a game board that no longer exists.

```bash
git status && git diff   # what actually changed
pnpm test                # what's actually failing right now
```

Do not skip this. Operating on a contaminated state is the root cause of most spirals — the oscillation is a symptom.

## Anti-Patterns to Watch For

- **Oscillation**: Touching the same 3+ files across consecutive iterations without net progress — you're flip-flopping
- **Scope creep**: Modifying files outside the original task's scope — "while I'm here" is a trap
- **Diminishing returns**: Less than 10% progress in 2 consecutive iterations — you're stuck
- **Thrashing**: Spending more time per iteration while making zero or negative progress

## Response

1. Recognize the pattern (be honest with yourself)
2. Stop iterating immediately
3. Document what you tried and why it didn't work
4. Either accept partial completion or escalate with diagnosis + options

## Commitment Levels

As work progresses and budget/time depletes, constrain your decision space:

| Level | Constraint |
|-------|-----------|
| 0–1 | Full flexibility |
| 2 | Hard budget constraint — no new explorations |
| 3 | Only incomplete work — no new scope |
| 4 | Bug fixes only |
| 5 | Force complete — accept current state and report |

## Escalation Trigger

If you've hit the same failure 3+ times with different approaches: stop and escalate with:
- What the task was
- What you tried (each approach)
- Why each failed
- Your best hypothesis for root cause
- What decision is needed to unblock
