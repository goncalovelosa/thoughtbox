# Show HN Submission

## Title Options

**A (recommended):** Show HN: We built mind-expansion for Claude Code. It thought for 2 hours straight

**B:** Show HN: We gave Claude Code a mind-expansion tool and let it think for 2.5 hours

**C:** Show HN: What happens when you give an AI agent 167 structured thoughts

## URL

`https://thoughtbox.dev/blog/167-thoughts` (TBD -- publish before submission)

## First Comment (Maker Context)

Post this immediately after submission:

---

Hey HN -- I'm the solo developer behind Thoughtbox. It's an MCP server that gives AI agents persistent, structured memory: sessions with typed thoughts, a knowledge graph, notebooks, and observability.

The 167-thought session in the title was real. I pointed Claude Code at 30+ agentic reasoning papers and let it research autonomously using Thoughtbox for ~2.5 hours. It produced:

- A complete survey of agentic reasoning paradigms
- 17 knowledge graph entities with cross-paper connections
- 12 belief snapshots where it tracked how its understanding changed
- 5 implementation specs for features it designed itself

None of this would have survived a normal context window. The session generated ~540KB of research across 8 crawled papers, far beyond what fits in a single prompt. Thoughtbox acted as external working memory -- the agent could write structured thoughts, query what it had already figured out, and build on its own prior reasoning.

The core thesis: the bottleneck on agent capability right now is cognitive infrastructure, not model intelligence. Agents are smart enough. They just can't remember what they were doing 45 minutes ago.

Thoughtbox is open source (MCP server), with a hosted version at thoughtbox.dev. You can browse the actual 167-thought session at [session explorer link TBD].

Happy to answer questions about MCP, structured reasoning, or what we learned from watching an agent think for 2 hours straight.

---

## Prepared Responses to Objections

### "This is just a wrapper around [Claude/MCP/SQLite]"

> Fair question. Thoughtbox uses MCP as the transport, but the value is in the reasoning primitives -- typed thoughts (belief snapshots, decision frames, assumption updates), a knowledge graph with typed relations, and session-scoped context that persists across tool calls.
>
> A wrapper would be "save text to a file." Thoughtbox gives the agent cognitive operations: revise a belief, fork a reasoning path, query what it concluded three steps ago. The 167-thought session wouldn't have produced novel cross-paper insights with a flat text file -- the agent needed to search its own prior reasoning to make connections.

### "Context windows are getting bigger, this won't matter"

> Context windows are at 1M+ tokens already. The problem isn't capacity -- it's structure. Dumping 540KB of research into a prompt gives the model everything at once with no organization. Thoughtbox gives the agent the ability to write, search, and build on structured thoughts incrementally.
>
> The Library Theorem (Mainen 2026) formalizes this: indexed external memory provides exponential advantage over sequential context, even with unlimited window size. It's the same reason humans use notebooks instead of trying to hold everything in working memory.

### "How is this different from Mem0 / other memory servers?"

> Mem0 and similar tools are memory-first: they store and retrieve facts. Thoughtbox is reasoning-first: it gives agents typed cognitive operations (belief snapshots, decision frames, progress checkpoints) and a knowledge graph with semantic relations.
>
> The difference shows up in practice. A memory server can tell an agent "you previously discussed X." Thoughtbox can tell an agent "your belief about X changed at thought #47, here's the before and after, and here are three entities in the knowledge graph that connect to that belief."
>
> We surveyed 30+ tools in this space during the research session. The closest competitors are Prism MCP (Hebbian learning) and NEXO Brain (150+ tools). Thoughtbox's differentiator is integration depth across 7 modules and the reasoning-first design.

### "I wouldn't use this / I don't see the use case"

> Totally fair. If you're using agents for short tasks (code review, one-off scripts), you don't need this.
>
> The use case is sustained autonomous work: research sessions, multi-step refactoring, architecture exploration, debugging complex systems. Anything where the agent needs to think for more than ~15 minutes and build on its own earlier conclusions.
>
> The 167-thought session is an extreme example, but even a 20-thought session benefits from structured memory. The agent can query what it already tried, track which hypotheses it's tested, and avoid re-deriving conclusions it already reached.

### "Who pays for this?"

> Hosted version at thoughtbox.dev. Free tier: 5 sessions, 100 thoughts. Pro: $29/mo, unlimited. The MCP server is open source if you want to self-host.
>
> Target users are developers and teams running agents on sustained tasks -- research, architecture, debugging. The bet is that as agents get more capable, they'll be doing longer, more complex work, and they'll need cognitive infrastructure to do it well.

### Bug reports / technical issues

> Thanks for flagging. Can you open an issue on the repo? [link to GitHub issues]. I'm a solo dev so response time varies, but I take bug reports seriously.
