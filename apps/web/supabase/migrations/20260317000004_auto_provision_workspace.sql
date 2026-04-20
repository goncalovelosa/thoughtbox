-- =============================================================================
-- Workspace Auto-Provisioning
-- Automatically creates a personal workspace for every new user.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id UUID := gen_random_uuid();
  workspace_name TEXT;
  workspace_slug TEXT;
BEGIN
  -- 1. Create a Profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1));

  -- 2. Determine Workspace Name & Slug
  workspace_name := split_part(NEW.email, '@', 1) || '''s Workspace';
  workspace_slug := lower(split_part(NEW.email, '@', 1)) || '-' || lower(substring(replace(workspace_id::text, '-', ''), 1, 4));

  -- 3. Create the Workspace
  INSERT INTO public.workspaces (id, name, slug, owner_user_id, status, plan_id)
  VALUES (workspace_id, workspace_name, workspace_slug, NEW.id, 'active', 'free');

  -- 4. Create the Membership (Owner)
  INSERT INTO public.workspace_memberships (workspace_id, user_id, role)
  VALUES (workspace_id, NEW.id, 'owner');

  -- 5. Set as Default Workspace for Profile
  UPDATE public.profiles
  SET default_workspace_id = workspace_id
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (Supabase internal table)
-- Note: This requires the trigger to be created by a superuser/service_role
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
