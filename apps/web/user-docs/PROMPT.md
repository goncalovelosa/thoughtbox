# User Documentation Requirements

For the docs to serve a founding beta buyer, here's what you need:

## Must-have Pages

### 1. Quickstart

- Get an API key
- Add the MCP config to Claude Code (and Cursor/VS Code)
- Send your first thought
- See it in the dashboard
- That's it. 60 seconds to working.

### 2. Sessions & Thoughts

- A session is thought 1 through thought N — the full reasoning trace from one agent interaction
- Thoughts are numbered, timestamped, linked to predecessors
- Thought types: the 7 semantic types (reasoning, decision_frame, action_report, belief_snapshot, assumption_update, context_snapshot, progress) — what each one means, when an agent would use each
- Branching: how branchId and branchFromThought work
- Revisions: how isRevision and revisesThought work

### 3. Code Mode

- Two tools: thoughtbox_search and thoughtbox_execute
- Why two tools instead of 44 individual ones (context window efficiency)
- The tb SDK namespaces: tb.thought(), tb.session.*, tb.knowledge.*
- A few concrete examples: record a thought, list sessions, export a session, query the knowledge graph

### 4. Authentication

- API key format (tbx_ prefix)
- How to create/rotate/revoke keys in the dashboard
- How the key goes in the MCP URL

## Nice-to-have but Not Blocking

### 5. Reasoning Patterns

Forward, backward, branching, revision, critique. The patterns cookbook content already exists in the MCP server at `src/resources/patterns-cookbook-content.ts` — just reformat it for the web.

### 6. Knowledge Graph

Entities, relations, visibility levels. Only matters if you're selling that capability in the beta.

### 7. Self-hosted / Docker Setup

Only if a beta buyer might want to run it locally instead of hosted.

## What NOT to Write Yet

- REST API reference (doesn't exist as a user-facing thing)
- Hub / multi-agent collaboration docs (not the beta wedge)
- Notebooks (not the beta wedge)
- Theseus/Ulysses protocols (power user stuff, not onboarding)
- Observability stack docs (Prometheus/Grafana — that's ops, not user-facing)

## Key Principle

The four must-haves are what make a buyer think "this is a real product I can use." Everything else can come after the first payment.