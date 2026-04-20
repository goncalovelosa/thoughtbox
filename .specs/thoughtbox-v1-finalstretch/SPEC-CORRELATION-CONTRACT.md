# SPEC-CORRELATION-CONTRACT: Canonical Audit Correlation

## Status: DRAFT

## Summary

Thoughtbox auditability depends on a single canonical contract for joining
reasoning data and activity telemetry. The system must not infer correlation
from absence, guessed equality, or parser-side reconstruction.

For the current release, the canonical join path is:

1. a Thoughtbox reasoning session exists
2. a `runs` row exists for the work period
3. OTEL events arrive with the raw OTEL session identifier
4. a required hook-side binding event carries both the Thoughtbox session
   identity and OTEL session identity
5. the backend reconciles the `runs` row
6. all audit queries resolve through `runs`

For the current release, a run enters `binding_missing` only after both
reasoning and telemetry exist without a canonical binding for a bounded window.

## Requirements

1. `runs` is the only authoritative bridge between Thoughtbox session data and
   OTEL-backed telemetry.
2. Thoughtbox session identity and OTEL `session.id` must be treated as
   different external identifiers.
3. The system must not rely on raw equality between those identifiers.
4. The binding event emitted by the hook path is required product
   infrastructure for this release.
5. Reconciliation must update the canonical `runs` row, not attach ad hoc joins
   inside query handlers.
6. Observability and cost queries must resolve telemetry through `runs`, not by
   guessing or bypassing the binding layer.
7. If binding has not happened, the system must surface `binding_missing`
   explicitly rather than returning an empty or misleading healthy view.
8. The binding timeout clock starts only once both reasoning and telemetry
   exist for the same work period and no canonical binding has been recorded.
9. The bounded timeout for the release is 15 seconds from that point.

## Acceptance Criteria

- [ ] One real work period creates one canonical `runs` row
- [ ] OTEL rows persist the raw OTEL session identifier
- [ ] Binding event ingestion can populate or update the `runs` row with the
      OTEL session identifier
- [ ] Timeline and cost queries read OTEL data through `runs`
- [ ] No release-path query assumes a fake shared session key
- [ ] When reasoning and telemetry both exist without a binding, the product
      surfaces `binding_missing`

## Invariants

1. No run is `healthy` without a bound `runs` row.
2. No query may claim a correlated audit trail without a canonical binding.
3. No fallback parser-side inference is allowed for the release path.
4. Hook-side binding failure is a product-visible failure, not a debug-only
   condition.
5. Reconciliation is idempotent by exact value match only.

## Non-Goals

- Replacing hooks with a daemon runtime
- Inferring correlation from repository structure
- Solving multi-connection merge heuristics for this cutline

## Dependencies

- `runs` schema and persistence support
- Hook-side binding event emission
- OTEL ingestion of raw session identifiers
- Failure state machine for explicit health reporting

## Decisions

- Reconciliation is idempotent by exact value match only. There is no relaxed
  “equivalent payload” tolerance mode for the release.
- A run is promoted to `binding_missing` 15 seconds after both reasoning and
  telemetry exist without a canonical binding.
- The timeout clock does not start at session creation. It starts only once both
  sides of the correlation are present and the binding is still absent.

## Remaining Investigation

- Validate whether 15 seconds is generous enough to absorb normal async hook,
  network, and ingestion latency without masking real binding failures.
