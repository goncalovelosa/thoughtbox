# Plan: Production-First Realtime Alignment

This plan fixes multi-tenancy bugs and removes placeholders in the Realtime and Auth layers to ensure the system is ready for multi-user deployment.

## 1. Multi-Tenant Emitter Refactor
The `ThoughtEmitter` singleton must handle multiple workspaces simultaneously without cross-talk.

- **File:** `thoughtbox/src/observatory/emitter.ts`
- **Changes:**
    - Replace single `channel` field with `private channels: Map<string, RealtimeChannel>`.
    - Replace single `workspaceId` field with `private sessionToWorkspace: Map<string, string>`.
    - New method `registerWorkspaceClient(workspaceId: string, client: SupabaseClient)`.
    - Update `safeEmit` to find the correct channel by event payload content.

## 2. Real Connection State in UI
Remove the `isLive: true` placeholder and use actual Supabase socket events.

- **File:** `src/lib/session/use-session-realtime.ts`
- **Changes:**
    - Add `const [status, setStatus] = useState<string>('connecting')`.
    - Update `.subscribe((status) => setStatus(status))`.
    - Return `isLive: status === 'SUBSCRIBED'`.

## 3. Production-Ready Seeding
Ensure migrations work against real Supabase schemas without dummy UUIDs for restricted tables.

- **File:** `supabase/migrations/20260317000003_seed_dev_workspace.sql`
- **Changes:**
    - Use `(SELECT id FROM auth.users LIMIT 1)` to fetch a real owner ID.
    - Add guards to prevent crashes if `auth.users` is empty.

## 4. MCP Server Integration Fix
- **File:** `thoughtbox/src/index.ts`
- **Changes:**
    - Call `thoughtEmitter.registerWorkspaceClient(workspaceId, realtimeClient)` inside the HTTP handler.
    - Ensure `thoughtEmitter` maps the `sessionId` to the `workspaceId` immediately.

## 5. Billing Model: Flat Rate / Unlimited
- **Schema:** Removed atomic usage counters. Added `stripe_customer_id` and `subscription_status` to `workspaces`.
- **UI:** Refactored Usage page to show plan entitlements rather than meters.
