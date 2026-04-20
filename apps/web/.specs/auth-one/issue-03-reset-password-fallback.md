# Spec: resetPasswordAction Invalid Fallback URL

**Issue severity:** Low  
**Source audit:** `reports/auth-flow-audit-2026-03-21.md §5.3`  
**Affected file:** `src/app/(auth)/actions.ts` — `resetPasswordAction`, line 134

---

## Problem

After `auth.updateUser({ password })` succeeds, `resetPasswordAction` resolves the user's
workspace slug to build a redirect URL:

```typescript
const workspaceSlug = (profile?.workspaces as unknown as { slug: string } | null)?.slug ?? 'dashboard'
redirect(`/w/${workspaceSlug}/dashboard`)
```

When the profile query fails or returns no workspace — for example, a user whose
`handle_new_user()` trigger did not fire, leaving them with an auth record but no profile row —
`workspaceSlug` falls back to the string literal `'dashboard'`. The resulting redirect is:

```
/w/dashboard/dashboard   →   404
```

The user has just successfully changed their password but is sent to a non-existent route with
no recovery path. Because the password update already succeeded, there is no way for the user
to retry the reset flow.

---

## Target State After Fix

### `src/app/(auth)/actions.ts` — `resetPasswordAction`

The fallback redirects to `/sign-in` instead of constructing an invalid workspace URL.
`/sign-in` is a valid, always-reachable route that allows the user to sign in with their
newly set password, which is the correct recovery path regardless of profile state.

```typescript
export async function resetPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  if (password.length < 12) {
    return { error: 'Password must be at least 12 characters.' }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.updateUser({ password })

  if (authError) {
    return { error: authError.message }
  }

  if (!user) return { error: 'Authentication failed' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('workspaces!profiles_default_workspace_id_fkey(slug)')
    .eq('user_id', user.id)
    .single()

  const workspaceSlug = (profile?.workspaces as unknown as { slug: string } | null)?.slug
  if (!workspaceSlug) {
    redirect('/sign-in')
  }

  redirect(`/w/${workspaceSlug}/dashboard`)
}
```

The change is minimal: the nullish coalesce (`?? 'dashboard'`) and the single combined
`redirect(...)` are replaced by an explicit null-check that calls `redirect('/sign-in')` when
no slug can be resolved.

### Redirect Outcome Matrix

| Profile state | Workspace slug | Redirect destination |
|---|---|---|
| Profile exists, default workspace set | resolved | `/w/<slug>/dashboard` ✅ |
| Profile missing or no workspace | null / undefined | `/sign-in` ✅ |
| Previously (broken) | null / undefined | `/w/dashboard/dashboard` ❌ |

---

## Verification

- A test user whose profile row has been manually deleted (simulating a trigger failure)
  successfully resets their password and is redirected to `/sign-in` rather than receiving a 404.
- A normal user with a valid profile is redirected to `/w/<slug>/dashboard` as before.

---

## Notes

- No migration or environment change is required. This is a single-line logic fix in
  `src/app/(auth)/actions.ts`.
- The same workspace slug resolution pattern in `signInAction` (lines 32–45) uses a different
  fallback: `redirect('/app')`. That fallback is valid because `/app` is a server component that
  re-resolves the slug. For the reset password path, `/sign-in` is more appropriate since the
  `/app` redirect depends on a session that may not be reliably established at that point for
  an orphaned user.
