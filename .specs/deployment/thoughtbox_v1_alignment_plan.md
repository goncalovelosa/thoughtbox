# ThoughtBox v1: Comprehensive Alignment & Execution Plan

This document breaks down the requirements from the `thoughtbox_v1_functional_deployment_conditions.md` into concrete, actionable implementation plans. All tasks are aligned with a Supabase-centric architecture (Auth, Postgres, Realtime) and Next.js (App Router). 

---

## Phase 1: Core SaaS Data Model & Tenancy

**Objective:** Establish the foundation for users, workspaces (tenancy), and membership, ensuring all subsequent data (runs, traces) is properly scoped.

### 1.1 Schema Definition & Migrations
- **Action:** Create `supabase/migrations/xxxx_create_saas_core.sql`.
- **Tables Needed:**
  - `workspaces`: `id`, `name`, `slug`, `plan_id`, `stripe_customer_id`, `created_at`.
  - `memberships`: `id`, `user_id` (refs auth.users), `workspace_id`, `role` (owner, member), `created_at`.
- **Modifications to Existing Tables:**
  - Alter `sessions`, `thoughts`, and `knowledge` to require a `workspace_id`.
  - Update all existing `idx_sessions_project` to `idx_sessions_workspace_id`.

### 1.2 Row Level Security (RLS) Implementation
- **Action:** Define strict RLS policies for all tables.
- **Policies:**
  - Users can read/write `workspaces` only if they have a corresponding `memberships` record.
  - Users can read/write `sessions`, `thoughts`, `knowledge`, and `api_keys` only if the `workspace_id` matches a `memberships` record for `auth.uid()`.

### 1.3 Auto-Provisioning Pipeline
- **Action:** Create a Postgres Trigger or Supabase Auth Webhook.
- **Logic:** Upon insertion into `auth.users`, automatically create a "Personal Workspace" and assign the user as the "Owner" in `memberships`. This solves the "first run empty state" problem.

---

## Phase 2: Programmatic Access (API Keys)

**Objective:** Fulfill the requirement that users can obtain credentials and make successful programmatic requests.

### 2.1 API Key Data Model
- **Action:** Create `supabase/migrations/xxxx_create_api_keys.sql`.
- **Table:** `api_keys` (`id`, `workspace_id`, `key_hash`, `name`, `created_at`, `last_used_at`, `revoked_at`).
- **Security:** Never store raw keys. Store hashed versions.

### 2.2 Key Generation UI
- **Location:** `src/app/w/[slug]/settings/keys/page.tsx`
- **Features:** Generate new key, display raw key exactly once, list active keys, revoke key button.

### 2.3 API Authentication Middleware
- **Location:** `src/middleware.ts` or specific API route handlers (`src/app/api/...`).
- **Logic:** Intercept `Authorization: Bearer <key>`, hash the key, look it up in the database, extract the associated `workspace_id`, and inject it into the request context for downstream use.

---

## Phase 3: The Wedge (Trace / Ledger UI)

**Objective:** Deliver the core differentiating value: post-hoc reasoning auditability.

### 3.1 Ingestion API
- **Location:** `src/app/api/ingest/route.ts` or similar.
- **Logic:** Accept payloads from the ThoughtBox MCP server. Authenticate via API key. Insert/append into `sessions` and `thoughts` tables using the authenticated `workspace_id`.

### 3.2 Real-time Infrastructure Bridge
- **Action:** Transition from custom WebSocket to Supabase Realtime.
- **Logic:** When thoughts are inserted into the database, trigger a Supabase Realtime Broadcast or ensure the UI is listening to Postgres Changes on the `thoughts` table for the active session.

### 3.3 Run Explorer UI (Dashboard)
- **Location:** `src/app/w/[slug]/runs/page.tsx`
- **Features:** List all sessions (`runs`) for the workspace. Filter by status, time, or project context.

### 3.4 Ledger Viewer UI (Detail Page)
- **Location:** `src/app/w/[slug]/runs/[sessionId]/page.tsx`
- **Features:** 
  - Timeline view of the ledger.
  - Distinguish inputs, tool activity, decisions, and outputs.
  - Supabase Realtime listener to append incoming thoughts live.

---

## Phase 4: App Navigation & Identity Loop

**Objective:** Complete the "Stranger Test" so users can sign up, log in, and navigate the app contextually.

### 4.1 Supabase Auth UI integration
- **Location:** `src/app/(auth)/sign-in/page.tsx`, `src/app/(auth)/sign-up/page.tsx`
- **Action:** Wire up existing stubbed components to `@supabase/ssr` methods for email/password or OAuth login.

### 4.2 Workspace Routing & Middleware
- **Location:** `src/middleware.ts` and `src/app/w/[slug]/layout.tsx`
- **Logic:** Ensure every URL under `/w/[slug]` validates that the current `auth.uid()` has membership in the workspace identified by `slug`. Redirect unauthorized users.

### 4.3 Public Marketing Surfaces
- **Location:** `src/app/(public)/...`
- **Action:** Ensure Home, Pricing, Quickstart (Docs), Privacy, and Terms pages exist and clearly state the value prop and boundaries.

---

## Phase 5: Billing, Limits, and Entitlements

**Objective:** Ensure a paid tier exists, works, and limits are enforced.

### 5.1 Stripe Integration
- **Action:** Implement Stripe Checkout and Customer Portal.
- **Location:** `src/app/api/webhooks/stripe/route.ts`
- **Logic:** Listen to Stripe webhooks to sync `subscriptions` data to the Supabase database.

### 5.2 Usage Metering & Limits
- **Action:** Implement Postgres RPC functions for atomic usage counting (e.g., `increment_usage(workspace_id, metric)`).
- **Location:** API route ingestion endpoints.
- **Logic:** Before accepting a run or thought, check if the workspace has exceeded its monthly limit based on its `plan_id`. Return `402 Payment Required` if exceeded.

### 5.3 Billing Dashboard UI
- **Location:** `src/app/w/[slug]/settings/billing/page.tsx`
- **Features:** Show current plan, usage vs. limits progress bars, and an "Upgrade" button linking to Stripe.

---

## Phase 6: Operational Control Plane

**Objective:** Provide internal supportability without manual database surgery.

### 6.1 Admin Dashboard
- **Location:** `src/app/admin/...` (Protected by a super-user role/flag).
- **Features:**
  - View workspaces, usage, and billing state.
  - Revoke compromised keys manually.
  - Suspend abusive workspaces.
  - View system-wide error rates.

---

## Proposed Execution Order

To reach the "Stranger Test" milestone fastest:

1. **Phase 1 (Data Model & Tenancy)** - Foundation must exist first.
2. **Phase 4.1 & 4.2 (Identity & Routing)** - Get the auth shell working so we can log in.
3. **Phase 2 (API Keys)** - Allow programmatic access generation.
4. **Phase 3 (Ingestion & Ledger UI)** - Prove the core product loop works.
5. **Phase 4.3 (Marketing/Docs)** - Polish the entry points.
6. **Phase 5 (Billing & Entitlements)** - Gate the product.
7. **Phase 6 (Admin)** - Supportability.
