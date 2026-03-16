-- SEED: Development Workspace & Test Key
-- This allows testing the MCP server with a real API key resolution flow.

DO $$
DECLARE
  dev_user_id UUID;
  workspace_id UUID := 'd1e57000-0000-0000-0000-000000000000';
BEGIN
  -- 1. Fetch a real user to be the owner
  SELECT id INTO dev_user_id FROM auth.users LIMIT 1;

  IF dev_user_id IS NULL THEN
    RAISE NOTICE 'No users found in auth.users. Skipping workspace seed.';
    RETURN;
  END IF;

  RAISE NOTICE 'Seeding development workspace for user: %', dev_user_id;

  -- 2. Create Workspace
  INSERT INTO workspaces (id, name, slug, owner_user_id)
  VALUES (workspace_id, 'Development Workspace', 'dev-workspace', dev_user_id)
  ON CONFLICT (slug) DO NOTHING;

  -- 3. Create Membership (Owner)
  INSERT INTO workspace_memberships (workspace_id, user_id, role)
  VALUES (workspace_id, dev_user_id, 'owner')
  ON CONFLICT DO NOTHING;

  -- 4. Create API Key (tbx_dev_test_key_1234567890)
  INSERT INTO api_keys (workspace_id, name, key_prefix, key_hash, created_by_user_id)
  VALUES (
    workspace_id, 
    'Dev Test Key', 
    'tbx_dev_', 
    '$2b$12$H0v/xExvBRNn.nrI5zoyruHILa4wNQixs4xdpsfkZyrwdC1jizWb2', 
    dev_user_id
  )
  ON CONFLICT DO NOTHING;
END $$;
