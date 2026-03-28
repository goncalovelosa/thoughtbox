# Tooling Inventory

## Built-in Tools
| Tool | Purpose |
|------|---------|
| Read | File reading |
| Write | File creation |
| Edit | File modification (diff-based) |
| Glob | File pattern matching |
| Grep | Content search (ripgrep) |
| Bash | Shell command execution |
| Agent | Subagent dispatch |
| Skill | Skill invocation |

## MCP Tools — Thoughtbox
| Tool | Purpose |
|------|---------|
| `mcp__thoughtbox__thoughtbox_execute` | Run JavaScript against the `tb` SDK — chain operations, query sessions, submit thoughts |
| `mcp__thoughtbox__thoughtbox_search` | Query the operation/prompt/resource catalog to discover available operations |

### Thoughtbox SDK Modules (via Code Mode)
- **session**: list, get, search, resume, export, analyze, extractLearnings
- **thought**: thoughtbox_thought (structured thought submission)
- **knowledge**: createEntity, getEntity, listEntities, addObservation, createRelation, queryGraph, stats
- **notebook**: create, list, load, addCell, updateCell, runCell, installDeps, listCells, getCell, export
- **theseus**: init, visa, checkpoint, outcome, status, complete
- **ulysses**: init, plan, outcome, reflect, status, complete
- **observability**: health, metrics, metrics_range, sessions, session_info, alerts, dashboard_url

## MCP Tools — Other
| Tool | Purpose |
|------|---------|
| `mcp__exa__web_search_exa` | Web search via Exa AI |
| `mcp__exa__get_code_context_exa` | Code context search |
| `mcp__context7__resolve-library-id` | Resolve library for documentation |
| `mcp__context7__query-docs` | Query library documentation |
| `mcp__supabase__*` | Supabase management (migrations, SQL, edge functions, etc.) |
| `mcp__Neon__*` | Neon database management |
| `mcp__effect-patterns__*` | Pattern and skill discovery |
| `mcp__ide__*` | IDE diagnostics and code execution |

## Sufficiency Assessment

**Task**: Review the /runs web UI, compare it to Thoughtbox Code Mode capabilities, identify UI patterns to close the gap.

**Verdict**: SUFFICIENT. The combination of:
- File read/glob/grep for codebase analysis
- Thoughtbox Code Mode for demonstrating programmatic session traversal
- Screenshot viewing for UI analysis
- No external research needed (this is an internal product analysis)

...provides everything needed for this review task.
