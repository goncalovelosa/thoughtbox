# Spec: Server-Side Password Length Enforcement on Sign-Up

**Issue severity:** Medium  
**Source audit:** `reports/auth-flow-audit-2026-03-21.md §5.2`  
**Affected file:** `src/app/(auth)/actions.ts` — `signUpAction`

---

## Problem

`SignUpForm.tsx` renders a password input with `placeholder="Min. 12 characters"`, communicating
a 12-character minimum to users. `signUpAction` performs no server-side length check before
calling `supabase.auth.signUp()`. Supabase enforces only a 6-character minimum (per
`config.toml:120` for the local instance; production minimum is unknown but no higher guard
exists in application code).

A user can create an account with a 7-character password despite the stated requirement.

`resetPasswordAction` in the same file does enforce the 12-character minimum at lines 114–116:

```typescript
if (password.length < 12) {
  return { error: 'Password must be at least 12 characters.' }
}
```

This inconsistency means the two password-setting code paths are governed by different rules.

---

## Target State After Fix

### `src/app/(auth)/actions.ts` — `signUpAction`

`signUpAction` validates password length server-side before calling `supabase.auth.signUp()`.
The guard uses the same threshold and error message as `resetPasswordAction`:

```typescript
export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

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
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
```

The guard is inserted immediately after reading `email` and `password` from `formData`, before
any network call is made. No Supabase call is performed for passwords shorter than 12 characters.

### Consistency Invariant

All password-setting server actions in `src/app/(auth)/actions.ts` enforce the same 12-character
minimum:

| Action | Guard present | Error message |
|---|---|---|
| `signUpAction` | ✅ Yes | `'Password must be at least 12 characters.'` |
| `resetPasswordAction` | ✅ Yes (unchanged) | `'Password must be at least 12 characters.'` |

### `SignUpForm.tsx`

No change required. The placeholder `"Min. 12 characters"` already matches the enforced rule.

---

## Verification

- Submitting the sign-up form with an 8-character password returns `{ error: 'Password must be
  at least 12 characters.' }` from `signUpAction` without making a Supabase network request.
- Submitting with a 12-character password proceeds to `supabase.auth.signUp()` as before.
- The error is rendered by `SignUpForm.tsx`'s existing error state display.

---

## Notes

- This fix is pure TypeScript — no migration or environment change required.
- A companion task should align `supabase/config.toml:120` (`minimum_password_length = 6`) and
  the production Supabase project's auth settings to match the 12-character rule, so that the
  Supabase-enforced minimum and the application-enforced minimum agree. That alignment is a
  separate concern from this fix, which closes the server-side validation gap.
