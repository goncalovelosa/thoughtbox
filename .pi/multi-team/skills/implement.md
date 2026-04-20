# Implement

TDD-oriented implementation workflow. Read the spec, write tests first, implement to pass, verify.

## Phase 1: Requirement Extraction (10% of effort)

1. Read the spec or ADR that describes what to build
2. Extract atomic, testable requirements
3. Identify internal and external dependencies
4. Create a checklist of acceptance criteria

Do not start writing code until you can list the acceptance criteria.

## Phase 1b: State Checkpoint

Before writing any code, verify the actual current state of the system.
Do not reason from memory about what the state *should* be.

```bash
git status          # what branch, what's staged
pnpm test           # what's currently passing or failing
```

If tests are already failing before you've touched anything, note it. You are reasoning about that system — not the clean one you might be imagining.

## Phase 2: Test-First Development (25% of effort)

For each requirement, before writing the test:
1. **Predict**: State what failure you expect to see when this test runs (what specific assertion will fail, what error message)
2. Write the test
3. Run it — assess against your prediction:
   - `expected` failure → proceed
   - `unexpected` failure (wrong error, wrong line, different behavior) → update your model before continuing
4. Move to the next requirement

Don't implement while writing tests. An unexpected failure during the red phase means your understanding of the codebase is off — find out why before writing code that assumes you understand it.

## Phase 3: Implementation (50% of effort)

For each failing test, in dependency order:
1. **Predict**: State what you expect the test output to look like after your change
2. Implement the minimum code to make the test pass
3. Run — assess against prediction (expected / unexpected-favorable / unexpected-unfavorable)
4. `unexpected-favorable` is not a success — it means your model was wrong in a lucky direction. Update the model.
5. `unexpected-unfavorable` twice in a row → stop, activate Ulysses Protocol
6. Refactor if needed, keep tests green

**Track ruled-out approaches**: If you try an implementation and it fails in a surprising way, record it. Do not re-try the same approach in a different costume.

**Spiral detection**: If you're editing the same files 3+ times without net progress, stop and reassess.

## Phase 4: Verification (15% of effort)

1. Run the full test suite (`pnpm test`)
2. Walk through each acceptance criterion — does the implementation satisfy it?
3. Check edge cases not covered by tests
4. Check types compile (`pnpm typecheck` if available)

## Output Format

Return to the Engineering Lead with:

```
## Implementation Summary

Spec: [path to spec or ADR]
Terminal state: resolved | deferred | environment-blocked
Requirements: [N total, N implemented, N deferred]
Tests: [N passing, N failing, N skipped]
Files changed: [list]

Acceptance Criteria:
  ✓ [criterion 1]
  ✓ [criterion 2]
  ✗ [criterion 3]: [why it wasn't met / deferred]

Ruled-out approaches:
  - [approach tried]: [why it failed] — do not retry

Risks:
  - [anything the Validation team should look at closely]
```

If terminal state is `deferred` or `environment-blocked`, include what information or change is needed to unblock.
