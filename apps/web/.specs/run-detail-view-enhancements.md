# Specification: Run Detail View Enhancements

## Overview
This specification outlines the improvements made to the Thoughtbox run detail view to enhance usability, clarity, and data accessibility.

## 1. Default View
- **Requirement**: The "Decisions" tab is now the default view for all run detail pages.
- **Rationale**: Provides immediate access to structured agent reasoning and decision-making, which is the primary value proposition for users.

## 2. Full Trace Enhancements
- **OTEL Event Rows**:
  - Inline display of `DURATION_MS` (formatted as "150ms" or "1.2s").
  - Inline success/failure indicators (✓/✗) based on `SUCCESS` attribute.
  - Graceful handling of missing attributes.
- **Detail Panel Rendering**:
  - `extractRichContent()` utility parses event attributes to display meaningful content (commands, file paths, inputs/outputs) instead of generic event type names.
  - Pretty-printing for JSON data.
- **Event Limits**:
  - Increased OTEL event limit from 500 to 10,000 to prevent premature truncation.
  - Warning badge only appears when events exceed the 10,000 limit.

## 3. Diagnostic UX
- **OTEL ID Badge**:
  - Converted from amber warning to blue info badge ("Bound to OTEL: [id]").
  - Added tooltip explaining that this is normal behavior for bound sessions.
  - Improved trust by removing alarming, unexplained warnings.

## 4. UI/UX Refinements
- **Visual Distinction**: Telemetry events are now visually distinct from agent thoughts.
- **Type Badges**: All reasoning thoughts now include proper type labels.
- **Toggle Clarity**: Improved the CONTENT/TITLES toggle UI.
- **Thought #1 Label**: Added missing type badge to Thought #1.
- **Span Counter**: Clarified the span counter in the right panel header.
- **Title Cleanup**: Stripped "Retest:" prefix from thought titles.
- **Accordion Labeling**: Renamed "RAW THOUGHT" to be more descriptive.

## 5. Data Filtering
- **Run-Boundary Filtering**: OTEL span list is now filtered to only show events occurring between the run's `started_at` and `completed_at` timestamps, ensuring trace relevance.
