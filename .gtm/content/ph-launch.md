# Product Hunt Launch Assets

## Tagline

**Mind-expansion for AI agents. Structured reasoning via MCP.**

(55 characters)

## Description

Thoughtbox gives AI agents persistent, structured memory through MCP. Sessions with typed thoughts, a knowledge graph, and observability. We let Claude Code think for 2.5 hours using Thoughtbox -- it produced 167 structured thoughts, surveyed 30+ research paradigms, and designed its own features.

(258 characters)

## Topics / Categories

- Artificial Intelligence
- Developer Tools
- Open Source
- Productivity

## Maker's First Comment

---

Hi Product Hunt -- I'm building Thoughtbox solo while expecting my first kid in two months. That timeline clarifies priorities.

Thoughtbox started as a question: what happens if you give an AI agent real cognitive infrastructure instead of just a context window? Not memory storage -- actual reasoning tools. Belief tracking. Knowledge graphs. Decision frames.

To test this, I pointed Claude Code at 30+ agentic reasoning papers with Thoughtbox as its working memory. It ran for 2.5 hours. 167 structured thoughts. It surveyed the entire agentic reasoning landscape, found novel connections between papers, tracked how its own understanding evolved, and designed 5 implementation specs for features I hadn't thought of.

The session produced ~540KB of structured research. A normal context window can't hold that. More importantly, flat text can't represent it. The agent needed to query its own prior reasoning, revise beliefs, and build incrementally on what it had already figured out.

You can browse the actual session here: [session explorer link TBD]

The core insight: agents are smart enough. They just can't remember what they were doing 45 minutes ago. Thoughtbox fixes that with structured cognition, not just storage.

MCP server is open source. Hosted version at thoughtbox.dev with a free tier. Would love your feedback.

---

(~240 words)

## Screenshot Descriptions Needed

1. **Session Explorer overview** -- The 167-thought session timeline showing thought types (reasoning, belief_snapshot, decision_frame) with color coding and timestamps. Shows the full 2.5-hour arc.

2. **Knowledge Graph visualization** -- The 17 entities and 12 relations from the research session, showing how concepts like "Library Theorem," "Adaptive Compute," and "Extended Mind Thesis" connect.

3. **Belief Snapshot detail** -- A single belief_snapshot thought expanded, showing how the agent's understanding of a concept changed from one state to another mid-session.

4. **MCP Connect page** -- The dashboard page showing how to connect Thoughtbox to Claude Code with a single JSON config snippet. Emphasize the one-line setup.

5. **Dashboard with live session** -- The workspace dashboard showing session counts, thought counts, and a recent run with real-time updates. Shows the product in everyday use, not just the hero session.
