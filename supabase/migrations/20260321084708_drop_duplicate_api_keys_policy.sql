-- Drop redundant api_keys_workspace_member RLS policy
-- api_keys_member_access (which calls is_workspace_member()) is equivalent
-- and is the canonical policy.
DROP POLICY IF EXISTS "api_keys_workspace_member" ON "public"."api_keys";
