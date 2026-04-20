# SPEC: Seven-Layer Stewardship Architecture

**Status**: DRAFT — research artifact, not accepted
**Source session**: `316ec05c-e2c0-4960-8322-05caf9708736`
**Primary sources**: OpenAI Harness Engineering (Feb 2026), Stripe Minions Parts 1+2 (Feb 2026), Anthropic Code Review launch (Mar 2026), Factory AI Missions (Apr 2026), GitHub Copilot Coding Agent docs (Feb 2026), Sourcegraph Amp Oracle/Worker (2025–2026), Letta Sleep-Time Compute (arXiv 2504.13171, Apr 2025), Boris Cherny interviews (2026).

## Context

Every team shipping high-volume AI-written code at production quality converges on the same structural response. The convergence is the evidence: independent teams, different stacks, same architectural answer. It's not one big idea; it's seven independent defense layers that compose via Swiss-Cheese logic.

The defining property across every layer: **governance lives outside the agent-editable surface.** Any layer the agent can modify will eventually be modified by the agent — not from malice, but from training-gradient pressure toward task-looks-done (see SPEC-EVOLUTION-CHECK-GENERALIZED.md for the theory).

## The seven layers

### L1 — Platform-level permissions

Out-of-repo, administered at the org/platform level. Agents with repo-scope tokens cannot modify these.

- GitHub branch protection (main writable only via PR)
- CODEOWNERS requiring specific reviewers
- Push rulesets, force-push blocks
- Enterprise MCP allowlists (which MCP servers are usable at all)
- Separation of duties (writer ≠ approver)

**Evidence**: GitHub Copilot Coding Agent's four architectural defaults (branch isolation to `copilot/` prefix, network firewall, action execution approval, separation of duties). Stripe's Blueprint Engine architecture assumes no agent edits to CI config. Every team has this layer.

### L2 — Structural execution gates

Deterministic non-LLM checks interleaved with agent work. The agent literally cannot skip the linter, bypass CI, or proceed without a passing check.

- Required CI status checks
- Custom linters with remediation error messages (OpenAI pattern — the error message itself teaches the fix)
- Structural tests of architectural invariants (layered dependency rules, naming conventions, file-size limits)
- Stripe's Blueprint Engine: DAG of alternating deterministic + agentic nodes; the deterministic nodes never invoke an LLM

**Evidence**: OpenAI Harness — "parse data shapes at the boundary," rigid `Types → Config → Repo → Service → Runtime → UI` layering enforced mechanically. Stripe — "The model does not run the system. The system runs the model."

### L3 — Capability-ceiling environment

Each agent task runs in a sandboxed, ephemeral environment that bounds its blast radius.

- Stripe DevBoxes (pre-warmed AWS EC2, isolated, disposable, 10-second boot)
- GitHub Actions containers (ephemeral, isolated, per-task)
- OpenAI per-worktree bootable app + observability stack

**Evidence**: Stripe's design philosophy — "What's good for humans is good for agents." The DevBox is a clone of the dev env, not a stripped-down agent-specific one. Environment IS the capability ceiling.

### L4 — Tool governance

Default-deny capability model. The agent sees only the tool handles it needs for this step.

- Stripe Tool Shed (MCP): ~500 tools total, meta-tool exposes 15–20 relevant for the current step via deterministic rule-based selection. Agent never sees the rest.
- GitHub Copilot enterprise MCP allowlists

**Evidence**: Stripe Minions Part 2 — the meta-tool is a deterministic capability filter; not the agent choosing which tools to load.

### L5 — Multi-agent adversarial review with uncorrelated context

The single highest-leverage layer. An agent that wrote work cannot objectively evaluate it; prior reasoning biases toward confirming what it already did. Solution: a fresh agent with separate context window reviews.

- Anthropic Code Review product: team of agents per PR, ~20 min, $15–25/PR, 84 % of large PRs get findings, < 1 % disagreement rate
- OpenAI Ralph Wiggum Loop (references Ghuntley pattern): "iterate until all agent reviewers are satisfied"
- Factory AI Missions: Scrutiny validators + User-testing validators, always fresh agents
- Sourcegraph Amp Oracle/Worker: different *model* (o3 or Gemini 2.5 Pro) asks "is there a better solution?"
- Boris Cherny's competing subagents: one hunts bugs, one challenges whether they're real

**Theoretical basis**: Factory AI post articulates it cleanly — "agents are highly reactive to their context; an agent's trajectory is append-only; implementer bias is structural."

**Solo adaptation**: a cheap model (Haiku tier) invoked via GitHub Action on every PR, prompted as fresh skeptical reviewer with no author intent context. ~$1–5/PR.

### L6 — Federated directory-scoped rules

Rules live next to the code they govern, in small scoped files, maintained by whoever owns that directory. No monolithic encyclopedia.

- Stripe directory-scoped rule files (Cursor format: markdown + YAML frontmatter, conditionally loaded by path)
- OpenAI: `AGENTS.md` as ~100-line table-of-contents + `docs/` subdirs for progressive disclosure
- Cursor: `.cursor/rules/*.mdc` with `globs:` scoping
- Emerging `.agents/rules/` standard (`agentsmd/agents.md` proposal)

**Evidence**: OpenAI's "one big AGENTS.md" failed in predictable ways: "Context is a scarce resource... too much guidance becomes non-guidance... rots instantly... hard to verify." Small + scoped + progressively loaded beats large + comprehensive.

### L7 — Compounding memory + automated cleanup loops

Living artifacts that encode institutional learnings and are mechanically pruned. Memory IS storage; cleanup IS a recurring agent.

- Anthropic living `CLAUDE.md` (~2,500 tokens, updated weekly via `@.claude` mention in PR review)
- OpenAI golden-principles + recurring "doc-gardening" agent that scans for stale rules and opens fix-up PRs
- "Promote the rule into code" (OpenAI) — when docs fall short, the rule is migrated to a mechanical check
- Letta sleep-time compute — primary agent does work, sleep-time agent consolidates memory async (see SPEC-THOUGHTBOX-SLEEP-TIME.md)

**Key insight**: without automated cleanup loops, governance accretes monotonically until a crisis purge. With automated cleanup, entropy is paid continuously in small increments. Lehman's Second Law — complexity grows unless matched cleanup is invested.

## Why seven layers, not one strong layer?

Swiss-Cheese Model (James Reason 1990). Each layer is imperfect; alignment of holes across independent layers produces accidents. Defense in depth works ONLY if layers are INDEPENDENT.

Previous attempts in this repo accumulated multiple instruction-layer mechanisms (`bead-workflow`, `HDD`, Ulysses, Theseus, Delphi protocols, various CLAUDE.md and AGENTS.md sections). These shared the same failure mode — agent reads prose, agent may or may not obey, no structural enforcement. Five layers at the same layer equals one layer for Swiss-Cheese purposes.

The seven layers above are genuinely independent: an agent routing around L5 (adversarial review by writing cleverer compliance-shaped code) still gets blocked by L1 (no write access to main) and L2 (CI fails on structural invariant violation) and L6 (directory rule loader injects specific context). Holes in one layer are caught by another.

## Mapping to Goodhart variants

| Goodhart variant (Manheim-Garrabrant 2018) | Counter-layer |
|---|---|
| Regressional (imperfect proxy correlation) | L2 structural checks (near-perfect correlators: types, compilers, tests) |
| Extremal (optimization into tail breaks rule) | Retry caps (Stripe's 2 CI rounds), bounded trajectory lengths |
| Causal (non-causal proxy) | L3 + L5 — execute and observe real behavior, not just read artifacts |
| Adversarial (metric-manipulation) | L1 + L5 + L7 — enforcement outside agent reach, adversarial review, continuous cleanup |

## Solo-operator subset

Of the seven layers, 17 of the 20 cross-cutting patterns identified in session `316ec05c` are viable without headcount. The three team-dependent ones (GitHub separation-of-duties enforcing different approver than assigner; multi-human PR review as gate; org-level admin roles held by non-developer team) are substituted in solo by: automated adversarial review (replaces human reviewer) + bot-identity commits + CODEOWNERS requiring non-bot approval.

See `STARTER-TIER-A.md` for the concrete starter set.

## Non-goals

- This is not a complete blueprint for rebuilding this repo's governance. It's a mental model for *which direction* to invest.
- This is not a recommendation to adopt all seven layers at once. Starting with L1 + L7 is often correct.
- This is not a claim that this architecture eliminates drift. Goal: reduce time-to-detect drift from weeks/months to under 48 hours.

## References

See README.md for the knowledge-graph entity IDs and notebook IDs that back these findings.
