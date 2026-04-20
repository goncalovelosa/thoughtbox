# Thoughtbox Session Area Spec Pack

This pack translates the provided design brief into a near-ticket-ready set of Markdown specs for the **Session area** of the Thoughtbox web app.

## Canonical decisions for this pack

- **Domain term:** `Session` is the canonical product term. `Run` is treated as legacy wording that may still appear in the current route namespace.
- **Scope:** the whole Session area is in scope, with the **detail experience** getting the deepest treatment and the **index page** kept deliberately conservative.
- **Primary detail layout:** desktop-first **split view** with the trace on the left and the selected thought on the right.
- **Selection model:** a selected thought is **URL-addressable** and should survive refresh, copy/paste, and browser navigation.
- **Primary visualization:** a **hybrid chronological list plus lightweight SVG lane rail** is the default recommendation for v1.
- **Branch handling:** **passive visualization only** in v1.
- **Utilities in v1:** search within thoughts, filter by thought type, and show revisions only.
- **Theming stance:** the Session experience defaults to **dark surfaces** inside the main content area.
- **Live behavior:** the UI is designed to support **active / in-progress sessions** and incremental updates, but the transport remains intentionally unspecified.
- **Data contracts:** the web app should define its own UI types based on the **persistence layer**, not the observatory schema.
- **Explicitly out of this pack:** responsive/mobile spec, accessibility spec, and an engineering implementation plan.

## Scale assumptions used by these specs

- **Common session:** 100 thoughts or fewer
- **Large session:** around 200 thoughts
- **Observed upper bound:** around 400 thoughts for a single-agent session

These assumptions drive several recommendations:
- no default virtualization requirement in v1
- client-side filtering/search within a loaded session is acceptable
- progressive disclosure matters more than deep pagination inside a session

## File map

1. [01-product-ux-spec.md](./01-product-ux-spec.md)
2. [02-routing-and-information-architecture-spec.md](./02-routing-and-information-architecture-spec.md)
3. [03-component-architecture-spec.md](./03-component-architecture-spec.md)
4. [04-sessions-index-spec.md](./04-sessions-index-spec.md)
5. [05-session-detail-layout-and-trace-spec.md](./05-session-detail-layout-and-trace-spec.md)
6. [06-interaction-state-and-url-spec.md](./06-interaction-state-and-url-spec.md)
7. [07-thought-card-and-rendering-spec.md](./07-thought-card-and-rendering-spec.md)
8. [08-visual-design-and-tailwind-token-spec.md](./08-visual-design-and-tailwind-token-spec.md)
9. [09-data-contract-and-view-model-spec.md](./09-data-contract-and-view-model-spec.md)
10. [10-dependency-graph-and-open-questions.md](./10-dependency-graph-and-open-questions.md)
11. [11-qa-scenarios-and-acceptance-matrix.md](./11-qa-scenarios-and-acceptance-matrix.md)

## Recommended reading order

Read in this order if the goal is to collapse uncertainty quickly:

1. Product / UX
2. Routing / IA
3. Session detail layout and trace
4. Interaction state and URL model
5. Data contract and view models
6. Thought card rendering
7. Visual token spec
8. Component architecture
9. Dependency graph / open questions
10. QA matrix

## Notes on terminology

This pack intentionally uses **Session** as the canonical noun in headings, labels, and model language. Because the existing app already uses a `/runs` route namespace, the specs assume one of these two outcomes:

- keep the existing route namespace for continuity and use **Session** in user-facing copy, or
- later rename the IA to `/sessions` as a larger navigation cleanup

The first option is treated as the safer default for v1.

## Pack-level acceptance criteria

- The pack covers the full Session area, not only the detail page.
- The pack contains product/UX, routing/URL state, component architecture, visual design/token, data contract, and QA material.
- Every spec file contains explicit acceptance criteria.
- The pack preserves open questions while still recommending strong defaults.
- The pack does not include a responsive/mobile spec, an accessibility spec, or an engineering implementation plan.
