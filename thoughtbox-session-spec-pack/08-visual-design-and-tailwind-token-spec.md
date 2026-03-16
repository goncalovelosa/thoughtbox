# 08 — Visual Design and Tailwind Token Spec

## Purpose

Define the visual stance, semantic color vocabulary, typography rules, and copy-pasteable Tailwind class patterns for the Session area.

## Design stance

The current dashboard is mostly light-themed. The Session area should deliberately feel like a more technical inspection environment.

### Recommended default

Use **dark surfaces inside the Session content area** while leaving the existing workspace shell intact.

This creates contrast without requiring an immediate whole-app dark mode rollout.

### Rejected default

Do not make the trace itself light inside a dark shell in v1. Mixed polarity inside the trace/detail workspace is more likely to feel accidental than purposeful.

## Surface hierarchy

### Page content backdrop

```tsx
bg-slate-950 text-slate-100
```

### Elevated containers

```tsx
rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm
```

### Inner panels / cards

```tsx
rounded-xl border border-slate-800 bg-slate-900
```

### Recessed utility strips or code blocks

```tsx
rounded-lg border border-slate-800 bg-slate-950/80
```

## Typography

### Sans text

- use existing `Inter`
- primary body copy: `text-sm text-slate-200`
- secondary metadata: `text-xs text-slate-400`

### Monospace text

- use existing `JetBrains Mono`
- IDs, hashes, and raw thought content should use the mono font
- default mono utility:
  `font-mono text-[12px] leading-5`

## Session header recipes

### Back link

```tsx
inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white
```

### Session title

```tsx
text-2xl font-semibold tracking-tight text-white
```

### Secondary metadata cluster

```tsx
flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-400
```

## Toolbar recipes

### Search input

```tsx
h-10 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20
```

### Filter chip (inactive)

```tsx
inline-flex h-9 items-center rounded-full border border-slate-800 bg-slate-900 px-3 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white
```

### Filter chip (active)

```tsx
inline-flex h-9 items-center rounded-full border border-brand-500/40 bg-brand-500/10 px-3 text-xs font-medium text-brand-200
```

## Timeline container recipes

### Timeline shell

```tsx
rounded-2xl border border-slate-800 bg-slate-950 shadow-sm
```

### Timeline sticky toolbar

```tsx
sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 backdrop-blur
```

### Timeline scrolling body

```tsx
overflow-y-auto
```

## Thought row recipes

### Row base

```tsx
group grid grid-cols-[84px_minmax(0,1fr)] items-start gap-3 px-4 py-3
```

### Row content card

```tsx
rounded-xl border border-transparent bg-transparent px-3 py-2 transition-colors group-hover:bg-slate-900/70
```

### Selected row content card

```tsx
rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2 ring-1 ring-brand-500/20
```

### Preview text

```tsx
text-sm font-medium leading-5 text-slate-100
```

### Meta line

```tsx
mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400
```

## Gap separator recipe

```tsx
relative my-2 flex items-center gap-3 px-4 py-1 text-[11px] uppercase tracking-wide text-slate-500
```

Inner rule style:
```tsx
h-px flex-1 bg-slate-800
```

## Detail panel recipes

### Panel shell

```tsx
sticky top-6 rounded-2xl border border-slate-800 bg-slate-900/80 shadow-sm
```

### Panel inner sections

```tsx
border-b border-slate-800 px-5 py-4 last:border-b-0
```

### Raw content block

```tsx
overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-[12px] leading-5 text-slate-200
```

## Badge vocabulary

Use the same badge geometry everywhere:
- `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide`

### Status badges

#### Active
```tsx
bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20
```

#### Completed
```tsx
bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/20
```

#### Abandoned
```tsx
bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/20
```

### Thought-type badges

#### Decision
```tsx
bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/20
```

#### Action
```tsx
bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/20
```

#### Progress
```tsx
bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/20
```

#### Belief
```tsx
bg-pink-500/15 text-pink-300 ring-1 ring-pink-500/20
```

#### Assumption
```tsx
bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/20
```

#### Context
```tsx
bg-slate-500/15 text-slate-300 ring-1 ring-slate-500/20
```

#### Reasoning / generic
```tsx
bg-slate-700/50 text-slate-200 ring-1 ring-slate-600
```

## Branch lane colors

Recommended semantic mapping in `tailwind.config.ts`:

```ts
sessionLane: {
  main: '#3fb950',
  branch1: '#a371f7',
  branch2: '#58a6ff',
  branch3: '#d29922',
  branch4: '#db61a2',
  branch5: '#f85149',
}
```

These may be exposed as CSS variables for use in SVG stroke and fill values.

## Rail sizing guidance

- row height baseline: `48px`
- lane width baseline: `20px`
- rail horizontal offset baseline: `30px`
- dot radius baseline: `4px`

These mirror the observatory enough to preserve familiarity while fitting a React/Tailwind implementation.

## Structured card patterns

### Thought card shell

```tsx
rounded-xl border border-slate-800 bg-slate-900
```

### Thought card header

```tsx
flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-4 py-3
```

### Thought card body

```tsx
space-y-4 px-4 py-4 text-sm text-slate-200
```

## Open visual questions

1. Should the Session area eventually get its own top-level theme toggle?
2. Should selected rows use a stronger brand tint or remain mostly neutral?
3. Should typed cards use subtle tinted backgrounds per type, or only type badges and accents?

## Acceptance criteria

- The Session area has a clear dark-surface visual system distinct from the current light dashboard content.
- Tailwind class recipes are specific enough to paste into components.
- Status, type, and lane colors are explicitly defined.
- The visual system supports dense timeline rows and a richer detail panel.
- The spec avoids a mixed light-trace/dark-shell default in v1.
