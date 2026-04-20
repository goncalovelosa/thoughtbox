# Spec: NODE_ENV Should Be development in Local Dev Environment

**Issue severity:** Low  
**Source audit:** `reports/auth-flow-audit-2026-03-21.md §5.4`  
**Affected file:** Vercel project environment configuration; `.env.example`

---

## Problem

`vercel env pull .env.local` produces a file containing:

```
NODE_ENV="production"
```

This causes local development to run in React's production mode. Consequences include:

- React development warnings (including hydration mismatch errors) are suppressed.
- Auth-related hydration bugs — such as mismatched cookie reads between server and client
  render — can go undetected during development.
- Error boundaries display production-mode error messages rather than development stack traces.
- Next.js disables Fast Refresh behaviour that relies on development mode checks.

The `.env.example` in the repository already documents `NODE_ENV=development` as the expected
value, so the Vercel-pulled configuration contradicts the repository's own guidance.

---

## Target State After Fix

### Vercel Project Environment Variables — Development Environment

The Vercel project's **Development** environment does not set `NODE_ENV` at all, or sets it
to `development`. (Next.js sets `NODE_ENV=development` by default when running `next dev`;
explicitly setting it to `production` in the pulled env file overrides that default.)

When a developer runs `vercel env pull .env.local`, the resulting file does not contain a
`NODE_ENV` entry, or contains:

```
NODE_ENV=development
```

### `.env.example`

`.env.example` retains the existing documentation:

```
# ── App ───────────────────────────────────────────────────────────────────────
NODE_ENV=development
```

No change required to this file — it already shows the correct value.

### Local Development Behaviour After Fix

- `pnpm dev` runs Next.js in development mode.
- React development warnings are active.
- Hydration mismatches produce visible console errors.
- `process.env.NODE_ENV === 'development'` evaluates to `true` in local dev.

### Production and Preview Environments

`NODE_ENV` is not changed for Production or Preview environments. Vercel sets
`NODE_ENV=production` automatically for builds in those environments. No manual override
is needed or appropriate there.

---

## Verification

After pulling the updated env:

```bash
vercel env pull .env.local
grep NODE_ENV .env.local   # should be absent or show "development"
pnpm dev
```

In the running browser, intentionally introducing a hydration mismatch (e.g., rendering
`Date.now()` in a server component without a `suppressHydrationWarning` attribute) produces
a visible React error in the browser console.

---

## Notes

- This fix requires removing or updating the `NODE_ENV` variable in the Vercel dashboard's
  **Development** environment only. It is a dashboard action, not a code commit.
- The risk of this fix is negligible: `next dev` always sets `NODE_ENV=development`
  internally, and the explicit override to `production` is the aberrant configuration.
- This issue does not affect production deployments.
