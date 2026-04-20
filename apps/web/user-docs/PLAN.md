# User Documentation — Implementation Plan

## Goal

Ship four documentation pages that make a founding beta buyer think "this is a real product I can use." Pages live in `user-docs/` as markdown, rendered as part of the web app at `/docs`.

## Priority Order

| # | Page | Estimated Size | Blocked By |
|---|------|---------------|------------|
| 1 | Quickstart | ~80 lines | Nothing |
| 2 | Sessions & Thoughts | ~150 lines | Nothing |
| 3 | Code Mode | ~120 lines | Sessions & Thoughts (references concepts) |
| 4 | Authentication | ~80 lines | Nothing (dashboard key mgmt exists) |

Pages 1, 2, and 4 can be written in parallel. Page 3 depends on page 2 for concept definitions.

---

## Page 1: Quickstart (`quickstart.md`)

**Job:** 60 seconds from zero to "I see my first thought in the dashboard."

### Outline

1. **Get an API key** — Log in at [app URL], go to Settings > API Keys, create a key. Copy it.
2. **Add MCP config** — Drop this JSON into your Claude Code / Cursor / VS Code MCP config:
   ```json
   {
     "thoughtbox": {
       "type": "http",
       "url": "https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp?key=tbx_YOUR_KEY"
     }
   }
   ```
   Show where the config file lives for each client (Claude Code: `.mcp.json`, Cursor: settings, VS Code: settings).
3. **Send your first thought** — Paste this into your agent:
   > "Use thoughtbox to record a reasoning thought: I'm testing Thoughtbox for the first time."
4. **See it in the dashboard** — Go to Sessions in the web app. Your session appears with one thought.

### Content sources

- MCP config format: `.mcp.json` in repo root
- Service URL: `https://thoughtbox-mcp-272720136470.us-central1.run.app/mcp`
- Port/endpoint: `src/index.ts` (port 1731, path `/mcp`)

---

## Page 2: Sessions & Thoughts (`sessions-and-thoughts.md`)

**Job:** Explain the data model so users understand what they're recording and why.

### Outline

1. **What is a session?** — A session is thought 1 through thought N: the full reasoning trace from one agent interaction. Sessions have a title, tags, status (active/completed/abandoned), and auto-maintained thought and branch counts.

2. **What is a thought?** — A numbered, timestamped unit of reasoning linked to its predecessor. Thoughts are append-only (never edited after creation).

3. **Thought types** — Table with all 7 types, what each means, when to use it, and what extra payload it carries:

   | Type | Purpose | Extra fields |
   |------|---------|--------------|
   | `reasoning` | General analysis and exploration | — |
   | `decision_frame` | Choosing between options | `options[]` |
   | `action_report` | Recording what was done and what happened | `actionResult` |
   | `belief_snapshot` | Stating current beliefs for later comparison | `beliefs` |
   | `assumption_update` | Flagging a changed assumption | `assumptionChange` |
   | `context_snapshot` | Capturing environmental state | `contextData` |
   | `progress` | Tracking completion toward a goal | `progressData` |

4. **Confidence** — Each thought can carry `confidence: "high" | "medium" | "low"`.

5. **Branching** — How `branchId` and `branchFromThought` work. A branch diverges from a specific thought number and gets its own named track. Thought numbers are scoped per session+branch. Include a simple diagram showing thought 1-2-3, then branch "approach-a" from thought 2.

6. **Revisions** — How `isRevision` and `revisesThought` work. A revision is a new thought that logically supersedes an earlier one. The original is preserved (append-only). This is intellectual honesty over appearing consistent.

### Content sources

- Data model: `docs/architecture/data-model.md`
- SDK types: `src/code-mode/sdk-types.ts` (ThoughtInput interface)
- Patterns cookbook: `src/resources/patterns-cookbook-content.ts` (branching and revision patterns)

---

## Page 3: Code Mode (`code-mode.md`)

**Job:** Explain the two-tool interface and show concrete examples.

### Outline

1. **Why two tools?** — Most MCP servers expose dozens of individual tools. Each tool definition consumes context window tokens even when unused. Thoughtbox exposes exactly two tools (`thoughtbox_search` and `thoughtbox_execute`) to minimize context overhead. The agent writes JavaScript to discover and call operations.

2. **`thoughtbox_search`** — Discover what's available. Write a JS arrow function that receives a `catalog` object and returns filtered results. Read-only, 10s timeout.
   - Catalog structure: `operations` (by module: session, thought, knowledge, notebook, theseus, ulysses, observability), `prompts`, `resources`, `resourceTemplates`.
   - Example: find all session operations, find operations matching a keyword.

3. **`thoughtbox_execute`** — Do things. Write a JS arrow function using the `tb` SDK. 30s timeout.
   - The `tb` namespace:
     - `tb.thought(input)` — record a thought
     - `tb.session.list()`, `.get()`, `.search()`, `.resume()`, `.export()`, `.analyze()`, `.extractLearnings()`
     - `tb.knowledge.createEntity()`, `.getEntity()`, `.listEntities()`, `.addObservation()`, `.createRelation()`, `.queryGraph()`, `.stats()`
   - All methods return unwrapped results, not raw MCP envelopes.

4. **Examples** — 4-5 concrete code snippets:
   - Record a reasoning thought
   - List recent sessions
   - Export a session as markdown
   - Create a knowledge entity and add an observation
   - Search the knowledge graph

### Content sources

- Tool schemas: `src/code-mode/search-tool.ts`, `src/code-mode/execute-tool.ts`
- SDK types: `src/code-mode/sdk-types.ts`
- Catalog structure: `SearchCatalog` interface in search-tool.ts

---

## Page 4: Authentication (`authentication.md`)

**Job:** Explain how API keys work, how to manage them, and how they travel in requests.

### Outline

1. **API key format** — `tbx_<prefix>_<secret>`. The prefix is a fast-lookup index. The secret is bcrypt-hashed; the raw key is never stored.

2. **Creating a key** — In the web app: Settings > API Keys > Create. Copy the key immediately (it won't be shown again).

3. **Rotating a key** — Create a new key, update your MCP config, then revoke the old key.

4. **Revoking a key** — In the web app: Settings > API Keys > Revoke. The key stops working immediately (status flip, no deletion).

5. **How the key travels** — Two options:
   - URL query param: `https://...thoughtbox.../mcp?key=tbx_YOUR_KEY` (simplest for MCP config)
   - HTTP header: `Authorization: Bearer tbx_YOUR_KEY`
   - Header takes precedence if both are present.

6. **Key scoping** — Each key resolves to a workspace. All sessions, thoughts, and knowledge are scoped to that workspace. Different keys for the same workspace see the same data. Keys for different workspaces are isolated.

### Content sources

- Auth flow: `docs/architecture/auth-and-billing.md`
- Key extraction: `src/index.ts:200-203`
- Key verification: `src/auth/api-key.ts`
- Key resolution table: `docs/architecture/auth-and-billing.md`

---

## Implementation Notes

### What to defer (not in these four pages)

- REST API reference (no user-facing REST API)
- Hub / multi-agent collaboration
- Notebooks
- Theseus/Ulysses protocols
- Observability stack (Prometheus/Grafana)
- Reasoning Patterns cookbook (nice-to-have page 5, content exists in `src/resources/patterns-cookbook-content.ts`)
- Knowledge Graph deep-dive (nice-to-have page 6)
- Self-hosted / Docker setup (nice-to-have page 7)

### Open questions

1. **App URL** — What's the production URL for the web app? Needed for Quickstart and Auth pages (login link, dashboard link).
2. **Dashboard screenshots** — Should pages include screenshots of the dashboard (sessions list, API key management)? Or text-only for now?
3. **MCP client coverage** — The Quickstart mentions Claude Code, Cursor, and VS Code. Do we need config examples for all three, or just Claude Code for the beta?
4. **Rendering** — These are markdown files in `user-docs/`. How will they be rendered in the web app? MDX in Next.js? A docs framework? This affects whether we can use components (tabs, callouts) or need to stick to plain markdown.
