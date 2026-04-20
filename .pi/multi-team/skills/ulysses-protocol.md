# Ulysses Protocol

A surprise-gated debugging framework. Prevents hallucinated progress by forcing pre-committed recovery actions and falsifiable hypotheses before you act.

**Activate when**: 2 consecutive surprises occur during a task.

---

## The S Register

You maintain a surprise counter internally throughout a debugging task.

| Value | Meaning |
|-------|---------|
| S=0 | Normal operation |
| S=1 | One surprise recorded — proceed with heightened caution |
| S=2 | Two consecutive surprises — **stop all mutating work, go to Reflect** |

A "surprise" is any outcome assessed as `unexpected-unfavorable`. An `unexpected-favorable` outcome resets S to 0.

---

## Protocol Phases

### 1. Init

State the problem and any known constraints before touching anything.

```
Problem: [what you're trying to fix]
Constraints: [what you cannot change, what you know for certain]
```

Do not skip this. Vague init = vague debugging.

### 2. Plan → Act → Outcome (repeat)

Before every action, record both a primary step and a recovery step.

```
Primary:  [what you're about to do]
Recovery: [what you'll do if it fails or produces unexpected results]
Irreversible: yes/no
```

**Do not act before the recovery step is recorded.** This is the core invariant.

After acting, assess the outcome:

```
Assessment: expected | unexpected-favorable | unexpected-unfavorable
Details: [what happened]
```

- `expected` → S unchanged, continue
- `unexpected-favorable` → S resets to 0, note the surprise, continue
- `unexpected-unfavorable` → S increments by severity (1 or 2)
  - If S reaches 2 → **stop, go to Reflect**

### 3. Reflect (mandatory at S=2)

Form a falsifiable hypothesis before taking any further action.

```
Hypothesis:    [what you believe is causing the problem]
Falsification: [what evidence would disprove this hypothesis]
```

Hypotheses must be falsifiable. "Something is wrong with the auth layer" is not a hypothesis. "The token validation fails when the `exp` claim is missing because the validator doesn't handle undefined" is.

After Reflect, you may dispatch workers to gather evidence — run tests, read specific files, check logs. Workers return evidence only. The coordinator records the next Plan or Outcome.

Competing hypotheses are fine. Rank them. Work the most falsifiable first.

### 4. Complete

When the debugging session ends, record:

```
Terminal state: resolved | insufficient_information | environment_compromised
Summary: [transferable learning — what the root cause was, what fixed it, what to watch for next time]
```

The summary is not optional. It feeds the expertise file.

---

## Invariants

1. **No action without a recorded primary + recovery step.**
2. **Surprises accumulate in the S register — do not ignore them.**
3. **Reflect is mandatory at S=2.** Not suggested. Mandatory.
4. **Hypotheses must be falsifiable.** If you can't state what would disprove it, it's not a hypothesis.
5. **Knowledge capture is part of completion**, not an afterthought.

---

## Coordinator vs. Evidence Gatherer

In the multi-team context:

- **Coordinator** (Engineering Lead, or the worker running the session solo): owns the protocol state machine — calls Init, Plan, Outcome, Reflect, Complete
- **Evidence Gatherers** (other workers dispatched after Reflect): test hypotheses, gather logs, run targeted checks — return findings only, do not own protocol state

A worker may run the protocol solo for contained debugging. Escalate to the Engineering Lead as coordinator when the problem spans multiple domains or S=2 is hit and the worker needs help forming a good hypothesis.

---

## Anti-Patterns

- **Skipping Plan**: Acting without declaring recovery → you will spiral
- **Absorbing surprises**: Noting something unexpected and continuing without incrementing S → you are lying to yourself
- **Unfalsifiable hypotheses**: "The system is behaving strangely" → this helps no one
- **Infinite reflect loops**: If you've formed 3+ hypotheses and tested none, you're stalling — pick the most falsifiable and act
- **Treating completion as optional**: If you don't capture the learning, the next agent hits the same wall
