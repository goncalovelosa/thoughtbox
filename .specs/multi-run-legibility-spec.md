# Specification: Multi-Run Session Legibility

## Overview
This specification details the implementation of a "Run-Aware Timeline" to improve legibility for sessions containing multiple runs (e.g., retries, parallel branches, multi-stage workflows).

## 1. Visual Segmentation
- **Requirement**: Introduce a "Run Header" in the timeline whenever a new `runId` is detected.
- **Implementation**:
  - Inject a `RunHeader` component into the `SessionTimeline` component.
  - The header will display run-specific metadata: Start Time, Duration, and Status.
  - This provides clear visual boundaries between different execution attempts.

## 2. Run Filtering
- **Requirement**: Add a run selector to the `SessionTraceToolbar`.
- **Implementation**:
  - Update `SessionTraceToolbar` to include a dropdown allowing users to filter the timeline by specific `runId`s.
  - This allows users to focus on a single run's trace while maintaining the context of the overall session.

## 3. Branching Visualization
- **Requirement**: Visualize relationships between parent and child runs.
- **Implementation**:
  - If runs are parallel or nested, use indentation or tree-like structures in the timeline to show the relationship between the parent run and its children.

## 4. Data Model Updates
- **Requirement**: Ensure `runId` is available for all timeline items.
- **Implementation**:
  - Update `src/lib/session/view-models.ts` to include `runId` in `ThoughtRowVM` and `OtelEventVM`.
  - Ensure all components rendering timeline items have access to the `runId` property.

## 5. Implementation Plan
1. **Model Update**: Update `view-models.ts` to include `runId`.
2. **Component Injection**: Create `RunHeader` component and inject it into `SessionTimeline`.
3. **Toolbar Update**: Add run selector dropdown to `SessionTraceToolbar`.
4. **Filtering Logic**: Update `SessionTraceExplorer` to filter thoughts and OTEL events by the selected `runId`.
