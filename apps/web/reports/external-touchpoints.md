# External Touchpoints & Behavioral Expectations

Every place this web application interacts with services, APIs, or systems
outside its own process boundary.

Last audited: 2026-03-21

---

## 1. Supabase Auth (Server Actions)

**Locations:**
- `src/app/(auth)/actions.ts` — sign-in, sign-up, forgot-password, reset-password
- `src/app/api/auth/callback/route.ts` — OAuth / magic-link PKCE code exchange
- `src/app/actions.ts` — global `signOut` server action
- `src/app/app/page.tsx` — `auth.getUser()` + profile lookup for redirect routing

**Expected behavior:**
- Validates credentials and establishes session cookies via `@supabase/ssr`.
- Post-login resolves the user's `default_workspace_id` from their profile and
  redirects to `/w/[workspaceSlug]/dashboard`.
- Surfaces clear, safe error messages to the UI (e.g. invalid credentials,
  password policy violations).
- OAuth callback exchanges the PKCE code and redirects. When no workspace is
  resolved, the authenticated user falls back to `/app`, which now presents a
  workspace recovery state instead of redirecting back to `/sign-in`.

---

## 2. Supabase Auth (Middleware — Session Refresh)

**Location:**
- `middleware.ts`

**Expected behavior:**
- Runs on every request matching `/w/:path*`, `/app`, `/sign-in`, `/sign-up`,
  `/forgot-password`.
- Creates its own Supabase server client and calls `auth.getUser()` to refresh
  the session token on every matched navigation.
- Redirects unauthenticated users away from `/w/*` and `/app` to `/sign-in`.
- Redirects authenticated users away from auth-only pages to `/app`.
- This is a separate external call from the server actions — it fires on
  navigation, not just on form submission.

---

## 3. Supabase Database (PostgreSQL via REST)

**Locations:**
- `src/app/w/[workspaceSlug]/api-keys/actions.ts` — create, revoke, list API keys
- `src/app/w/[workspaceSlug]/runs/page.tsx` — fetch sessions list
- `src/app/w/[workspaceSlug]/runs/[runId]/page.tsx` — fetch session + thoughts
- `src/app/app/page.tsx` — profile + workspace lookup for redirect

**Expected behavior:**
- All queries go through the Supabase client scoped to the authenticated
  session. Row Level Security (RLS) is assumed active — the database must
  strictly scope returned data to the authenticated user and requested workspace.
- Write operations (API key creation, revocation) must succeed atomically or
  fail completely.
- Read failures surface as empty states or `notFound()`, not unhandled
  exceptions.

---

## 4. Supabase Realtime (WebSockets)

**Location:**
- `src/lib/session/use-session-realtime.ts`

**Expected behavior:**
- Establishes a persistent WebSocket connection to the channel
  `workspace:[workspaceId]`.
- Listens for broadcast events (`thought:added`, `thought:revised`,
  `thought:branched`) and updates local state reactively.
- Should reconnect on connection drop. Only users with workspace access should
  be able to subscribe.

---

## 5. Google Fonts (CDN)

**Location:**
- `src/app/layout.tsx:2-15` — `next/font/google` imports for Inter and
  JetBrains Mono

**Expected behavior:**
- Next.js fetches font files from Google's font CDN at build time (and
  potentially at runtime in dev mode).
- Uses `display: 'swap'` to avoid blocking the critical rendering path.
- Note: font requests expose the build server's IP to Google. In production
  with static optimization, fonts are self-hosted from the Next.js asset
  pipeline after the initial fetch.

---

## 6. Redis (Optional — ISR Cache)

**Location:**
- `.env.example:12-13` — `REDIS_URL` environment variable

**Expected behavior:**
- Optional dependency for the Next.js ISR cache handler in multi-instance
  deployments (e.g. multiple Vercel regions or self-hosted).
- When configured, Next.js connects to Redis to share incremental static
  regeneration cache across instances.
- When absent, ISR uses the default in-memory/filesystem cache (single-instance
  only).

---

## 7. Hardcoded MCP Server URLs (GCP Cloud Run)

**Locations:**
- `src/app/w/[workspaceSlug]/connect/ConnectPanel.tsx:6` —
  `https://api.thoughtbox.dev/mcp`
- `src/app/w/[workspaceSlug]/docs/quickstart/page.tsx:47` —
  `https://api.thoughtbox.dev/mcp`

**Expected behavior:**
- This URL is rendered into copyable config snippets for the user — the web app
  does not call it directly.
- All product and public docs surfaces should render the same MCP endpoint from
  one shared source of truth.

---

## 8. Clipboard API (Browser)

**Locations:**
- `src/app/w/[workspaceSlug]/connect/ConnectPanel.tsx:33` —
  `navigator.clipboard.writeText()`
- `src/app/w/[workspaceSlug]/api-keys/CreateKeyDialog.tsx` — clipboard
  interaction for copying API keys

**Expected behavior:**
- Writes text to the OS clipboard. Requires a secure context (HTTPS) and may
  prompt the user for permission in some browsers.
- Should handle the rejection case (e.g. permission denied) gracefully by
  surfacing a manual-copy fallback message.

---

## 9. Vercel Analytics (Installed but NOT Wired Up)

**Location:**
- `package.json:15` — `@vercel/analytics` v2.0.1

**Current state:**
- The package is a production dependency but the `<Analytics />` component is
  **not imported or rendered** anywhere in the application. No layout, page, or
  component references it.
- This means Vercel Analytics is **not active**. It is dead weight in
  `node_modules` today.
- If/when wired up, it should load asynchronously and not block rendering.

---

## 10. Unused Dependencies (Potential External Surface)

**Location:**
- `package.json:14,18` — `jsonwebtoken` v9.0.3 and `@types/jsonwebtoken`

**Current state:**
- `jsonwebtoken` is a production dependency but has **no imports** anywhere in
  `src/`. It appears to be dead weight or pre-provisioned for future use.
- `bcryptjs` (also in `package.json:16`) **is** actively used in
  `src/app/w/[workspaceSlug]/api-keys/actions.ts` for hashing API keys. This is
  a legitimate, active dependency — not an external touchpoint per se, but a
  security-sensitive crypto boundary worth tracking.

---

## Summary Table

| # | Touchpoint | Type | Status |
|---|-----------|------|--------|
| 1 | Supabase Auth (actions) | Auth API | Active |
| 2 | Supabase Auth (middleware) | Auth API | Active |
| 3 | Supabase Database (REST) | Database | Active |
| 4 | Supabase Realtime | WebSocket | Active |
| 5 | Google Fonts CDN | Asset fetch | Active (build-time) |
| 6 | Redis | Cache | Optional, env-gated |
| 7 | MCP Server URLs | Rendered reference | Passive (not called) |
| 8 | Clipboard API | Browser API | Active |
| 9 | Vercel Analytics | Analytics | Installed, not wired |
| 10 | `jsonwebtoken` | Crypto lib | Installed, not used |
