# SPEC-FAILURE-STATE-MACHINE: Evidence-Gated Product Health

## Status: DRAFT

## Summary

Thoughtbox must stop inferring health from missing effects. The product reports
explicit setup and correlation states backed by persisted evidence.

This state machine is not optional observability polish. It is core product
behavior for the hosted release.

## Scope

The release needs two related health models:

1. `workspace_setup_status`
2. `run_correlation_status`

Both models live in persisted backend state and are rendered directly by the CLI
and UI.

## Requirements

### 1. Evidence-Gated State

1. A state may advance only when the concrete event for that state has been
   observed.
2. Success states are illegal without their required evidence.
3. Missing expected evidence after a bounded wait transitions to an explicit
   failure state.
4. For binding specifically, the bounded wait begins only once both reasoning
   and telemetry evidence exist.

### 2. Workspace Setup Status

Minimum states:

- `unconfigured`
- `configured`
- `auth_failed`
- `mcp_missing`
- `hook_missing`
- `otel_missing`
- `ready`

Semantics:

- `configured` means config files were written successfully
- `ready` means `doctor` has proven the release path is usable

### 3. Run Correlation Status

Minimum states:

- `session_created`
- `reasoning_seen`
- `telemetry_seen`
- `reasoning_only`
- `telemetry_only`
- `binding_missing`
- `healthy`

Semantics:

- `reasoning_only` means reasoning data exists, but required telemetry proof did
  not arrive in time
- `telemetry_only` means telemetry exists without reasoning linkage
- `binding_missing` means both sides exist, but the canonical binding does not
  yet exist
- `healthy` means reasoning + telemetry + canonical binding all exist for the
  same work period

### 4. Enforcement Surfaces

1. `thoughtbox init` must not report success if required config writes failed.
2. `thoughtbox doctor` must fail unless the target workspace reaches `ready`.
3. The UI must render an explicit state instead of a blank neutral dashboard.
4. Query handlers must return typed health/failure metadata rather than empty
   arrays that force the user to guess.

### 5. Persistence

1. Health state must live in the backend database.
2. CLI, server, ingestion, and UI must all read/write through the same shared
   truth.
3. State transitions must be timestamped for debugging and support.

## Acceptance Criteria

- [ ] Every release-path failure mode maps to an explicit typed state
- [ ] No blank dashboard is shown for an unhealthy workspace or run
- [ ] `doctor` exits nonzero for any non-`ready` setup state
- [ ] A correlated run reaches `healthy` only with concrete reasoning,
      telemetry, and binding evidence
- [ ] Missing evidence transitions to an explicit failure state after a bounded
      wait

## Suggested Transition Rules

1. `unconfigured -> configured` after `thoughtbox init` writes config
2. `configured -> ready` only after `doctor` proves the full path
3. `session_created -> reasoning_seen` when a Thoughtbox session persists
4. `session_created -> telemetry_seen` when OTEL data lands first
5. `reasoning_seen -> reasoning_only` if telemetry does not arrive in time
6. `telemetry_seen -> telemetry_only` if reasoning does not arrive in time
7. `reasoning_seen + telemetry_seen -> binding_missing` if the canonical binding
   is absent
8. `binding_missing -> healthy` when the `runs` row is reconciled

## Non-Goals

- Generic workflow orchestration
- Automatic repair of every failure mode
- Long-term support analytics

## Dependencies

- `thoughtbox init`
- `thoughtbox doctor`
- canonical run correlation contract
- UI support for explicit status rendering

## Open Questions

- Should workspace setup state and run correlation state live in dedicated
  tables, or should one or both piggyback on existing entities? --> `I think they should live in dedicated tables. `
- What exact timeout windows are acceptable before promoting missing evidence to
  failure? --> `I'm going to need a clearer picture of what you're picturing beginning to end here before I can answer that question. `
