# Managed Thoughtbox Cloud

Specification for turning Thoughtbox into a paid SaaS product. This document maps
what already exists in the codebase against what's needed to accept a payment and
serve real session data.

## 1. Current State Inventory

### What exists and works

| Layer | Status | Details |
|-------|--------|---------|
| **Supabase Auth** | Working | Sign-in, sign-up, forgot/reset password, OAuth callback, middleware session refresh |
| **Workspace routing** | Working | `w/[workspaceSlug]/` layout with sidebar, top bar, user context |
| **Workspace model** | Working | `workspaces` table has `slug`, `owner_user_id`, `plan_id`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status` columns already defined |
| **Workspace membership** | Working | `workspace_memberships` table with `user_id`, `workspace_id`, `role` |
| **Profiles** | Working | `profiles` table with `default_workspace_id`, sign-in resolves to user's default workspace |
| **API key management** | Working | Full CRUD — create (bcrypt-hashed, `tbx_` prefix), revoke, list. Keys scoped to workspace and user |
| **Dashboard** | Working | Queries real `sessions`, `thoughts`, `api_keys` counts from Supabase. Shows recent runs |
| **Runs list** | Working | Fetches sessions with OTEL event counts and thought-type signal breakdowns |
| **Run detail** | Working | Full trace explorer with thoughts, OTEL events, realtime subscription via Supabase broadcast |
| **Usage page** | Working | All-time and 30-day counts for thoughts, sessions, API keys, tags |
| **Connect page** | Working | Generates MCP config JSON with API key selector, points to Cloud Run MCP server URL |
| **Realtime** | Working | `useSessionRealtime` hook subscribes to `workspace:{id}` broadcast channel for live thought updates |
| **RLS function** | Exists | `is_workspace_member(ws_id)` function defined in database |
| **Billing page** | Stub | Hardcoded "Founding Beta / Free through May 1" card. No Stripe integration |
| **Pricing page** | Stub | Single "Free" card with founding beta copy. No tiers |
| **Auto-provisioning** | Assumed | Sign-up creates user, but workspace creation on sign-up is not visible in the web app code (likely a Supabase trigger) |

### What does NOT exist

1. **Stripe integration** — No checkout session creation, no webhook handler, no subscription lifecycle management
2. **Plan enforcement** — `plan_id` and `subscription_status` columns exist on `workspaces` but nothing reads them to gate features or enforce limits
3. **Usage metering** — Counts are displayed but not compared against plan limits
4. **Welcome email** — No transactional email on sign-up or checkout completion
5. **Workspace provisioning tied to checkout** — No flow that creates a workspace as a result of a Stripe payment
6. **Billing portal** — No link to Stripe Customer Portal for plan changes or cancellation

## 2. Pricing Tiers

| | Free | Pro | Team |
|---|---|---|---|
| **Price** | $0 | $29/mo | $99/mo |
| **Sessions** | 5 | Unlimited | Unlimited |
| **Thoughts** | 100 | Unlimited | Unlimited |
| **Seats** | 1 | 1 | 5 |
| **API keys** | 2 | 10 | 25 |
| **Realtime** | No | Yes | Yes |
| **OTEL traces** | No | Yes | Yes |
| **Knowledge graph** | Read-only (100 entities) | Full | Full |
| **Data retention** | 30 days | Unlimited | Unlimited |
| **Support** | Community | Email | Priority email |

### Plan IDs

Store as string identifiers on `workspaces.plan_id`:
- `free`
- `pro`
- `team`

### Stripe Products

Create three Stripe Products with monthly recurring prices. Map each Stripe Price ID
to a plan ID via environment variables:

```
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_TEAM=price_xxx
```

The Free plan has no Stripe price — it's the default when no subscription exists.

## 3. Provisioning Flow

### 3a. Free tier (sign-up only)

This already works (or nearly works):

1. User signs up via `/sign-up`
2. Supabase Auth creates user
3. Supabase trigger creates `profiles` row with `default_workspace_id`
4. Supabase trigger creates `workspaces` row with `plan_id = 'free'`, `subscription_status = 'active'`
5. Supabase trigger creates `workspace_memberships` row with `role = 'owner'`
6. User confirms email, lands on `/w/{slug}/dashboard`

**Gap**: Verify the existing Supabase trigger sets `plan_id = 'free'` on workspace creation. If not, add a migration.

### 3b. Paid tier (Stripe Checkout)

New flow:

1. User is on `/pricing` or `/w/{slug}/billing` and clicks "Upgrade to Pro" or "Upgrade to Team"
2. **Server action** creates a Stripe Checkout Session:
   - `mode: 'subscription'`
   - `customer_email: user.email` (or `customer: stripe_customer_id` if returning)
   - `metadata: { workspace_id, plan_id, user_id }`
   - `success_url: /w/{slug}/billing?upgraded=true`
   - `cancel_url: /w/{slug}/billing`
3. User completes payment on Stripe-hosted checkout
4. Stripe sends `checkout.session.completed` webhook
5. **Webhook handler** (`src/app/api/stripe/webhook/route.ts`):
   - Extracts `workspace_id` and `plan_id` from metadata
   - Updates `workspaces` row: `stripe_customer_id`, `stripe_subscription_id`, `plan_id`, `subscription_status = 'active'`
6. User returns to success URL, billing page shows new plan

### 3c. Subscription lifecycle webhooks

Handle these Stripe events:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `plan_id`, `stripe_customer_id`, `stripe_subscription_id`, `subscription_status = 'active'` |
| `customer.subscription.updated` | Update `plan_id` if price changed, update `subscription_status` |
| `customer.subscription.deleted` | Set `plan_id = 'free'`, `subscription_status = 'canceled'` |
| `invoice.payment_failed` | Set `subscription_status = 'past_due'` |

### 3d. Welcome email via AgentMail

After `checkout.session.completed`:

1. Webhook handler calls AgentMail API to send a welcome email
2. Template includes: workspace URL, link to Connect page, link to quickstart docs
3. For free-tier sign-ups, send a lighter welcome email from the Supabase Auth email hook or a separate trigger

## 4. Plan Enforcement

### Where to enforce

Enforcement happens at two boundaries:

1. **MCP server (Cloud Run)** — The Thoughtbox MCP server already validates API keys. Add a plan check: after resolving `workspace_id` from the API key, query `workspaces.plan_id` and `subscription_status` to determine limits.

2. **Web app** — The Next.js dashboard reads data via Supabase client. Add a `getWorkspacePlan()` helper that returns the plan config for the current workspace.

### Enforcement logic

Create a shared plan-limits config:

```ts
const PLAN_LIMITS = {
  free: {
    maxSessions: 5,
    maxThoughts: 100,
    maxApiKeys: 2,
    maxSeats: 1,
    realtime: false,
    otelTraces: false,
    retentionDays: 30,
  },
  pro: {
    maxSessions: Infinity,
    maxThoughts: Infinity,
    maxApiKeys: 10,
    maxSeats: 1,
    realtime: true,
    otelTraces: true,
    retentionDays: Infinity,
  },
  team: {
    maxSessions: Infinity,
    maxThoughts: Infinity,
    maxApiKeys: 25,
    maxSeats: 5,
    realtime: true,
    otelTraces: true,
    retentionDays: Infinity,
  },
} as const
```

### MCP server enforcement

When the MCP server receives a `thoughtbox_execute` call:

1. Resolve workspace from API key (already happens)
2. Check `subscription_status` — reject if `canceled` or `past_due` (with grace period)
3. Check current counts against plan limits — return a structured error if exceeded
4. The error message should include an upgrade URL: `https://thoughtbox.dev/w/{slug}/billing`

### Web app enforcement

- **Usage page**: Show progress bars against plan limits instead of just raw counts
- **Dashboard**: Show an upgrade banner when approaching limits (>80% usage)
- **API keys page**: Disable "Create key" button when at limit
- **Runs list**: Show "Upgrade to view older runs" when retention limit applies

## 5. Connecting Dashboard to Real Data

### Already connected

The dashboard, runs list, run detail, and usage pages already query real Supabase
tables. The queries in the codebase are production-ready:

- `dashboard/page.tsx` — queries `sessions`, `thoughts`, `api_keys` with workspace scoping
- `runs/page.tsx` — queries `sessions`, `runs`, `otel_events`, `thoughts` with workspace scoping
- `runs/[runId]/page.tsx` — full session detail with thoughts, OTEL events, realtime
- `usage/page.tsx` — all-time and 30-day counts
- `api-keys/actions.ts` — full key lifecycle with bcrypt hashing

### Remaining connections

| Page | Gap | Work needed |
|------|-----|-------------|
| **Billing** | Hardcoded "Founding Beta" | Replace with dynamic plan lookup from `workspaces.plan_id` and `subscription_status`. Add Stripe Customer Portal link |
| **Usage** | Hardcoded "Unlimited" entitlements | Replace with plan-aware limits and progress indicators |
| **Pricing** | Single free card | Replace with three-tier card layout, each with a checkout CTA |
| **Settings > Workspace** | No plan info | Show current plan, link to billing |
| **Observability** | Unknown state | Verify this page works with real OTEL data |

### Data flow diagram

```
MCP Client (Claude Code, Cursor, etc.)
    │
    │ MCP protocol over HTTP
    │ Authorization: API key (tbx_xxx)
    ▼
Thoughtbox MCP Server (Cloud Run)
    │
    │ API key → workspace_id resolution
    │ Plan limit check
    │ Supabase client writes
    ▼
Supabase (Postgres + Realtime)
    │
    │ RLS: is_workspace_member(ws_id)
    │ Realtime broadcast: workspace:{id}
    ▼
Next.js Web App (Vercel)
    │
    │ Supabase server client reads
    │ Supabase browser client (realtime)
    ▼
Dashboard UI
```

## 6. Security

### Row-Level Security

The `is_workspace_member(ws_id)` function already exists. Verify RLS policies are
enabled on all data tables:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `workspaces` | Member | Owner | Owner | Never (soft delete) |
| `workspace_memberships` | Member | Owner | Owner | Owner |
| `sessions` | Member | Member (via MCP) | Member | Never |
| `thoughts` | Member | Member (via MCP) | Never | Never |
| `entities` | Member | Member | Member | Never |
| `observations` | Member | Member | Member | Never |
| `relations` | Member | Member | Member | Never |
| `api_keys` | Member | Member | Member (revoke only) | Never |
| `otel_events` | Member | Member (via MCP) | Never | Never |
| `runs` | Member | Member (via MCP) | Member | Never |

**Action needed**: Audit existing RLS policies against this matrix. The
`rls-revert-migration.md` spec in `.specs/deployment/` suggests RLS has been
toggled before — verify current state.

### API key validation

Already implemented:
- Keys are bcrypt-hashed at rest
- Keys use `tbx_` prefix with a random prefix segment for identification
- Revocation sets `status = 'revoked'` and `revoked_at` timestamp
- List query filters by `created_by_user_id`

Needed:
- Rate limiting on the MCP server per API key (prevent abuse on free tier)
- Key scoping: add optional `scopes` column to `api_keys` for future granular permissions

### Workspace isolation

Already in place:
- Every data table has `workspace_id` as a required column
- All dashboard queries filter by `workspace_id`
- Realtime subscriptions are scoped to `workspace:{id}` channel
- API key resolution maps to a single workspace

Needed:
- Verify that the MCP server's API key validation returns the `workspace_id` and
  uses it for all subsequent writes (not trusting a client-provided workspace)
- Add a periodic audit query that checks for any rows where `workspace_id` doesn't
  match the session's workspace (data integrity check)

### Stripe webhook security

- Verify webhook signature using `stripe.webhooks.constructEvent()` with the
  `STRIPE_WEBHOOK_SECRET` environment variable
- Reject unsigned or replayed events
- Use idempotency: check if the subscription update has already been applied before
  writing

## 7. Minimum Work to Launch

Ordered by dependency. Each item is a single PR.

### Phase 1: Stripe integration (the payment gate)

**PR 1: Stripe webhook handler**
- `src/app/api/stripe/webhook/route.ts`
- Handles `checkout.session.completed`, `customer.subscription.updated`,
  `customer.subscription.deleted`, `invoice.payment_failed`
- Updates `workspaces` table with Stripe IDs and plan
- Environment variables: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

**PR 2: Checkout server action + billing page**
- Server action to create Stripe Checkout Session with workspace metadata
- Update `/w/{slug}/billing` to show current plan from database, upgrade buttons,
  and Stripe Customer Portal link
- Server action to create a Stripe Customer Portal session for plan management

**PR 3: Pricing page with checkout CTAs**
- Replace single free card with three-tier layout
- Each paid tier button calls the checkout server action
- Free tier links to `/sign-up`

### Phase 2: Plan enforcement (the value gate)

**PR 4: Plan limits config + workspace plan helper**
- `src/lib/plans.ts` — plan limits constant and `getWorkspacePlan()` helper
- Usage page shows progress bars against limits
- Dashboard shows upgrade banner when near limits

**PR 5: MCP server plan enforcement**
- After API key validation, check plan limits before accepting writes
- Return structured error with upgrade URL when limits exceeded
- This is a change to the MCP server repo, not this web app

### Phase 3: Polish (launch-ready)

**PR 6: Welcome email**
- AgentMail integration in the Stripe webhook handler
- Welcome template with workspace URL, connect instructions, quickstart link

**PR 7: RLS audit**
- Verify all tables have correct RLS policies enabled
- Add missing policies per the matrix above
- Run the audit as a Supabase migration

### What is NOT needed for launch

- Team seat management (can be manual/email-based initially)
- Usage-based billing or overages
- Self-serve plan downgrades (handle via Stripe Portal)
- Data retention enforcement (can run as a cron job later)
- Knowledge graph access control differences between free/paid
- Custom domains or white-labeling

## 8. Environment Variables (new)

Add to `.env.local` and Vercel project settings:

```
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_TEAM=price_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
AGENTMAIL_API_KEY=xxx
```

## 9. Open Questions

1. **Auto-provisioning trigger**: Does the existing Supabase trigger set `plan_id = 'free'` on workspace creation? Need to verify in the Supabase dashboard or migrations.

2. **MCP server changes**: The plan enforcement on the MCP server side requires changes to a separate repo. What's the coordination plan?

3. **Founding beta migration**: ~how many existing users need to be migrated? Do they get grandfathered into Pro, or do they start on Free with an upgrade prompt?

4. **Billing cycle alignment**: If a user signs up mid-month, Stripe prorates by default. Is that acceptable?

5. **Free tier realtime**: Disabling realtime for free users means they won't see live thought updates in the trace explorer. Is the trade-off worth it, or should realtime be available to all tiers to maintain the "wow" factor during onboarding?
