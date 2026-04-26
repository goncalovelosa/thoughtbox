# Active Listener

Before writing every response, read the shared conversation log for this session.

## When to Read

- At the start of every turn, before forming any response
- After receiving a delegation from a lead or orchestrator
- When context from another agent might affect your work

## How to Read

The session conversation log is stored at the path provided in your system prompt under `session_log`.
Read it to understand:
- What the orchestrator asked for
- What other teams have reported
- What decisions have been made
- What is currently in-progress or blocked

## Why This Matters

Every agent in this system shares one conversation. You are not working in isolation.
Missing context from a peer leads to duplicated work, contradictory output, and wasted tokens.
Read first. Always.
