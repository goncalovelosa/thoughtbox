# Mental Model

You maintain a persistent expertise file that grows over sessions. This is your long-term memory.

## Your Expertise File

Located at the path specified in your frontmatter under `expertise`. It is yours to own and update.

## When to Update

- After completing a significant task
- When you discover something important about the codebase that isn't obvious from reading the code
- When a decision was made that future-you should know about
- When a pattern is confirmed or refuted by evidence
- At the end of every session that involved substantive work

## What to Track

Good entries:
- Architectural patterns you confirmed (with file evidence)
- Key decisions and why they were made
- Surprising behaviors or edge cases
- Dependencies between subsystems that aren't obvious
- What NOT to do (and why)
- Open questions you haven't resolved yet

Bad entries:
- Things that are obvious from reading the code
- Specific line numbers (they change)
- Transcripts of what you did in a session

## Format

```markdown
## [Date] — [Session Topic]

### Confirmed
- [Fact with evidence] [HOT]

### Decisions
- [Decision]: [Rationale] [HOT]

### Patterns
- [Pattern name]: [Description] [WARM]

### Watch Out For
- [Gotcha or edge case] [HOT]

### Open Questions
- [Question you haven't answered yet]

### Stepping Stones (failed approaches worth remembering)
- [What was tried] → [Why it failed] → [When it might become relevant again]
```

## Continual Calibration

Learnings are not permanent. Tag every entry with a freshness level and recalibrate over sessions.

| Tag | Meaning |
|-----|---------|
| **HOT** | Actively relevant, recently validated — use by default |
| **WARM** | Occasionally relevant, not recently tested — verify before relying on |
| **COLD** | Reference only, may be outdated — check before applying |

### Fitness Tracking

- **Used and worked** → Promote: HOT
- **Used and failed** → Demote with context: mark as anti-pattern, record why
- **Not used** → Decay: HOT → WARM → COLD → archive
- **Failed but informative** → Preserve as stepping stone with resurrection conditions

### Session Calibration

At the end of significant work sessions, briefly assess:
1. Which entries from memory actually helped?
2. Which were irrelevant or misleading?
3. Are any previous entries now contradicted?
4. What new pattern emerged that should be captured?

## Max Lines

Keep your expertise file under the `max-lines` limit in your frontmatter.
When approaching the limit, prune COLD entries first, then WARM.
Quality over quantity — 50 dense, calibrated lines beat 500 lines of noise.
