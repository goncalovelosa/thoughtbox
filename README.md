# Thoughtbox — Web App

Unified Next.js application that serves both the public marketing site and the authenticated product dashboard. Deployed to Google Cloud Run via Docker.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v3 |
| Fonts | Inter + JetBrains Mono (via `next/font`) |
| Runtime | Node.js 22 |
| Deployment | Cloud Run (`output: 'standalone'`) |

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Set up local environment
cp .env.example .env.local
# Edit .env.local with your Supabase and Redis credentials

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Route map

### Public

| Route | Description |
|---|---|
| `/` | Marketing homepage |
| `/pricing` | Pricing plans |
| `/docs` | Documentation index |
| `/docs/quickstart` | Quickstart guide |
| `/support` | Support page |
| `/terms` | Terms of Service |
| `/privacy` | Privacy Policy |

### Auth

| Route | Description |
|---|---|
| `/sign-in` | Sign-in form |
| `/sign-up` | Sign-up form |
| `/forgot-password` | Password reset request |
| `/reset-password` | Set new password (token from email) |

### Authenticated app

| Route | Description |
|---|---|
| `/app` | Redirects to the default workspace dashboard when available; otherwise shows a workspace recovery state |
| `/w/[workspaceSlug]/dashboard` | Workspace overview |
| `/w/[workspaceSlug]/projects` | Projects list |
| `/w/[workspaceSlug]/runs` | MCP session run history |
| `/w/[workspaceSlug]/api-keys` | API key management |
| `/w/[workspaceSlug]/usage` | Usage meters |
| `/w/[workspaceSlug]/billing` | Subscription & billing |
| `/w/[workspaceSlug]/settings/account` | Personal account settings |
| `/w/[workspaceSlug]/settings/workspace` | Workspace settings |
| `/w/[workspaceSlug]/docs/quickstart` | In-app quickstart guide |

### Platform

| Route | Description |
|---|---|
| `/health` | Cloud Run health check — returns `{ status: "ok" }` |

## Building for production

```bash
npm run build

# Run the standalone server locally (mirrors Cloud Run behavior)
npm start
```

## Docker / Cloud Run

```bash
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
```

## Architecture notes

- **Route groups**: `(public)` and `(auth)` are route groups — they group related layouts without affecting the URL.
- **Server Components by default**: all pages and layouts are Server Components unless a file starts with `'use client'`.
- **Async params**: Next.js 15 makes `params` a `Promise` in dynamic routes — always `await params` before destructuring.
- **Standalone output**: `next.config.ts` sets `output: 'standalone'` so the Docker image contains only the minimal runtime.
- **`/health`**: implemented as a Next.js Route Handler at `src/app/health/route.ts`, not under `/api/`, matching the Cloud Run spec.

## What's not yet implemented

| Feature | ADR |
|---|---|
| Auth (sign-in, sign-up, session management) | ADR-FE-02 / ADR-AUTH-01 |
| API key issuance & revocation | ADR-AUTH-02 |
| Real runs and thought data | WS-04 / WS-05 |
| Stripe billing integration | ADR-BILL-01 |
| Live usage counters | WS-06 |

Auth forms are rendered as visible but disabled stubs, ready to be wired up.
