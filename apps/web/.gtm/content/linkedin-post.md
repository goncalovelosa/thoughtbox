# LinkedIn Launch Post

## Post

I've been building Thoughtbox for the past year -- an MCP server that gives AI agents persistent, structured memory. Last week, I ran an experiment that changed how I think about agent capability.

I pointed Claude Code at 30+ agentic reasoning research papers and gave it Thoughtbox as its working memory. Then I walked away.

Two and a half hours later, it had produced 167 structured thoughts. A complete survey of agentic reasoning paradigms. 17 knowledge graph entities with typed relations connecting concepts across papers. 12 belief snapshots tracking how its understanding evolved. And 5 implementation specs for features I hadn't considered.

The interesting part isn't the volume. It's the structure.

The agent didn't just summarize papers. It revised its own beliefs when new evidence contradicted earlier conclusions. It found connections between research threads that weren't cited together. It built a coherent framework (Five Pillars of Cognitive Architecture) that synthesized work from different fields.

None of this is possible with a flat context window. The agent needed to write structured thoughts, query what it had already figured out, and build incrementally on its own prior reasoning. That's what Thoughtbox provides -- not memory storage, but cognitive infrastructure.

The research validated a thesis from the Library Theorem (Mainen 2026): indexed external memory provides exponential advantage over sequential context, regardless of window size.

For engineering teams running agents on sustained tasks -- research, architecture exploration, complex debugging -- this means the bottleneck isn't model intelligence. It's the tools you give the model to think with.

Thoughtbox is open source (MCP server) with a hosted version at thoughtbox.dev. You can browse the actual 167-thought session on the site.

If your team is building with AI agents and hitting the limits of context windows, I'd be interested to hear what you're running into.

## Posting Notes

- Post Tuesday-Thursday, 8-10am local time
- No hashtags (LinkedIn deprioritizes posts with hashtags)
- First comment: link to the session explorer and blog post
- Engage with every comment in the first 2 hours
