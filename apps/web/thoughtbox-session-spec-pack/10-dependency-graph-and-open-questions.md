# 10 — Dependency Graph and Open Questions

## Purpose

Expose implementation dependencies without prescribing a strict sequence, and preserve the key unanswered questions that still deserve human product judgment.

## Dependency graph

The graph below describes **feature dependency**, not sprint order.

## Node list

- **A** — Session routing and IA contract
- **B** — Data adapter and normalized view models
- **C** — Session index page
- **D** — Session detail shell and header
- **E** — Timeline / lane rail rendering
- **F** — Interaction state and URL synchronization
- **G** — Thought-card rendering system
- **H** — Visual token and Tailwind recipe layer
- **I** — QA matrix and scenario coverage

## Graph

```text
A -> C
A -> D
A -> F

B -> C
B -> D
B -> E
B -> F
B -> G
B -> I

D -> E
D -> F
D -> G
D -> I

E -> F
E -> G
E -> I

F -> G
F -> I

H -> C
H -> D
H -> E
H -> G

C -> I
G -> I
```

## Practical interpretation

### A. Routing and IA

Needed before:
- table row links are final
- detail-page query params are final
- shareable URLs are consistent

### B. Data adapter

Needed before:
- the UI can consume stable types
- lane assignment can be deterministic
- filters/search can operate on normalized text

### D, E, F, G as the core detail cluster

These four pieces form the heart of the Session detail experience:
- layout shell
- timeline rendering
- selection/filter state
- selected-thought rendering

They can be worked on in parallel, but only if:
- routing decisions are stable enough
- the view-model layer is stable enough
- the visual tokens are available

## Recommended “lock first” decisions

These are the decisions worth collapsing earliest if you want less implementation churn:

1. Whether the route namespace stays `/runs` while the product copy says Session
2. Whether `thoughtNumber` is the canonical URL selection key
3. Whether live-edge attachment is selection-based only or also scroll-based
4. Whether type filters use repeated query params
5. Whether typed cards use only accent badges or tinted card surfaces by type

## Preserved open questions with recommended defaults

## 1. Product term vs route namespace

### Open question
Should the app continue to route under `/runs` if the UI noun is Session?

### Recommended default
Yes for v1. Keep `/runs` for route continuity, switch user-facing copy to Session.

## 2. Richer graph mode

### Open question
Should the detail view eventually support a more graph-like mode?

### Recommended default
Yes as a future option, but not as the default v1 build target.

## 3. Live-session transport

### Open question
Should active-session updates come from WebSockets, polling, or a hybrid?

### Recommended default
Keep transport out of scope here. Design the UI around incremental updates and live-edge state only.

## 4. Selected-thought URL key

### Open question
Should links target `thoughtNumber` or raw `id`?

### Recommended default
Use `thoughtNumber` in v1 because it is readable, stable within a Session, and aligns with the UI mental model.

## 5. Visual polarity

### Open question
Should the whole Session area go dark, or only the content region?

### Recommended default
Dark content region only, preserving the existing workspace shell for now.

## 6. Filter persistence outside URL

### Open question
Should the app remember a user’s previous thought filters for each workspace?

### Recommended default
No persistent memory requirement in v1; the URL is the canonical shared state.

## Questions that do **not** need to block v1

- whether the index later gets richer analytics
- whether branch labels become editable/named
- whether metadata disclosure persists its open state across selections
- whether rows get a compact/dense toggle later

## Acceptance criteria

- The pack includes a clear dependency graph rather than a fixed implementation plan.
- The dependency graph distinguishes routing, data, visual, interaction, and QA concerns.
- Open questions are preserved, not erased.
- Each preserved question includes a recommended default so implementation can still proceed.
