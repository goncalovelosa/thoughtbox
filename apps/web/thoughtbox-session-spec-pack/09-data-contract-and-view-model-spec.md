# 09 — Data Contract and View-Model Spec

## Purpose

Define the data shape assumptions for the Session area, using the persistence layer as canonical input and a dedicated UI view-model layer as canonical frontend output.

## Canonical source of truth

For the web app, treat the **persistence layer** as canonical for what is actually stored and retrievable.

Do **not** model the frontend directly off the observatory schema.

## Domain terminology

Use these frontend concepts:

- `Session` — the top-level reasoning trace
- `Thought` — an individual reasoning step or typed event
- `SessionSummaryVM` — index-page row model
- `SessionDetailVM` — detail-page shell model
- `ThoughtRowVM` — dense timeline row model
- `ThoughtDetailVM` — selected-thought panel model

## Raw data principles

1. Raw persistence types may contain more fields than v1 renders.
2. The UI adapter should normalize inconsistencies into safe defaults.
3. No data migration strategy is part of this pack.
4. Historical/untyped thoughts remain supported through normalization.

## Recommended raw type sketch

This is intentionally a UI-facing approximation, not a claim about the exact backend module exports.

```ts
type RawThoughtRecord = {
  id: string
  thoughtNumber?: number
  totalThoughts?: number
  thought: string
  timestamp: string
  nextThoughtNeeded?: boolean

  isRevision?: boolean
  revisesThought?: number

  branchId?: string
  branchFromThought?: number

  thoughtType?: 'reasoning' | 'decision_frame' | 'action_report' |
    'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress'

  confidence?: 'high' | 'medium' | 'low'
  options?: { label: string; selected: boolean; reason?: string }[]
  actionResult?: {
    success: boolean
    reversible: 'yes' | 'no' | 'partial'
    tool: string
    target: string
    sideEffects?: string[]
  }
  beliefs?: {
    entities: { name: string; state: string }[]
    constraints?: string[]
    risks?: string[]
  }
  assumptionChange?: {
    text: string
    oldStatus: string
    newStatus: 'believed' | 'uncertain' | 'refuted'
    trigger?: string
    downstream?: number[]
  }
  contextData?: {
    toolsAvailable?: string[]
    systemPromptHash?: string
    modelId?: string
    constraints?: string[]
    dataSourcesAccessed?: string[]
  }
  progressData?: {
    task: string
    status: 'pending' | 'in_progress' | 'done' | 'blocked'
    note?: string
  }

  agentId?: string
  agentName?: string
  contentHash?: string
  parentHash?: string
  critique?: unknown
}

type RawSessionRecord = {
  id: string
  title?: string
  tags?: string[]
  createdAt: string
  completedAt?: string
  updatedAt?: string
  status: 'active' | 'completed' | 'abandoned'
  thoughts?: RawThoughtRecord[]
}
```

## Normalization rules

### Session-level normalization

- `title`: use trimmed value if present, otherwise `undefined`
- `tags`: default to `[]`
- `status`: trust persisted value when available
- `updatedAt`: use `completedAt ?? updatedAt ?? createdAt` as a stable fallback for freshness displays
- `thoughtCount`: derive from loaded thoughts length when authoritative count is absent

### Thought-level normalization

- `thoughtNumber`: required for canonical row ordering; if absent, derive from sorted position only as a last-resort UI fallback
- `displayType`: `thoughtType ?? 'reasoning'`
- `previewText`: first line of `thought`, trimmed and truncated
- `isTyped`: true when a known `thoughtType` is present
- `isRevision`: normalize from `isRevision === true || revisesThought != null`
- `branchKey`: `branchId ?? '__main__'`
- `timestamp`: parse into a valid date object or mark as invalid for fallback rendering

## Recommended view models

```ts
type SessionSummaryVM = {
  id: string
  shortId: string
  title?: string
  status: 'active' | 'completed' | 'abandoned'
  thoughtCount?: number
  startedAtISO: string
  startedAtLabel: string
  durationLabel: string
  href: string
}

type SessionDetailVM = {
  id: string
  shortId: string
  title?: string
  status: 'active' | 'completed' | 'abandoned'
  tags: string[]
  startedAtISO: string
  startedAtLabel: string
  completedAtISO?: string
  durationLabel: string
  thoughtCount: number
  lastUpdatedAtISO?: string
  isLiveCapable: boolean
}

type ThoughtRowVM = {
  id: string
  thoughtNumber: number
  totalThoughts?: number
  shortId: string
  previewText: string
  timestampISO: string
  relativeTimeLabel: string
  absoluteTimeLabel: string
  displayType: 'reasoning' | 'decision_frame' | 'action_report' |
    'belief_snapshot' | 'assumption_update' | 'context_snapshot' | 'progress'
  isTyped: boolean
  isRevision: boolean
  revisesThought?: number
  laneIndex: number
  laneColorToken: string
  branchId?: string
  branchLabel?: string
  branchFromThought?: number
  showGapBefore: boolean
  gapLabel?: string
  searchIndexText: string
}

type ThoughtDetailVM = ThoughtRowVM & {
  rawThought: string
  nextThoughtNeeded?: boolean
  confidence?: 'high' | 'medium' | 'low'
  options?: { label: string; selected: boolean; reason?: string }[]
  actionResult?: {
    success: boolean
    reversible: 'yes' | 'no' | 'partial'
    tool: string
    target: string
    sideEffects?: string[]
  }
  beliefs?: {
    entities: { name: string; state: string }[]
    constraints?: string[]
    risks?: string[]
  }
  assumptionChange?: {
    text: string
    oldStatus: string
    newStatus: 'believed' | 'uncertain' | 'refuted'
    trigger?: string
    downstream?: number[]
  }
  contextData?: {
    toolsAvailable?: string[]
    systemPromptHash?: string
    modelId?: string
    constraints?: string[]
    dataSourcesAccessed?: string[]
  }
  progressData?: {
    task: string
    status: 'pending' | 'in_progress' | 'done' | 'blocked'
    note?: string
  }
  debugMeta: Record<string, unknown>
}
```

## Search index text recommendation

Because the upper bound is modest, build a per-thought flat text field for search from:
- raw thought text
- branch label
- tool/target strings
- option labels/reasons
- belief entities/states
- assumption text/trigger
- context strings
- progress task/note

This enables simple client-side filtering without introducing a heavyweight search subsystem.

## Lane assignment contract

The UI layer should receive either:
- precomputed `laneIndex` values from the adapter, or
- enough branch metadata to derive them deterministically

Preferred v1 choice:
- compute lane assignment in the adapter, not deep inside row components

## Gap-separator contract

A row view model should include:
- whether a gap separator appears before it
- the already-formatted gap label

This keeps presentation components simple.

## Performance recommendation

For sessions under ~400 thoughts:
- fetch all thoughts for the selected Session in one payload if practical
- normalize once
- filter/search client-side
- avoid refetching on every thought selection

## Error-tolerance rules

The adapter must not throw purely because:
- `thoughtType` is absent
- typed metadata is partially missing
- branch metadata is incomplete
- `totalThoughts` disagrees with row count
- extra persistence-only fields are present

Instead:
- normalize and preserve raw data in `debugMeta`

## Open data questions

1. Should the canonical selected-thought URL param eventually switch from `thoughtNumber` to `id`?
2. Should branch names exist as first-class persisted data or remain derived labels?
3. Should active-session APIs expose both an authoritative thought count and a freshness timestamp?

## Acceptance criteria

- The persistence layer is explicitly treated as canonical input.
- The frontend uses a separate normalized view-model layer.
- Untyped and inconsistent historical data are tolerated without migration work.
- The view models are specific enough for implementation and ticketing.
- The data contract supports the index page, detail header, timeline rows, and selected-thought panel.
