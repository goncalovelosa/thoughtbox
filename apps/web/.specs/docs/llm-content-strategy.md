# SPEC: LLM Content Strategy

**Status**: Draft
**Depends on**: None (independent of other docs specs)

---

## 1. Decision: `llms.txt` Convention

Serve `docs-for-llms/` content as plain text files following the `llms.txt` convention (llmstxt.org). These files are machine-readable references for AI agents, not human-readable documentation — they get no UI, no sidebar entry, and no website navigation.

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Format | `llms.txt` convention | Emerging standard for machine-readable site docs |
| UI section | None | LLM docs are dense schema references, not useful for human readers |
| Serving | Static files in `public/` | Served directly by Next.js/Vercel with no build step needed |
| Generation | Build-time script | Concatenates and formats source files into `public/` outputs |

---

## 2. Output Files

| File | URL | Content |
|------|-----|---------|
| `public/llms.txt` | `/llms.txt` | Index file — title, description, links to individual files |
| `public/llms-full.txt` | `/llms-full.txt` | Concatenated full content of all LLM doc files |
| `public/llm/architecture.txt` | `/llm/architecture.txt` | Individual: `ARCHITECTURE.md` |
| `public/llm/configuration.txt` | `/llm/configuration.txt` | Individual: `CONFIGURATION.md` |
| `public/llm/data-models.txt` | `/llm/data-models.txt` | Individual: `DATA-MODELS.md` |
| `public/llm/tool-interfaces.txt` | `/llm/tool-interfaces.txt` | Individual: `TOOL-INTERFACES.md` |

**Excluded**: `DOC-INCONSISTENCIES.md` — internal audit, not part of the public docs.

---

## 3. `llms.txt` Index Format

```
# Thoughtbox

> Persistent, queryable memory for AI agents via MCP.

Thoughtbox is an MCP server that gives AI agents structured,
auditable memory that survives conversations.

## Docs

- [Architecture](https://thoughtbox.dev/llm/architecture.txt): Server architecture, data flows, storage backends
- [Configuration](https://thoughtbox.dev/llm/configuration.txt): Environment variables, settings, deployment options
- [Data Models](https://thoughtbox.dev/llm/data-models.txt): Thought schema, session schema, branch schema, knowledge graph types
- [Tool Interfaces](https://thoughtbox.dev/llm/tool-interfaces.txt): MCP tool definitions, parameters, return types

## Full Documentation

- [Complete reference](https://thoughtbox.dev/llms-full.txt): All documentation in a single file
```

---

## 4. `llms-full.txt` Format

Concatenation of all 4 source files with clear separators:

```
# Thoughtbox — Complete LLM Reference

================================
ARCHITECTURE
================================

<contents of ARCHITECTURE.md>

================================
CONFIGURATION
================================

<contents of CONFIGURATION.md>

================================
DATA MODELS
================================

<contents of DATA-MODELS.md>

================================
TOOL INTERFACES
================================

<contents of TOOL-INTERFACES.md>
```

---

## 5. Build Script

A Node.js script at `scripts/build-llms-txt.ts` that:

1. Reads the 4 source files from `docs-staging/docs-for-llms/` (excluding `DOC-INCONSISTENCIES.md`)
2. Generates `public/llms.txt` (index with links)
3. Generates `public/llms-full.txt` (concatenated)
4. Copies individual files to `public/llm/*.txt`

Run as a `prebuild` script in `package.json`:

```json
{
  "scripts": {
    "prebuild": "tsx scripts/build-llms-txt.ts",
    "build:llms": "tsx scripts/build-llms-txt.ts"
  }
}
```

The `prebuild` hook ensures `llms.txt` files are always fresh before a production build. `build:llms` provides a standalone invocation for development.

### Dependency

Requires `tsx` as a dev dependency (likely already present; if not, add it).

---

## 6. Source Files

| Source | Target | Size (approx) |
|--------|--------|----------------|
| `docs-staging/docs-for-llms/ARCHITECTURE.md` | `public/llm/architecture.txt` | ~900 lines |
| `docs-staging/docs-for-llms/CONFIGURATION.md` | `public/llm/configuration.txt` | ~600 lines |
| `docs-staging/docs-for-llms/DATA-MODELS.md` | `public/llm/data-models.txt` | ~800 lines |
| `docs-staging/docs-for-llms/TOOL-INTERFACES.md` | `public/llm/tool-interfaces.txt` | ~1200 lines |

Total `llms-full.txt` size: ~3500 lines (~120KB).

---

## 7. Cross-Linking

A small note in the human docs footer (on every doc page, below the PrevNextNav):

```
Machine-readable docs for AI agents: /llms.txt
```

Styled as `text-xs text-slate-400 mt-8` — unobtrusive, present for discoverability.

---

## 8. Sync Process

Manual. When human docs change materially, review whether the LLM docs need corresponding updates. The two doc sets serve different audiences and have different structures, so there is no automated sync.

Add a note to the contribution guidelines (when they exist) that changes to core concepts, tool interfaces, or data models should trigger a review of the LLM docs.

---

## 9. Gitignore

Add generated files to `.gitignore` so they are not committed:

```
# Generated LLM docs
public/llms.txt
public/llms-full.txt
public/llm/
```

These are build artifacts, regenerated on every `pnpm build`.
