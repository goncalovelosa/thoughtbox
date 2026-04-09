# Thoughtbox

**Mind-expansion for AI agents.** Give Claude Code structured reasoning, persistent memory, and a knowledge graph. Let it think for hours, not minutes.

[Live Demo: Browse a 167-thought research session](https://thoughtbox.dev/sessions/880b76fa) | [npm](https://www.npmjs.com/package/thoughtbox) | [GitHub](https://github.com/Kastalien-Research/thoughtbox) | MIT License

---

## Quick Start (2 minutes)

Add this to your Claude Code `settings.json`:

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "npx",
      "args": ["-y", "thoughtbox@latest"],
      "env": {
        "THOUGHTBOX_TRANSPORT": "stdio"
      }
    }
  }
}
```

That's it. Your agent now has access to structured reasoning, persistent memory, and a knowledge graph.

---

## See It in Action

[Browse the 167-thought research session](https://thoughtbox.dev/sessions/880b76fa)

A single Claude Code agent spent hours mapping the agentic reasoning landscape -- evaluating competitors, identifying positioning gaps, and synthesizing a go-to-market strategy. Every thought is numbered, linked, and explorable.

<!-- TODO: Add screenshot of session explorer showing the 167-thought graph -->
![Session Explorer](placeholder-session-explorer.png)

---

## What Is This?

Thoughtbox is an MCP server that gives AI agents seven capabilities they don't have natively:

| Module | What it does |
|--------|-------------|
| **Thoughts** | Numbered, linked reasoning nodes with branching, revision, and critique |
| **Sessions** | Persistent containers that organize thoughts across hours-long work |
| **Knowledge Graph** | Entity-relation memory that persists across sessions |
| **Notebooks** | Literate programming -- documentation interleaved with executable code |
| **Hub** | Multi-agent coordination: workspaces, problems, proposals, consensus |
| **Observatory** | Real-time visualization of reasoning as it unfolds |
| **Protocols** | Ulysses (pre-committed recovery) and Theseus (safe refactoring) |

Everything runs locally. All data stays at `~/.thoughtbox/`.

---

## When to Use Thoughtbox

Thoughtbox is for extended reasoning tasks where an agent needs to track its own thinking.

| Task type | Why Thoughtbox helps |
|-----------|---------------------|
| **Research & Analysis** (30+ min) | The agent builds up a knowledge base across dozens of thoughts, revisiting and refining earlier conclusions |
| **Strategic Planning** | Multi-pass reasoning with backward planning from goals, branching to compare alternatives |
| **Complex Debugging** | Hypothesis tracking -- the agent records what it tried, what it ruled out, and why |
| **Architecture Design** | Trade-off analysis with explicit decision frames and belief snapshots |

**For quick tasks (under 10 minutes), think natively.** Thoughtbox adds overhead that only pays off when reasoning is long enough to forget where it started.

---

## Code Mode

Thoughtbox exposes exactly **two MCP tools**:

- **`thoughtbox_search`** -- Write JavaScript to query the operation catalog. Full programmatic filtering over all available operations.
- **`thoughtbox_execute`** -- Write JavaScript using the `tb` SDK to chain operations. Access thoughts, sessions, knowledge, notebooks, hub, observability, and protocols through a unified namespace.

This two-tool surface replaces per-operation tool registration. It scales without bloating the context window.

**Workflow:** search to discover available operations, then execute code against them. Use `console.log()` for debugging -- output is captured in response logs.

---

## Installation

### Quick (npx, no Docker)

Add to `~/.claude/settings.json` or your project's `.claude/settings.json`:

```json
{
  "mcpServers": {
    "thoughtbox": {
      "command": "npx",
      "args": ["-y", "thoughtbox@latest"],
      "env": {
        "THOUGHTBOX_TRANSPORT": "stdio"
      }
    }
  }
}
```

### Docker (persistent deployment with observability)

```bash
git clone https://github.com/Kastalien-Research/thoughtbox.git
cd thoughtbox
docker compose up --build
```

This starts the MCP server (port 1731), Observatory UI (port 1729), and the full observability stack (OpenTelemetry, Prometheus, Grafana).

Then configure Claude Code to connect via HTTP:

```json
{
  "mcpServers": {
    "thoughtbox": {
      "url": "http://localhost:1731/mcp"
    }
  }
}
```

To route through the observability sidecar (adds OpenTelemetry tracing):

```json
{
  "mcpServers": {
    "thoughtbox": {
      "url": "http://localhost:4000/mcp"
    }
  }
}
```

### Other MCP Clients

Thoughtbox is currently optimized for Claude Code. For Cline / VS Code, add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "thoughtbox": {
      "url": "http://localhost:1731/mcp"
    }
  }
}
```

If you're using a different client and encounter issues, please [open an issue](https://github.com/Kastalien-Research/thoughtbox/issues).

---

## Want Help?

- **Free Agent Reasoning Audit** -- We'll review how your agents reason and where structured thinking would help. [Request an audit](https://thoughtbox.dev/audit)
- **Implementation support** -- Need help integrating Thoughtbox into your workflow? [Contact us](https://thoughtbox.dev/support)
- **Thoughtbox Cloud** -- Managed deployment with team collaboration and hosted sessions. [See pricing](https://thoughtbox.dev/pricing)

---

## Multi-Agent Collaboration

The Hub is the coordination layer. Agents register with role-specific profiles, join shared workspaces, and work through a structured problem-solving workflow via `thoughtbox_execute`.

**The workflow:** register -- create workspace -- create problem -- claim -- work -- propose solution -- peer review -- merge -- consensus

**Workspace primitives:**

- **Problem** -- A unit of work with dependencies, sub-problems, and status tracking (open -- in-progress -- resolved -- closed)
- **Proposal** -- A proposed solution with a source branch reference and review workflow
- **Consensus** -- A decision marker tied to a thought reference for traceability
- **Channel** -- A message stream scoped to a problem for discussion

**Agent Profiles:** `MANAGER`, `ARCHITECT`, `DEBUGGER`, `SECURITY`, `RESEARCHER`, `REVIEWER` -- each provides domain-specific mental models and behavioral priming.

28 operations across identity, workspace management, problems, proposals, consensus, channels, and status reporting.

---

## Auditable Reasoning

Every thought is a node in a graph -- numbered, timestamped, linked to its predecessors, and persisted across sessions. This creates an auditable trail of how conclusions were reached.

Agents can think forward, plan backward, branch into parallel explorations, revise earlier conclusions, and request autonomous critique via MCP sampling. Each pattern is a first-class operation:

| Pattern | Description | Use case |
|---------|-------------|----------|
| **Forward** | Sequential 1 -- 2 -- 3 -- N progression | Exploration, discovery, open-ended analysis |
| **Backward** | Start at goal (N), work back to start (1) | Planning, system design, working from known goals |
| **Branching** | Fork into parallel explorations (A, B, C...) | Comparing alternatives, A/B scenarios |
| **Revision** | Update earlier thoughts with new information | Error correction, refined understanding |
| **Critique** | Autonomous LLM review via MCP sampling | Self-checking, quality gates |

Each thought carries a semantic `thoughtType` (`reasoning`, `decision_frame`, `action_report`, `belief_snapshot`, `assumption_update`, `context_snapshot`, `progress`) that classifies what kind of thought it is, orthogonal to the process pattern used.

See the **[Patterns Cookbook](src/resources/docs/thoughtbox-patterns-cookbook.md)** for examples.

---

## Real-Time Observability

The **Observatory** is a built-in web UI at `http://localhost:1729` for watching reasoning unfold live.

- **Live Graph** -- Thoughts appear as nodes in real-time via WebSocket
- **Branch Navigation** -- Branches collapse into clickable stubs; drill in and back out
- **Detail Panel** -- Click any node to view full thought content
- **Multi-Session** -- Switch between active reasoning sessions
- **Deep Analysis** -- Analyze sessions for reasoning patterns, cognitive load, and decision points

The full observability stack includes OpenTelemetry tracing, Prometheus metrics, and Grafana dashboards.

---

## Knowledge & Reasoning Tools

**Knowledge Graph** -- Persistent memory across sessions. Capture insights, concepts, workflows, and decisions as typed entities with typed relations (`BUILDS_ON`, `CONTRADICTS`, `SUPERSEDES`, etc.) and visibility controls (`public`, `agent-private`, `team-private`).

**Notebooks** -- Interactive literate programming combining documentation with executable JavaScript/TypeScript in isolated environments.

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `THOUGHTBOX_DATA_DIR` | Base directory for persistent storage | `~/.thoughtbox` |
| `THOUGHTBOX_PROJECT` | Project scope for session isolation | `_default` |
| `THOUGHTBOX_TRANSPORT` | Transport type (`stdio` or `http`) | `http` |
| `THOUGHTBOX_STORAGE` | Storage backend (`fs`, `memory`, or `supabase`) | `fs` |
| `THOUGHTBOX_OBSERVATORY_ENABLED` | Enable Observatory web UI | `false` |
| `THOUGHTBOX_OBSERVATORY_PORT` | Observatory UI port | `1729` |
| `THOUGHTBOX_AGENT_ID` | Pre-assigned Hub agent ID | (none) |
| `THOUGHTBOX_AGENT_NAME` | Pre-assigned Hub agent name | (none) |
| `PORT` | HTTP server port | `1731` |
| `HOST` | HTTP server bind address | `0.0.0.0` |

See the full list in the [source repository](https://github.com/Kastalien-Research/thoughtbox).

---

## Development

For local development (requires Node.js 22+):

```bash
pnpm install
pnpm build
pnpm dev      # Development with hot reload
```

### Testing

```bash
npx vitest run              # Unit tests
pnpm test                   # Full suite (build + vitest)
pnpm test:agentic           # Agentic tests (full suite)
pnpm test:behavioral        # Behavioral contract tests
```

### Docker Compose Services

| Service | Port | Description |
|---------|------|-------------|
| **thoughtbox** | 1731 (MCP), 1729 (Observatory) | Core MCP server + Observatory UI |
| **mcp-sidecar** | 4000 | Observability proxy with OpenTelemetry |
| **otel-collector** | 4318 (HTTP), 8889 (metrics) | OpenTelemetry Collector |
| **prometheus** | 9090 | Metrics storage + alerting |
| **grafana** | 3001 | Dashboards and visualization |

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, commit conventions, and the pull request process.

## License

MIT License -- free to use, modify, and distribute.
