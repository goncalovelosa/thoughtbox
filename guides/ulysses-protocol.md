# Ulysses Protocol: Surprise-Gated Debugging

A debugging discipline that prevents the "try random things" spiral.
Pre-commit to recovery actions before executing plans, and force
reflection when surprises accumulate.

## When to Use

Use after 2+ failed attempts at fixing something. Use when behavior is
genuinely surprising. Use when you catch yourself thinking "let me just
try one more thing."

Skip for obvious errors (typos, missing imports, wrong variable names).
Skip for well-understood failures where you know the root cause. The
protocol adds overhead -- deploy it when you need the discipline, not
on every bug.

## Actions vs Research

Only **actions** -- steps that change game state -- move the S-register.
Writing code, running a build, applying a config change, deploying: these
are actions. If the outcome surprises you, S increments.

**Research** does not move S. Checking a version number, reading logs,
comparing environment variables, inspecting config files: these are
lookups. They inform your mental model but they do not change anything.
A lookup that returns unexpected information is useful data, not a
surprise in the protocol sense. Use it to refine your next action.

The distinction matters because the protocol gates *planning*, not
*learning*. You should never feel blocked from gathering information.

## The S-Register

The surprise counter starts at 0. Each unexpected **action** outcome
increments S.

| S value | Effect |
|---------|--------|
| 0 | Normal operation. Plan and execute freely. |
| 1 | Caution. Plans still allowed, but pay attention. |
| 2+ | **Blocked.** No new plans until you `reflect`. |

At S=2, the protocol forces you to stop executing and start thinking.
This is the mechanism that breaks the spiral. You cannot plan your way
out -- you must form a falsifiable hypothesis first.

## Workflow

### Init

Start a Ulysses session when you recognize the pattern.

```javascript
async () => tb.ulysses({
  operation: "init",
  problem: "Tests pass locally but fail in CI",
  constraints: [
    "Cannot modify CI config without approval"
  ]
})
```

This creates the session, sets S=0, and records the problem statement.

### Plan

Every plan requires a pre-committed recovery action. Decide what you
will do if this plan fails *before* you execute it. This prevents
post-hoc rationalization.

```javascript
async () => tb.ulysses({
  operation: "plan",
  primary: "Compare CI env vars to local .env",
  recovery: "If env vars match, check node version differences"
})
```

The recovery field is not optional. If you cannot articulate what you
will do when the plan fails, you do not understand the problem well
enough to act.

### Outcome

Record what happened. Be honest about whether it matched expectations.

```javascript
async () => tb.ulysses({
  operation: "outcome",
  assessment: "unexpected-unfavorable",
  severity: 1,
  details: "Environment variables are identical -- " +
    "rules out config differences"
})
```

Assessments: `expected` (S unchanged), `unexpected-favorable`
(S increments -- surprise went well), or `unexpected-unfavorable`
(S increments -- surprise went badly). Both unexpected variants
increment S equally.

Severity: `1` (surprising but not disorienting) or `2`
(fundamentally challenges your mental model).

### Reflect

Required when S reaches 2. Blocked from planning until you do this.

Form a falsifiable hypothesis. State exactly what would prove it wrong.

```javascript
async () => tb.ulysses({
  operation: "reflect",
  hypothesis: "CI failure is a timing race -- " +
    "database not ready when tests start",
  falsification: "If adding a 5-second delay before tests " +
    "doesn't fix it, this hypothesis is false"
})
```

Reflection resets S to 0, but only if the hypothesis is falsifiable.
"Something is wrong with CI" is not a hypothesis. "The database
container takes longer to start in CI than locally" is.

### Complete

End the session with a terminal state.

```javascript
async () => tb.ulysses({
  operation: "complete",
  terminalState: "resolved",
  summary: "Root cause: async database seeding not awaited " +
    "in test setup"
})
```

### Status

Check current session state at any point.

```javascript
async () => tb.ulysses({ operation: "status" })
```

Returns the S-register value, active plan, and session history.

## Worked Example

**Problem:** Tests pass locally but fail in CI.

### 1. Init (S=0)

Start the session. State the problem and constraints.

```
init -> S=0, problem registered
```

### 2. Research: check env vars (S=0)

Compare CI env vars to local `.env`. This is a lookup -- reading
config, not changing anything. S stays at 0 regardless of what we
find. Result: environment variables are identical. Rules out config
drift. Useful data.

### 3. Research: check node version (S=0)

Compare `node --version` in CI logs vs local. Still a lookup. S stays
at 0. Result: node versions are identical. Two common causes ruled out
without spending any surprise budget.

### 4. Plan: add sleep before test suite (S=0)

At this point research has narrowed the problem to something dynamic,
not static config. Form a hypothesis: CI failure is a timing race --
the database container is slower in CI.

Primary: add `await sleep(5000)` before test suite in CI.
Recovery: if tests still fail, check database logs for connection
errors during the test window.

This is an **action** -- it changes code and re-runs the build.

### 5. Outcome: expected (S=0)

Tests pass with the delay. Hypothesis confirmed. S stays at 0.

Now fix the root cause: the test setup calls `seedDatabase()` without
`await`. Add the await, remove the delay, confirm tests still pass.

### 6. Complete: resolved

Root cause: async database seeding not awaited in test setup. The
local database was fast enough to finish before tests started; CI's
database was not.

### What if step 4 had failed?

If adding the delay didn't fix tests, that's S=1 (unexpected action
outcome). You'd execute the pre-committed recovery: check database
logs. If the recovery action also surprises you, S=2 -- reflect
before planning again.

## Terminal States

### resolved

Root cause found and fixed. The preferred outcome. Record the root
cause clearly -- future sessions can search for it.

### insufficient_information

Cannot make further progress with available data or tools. Use when
debugging requires access you do not have (production logs, metrics,
credentials) or when the problem is not reproducible with current
information. Record what information would unblock the investigation.

### environment_compromised

The debugging environment itself is unreliable. Use when you discover
that the test environment, tooling, or data is corrupted in a way
that invalidates prior observations. Record which observations are
affected and what needs to be fixed before resuming.
