# Auth Flow Fixes — Spec Suite (auth-one)

**Source audit:** `reports/auth-flow-audit-2026-03-21.md`  
**Branch context:** `feat/supabase-v1-alignment`

Each spec in this directory describes the **target state of the codebase after a fix has been
applied** for one issue identified in the 2026-03-21 auth flow audit. Specs are ordered by
severity.

---

## Issue Index

| File | Severity | Fix location | Summary |
|---|---|---|---|
| [`issue-01-anon-key-env-var.md`](./issue-01-anon-key-env-var.md) | **High** | Vercel dashboard + `.env.example` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` added to Vercel dev env; fresh checkout works without local `.env` |
| [`issue-02-signup-password-validation.md`](./issue-02-signup-password-validation.md) | **Medium** | `src/app/(auth)/actions.ts` | `signUpAction` enforces 12-char minimum before calling Supabase |
| [`issue-03-reset-password-fallback.md`](./issue-03-reset-password-fallback.md) | **Low** | `src/app/(auth)/actions.ts:134` | Missing workspace slug falls back to `/sign-in` instead of `/w/dashboard/dashboard` (404) |
| [`issue-04-name-fields-dead-ui.md`](./issue-04-name-fields-dead-ui.md) | **Low** | `src/app/(auth)/actions.ts` + new migration | `firstName`/`lastName` read from FormData, stored in `raw_user_meta_data`; trigger uses them for `display_name` |
| [`issue-05-duplicate-rls-policy.md`](./issue-05-duplicate-rls-policy.md) | **Low** | New Supabase migration | `api_keys_workspace_member` policy dropped; `api_keys_member_access` is the sole member gate |
| [`issue-06-node-env-dev.md`](./issue-06-node-env-dev.md) | **Low** | Vercel dashboard | `NODE_ENV=production` removed from Vercel dev env; local dev runs in development mode |

---

## What Is Not Covered Here

- **Issue 7 (Informational):** `config.toml` framed as production config in `auth-flow-analysis.md §8`
  — documentation update only, no spec required.
- **Issue 8 (Informational):** Callback `?next=` branch undocumented in `auth-flow-analysis.md §2.2`
  — documentation update only, no spec required.

---

## Implementation Order

Execute in this order to minimise integration risk:

1. **Issue 1** — unblocks all developers on fresh checkouts; no code change.
2. **Issue 6** — enables React warnings before implementing TypeScript changes; no code change.
3. **Issues 2 + 4** — implement together in a single commit to `signUpAction` (they touch the same function).
4. **Issue 3** — one-line change to `resetPasswordAction`; independent.
5. **Issue 5** — database migration; apply last after TypeScript changes are deployed.

---

## Flows Confirmed Working (No Fix Required)

Per `reports/auth-flow-audit-2026-03-21.md §6`:

- Sign-in → workspace slug resolution → redirect
- Sign-out → session clear → `/sign-in`
- Middleware session refresh on every matched request
- `handle_new_user()` trigger — all 5 steps
- RLS enforcement on `profiles`, `sessions`, `thoughts`, `api_keys`
- `is_workspace_member()` helper — `SECURITY DEFINER`, correct `auth.uid()` check
- PKCE callback code exchange and slug resolution
