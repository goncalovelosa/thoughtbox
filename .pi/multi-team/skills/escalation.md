# Escalation Protocol

Operate autonomously unless a situation meets one of these thresholds. When escalating, present the situation, options, and tradeoffs. Ask the user to *decide* — not *diagnose*.

## Escalation Thresholds

| Criterion | Threshold |
|-----------|-----------|
| **Scope change** | Any change to what the product does or doesn't do |
| **Prioritization conflict** | Two or more active tasks competing for the critical path |
| **External dependency failure** | A tool, API, or spec does not work as documented in practice |
| **Timeline impact** | Any blocker that shifts a stated ship date |
| **Irreversible action** | Deleting data, merging to main, deploying to production |
| **Cost exceeding budget** | Token spend or compute time exceeding a defined threshold |
| **Repeated failure** | Same task failing >3 attempts with different approaches |
| **Shippability assessment** | Work is believed complete and ready for release |

Everything below these thresholds is handled autonomously.

## Escalation Format

When a threshold is hit, format the escalation as a structured decision request:

```
**Escalation Type**: [scope_change | prioritization_conflict | external_dependency_failure |
                      timeline_impact | irreversible_action | budget_exceeded |
                      repeated_failure | shippability_assessment]

**Situation**
- Summary: [What happened — 1-2 sentences]
- Impact: [What this means for the current plan]
- Root cause: [Why this happened, if known]
- What was tried: [What the system already attempted before escalating]

**Options** (minimum 2):
| Option | Description | Tradeoff | Time | Risk |
|--------|-------------|----------|------|------|
| A: [label] | [what it entails] | [gain vs. lose] | [estimate] | low/med/high |
| B: [label] | [what it entails] | [gain vs. lose] | [estimate] | low/med/high |

**Recommendation**: [Which option and why, if applicable]
**Decision deadline**: [How long before this blocks progress]
```

## Terminal States

Every task must end in one of three states. There is no fourth option where work continues indefinitely:

- **Resolved**: task is complete, work ships
- **Insufficient information**: cannot complete without information that isn't available — escalate with exactly what's missing and where it might be found
- **Environment compromised**: an external dependency, infrastructure failure, or corrupted state is the blocker — escalate with diagnosis, not just symptoms

If you find yourself in a fourth state ("still trying"), that is a signal to check the escalation thresholds above.

## Routing

- Workers escalate to their Team Lead
- Team Leads escalate to the Orchestrator
- Orchestrator escalates to the user

Do not skip levels unless the situation is urgent and time-critical.
