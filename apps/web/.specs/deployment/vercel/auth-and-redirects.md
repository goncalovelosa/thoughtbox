# SPEC: Supabase Auth — Redirect URLs for Vercel

**Initiative**: `.specs/deployment/v1-initiative.md` (WS-07 / ADR-FE-02)  
**Status**: Draft

Vercel generates unique URLs for every deployment (production domain + per-deployment preview URLs). Supabase Auth validates redirect URLs against an allowlist — this spec defines exactly what to add so that both production and preview deployments complete the email confirmation and password reset flows correctly.

---

## How Redirect URLs Are Constructed in the App

Two server actions build redirect URLs:

| Action | Constructed URL |
|---|---|
| `signUpAction` | `${siteUrl}/api/auth/callback` |
| `forgotPasswordAction` | `${siteUrl}/api/auth/callback?next=/reset-password` |

`siteUrl` is resolved at runtime via:
```ts
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  `https://${process.env.VERCEL_URL ?? 'localhost:3000'}`
```

- **Production**: `NEXT_PUBLIC_SITE_URL=https://thoughtbox.dev` → `https://thoughtbox.dev/api/auth/callback`
- **Preview**: `NEXT_PUBLIC_SITE_URL` unset → falls back to `VERCEL_URL` (e.g. `thoughtbox-web-abc123.vercel.app`) → `https://thoughtbox-web-abc123.vercel.app/api/auth/callback`
- **Local dev**: both unset → `http://localhost:3000/api/auth/callback`

---

## Supabase Dashboard Configuration

### Location

Supabase dashboard → **Authentication** → **URL Configuration**

### Site URL

| Field | Value |
|---|---|
| Site URL | `https://thoughtbox.dev` |

This is used for magic link and OAuth flows as the base redirect. Set to the canonical production domain.

### Redirect URL Allowlist

Add all of the following. Supabase supports `*` wildcards within a domain segment.

| URL Pattern | Covers |
|---|---|
| `https://thoughtbox.dev/**` | All paths on the production domain |
| `https://*.vercel.app/**` | All Vercel preview deployments (any project) |
| `http://localhost:3000/**` | Local development |

> **Note on the `*.vercel.app` wildcard**: this covers all Vercel preview URLs across any project. If you want tighter scoping, use `https://thoughtbox-web-*.vercel.app/**` (replace `thoughtbox-web` with the actual Vercel project name). However, Vercel's per-deployment hashes include the branch name and a random suffix, so the wildcard is the practical choice.

### How to Add Redirect URLs in Supabase

1. Go to **Authentication** → **URL Configuration** in the Supabase dashboard.
2. Under **Redirect URLs**, click **Add URL**.
3. Add each pattern from the table above, one at a time.
4. Save.

---

## `NEXT_PUBLIC_SITE_URL` per Vercel Environment

| Vercel Environment | `NEXT_PUBLIC_SITE_URL` | Resulting `siteUrl` |
|---|---|---|
| Production | `https://thoughtbox.dev` | `https://thoughtbox.dev` |
| Preview | *(unset)* | `https://<VERCEL_URL>` (auto per deployment) |
| Development | *(unset)* | `http://localhost:3000` |

Setting `NEXT_PUBLIC_SITE_URL` on Preview would hardcode the production domain into every preview deployment's auth emails, breaking the preview confirmation flow. Leave it unset on Preview.

---

## Password Reset Flow

The password reset redirect uses a `next` query parameter:

```
https://thoughtbox.dev/api/auth/callback?next=/reset-password
```

The callback route handler (`src/app/api/auth/callback/route.ts`) reads `next` and redirects there after session exchange. No extra Supabase configuration is needed beyond the URL allowlist above — `/api/auth/callback` is covered by the `/**` wildcard.

`/reset-password` is intentionally excluded from the middleware matcher, so the page is accessible immediately after following the email link even before the session is fully established.

---

## Local Development

When running `npm run dev`, Supabase emails will contain links pointing to `http://localhost:3000/api/auth/callback`. This requires:

1. `http://localhost:3000/**` in the Supabase redirect URL allowlist (listed above).
2. No `NEXT_PUBLIC_SITE_URL` set in `.env.local` (or set it to `http://localhost:3000`).

---

## Acceptance Criteria

1. **Production sign-up**: confirmation email link redirects to `https://thoughtbox.dev/api/auth/callback` and successfully exchanges the code, landing the user on `/w/demo/dashboard`.
2. **Production password reset**: reset email link redirects to `https://thoughtbox.dev/api/auth/callback?next=/reset-password` and lands on the reset password page with an active session.
3. **Preview sign-up**: confirmation email link redirects to the correct `*.vercel.app` URL (not the production domain), completes the code exchange, and lands on `/w/demo/dashboard`.
4. **Local dev sign-up**: confirmation email link redirects to `http://localhost:3000/api/auth/callback` and completes the flow.
5. No Supabase "redirect URL not allowed" error appears in any environment.
