# SPEC: Codebase Changes for Vercel Migration

**Initiative**: `.specs/deployment/v1-initiative.md` (WS-07)  
**Status**: Draft

This document lists every file-level change needed to move from the current Cloud Run–oriented setup to Vercel. Changes are minimal — the Next.js application code itself is unaffected.

---

## Files to Delete

| File | Reason |
|---|---|
| `Dockerfile` | Vercel builds from source; no container image needed |
| `.dockerignore` | No longer relevant without a Dockerfile |

---

## Files to Modify

### `next.config.ts`

Remove the `output: 'standalone'` line. Vercel does not use the standalone server; leaving it in causes unnecessary bundling of a Node server that Vercel ignores.

**Before**:
```ts
const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
}
```

**After**:
```ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [],
  },
}
```

---

### `package.json`

The `start` script currently runs the standalone server binary. Vercel does not use `npm start` (it manages the runtime), but update the script so local production simulation works correctly.

**Before**:
```json
"start": "node .next/standalone/server.js"
```

**After**:
```json
"start": "next start"
```

---

### `.env.example`

Remove the `REDIS_URL` and `PORT` entries. Add `NEXT_PUBLIC_SITE_URL` with a comment explaining Vercel preview behaviour.

**Before** (relevant lines):
```bash
# ── Redis (WS-01 / ADR-GCP-01) ───────────────────────────────────────────────
# Used for Next.js ISR cache handler in multi-instance Cloud Run deployment
REDIS_URL=redis://localhost:6379

# ── App ───────────────────────────────────────────────────────────────────────
# Set to production when deploying to Cloud Run
NODE_ENV=development

# Cloud Run injects PORT automatically; override locally if needed
# PORT=8080
```

**After**:
```bash
# ── App ───────────────────────────────────────────────────────────────────────
NODE_ENV=development

# Production domain — used to construct Supabase auth redirect URLs.
# Set this in Vercel dashboard for Production only.
# Leave unset for Preview deployments; the code falls back to VERCEL_URL.
# For local dev, leave as-is (falls back to localhost:3000).
NEXT_PUBLIC_SITE_URL=https://thoughtbox.dev
```

---

### `README.md`

Replace the **Docker / Cloud Run** section with a **Vercel** deployment section. Replace the architecture note about `output: 'standalone'`.

**Replace** the "Docker / Cloud Run" section:
```md
## Docker / Cloud Run

\`\`\`bash
# Build image
docker build -t thoughtbox-webpage .

# Run locally (Cloud Run listens on 8080)
docker run -p 8080:8080 --env-file .env.local thoughtbox-webpage

# Deploy
gcloud run deploy thoughtbox-webpage \
  --image=REGION-docker.pkg.dev/PROJECT/REPO/thoughtbox-webpage:TAG \
  --region=us-central1 \
  --platform=managed \
  --port=8080
\`\`\`
```

**With**:
```md
## Deployment

Hosted on Vercel. Push to `main` auto-deploys to production.

\`\`\`bash
# Install Vercel CLI (one-time)
npm i -g vercel

# Link project (one-time, from repo root)
vercel link

# Deploy to production manually (if needed)
vercel --prod
\`\`\`

Set environment variables in the Vercel dashboard — see
\`.specs/deployment/vercel/vercel-project-config.md\`.
```

**Replace** the architecture note:
```md
- **Standalone output**: `next.config.ts` sets `output: 'standalone'` so the Docker image contains only the minimal runtime.
```

**With**:
```md
- **Vercel hosting**: deployed directly from source — no `output: 'standalone'` or Docker required.
```

---

## Files to Leave Unchanged

| File | Notes |
|---|---|
| `middleware.ts` | Vercel Edge Middleware supports `@supabase/ssr` without modification |
| `src/lib/supabase/server.ts` | No change — `cookies()` from `next/headers` works on Vercel |
| `src/lib/supabase/client.ts` | No change |
| `src/app/(auth)/actions.ts` | No change — `NEXT_PUBLIC_SITE_URL` fallback chain already handles Vercel URLs |
| `src/app/api/auth/callback/route.ts` | No change |
| `src/app/health/route.ts` | No change — works as a Vercel Serverless Function |
| All page and component files | No change |
| `tailwind.config.ts` | No change |
| `tsconfig.json` | No change |
| `postcss.config.mjs` | No change |

---

## Summary of Changes

| Category | Count |
|---|---|
| Files deleted | 2 (`Dockerfile`, `.dockerignore`) |
| Files modified | 4 (`next.config.ts`, `package.json`, `.env.example`, `README.md`) |
| Files unchanged | All application source |

---

## Acceptance Criteria

1. `next build` completes without errors after removing `output: 'standalone'`.
2. `npm start` (i.e. `next start`) serves the app at `http://localhost:3000` after a local build.
3. No reference to `standalone`, `PORT=8080`, or `REDIS_URL` remains in any committed file.
4. Vercel build log shows zero errors and the deployment resolves to "Ready".
