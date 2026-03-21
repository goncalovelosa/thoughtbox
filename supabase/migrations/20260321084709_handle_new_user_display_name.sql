-- Update handle_new_user() to derive display_name from user-supplied
-- first_name/last_name in raw_user_meta_data, falling back to email local part.
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
  RETURNS TRIGGER
  LANGUAGE "plpgsql" SECURITY DEFINER
  AS $$
DECLARE
  workspace_id UUID := gen_random_uuid();
  workspace_name TEXT;
  workspace_slug TEXT;
  computed_display_name TEXT;
BEGIN
  -- Prefer user-supplied name; fall back to email local part
  computed_display_name := NULLIF(
    trim(
      COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' ||
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    ),
    ''
  );
  computed_display_name := COALESCE(computed_display_name, split_part(NEW.email, '@', 1));

  -- 1. Create a Profile
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, computed_display_name);

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
$$;
