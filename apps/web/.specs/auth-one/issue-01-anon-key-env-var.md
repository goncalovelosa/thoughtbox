# Spec: NEXT_PUBLIC_SUPABASE_ANON_KEY Environment Variable Alignment

**Issue severity:** High  
**Source audit:** `reports/auth-flow-audit-2026-03-21.md §5.1`  
**Affected files:** `.env.example`, Vercel project environment configuration

---

## Problem

The Vercel CLI pulls a development environment file (`.env.local`) that sets `SUPABASE_ANON_KEY`
without the `NEXT_PUBLIC_` prefix. The application requires `NEXT_PUBLIC_SUPABASE_ANON_KEY` in
three locations:

- `middleware.ts:10`
- `src/lib/supabase/server.ts:9`
- `src/lib/supabase/client.ts:6`

On a fresh `git clone` + `vercel env pull`, with no committed `.env` file present,
`NEXT_PUBLIC_SUPABASE_ANON_KEY` resolves to `undefined`. All auth operations fail silently —
middleware and server client attempt authentication with an undefined key, and the browser
client exposes `undefined` to the client bundle.

The correct value is only available because it is hardcoded in a local `.env` file that is
not tracked by git, creating an invisible onboarding dependency.

---

## Target State After Fix

### Vercel Project Environment Variables

The Vercel project has `NEXT_PUBLIC_SUPABASE_ANON_KEY` set in **all three environments**
(Production, Preview, Development) with the same value as the existing `SUPABASE_ANON_KEY`
entry. The `SUPABASE_ANON_KEY` entry (without the prefix) may remain for backward compatibility
but is not relied upon by any application code.

When a developer runs `vercel env pull .env.local`, the pulled file contains:

```
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
NEXT_PUBLIC_SUPABASE_URL="https://akjccuoncxlvrrtkvtno.supabase.co"
```

No local `.env` file is required for basic auth to function after a fresh checkout.

### `.env.example`

`.env.example` documents `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY`) as the
canonical variable name. The file makes clear which variables must carry the `NEXT_PUBLIC_`
prefix to be embedded in the browser bundle:

```
# ── Supabase ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://your-site.com
```

### Application Code

No changes to application source code are required. `middleware.ts`, `src/lib/supabase/server.ts`,
and `src/lib/supabase/client.ts` continue to read `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`
unchanged.

---

## Verification

A developer who performs the following sequence on a machine with no pre-existing `.env` files:

```bash
git clone <repo>
cd thoughtbox-webpage-2026
pnpm install
vercel env pull .env.local
pnpm dev
```

can navigate to `/sign-in` and complete a sign-in without encountering a Supabase client
initialization error. The browser console contains no `undefined` key warnings.

---

## Notes

- The `NODE_ENV` issue in `.env.local` (Issue 6) is a separate Vercel environment variable
  problem tracked in `issue-06-node-env-dev.md`.
- This fix requires a Vercel dashboard action, not a code commit. The `.env.example` update
  is the only file change committed to git.
