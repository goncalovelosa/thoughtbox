# RLS Revert Migration: Restore `project_isolation` Policies

**Target**: `thoughtbox-staging` Supabase project (`akjccuoncxlvrrtkvtno`)
**Date**: 2026-03-16
**Status**: Ready to execute
**ADR**: [ADR-RLS-001](../../.adr/accepted/ADR-RLS-001-revert-project-isolation.md)

## Problem

Migration `20260313100000` (part of ADR-AUTH-01) dropped working
`project_isolation` RLS policies on all five product tables and replaced them
with `user_project_access` policies. The new policies depend on a
`user_can_access_project()` function that queries `workspace_memberships`.
Nothing populates workspace or membership rows, so all authenticated data
access to product tables fails. 33 integration tests are broken.

The original `project_isolation` policies (from migration `20260313000000`)
checked `project = (auth.jwt() ->> 'project')`. The MCP server's
`SupabaseStorage.refreshClient()` mints custom JWTs with a `project` claim
via `setProject()`. Those policies worked.

## Affected Tables and Policies

### Dropped (broken)

| Table | Policy dropped | Depended on |
|-------|---------------|-------------|
| `sessions` | `user_project_access` | `user_can_access_project()` |
| `thoughts` | `user_project_access` | `user_can_access_project()` |
| `entities` | `user_project_access` | `user_can_access_project()` |
| `relations` | `user_project_access` | `user_can_access_project()` |
| `observations` | `user_project_access` | `user_can_access_project()` |

Also dropped: `user_can_access_project(text)` function.

### Restored

| Table | Policy restored | USING / WITH CHECK |
|-------|----------------|-------------------|
| `sessions` | `project_isolation` | `project = (auth.jwt() ->> 'project')` |
| `thoughts` | `project_isolation` | `project = (auth.jwt() ->> 'project')` |
| `entities` | `project_isolation` | `project = (auth.jwt() ->> 'project')` |
| `relations` | `project_isolation` | `project = (auth.jwt() ->> 'project')` |
| `observations` | `project_isolation` | `project = (auth.jwt() ->> 'project')` |

All policies use `FOR ALL` (SELECT, INSERT, UPDATE, DELETE) with identical
USING and WITH CHECK clauses.

## What This Leaves Alone

- `service_role_bypass` policies on product tables -- untouched
- `workspaces`, `workspace_memberships` tables and their RLS policies -- untouched
- All indexes, triggers, columns, constraints -- untouched
- Auth configuration -- untouched

## Migration SQL

Copy-paste ready. Run in Supabase SQL Editor or as a CLI migration
(`supabase migration new rls_revert_project_isolation`).

```sql
-- =============================================================
-- RLS Revert: restore project_isolation, drop user_project_access
-- Reverting migration 20260313100000 back to 20260313000000 state
-- =============================================================

BEGIN;

-- 1. Drop the broken user_project_access policies
DROP POLICY IF EXISTS user_project_access ON sessions;
DROP POLICY IF EXISTS user_project_access ON thoughts;
DROP POLICY IF EXISTS user_project_access ON entities;
DROP POLICY IF EXISTS user_project_access ON relations;
DROP POLICY IF EXISTS user_project_access ON observations;

-- 2. Drop the function those policies depended on
DROP FUNCTION IF EXISTS user_can_access_project(text);

-- 3. Re-create project_isolation policies
--    These match the original 20260313000000 migration exactly.
--    FOR ALL = SELECT, INSERT, UPDATE, DELETE
CREATE POLICY project_isolation ON sessions
  FOR ALL
  USING (project = (auth.jwt() ->> 'project'))
  WITH CHECK (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON thoughts
  FOR ALL
  USING (project = (auth.jwt() ->> 'project'))
  WITH CHECK (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON entities
  FOR ALL
  USING (project = (auth.jwt() ->> 'project'))
  WITH CHECK (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON relations
  FOR ALL
  USING (project = (auth.jwt() ->> 'project'))
  WITH CHECK (project = (auth.jwt() ->> 'project'));

CREATE POLICY project_isolation ON observations
  FOR ALL
  USING (project = (auth.jwt() ->> 'project'))
  WITH CHECK (project = (auth.jwt() ->> 'project'));

COMMIT;
```

## Idempotency

- `DROP POLICY IF EXISTS` and `DROP FUNCTION IF EXISTS` make steps 1-2 safe
  to re-run.
- `CREATE POLICY` (without `IF NOT EXISTS`, which Postgres does not support
  for policies) will error if the policy already exists. If re-running after
  a partial success, drop the existing `project_isolation` policies first,
  then re-run the full script.

## Acceptance Criteria

Each criterion maps to a hypothesis in ADR-RLS-001.

### AC-1: Policy state is correct (H1)

After execution, querying `pg_policies` shows:
- All 5 tables have a `project_isolation` policy
- No table has a `user_project_access` policy
- `user_can_access_project()` function does not exist in `pg_proc`

```sql
-- Verify project_isolation exists on all 5 tables
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname IN ('project_isolation', 'user_project_access')
ORDER BY tablename;

-- Verify function is gone
SELECT proname FROM pg_proc WHERE proname = 'user_can_access_project';
```

Expected: 5 rows of `project_isolation`, 0 rows of `user_project_access`,
0 rows from `pg_proc`.

### AC-2: JWT project claim enables CRUD (H2)

A Supabase client initialized with a JWT containing `{ "project": "demo" }`
can INSERT, SELECT, UPDATE, and DELETE rows on all 5 tables where
`project = 'demo'`. A JWT with `{ "project": "other" }` returns 0 rows for
`demo` data.

Validation: integration test using `SupabaseStorage.setProject('demo')`.

### AC-3: service_role_bypass still works (H3)

A client using the service role key sees all rows on all 5 tables regardless
of JWT project claim.

Validation: query with service role client, confirm it returns rows across
multiple projects.

### AC-4: Integration tests pass (H4)

```bash
cd thoughtbox-staging
pnpm test -- --grep "supabase"
```

Expected: 33 previously-failing tests pass.

### AC-5: Cross-project isolation holds (H5)

Two `SupabaseStorage` instances scoped to different projects (`project-a`,
`project-b`) see only their own rows. INSERT with a mismatched project value
is rejected by WITH CHECK.

Validation: integration test with two storage instances, verify zero overlap
and rejected cross-project writes.
