# Operational Epistemics

The failure mode of autonomous agents is not bad reasoning — it is *structurally unconstrained* reasoning. An agent can produce confident, fluent, plausible-sounding forward progress while operating on a corrupted model of the world, re-visiting ruled-out ideas in new costumes, and never noticing it was wrong because it never committed to what "right" would look like.

Operational epistemics is the practice of building error-catching into the structure of the workflow itself — not trusting the agent's in-context reasoning to catch its own errors.

The five structural interventions that work:

---

## 1. Contaminated-State Awareness

**The problem**: Previous actions may have silently mutated the system. You are not necessarily reasoning about the system you think you are.

**The structural fix**: Before beginning any debugging or investigative task, checkpoint the actual current state. Don't reason from memory about what the state *should* be — verify what it *is*.

In practice:
- Before debugging a test failure: run the tests fresh, don't assume the last run is current
- Before debugging an infra issue: check actual running state, not expected state
- Before investigating a regression: verify the regression is still present in the current branch

A rollback-to-checkpoint isn't a consolation move when things go wrong. It's a first-class protocol step that guarantees you're reasoning about a known state.

---

## 2. Outcome-Space Typing

**The problem**: "Did that work?" is the wrong question. It allows retrospective reframing — any outcome can be absorbed as "part of the process." It also provides no signal about the quality of your model.

**The structural fix**: Before acting, commit to a prediction. After acting, assess against the prediction. The assessment has three values:

- `expected` — outcome matched prediction. Model was accurate.
- `unexpected-favorable` — outcome was better than predicted. Model was still wrong — update it.
- `unexpected-unfavorable` — outcome was worse than predicted. Model was wrong. Track this.

**unexpected-favorable is not a success signal — it's a calibration failure signal.** If you keep getting lucky, you don't understand the system.

---

## 3. Pre-Committed Prediction

**The problem**: Agents that don't commit to predictions before acting can always retrospectively reframe a bad outcome. There's no forcing function to notice when the model was wrong.

**The structural fix**: Before every action, record:
1. What you are about to do
2. What you predict will happen
3. What you will do if the prediction is violated

You cannot wriggle out of noticing you were wrong if you already went on record about what right looks like. The recovery step is not optional — it's what makes the prediction commitment meaningful.

---

## 4. Exclusion Mechanism

**The problem**: Without persistent memory of ruled-out space, an agent revisits bad ideas indefinitely in slightly different costumes. LLM sampling has no native memory of what's been tried — the exclusion list must be external.

**The structural fix**: Maintain an explicit, persistent list of approaches that have been tried and falsified. Before forming a new hypothesis or trying a new approach, check the exclusion list. Do not re-enter ruled-out space.

Failed approaches are not noise. They are the boundary of the known-wrong region. Deleting them destroys the search progress that was made.

This is why `mental-model.md` preserves stepping stones. It's not sentiment — it's search efficiency.

---

## 5. Terminal State Partition

**The problem**: Without explicit terminal states, agents run forever on hard problems. The actual failure mode of most agents is not wrong answers — it's infinite regress.

**The structural fix**: Every task must have a complete partition of terminal states that covers the entire outcome space with no fourth option:

- **Resolved**: the task is complete
- **Insufficient information**: the task cannot be completed with available information — escalate with what's missing
- **Environment compromised**: the environment itself is the blocker (external dependency, infra failure, corrupted state) — escalate with diagnosis

There is no state where work continues indefinitely. At each cycle, either progress is made (counter resets), space is pruned (exclusion list grows), or all paths are excluded and the agent must report underdetermination or environment failure. The protocol terminates.

---

## The Meta-Principle

All five interventions share the same structure: they govern the agent's *relationship to its own model of the world*, not the agent's cleverness.

- State corruption → verify before reasoning
- Unexamined predictions → commit before acting
- Retrospective reframing → outcome-space typing closes the escape hatch
- Unbounded search → exclusion list makes it finite
- Infinite regress → terminal state partition guarantees termination

None of these require a smarter agent. They require a *structurally constrained* agent. That's the real insight.

Apply these principles whenever you are designing a new workflow, reviewing an existing one, or noticing that a task is producing confident-sounding forward motion without actually converging.
