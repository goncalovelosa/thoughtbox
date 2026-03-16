# 07 — Thought Card and Rendering Spec

## Purpose

Define how thought rows and selected-thought detail render both untyped and typed thoughts using one unified card system.

## Rendering philosophy

Use a **single card shell** with consistent structure and type-specific sections. This preserves coherence across thought types and keeps older untyped thoughts from feeling like second-class leftovers.

## Unified card shell

### Card regions

1. **Header**
2. **Summary metadata row**
3. **Type-specific body section**
4. **Raw content section**
5. **Metadata disclosure**

### Header contents

- thought title: `Thought #N`
- optional branch badge
- type badge
- optional revision badge
- optional confidence / result / progress badge depending on type

### Summary metadata row

- short thought ID
- relative time
- absolute timestamp on secondary line or tooltip if desired
- step label such as `Step 23 of 112`

## Row preview rendering

The row in the timeline is intentionally compact.

### Required preview cues

- preview text
- branch label when relevant
- type badge when the thought is typed and non-plain
- revision badge when relevant
- short ID and relative timestamp

### Preview badge rules

- if `thoughtType` is absent, show no type badge by default
- if `thoughtType === reasoning`, type badge is optional and generally omitted in the row for density
- if typed and non-reasoning, show the type badge

## Detail rendering order

For a selected thought, render in this order:

1. Thought header
2. Structured card body if typed or if typed metadata exists
3. Raw content block
4. Metadata disclosure

This mirrors the observatory pattern while remaining native to the app.

## Untyped and incomplete thought behavior

### Untyped thoughts

Treat as default reasoning thoughts:
- use the unified shell
- show raw content prominently
- no empty typed placeholders

### Partially typed thoughts

If a `thoughtType` exists but some expected metadata is missing:
- still show the type badge
- render only the fields that exist
- do not show broken empty rows for absent optional fields

### Malformed enum or unknown type

- fall back to the generic reasoning treatment
- retain raw metadata inside disclosure for debugging

## Type-specific rendering rules

## `reasoning`

### Detail treatment

- no elaborate structured body required
- raw thought content is the primary body
- optional compact `Reasoning` badge only in the detail header if you want type explicitness

## `decision_frame`

### Required when data exists

- confidence badge if present
- options list
- selected option clearly marked
- option reason shown when present

### Missing metadata fallback

If `options` is absent, render a compact note:
`Decision metadata unavailable`

## `action_report`

### Required when data exists

- success / failure badge
- reversibility badge
- tool name
- target
- side effects list if present

### Missing metadata fallback

If `actionResult` is absent, show the type badge and raw content only.

## `belief_snapshot`

### Required when data exists

- entity/state pairs
- constraints list if present
- risks list if present

### Missing metadata fallback

If `beliefs` is absent, show the type badge and raw content only.

## `assumption_update`

### Required when data exists

- assumption text
- status transition from old to new
- trigger text if present
- downstream thought references if present

### Missing metadata fallback

If `assumptionChange` is absent, show the type badge and raw content only.

## `context_snapshot`

### Required when data exists

- key/value grid containing any present fields:
  - model ID
  - system prompt hash
  - tools available
  - constraints
  - data sources accessed

### Missing metadata fallback

If `contextData` is absent, show the type badge and raw content only.

## `progress`

### Required when data exists

- task text
- status badge
- note if present

### Missing metadata fallback

If `progressData` is absent, show the type badge and raw content only.

## Revision rendering

When a thought revises a prior thought:
- show a revision badge in both row and detail header
- show inline text such as `Revises thought #12`
- if the revised thought exists in the current trace, render it as a link-style affordance in the detail panel

Revision is not treated as a separate thought type.

## Raw content block

### Purpose

Preserve exact agent-authored content.

### Rules

- use JetBrains Mono or the app mono font
- preserve whitespace
- support large text blocks without collapsing layout
- allow long lines to wrap or horizontal-scroll based on final code-block style choice

## Metadata disclosure

Use a collapsible disclosure rather than always showing raw JSON.

### Recommended disclosure contents

- `thoughtNumber`
- `totalThoughts`
- `nextThoughtNeeded`
- `branchId`
- `branchFromThought`
- `thoughtType`
- raw typed metadata payloads
- persistence-only extras that are useful for debugging:
  - `agentId`
  - `agentName`
  - `contentHash`
  - `parentHash`
  - `critique`

## Long-content behavior

A single thought may contain:
- long prose
- code blocks
- JSON blobs
- stack traces

The detail panel must remain usable by:
- allowing the content region to scroll independently if needed
- avoiding auto-expansion of every content section in the trace list
- keeping header metadata compact

## Open questions

1. Should row previews surface more type-specific summaries, e.g. tool name for actions or selected option for decisions?
2. Should raw content ever be collapsible if the structured card is already rich?
3. Should revision links scroll the timeline and update selection in one action?

## Acceptance criteria

- All thoughts render through a unified shell.
- Typed thoughts gain richer detail without breaking older untyped data.
- Missing typed metadata degrades gracefully.
- Revision state is visible without becoming its own type system.
- Raw content and metadata disclosure are both preserved in the detail view.
- The row preview stays dense even when the selected-thought panel is rich.
