# Spec: firstName / lastName Fields Wired Through to Profile

**Issue severity:** Low  
**Source audit:** `reports/auth-flow-audit-2026-03-21.md §3.1`  
**Affected files:**  
- `src/app/(auth)/actions.ts` — `signUpAction`  
- `src/app/(auth)/sign-up/SignUpForm.tsx`  
- `supabase/migrations/` — new migration updating `handle_new_user()`

---

## Problem

`SignUpForm.tsx` renders `firstName` and `lastName` inputs with labels, `autoComplete`
attributes, and placeholder text. `signUpAction` reads only `email` and `password` from
`FormData`:

```typescript
const email = formData.get('email') as string
const password = formData.get('password') as string
```

`firstName` and `lastName` are silently discarded. The `display_name` stored in `profiles` is
always derived by the `handle_new_user()` trigger from `split_part(email, '@', 1)` — the
user's stated name has no effect on anything in the system. The form collects information it
never uses.

---

## Target State After Fix

### `src/app/(auth)/actions.ts` — `signUpAction`

`signUpAction` reads `firstName` and `lastName` from `FormData` and passes them to Supabase
as `options.data` (stored in `auth.users.raw_user_meta_data`):

```typescript
export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = (formData.get('firstName') as string | null)?.trim() ?? ''
  const lastName = (formData.get('lastName') as string | null)?.trim() ?? ''

  if (password.length < 12) {
    return { error: 'Password must be at least 12 characters.' }
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    `https://${process.env.VERCEL_URL ?? 'localhost:3000'}`

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/api/auth/callback`,
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
```

`firstName` and `lastName` are trimmed and default to empty strings when absent, so the action
remains safe if either field is not submitted.

### `src/app/(auth)/sign-up/SignUpForm.tsx`

No structural changes. The `firstName` and `lastName` inputs are already correctly wired
with `name="firstName"` and `name="lastName"`. They continue to render as-is.

### Supabase Migration — `handle_new_user()` Updated

A new migration updates the `handle_new_user()` trigger function to derive `display_name`
preferentially from `raw_user_meta_data` when name fields are present:

```sql
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
```

**Logic:** `trim(first_name || ' ' || last_name)` is computed; if the result is an empty
string (both fields blank or user omitted them), `NULLIF` turns it to `NULL`, and `COALESCE`
falls back to the email local part. The email-based fallback is preserved for users who do not
supply a name.

The workspace `name` and `slug` continue to derive from the email local part. Only
`display_name` changes.

---

## Behaviour Matrix

| firstName | lastName | display_name stored |
|---|---|---|
| `"Ada"` | `"Lovelace"` | `"Ada Lovelace"` |
| `"Ada"` | `""` | `"Ada"` |
| `""` | `""` | `split_part(email, '@', 1)` |
| (fields omitted) | (fields omitted) | `split_part(email, '@', 1)` |

---

## Verification

- A new user who fills `firstName="Ada"` and `lastName="Lovelace"` has `display_name = 'Ada Lovelace'` in their `profiles` row.
- A new user who leaves both name fields blank has `display_name` derived from their email as before.
- `signUpAction` returns `{ success: true }` for both cases — the name fields are optional.

---

## Notes

- `raw_user_meta_data` is readable from server-side contexts via `supabase.auth.getUser()`.
  Storing `first_name` / `last_name` there means they are also available for future use (e.g.,
  personalised email templates via Supabase Auth hooks) without requiring an additional profiles
  query.
- The workspace naming logic (`Ada's Workspace`, slug from email) is intentionally unchanged.
  Renaming workspaces after the user's name is a separate product decision.
- This fix includes both the Issue 2 password validation guard and the name fields wiring in
  the same `signUpAction` — implement them together.
