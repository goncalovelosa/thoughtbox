# SPEC: Thoughtbox Dark Factory (Agent-Operated GTM System)

**Status:** Draft
**Priority:** P1 — Required for sustainable operations by Week 3
**Source:** GTM planning session a6c60112, thoughts 62, 95, 110, 138, 166-170

## Overview

The "dark factory" is an agent-operated business operations system for Thoughtbox's go-to-market. It coordinates Thoughtbox (reasoning), AgentMail (communication), Websets (research), and Claude Code (execution) into an autonomous system that runs with minimal human input.

**Design constraint:** A new parent at 3 AM should be able to check the state of the business from their phone by browsing files. No custom servers to maintain. No databases to babysit.

## Architecture

The dark factory is NOT a custom application. It is:
- A set of **prompt templates** (one per operation)
- A **schedule configuration** (cron)
- A **file-based state system** (directories and JSONL logs)
- A **bootstrap script** that wires everything together
- **Claude Code scheduled triggers** as the execution engine

Each operation is a Claude Code session with a specific prompt that uses MCP tools. The scheduler triggers sessions. The sessions use Thoughtbox, AgentMail, and Websets MCPs. No custom integration code needed.

## Implementation Shape

```
thoughtbox-ops/
  ops/
    prompts/                        # One markdown file per operation
      morning-brief.md
      lead-processor.md
      content-publisher.md
      outreach-generator.md
      metrics-compiler.md
      nurture-sequencer.md
      audit-deliverer.md
    schedule.yaml                   # Cron schedule for all operations
    bootstrap.sh                    # One-time setup script

  config/
    ops-config.yaml                 # Master config (API key refs, defaults)
    email-sequences.yaml            # Nurture sequence definitions
    content-calendar.yaml           # Planned content with dates
    outreach-templates/             # Personalized message templates
    brief-template.md               # Morning brief format
    report-template.md              # Weekly report format
    audit-report-template.md        # Audit deliverable format

  state/
    pipeline.jsonl                  # Lead pipeline (append-only)
    content-log.jsonl               # Published content log
    operation-log.jsonl             # Every operation execution
    metrics/                        # Historical metrics snapshots
      week-01.json
    stargazers.json                 # GitHub stargazer contact status

  review/                           # Items awaiting human approval
    emails/
      outreach/
      nurture/
      stargazers/
    tweets/
    posts/
    audits/
      [lead-name]/
        report.md
        session-link.txt
        form-data.json

  approved/                         # Human-approved, ready for execution
    emails/
    tweets/
    posts/
    audits/

  published/                        # Successfully executed (archive)
    emails/
    tweets/
    posts/
    audits/

  briefs/                           # Daily morning briefs
    2026-04-10.md

  reports/                          # Weekly metrics reports
    week-01.md
```

## Operations Catalog

### OP-001: Morning Brief
**Schedule:** Daily 7:00 AM
**Inputs:** GitHub API, AgentMail inbox, Tally webhooks, Stripe API
**Process:**
1. Fetch overnight GitHub activity (new stars, issues, forks, PRs)
2. Check AgentMail inbox for new messages
3. Check Tally for new audit form submissions
4. Check Stripe for new payments/subscription changes
5. Identify today's WIN (most positive overnight event)
6. Generate 3 priority actions for today
7. Write brief to `briefs/YYYY-MM-DD.md`
8. Send summary notification via AgentMail

**Brief format:**
```
=== THOUGHTBOX MORNING BRIEF — [Day, Date] ===

TODAY'S WIN:
[One positive thing that happened overnight]

YOUR 3 THINGS TODAY:
1. [Action] — [time estimate]
2. [Action] — [time estimate]
3. [Action] — [time estimate]

WHAT CLAUDE DID OVERNIGHT:
- [Action] — [result]

IN YOUR REVIEW QUEUE:
- [X] emails, [X] audits, [X] tweets

NUMBERS:
Stars: [X] (+delta) | Traffic: [X] | Pipeline: [X] leads
Revenue: $[X] this week | MRR: $[X]

NOTHING IS ON FIRE.
```

### OP-002: Lead Processor
**Trigger:** New Tally form submission (webhook) OR daily 11:00 AM
**Inputs:** Form submission data, optionally GitHub repo URL
**Process:**
1. Parse form submission (email, company, agent count, pain points)
2. Qualify lead (score 1-10 based on agent count, use case, pain description)
3. If GitHub URL provided: analyze agent configuration files
4. Run a 30-50 thought Thoughtbox session analyzing their setup
5. Generate audit report from session using audit-report-template.md
6. Write report to `review/audits/[lead-name]/`
7. Create lead record in `state/pipeline.jsonl`
8. Notify founder: "New audit ready for review"

**Qualification scoring:**
- Agent count 1-2: +1, 3-10: +3, 10-50: +5, 50+: +7
- Use case (research/planning/debugging): +2
- Pain description mentions audit/compliance: +3
- Uses Claude Code: +2
- GitHub URL provided: +1

### OP-003: Content Publisher
**Schedule:** Daily 9:00 AM
**Inputs:** `approved/` directory contents
**Process:**
1. Check `approved/tweets/` for approved tweet files
2. Post first approved tweet (note: may need manual posting initially)
3. Check `approved/posts/` for approved blog posts
4. Publish to dev.to (via API), cross-reference Medium/Hashnode
5. Move published items to `published/`
6. Log to `state/content-log.jsonl`

### OP-004: Outreach Generator
**Schedule:** Monday 10:00 AM
**Inputs:** Exa Websets monitor results, outreach templates
**Process:**
1. Check Websets monitors for new matching companies
2. For each match: research company via Exa (tech stack, agent usage)
3. Select appropriate outreach template
4. Personalize with company-specific details
5. Write drafts to `review/emails/outreach/`
6. Notify founder: "X new outreach emails ready"

### OP-005: Metrics Compiler
**Schedule:** Friday 5:00 PM
**Inputs:** GitHub API, Stripe API, content platforms, pipeline state
**Process:**
1. Pull GitHub metrics (stars delta, issues, forks, traffic)
2. Pull Stripe metrics (revenue, MRR, new subscriptions)
3. Pull content metrics (blog views, social engagement)
4. Pull pipeline metrics (leads by stage, conversion rates)
5. Compare to previous week
6. Generate weekly report
7. Write to `state/reports/week-N.md`
8. Save metrics snapshot to `state/metrics/week-N.json`
9. Send report via AgentMail

### OP-006: Nurture Sequencer
**Schedule:** Daily 10:00 AM
**Inputs:** `state/pipeline.jsonl`, `config/email-sequences.yaml`
**Process:**
1. Read pipeline, find leads at each sequence stage
2. For each lead due for a sequence email: generate from template
3. Write drafts to `review/emails/nurture/`
4. Update pipeline state with "email queued"

### OP-007: Audit Deliverer
**Trigger:** File moved from `review/audits/` to `approved/audits/`
**Inputs:** Approved audit report
**Process:**
1. Format report as clean deliverable
2. Send via AgentMail with session explorer link
3. Update pipeline state to "delivered"
4. Schedule follow-up emails (Day 3, Day 7, Day 14)
5. Move to `published/audits/`

## MCP Integration Contracts

### Thoughtbox
- `tb.thought()` — Record thoughts during audit analysis sessions
- `tb.session.list()` — Session stats for metrics
- `tb.session.export()` — Export sessions for reports
- `tb.knowledge.stats()` — KG metrics for weekly report

### AgentMail (Code Mode)
- Send email (to, subject, body, optional attachments)
- Read inbox (check for responses to outreach/audit follow-ups)
- List sent messages (delivery tracking)

### Websets (Code Mode)
- Check monitors for new company matches
- Search for company details / enrichment
- Create/update monitoring websets

### External APIs
- **GitHub:** `gh` CLI for stars, issues, forks, traffic
- **Stripe:** Stripe CLI or API for payments, subscriptions, MRR
- **Tally:** Webhook or API for form submissions
- **dev.to:** API for blog publishing
- **Hashnode:** API for blog publishing

## State Design Principles

1. **Append-only logs:** `pipeline.jsonl`, `content-log.jsonl`, `operation-log.jsonl` are append-only. Never edit or delete. Complete audit trail.
2. **File-based:** No database. Files are inspectable, diffable, git-trackable. Browsable on a phone.
3. **Review queue is a directory:** Moving files from `review/` to `approved/` IS the approval action. Works with Finder, VS Code, or terminal.
4. **Idempotent operations:** Operations check `operation-log.jsonl` before executing. Running twice is safe.
5. **Recoverable:** If state is lost, rebuild from external APIs. History is nice-to-have.

## Pipeline JSONL Record Format

```json
{
  "id": "lead-001",
  "timestamp": "2026-04-15T10:30:00Z",
  "email": "alice@company.com",
  "company": "Acme AI",
  "source": "tally-form",
  "stage": "audit-delivered",
  "score": 8,
  "form_data": {},
  "audit_session_id": "abc-123",
  "events": [
    { "type": "form-submitted", "at": "2026-04-15T10:30:00Z" },
    { "type": "audit-generated", "at": "2026-04-15T14:00:00Z" },
    { "type": "audit-approved", "at": "2026-04-16T08:00:00Z" },
    { "type": "audit-delivered", "at": "2026-04-16T08:05:00Z" },
    { "type": "followup-day3-sent", "at": "2026-04-19T10:00:00Z" }
  ]
}
```

## Schedule Configuration

```yaml
# ops/schedule.yaml
operations:
  morning-brief:
    cron: "0 7 * * *"           # Daily 7 AM
    prompt: prompts/morning-brief.md
    priority: high

  content-publisher:
    cron: "0 9 * * *"           # Daily 9 AM
    prompt: prompts/content-publisher.md
    priority: medium

  nurture-sequencer:
    cron: "0 10 * * *"          # Daily 10 AM
    prompt: prompts/nurture-sequencer.md
    priority: medium

  lead-processor:
    cron: "0 11 * * *"          # Daily 11 AM (also webhook-triggered)
    prompt: prompts/lead-processor.md
    priority: high
    webhook: tally-form-submission

  outreach-generator:
    cron: "0 10 * * 1"          # Monday 10 AM
    prompt: prompts/outreach-generator.md
    priority: medium

  metrics-compiler:
    cron: "0 17 * * 5"          # Friday 5 PM
    prompt: prompts/metrics-compiler.md
    priority: high
```

## Bootstrap Process

```bash
#!/bin/bash
# ops/bootstrap.sh — Initialize the dark factory

set -euo pipefail

OPS_DIR="${HOME}/thoughtbox-ops"

echo "Initializing Thoughtbox Dark Factory..."

# Create directory structure
mkdir -p "${OPS_DIR}"/{config,state/metrics}
mkdir -p "${OPS_DIR}"/review/{emails/{outreach,nurture,stargazers},tweets,posts,audits}
mkdir -p "${OPS_DIR}"/approved/{emails,tweets,posts,audits}
mkdir -p "${OPS_DIR}"/{published,briefs,reports}
mkdir -p "${OPS_DIR}"/ops/prompts

# Initialize state files
touch "${OPS_DIR}/state/pipeline.jsonl"
touch "${OPS_DIR}/state/content-log.jsonl"
touch "${OPS_DIR}/state/operation-log.jsonl"

# Copy prompt templates and configs
# (These would be copied from the repo)

echo "Dark factory initialized at ${OPS_DIR}"
echo "Next: Register scheduled triggers with Claude Code"
echo "First morning brief will run at 7 AM tomorrow"
```

## Human-in-the-Loop Protocol

The human's daily interaction:

**Morning (15 min):**
1. Read `briefs/YYYY-MM-DD.md`
2. Browse `review/` directory
3. Move approved items to `approved/`
4. Delete rejected items (or move to `review/rejected/` with a note)

**Evening (15 min, optional):**
1. Check for stargazer/lead responses in AgentMail
2. Scan any new items in `review/`
3. Quick check: "Nothing is on fire" ✓

**Weekly (30 min, Friday):**
1. Read weekly report
2. Make strategic decisions based on data
3. Adjust content calendar or outreach templates if needed

**Total:** 30-60 min/day active, declining to 15-30 min/day as patterns stabilize.

## Emergency Shutdown Mode

If the human needs to completely disengage:
1. Auto-response on audit form: "Reports delayed 2 weeks"
2. Pre-written content continues publishing from buffer
3. Scheduled agents continue morning briefs (as health check)
4. SaaS auto-renews
5. GitHub Issues get pinned notice
6. All outreach pauses
7. Nurture sequences pause

Can run 4-6 weeks with zero human input. Revenue decreases but doesn't stop.

## Re-entry Ramp

After extended absence:
- Week 1 back: 30 min/day (read briefs, approve critical items)
- Week 2 back: 1 hr/day (process audit backlog)
- Week 3 back: 1.5 hrs/day (restart content creation)
- Week 4 back: 2 hrs/day (full operations)
