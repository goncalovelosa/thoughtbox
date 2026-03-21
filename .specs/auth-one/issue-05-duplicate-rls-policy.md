# Spec: Remove Redundant api_keys_workspace_member RLS Policy

**Issue severity:** Low  
**Source audit:** `reports/auth-flow-audit-2026-03-21.md §3.3`  
**Affected file:** `supabase/migrations/` — new migration dropping the redundant policy

---

## Problem

The `api_keys` table has two overlapping permissive RLS policies for authenticated members:

**`api_keys_member_access`** (line 964 of the remote schema migration):
```sql
CREATE POLICY "api_keys_member_access" ON "public"."api_keys"
  USING ("public"."is_workspace_member"("workspace_id"))
  WITH CHECK ("public"."is_workspace_member"("workspace_id"));
```

**`api_keys_workspace_member`** (lines 968–972):
```sql
CREATE POLICY "api_keys_workspace_member" ON "public"."api_keys"
  USING ((EXISTS (
    SELECT 1 FROM "public"."workspace_memberships" "wm"
    WHERE (("wm"."workspace_id" = "api_keys"."workspace_id")
      AND ("wm"."user_id" = "auth"."uid"()))
  )))
  WITH CHECK ((EXISTS (
    SELECT 1 FROM "public"."workspace_memberships" "wm"
    WHERE (("wm"."workspace_id" = "api_keys"."workspace_id")
      AND ("wm"."user_id" = "auth"."uid"()))
  )));
```

`is_workspace_member(workspace_id)` is defined as:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.workspace_memberships
  WHERE workspace_id = ws_id AND user_id = auth.uid()
);
```

The two policies are semantically identical. Both are `PERMISSIVE` (the default). Because
PostgreSQL RLS evaluates permissive policies with `OR` semantics, having both active means
every row-access decision runs two equivalent subqueries against `workspace_memberships`.
This is a schema hygiene issue and an unnecessary query cost, not a security vulnerability.

---

## Target State After Fix

### New Migration

A new migration file (timestamped after `20260321004644_remote_schema.sql`) drops
`api_keys_workspace_member`:

```sql
-- Migration: drop redundant api_keys_workspace_member RLS policy
-- api_keys_member_access (which calls is_workspace_member()) is equivalent
-- and is the canonical policy. This policy was a duplicate introduced during
-- schema import.

DROP POLICY IF EXISTS "api_keys_workspace_member" ON "public"."api_keys";
```

### Resulting RLS Policy Set on `api_keys`

After the migration runs:

| Policy name | Operation | Subject | Using clause |
|---|---|---|---|
| `api_keys_anon_validate` | SELECT | `anon` | `true` |
| `api_keys_member_access` | ALL | `authenticated` | `is_workspace_member(workspace_id)` |

`api_keys_workspace_member` no longer exists.

### No Application Code Changes

The application never references policy names directly. No TypeScript, no queries, and no
other migration files require modification.

---

## Consistency With Other Tables

After this fix, the `api_keys` table uses `is_workspace_member()` exclusively for its
member access gate, consistent with `sessions` and `thoughts`. The `workspaces` table's
own policies (`workspaces_select_member`, `workspaces_update_admin`) use inline `EXISTS`
subqueries — that is a separate pattern intentionally retained for that table and is not
changed by this fix.

---

## Verification

- After the migration runs, `SELECT policyname FROM pg_policies WHERE tablename = 'api_keys'`
  returns exactly two rows: `api_keys_anon_validate` and `api_keys_member_access`.
- An authenticated workspace member can still read, insert, update, and delete their own
  `api_keys` rows.
- An authenticated user who is not a member of a workspace cannot access that workspace's
  `api_keys` rows.

---

## Notes

- `DROP POLICY IF EXISTS` is safe to run even if the policy was already removed manually
  through the Supabase dashboard.
- This migration should be applied to both the local Supabase instance and the production
  project. Because the production project does not use `supabase start` / `config.toml`, this
  migration must be pushed via `supabase db push` or applied manually in the SQL editor.
