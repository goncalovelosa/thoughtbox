<!-- srcbook:{"language":"javascript"} -->

# Stewardship MVP Starter — Where to Begin

_Exported from Thoughtbox notebook jtl0qpq77i9, research session 316ec05c._

###### package.json

```json
{
  "type": "module",
  "dependencies": {}
}
```

## Context

Research session `316ec05c` concluded that the user's observed pattern — "interventions produce inverse outcomes" — is predicted by specification-gaming theory (Goodhart Adversarial). Every successful AI-heavy team (Anthropic, OpenAI, Stripe, Factory AI, GitHub Copilot) defends via the same seven-layer architecture, with the defining property that **governance lives outside the agent-editable surface**.

This notebook produces the concrete starting artifacts:
1. A Tier A checklist you can copy into an issue.
2. A shell script that sets up GitHub branch protection via `gh` CLI.
3. A CODEOWNERS file you can drop into `.github/CODEOWNERS`.

Absolute MVP if you do only two things: **A1 (branch protection) + B5 (truth layer on outbound claims)**. That's <2 hours.

###### tier-a-checklist.js

```javascript
const items = [
  ["A1", "Enable GitHub branch protection on main (require PR, passing checks, block force-push, block direct commits)", "10 min"],
  ["A2", "Add CODEOWNERS requiring self-review on .claude/hooks/, .husky/, .github/workflows/, AGENTS.md, .adr/, .specs/", "30 min"],
  ["A3", "Audit and delete zombie agent infra: .pi/, prototypes/, stale .claude/hooks/*.sh, unreferenced .specs/", "1 hr"],
  ["A4", "Prune AGENTS.md + CLAUDE.md to ≤200 lines (table-of-contents form); move details to docs/ subdirs", "1-2 hr"],
  ["A5", "Add GitHub Action that posts claim-check report on every PR (cross-check claims vs diff)", "2-4 hr"],
  ["B5", "Deploy outbound-claim truth layer: intermediary for Discord/Slack/PR-comment agent notifications that cross-references against git log + CI", "1 day"],
  ["B1", "Adversarial review GitHub Action: fresh-context skeptical reviewer (use cheap model) on every PR touching src/ | .specs/ | .adr/", "1-2 days"]
];

const md = [
  "# Tier A + MVP Starter Checklist",
  "",
  "_Generated from research session 316ec05c._",
  "",
  ...items.map(([id, desc, est]) => `- [ ] **${id}** (${est}) — ${desc}`),
  "",
  "## Priority if time-boxed",
  "",
  "If you only have 2 hours: **A1 + B5** alone addresses today's two acute failure modes.",
  "",
  "If you have a focused week: **A1 → A2 → B5 → A3+A4 → B1 → A5**.",
  "",
  "## Success metric at 3 months",
  "",
  "Time-to-detect governance drift should be under 48 hours, down from weeks/months."
];

console.log(md.join("\n"));
```

###### setup-branch-protection.sh

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="Kastalien-Research/thoughtbox"
BRANCH="main"

echo "Enabling branch protection on ${REPO}:${BRANCH}..."

gh api --method PUT "repos/${REPO}/branches/${BRANCH}/protection" \
  -H "Accept: application/vnd.github+json" \
  -f "required_status_checks[strict]=true" \
  -f "required_status_checks[contexts][]=" \
  -f "enforce_admins=false" \
  -f "required_pull_request_reviews[required_approving_review_count]=1" \
  -f "required_pull_request_reviews[dismiss_stale_reviews]=true" \
  -F "restrictions=" \
  -F "allow_force_pushes=false" \
  -F "allow_deletions=false" \
  -F "required_conversation_resolution=true"

echo "✓ Branch protection enabled on ${BRANCH}."
echo
echo "Verify with:"
echo "  gh api repos/${REPO}/branches/${BRANCH}/protection | jq"
```

###### CODEOWNERS

```
# CODEOWNERS — agents-aware governance gate
# Generated from research session 316ec05c.
# Reviews from @glassBead required before merge of any change to these paths.

# hook infrastructure — governance edits require explicit review
.claude/hooks/ @glassBead

# pre-commit/pre-push gates
.husky/ @glassBead

# CI definitions
.github/workflows/ @glassBead

# ownership file itself
.github/CODEOWNERS @glassBead

# top-level agent instructions
AGENTS.md @glassBead

# Claude-specific instructions
CLAUDE.md @glassBead

# ADR lifecycle
.adr/ @glassBead

# specifications
.specs/ @glassBead

# plugin CLI — user-facing surface
plugins/thoughtbox-claude-code/src/cli/ @glassBead

# schema evolution
supabase/migrations/ @glassBead
```

## B5 sketch — outbound-claim truth layer

Simplest form: Cloudflare Worker / Deno edge function. Accepts an agent notification payload, queries GitHub API for the claimed state, then either forwards verified or rewrites the message with a ❌ annotation.

```javascript
// Pseudocode — not executable in this notebook
async function verifyClaimedMerge(payload) {
  const m = payload.text.match(/merged PR #(\d+) to main/i);
  if (!m) return payload; // no merge claim — pass through

  const pr = m[1];
  const res = await fetch(`https://api.github.com/repos/${REPO}/pulls/${pr}`, {
    headers: { Authorization: `token ${GITHUB_TOKEN}` }
  });
  const data = await res.json();

  if (data.merged) return payload;

  return {
    ...payload,
    text: `⚠ UNVERIFIED: ${payload.text}\n(PR #${pr} is not merged to main as of ${new Date().toISOString()})`
  };
}
```
