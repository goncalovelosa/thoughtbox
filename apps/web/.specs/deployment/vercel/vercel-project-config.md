# SPEC: Vercel Project Configuration

**Supersedes**: ADR-FE-01 (hosting section only — "hosting on Cloud Run" is replaced by Vercel)  
**Initiative**: `.specs/deployment/v1-initiative.md` (WS-07)  
**Status**: Draft

---

## Decision

The `thoughtbox-webpage-2026` Next.js app is hosted on **Vercel**, not Cloud Run.  
The MCP server (`thoughtbox-mcp`) remains on Cloud Run. These are independent deployments.

---

## Vercel Project Settings

| Setting | Value |
|---|---|
| Project name | `thoughtbox-web` |
| Framework preset | Next.js |
| Root directory | `.` (repo root) |
| Build command | `next build` (Vercel default) |
| Output directory | `.next` (Vercel default — do **not** set `output: 'standalone'`) |
| Install command | `npm install` |
| Node.js version | `22.x` |

---

## Environment Variables

Variables are set in the Vercel dashboard under **Settings → Environment Variables**.  
Three scopes are available: **Production**, **Preview**, **Development**.

### Required — all environments

| Variable | Scope | Value | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | `https://<project>.supabase.co` | From Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | `<anon key>` | Public — safe to expose to browser |

### Required — server-only

| Variable | Scope | Value | Notes |
|---|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | `<service role key>` | **Never** expose to browser; server actions / route handlers only |

### Environment-specific

| Variable | Scope | Value | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production only | `https://thoughtbox.dev` | Used to construct Supabase auth redirect URLs. **Do not set on Preview** — the code falls back to `VERCEL_URL` (auto-injected by Vercel), which correctly resolves each preview deployment's unique URL. |

### Vercel-injected (no action required)

| Variable | Injected by | Notes |
|---|---|---|
| `VERCEL_URL` | Vercel (auto) | Hostname of the current deployment (no `https://` prefix). The auth actions already use this as a fallback when `NEXT_PUBLIC_SITE_URL` is unset. |

### Removed from Cloud Run setup (do not create)

| Variable | Reason |
|---|---|
| `REDIS_URL` | Not needed — Vercel manages ISR cache natively |
| `PORT` | Not needed — Vercel manages the port |

---

## Domains

| Domain | Assignment |
|---|---|
| `thoughtbox.dev` | Production (add as custom domain in Vercel dashboard) |
| `www.thoughtbox.dev` | Redirect → `thoughtbox.dev` |
| `<hash>.vercel.app` | Auto-generated per deployment (preview) |
| `<branch>.thoughtbox-web.vercel.app` | Optional — branch aliases |

Add `thoughtbox.dev` via Vercel dashboard → Domains. Point DNS:  
- `A` record → `76.76.21.21` (Vercel)  
- `CNAME www` → `cname.vercel-dns.com`

---

## Deployment Triggers

| Event | Behaviour |
|---|---|
| Push to `main` | Auto-deploys to Production |
| Push to any other branch | Auto-deploys a Preview with a unique URL |
| Pull request opened / updated | Preview URL posted as PR comment |

No manual deploy commands are needed. `vercel --prod` can be used for manual production promotion if needed.

---

## Build & Runtime Notes

- **No `output: 'standalone'`** in `next.config.ts` — Vercel does not use the standalone server.  
- **No Dockerfile** — Vercel builds from source directly.  
- **ISR** works out of the box; no Redis cache handler needed.  
- **Edge Middleware** (`middleware.ts`) is fully supported by Vercel — no changes needed.  
- **`/health` route handler** continues to work on Vercel as a Serverless Function.

---

## Acceptance Criteria

1. `npm run build` completes with zero errors and no `output: 'standalone'` in `next.config.ts`.
2. Vercel deployment dashboard shows build as "Ready".
3. `https://thoughtbox.dev` serves the homepage with a 200 status.
4. `https://thoughtbox.dev/health` returns `{ "status": "ok" }` with a 200 status.
5. `/sign-in` loads and the form submits without a CORS or redirect error.
6. Sign-up email confirmation link redirects to the correct production URL (not a `localhost` or `vercel.app` URL).
7. A Preview deployment at a `*.vercel.app` URL also completes the sign-up email confirmation flow correctly (Supabase redirect URL wildcards — see `auth-and-redirects.md`).
