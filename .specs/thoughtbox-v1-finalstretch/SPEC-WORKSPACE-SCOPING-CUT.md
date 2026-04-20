# SPEC-WORKSPACE-SCOPING-CUT: Workspace-As-Project Release Cut

## Status: DRAFT

## Summary

For the first usable hosted release, Thoughtbox drops project scoping entirely.
Each workspace is treated as exactly one effective project. The MCP server does
not resolve roots, does not call `listRoots`, and does not block the first tool
call on project discovery.

This is a release cut, not a claim that project scoping is unimportant forever.
It exists to remove an activation-critical dependency from the product path.

## Requirements

1. The hosted MCP server must not call `listRoots()` or any equivalent root
   discovery API during normal activation or tool execution.
2. The first tool call must not depend on project resolution. A user with a
   valid workspace API key must be able to connect and run without any
   root-derived metadata.
3. All persistence and query paths for the current release must scope by
   `workspace_id`, not `project_id`.
4. Existing or legacy `project_id` fields may remain nullable for compatibility,
   but they must not be required for the hosted cutline.
5. Where compatibility code still expects a project identifier, the backend may
   use a synthetic workspace-owned `project_id` value as a deterministic shim.
6. UI and API copy for the current release must describe the primary container
   as a workspace, not a project.
7. Documentation must explicitly say that project model upload, root-aware
   scoping, and multi-project workspaces are deferred.

## Acceptance Criteria

- [ ] MCP activation succeeds without any root discovery call
- [ ] `src/server-factory.ts` no longer blocks first tool invocation on project
      resolution
- [ ] A valid workspace API key is sufficient to create and use a session
- [ ] Observability and audit queries for the release path work with
      `workspace_id` alone
- [ ] Product docs no longer imply that hosted users must have project scoping
      working before first value

## Non-Goals

- Restoring root-based project resolution
- Multi-project workspaces
- Project model upload
- Structural enrichment from repository roots

## Consequences

- Blast radius and structural analysis remain deferred
- Anything that currently depends on `project_id` in the mainline product path
  must be cut, stubbed, or made optional
- A synthetic workspace-owned `project_id` is acceptable as a compatibility shim
  if it does not reintroduce activation-time project discovery
- The release path becomes materially shorter and removes a class of silent
  first-call failures

## Decisions

- Use a synthetic workspace-owned `project_id` when compatibility code still
  requires one.

## Remaining Investigation

- Identify every query surface that still assumes real project scoping and
  rewrite, stub, or cut it for the release.
