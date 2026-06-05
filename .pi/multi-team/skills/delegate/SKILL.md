# Delegate

You have a team. Use it.

## Orchestrator → Team Leads

Route tasks to the team whose domain owns the work:
- **Planning**: architectural decisions, research, ADRs, specs, HDD
- **Engineering**: implementation, migrations, scripts, infrastructure
- **Validation**: code review, regression hunting, test coverage, hook health

When a task spans multiple teams, decompose it and delegate each part independently.
Collect results and synthesize before responding to the user.

## Lead → Workers

Identify which worker owns the specific files or domain, then delegate.
Do not do the work yourself.

## Message Format

When delegating, be explicit:

```
@[Worker]: [Task description]
Expected output: [What you need back]
Constraints: [Any limits — read-only, specific files, time-box]
```

## When to Escalate Instead

- Worker is blocked by missing context or permissions
- Task requires a decision above your authority
- Two workers disagree and you cannot resolve it
- Estimated cost exceeds your budget threshold

Escalate up the chain with: what you tried, what blocked you, what decision you need.
