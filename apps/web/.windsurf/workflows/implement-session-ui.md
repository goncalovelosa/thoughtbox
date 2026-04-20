---
description: Implement the Session UI
---
This workflow guides an AI agent through implementing the Thoughtbox Session UI according to the strict ChatGPT specifications (`thoughtbox-session-spec-pack`).

## Phase 1: Data Contract & View Models

1. Create `src/lib/session/view-models.ts` and export the types defined in `09-data-contract-and-view-model-spec.md`.
2. Implement the pure functions: `createSessionSummaryVM`, `createSessionDetailVM`, and `createThoughtViewModels`.
3. Flesh out the tests in `src/lib/session/view-models.test.ts` to prove they work against raw mocked persistence data.

// turbo
4. Run `scripts/qa/agent-check.sh`. You MUST fix any errors before moving to Phase 2.

## Phase 2: Index Page Shell

1. Create the server and client components for the index page as defined in `03-component-architecture-spec.md` (e.g. `sessions-index-header.tsx`, `sessions-table.tsx`).
2. Wire them into `src/app/w/[workspaceSlug]/runs/page.tsx`.
3. Use the design tokens exactly as specified in `08-visual-design-and-tailwind-token-spec.md`. DO NOT import external component libraries.

// turbo
4. Run `scripts/qa/agent-check.sh`. Fix any architecture or design token violations.

## Phase 3: Detail Page Layout

1. Create the server shell `session-detail-header.tsx` and the client shell `session-trace-explorer.tsx`.
2. Wire them into `src/app/w/[workspaceSlug]/runs/[runId]/page.tsx`.
3. Set up the URL-state synchronization for the selected thought and filters as defined in `06-interaction-state-and-url-spec.md`.

// turbo
4. Run `scripts/qa/agent-check.sh`. Fix any architecture or design token violations.

## Phase 4: Trace and Lane Rendering

1. Implement `session-timeline.tsx`, `session-timeline-rail.tsx`, and `thought-row.tsx`.
2. Ensure the SVG lane rail correctly renders main/branch lanes using the `sessionLane` colors in the Tailwind config.

// turbo
3. Run `scripts/qa/agent-check.sh`.

## Phase 5: Structured Thought Detail

1. Implement `thought-detail-panel.tsx` and the unified `thought-card.tsx`.
2. Ensure all 7 typed thought cards (`decision_frame`, `action_report`, etc.) render correctly and fallback gracefully when data is missing.

// turbo
3. Run `scripts/qa/agent-check.sh`. If everything passes, the implementation is complete.
