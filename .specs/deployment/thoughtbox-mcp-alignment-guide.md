# Implementation Guide: Thoughtbox MCP Server Alignment

This document details the changes required in the standalone **Thoughtbox MCP Server** repository to align with the v1 Supabase Dashboard and multi-tenant schema.

## 1. SupabaseStorage Scoping
The storage layer must enforce workspace isolation for every query.

### Changes in `src/persistence/supabase-storage.ts`:
- **Constructor:** Update `SupabaseStorageConfig` to include an mandatory `workspaceId: string`.
- **Query Scoping:** Every `.from('sessions')` or `.from('thoughts')` call MUST include:
  ```typescript
  .eq('workspace_id', this.workspaceId)
  ```
- **Insert Mapping:** When creating a session or saving a thought, ensure the `workspace_id` column is populated with the instance's `workspaceId`.

## 2. API Key Resolution & Entitlement Check
The server must translate a `tbx_...` key into a valid `workspaceId` and verify the account is active.

### Recommended Logic:
1. Extract the prefix (first 8 chars) from the incoming key.
2. Query the `api_keys` and `workspaces` table using a **Supabase Service Role Key**:
   ```typescript
   const { data } = await adminClient
     .from('api_keys')
     .select('workspace_id, key_hash, workspaces(subscription_status)')
     .eq('key_prefix', prefix)
     .eq('status', 'active')
     .single();
   ```
3. **Entitlement Check:** Verify the subscription is active:
   ```typescript
   const ws = data.workspaces as any;
   if (ws.subscription_status !== 'active') {
     throw new Error('Workspace subscription is inactive. Please upgrade at the dashboard.');
   }
   ```
4. Use `bcryptjs` to verify the full key against the `key_hash`.
5. Return the `workspace_id` to the session manager.

## 3. Real-time Broadcasting
The "Observatory" no longer uses local WebSockets. It uses Supabase Realtime Broadcast.

### Changes in `src/observatory/emitter.ts`:
Refactor the `ThoughtEmitter` (singleton) to handle multiple workspace channels:
- **Registry:** `private channels: Map<string, RealtimeChannel> = new Map();`
- **Mapping:** `private sessionToWorkspace: Map<string, string> = new Map();`
- **Broadcast:** In `safeEmit`, find the workspace ID for the session and send:
  ```typescript
  channel.send({
    type: 'broadcast',
    event: eventName,
    payload: data
  });
  ```

## 4. MCP HTTP Server Wiring
The entry point (`src/index.ts`) must handle the scoping sequence for every new HTTP request.

### Execution Flow:
1. **Request Arrives:** Check `Authorization` header for `tbx_...`.
2. **Resolve:** Call the resolution logic to get `workspaceId`.
3. **Register:** Tell the `ThoughtEmitter` which workspace this `sessionId` belongs to.
4. **Scoped Instance:** Create a `new SupabaseStorage({ ..., workspaceId })` specifically for this request/session.
5. **Execute:** Pass the scoped storage to the `createMcpServer` factory.

## 5. Security Guardrails
- **Environment Variables:** Ensure the server has `SUPABASE_SERVICE_ROLE_KEY` to perform API key lookups.
- **RLS:** While the server uses a scoped client, the database RLS policies (see `supabase/migrations/`) provide the final safety net.
