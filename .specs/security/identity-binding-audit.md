# Identity-Binding Bug Class Audit

| Field | Value |
|---|---|
| Audit date | 2026-04-22 |
| Auditor | Claude Opus 4.7 (1M context), interactive session |
| Specimen | Password-reset incident, 2026-04-22 (User A's recovery hash + User B's stale cookies → `updateUser` ran against User B) |
| Specimen fix | commit `96bcb4a` on branch `fix/reset-password-hash-flow` |
| Reasoning trail | Thoughtbox session `f87f023d-5ce8-4281-b6f4-694b70ca94f6` (88 thoughts spanning design + audit) |
| Audit branch | `fix/reset-password-hash-flow` |
| Scope | Whole monorepo's auth-touching surface — `apps/web/`, `src/` (MCP server), `supabase/functions/`, `supabase/migrations/`, `plugins/`, `infra/` |

## Method

This audit took the password-reset incident as a *specimen* representing one or more underlying classes of identity-binding violation, then enumerated every instance of those classes across the monorepo's auth-touching surface.

The audit ran as a structured Thoughtbox session in five phases:

0. **Orientation** — `rg` over identity-touching mechanisms produced a canonical 41-file candidate list grouped into web (W), workspace-page (P), MCP-server (M), edge-function (E), and SQL-migration (R) areas.
1. **Class extraction** — two parallel passes (invariant-driven + counterfactual-driven), synthesized to require both gates pass. Six classes survived (5 fundamental + 1 paradigm-relative). Triaged via the "would a different auth library have this class" test.
2. **Per-class enumeration** — for each class, the predicate was first written as a thought, then expressed as a tooling query (`rg`/AST-style) where possible to narrow the candidate space; one atomic verdict thought per (candidate, class) cited file:line evidence.
3. **Formalization** — for each fundamental class, a Boolean predicate or recommended type/wrapper was locked.
4. **Side-findings sweep** — one round of class re-extraction over off-class evidence accumulated during Phase 2; produced 2 auxiliary classes (A1, A2).
5. **Synthesis** — this artifact.

The audit terminated with **zero UNCERTAIN debt** — every candidate received a definite MEMBER / NOT-MEMBER verdict with cited evidence.

## Class summary

| ID | Class | Triage | Active members | Specimen | Defense state |
|---|---|---|---|---|---|
| **C1** | PRINCIPAL-INSTALLED-AT-MUTATION | Fundamental | 0 active after 2026-04-25 ship pass | ✓ | Reset-password server action now verifies recovery principal before mutation |
| **C2** | EXPLICIT-MUTATION-TARGET | Fundamental | 1 latent after 2026-04-25 ship pass | ✓ | Reset-password fixed; profile update remains latent/deferred |
| **C3** | ASYNC-SESSION-RACE | Paradigm-relative | 0 active | ✓ (specimen now defended by 96bcb4a) | Watch list — applies only under @supabase/ssr browser-client + implicit-flow paradigm |
| **C4** | CROSS-FLOW-COOKIE-CONTAMINATION | Fundamental | 0 active after 2026-04-25 ship pass | ✓ | Reset-password now clears local auth state before explicit recovery install |
| **C5** | PATH-PARAM-PRINCIPAL-VERIFICATION | Fundamental | 0 | — | RLS-defended by architectural design (membership-join in every workspace-scoped policy) |
| **C6** | ADMIN-BYPASS-PRINCIPAL-SOURCE | Fundamental | 0 active in `BranchHandlers` after 2026-04-25 ship pass | — | `sessions`, `thoughts`, and `branches` operations now filter by API-key workspace |
| **A1** | REDIRECT-TARGET-NOT-VERIFIED | Fundamental (aux) | 1 | — | OAuth callback `next` param trusted verbatim |
| **A2** | OUT-OF-BAND-ACTION-WITHOUT-CALLER-AUTH | Fundamental (aux) | 1 | — | Claim page set-password-email send rate-limited only by GoTrue |

## Ship-pass status — 2026-04-25

This pass ships only the critical/high findings:

- **C6 fixed** in `src/branch/handlers.ts`: every `sessions`, `thoughts`, and `branches` service-role operation in `BranchHandlers` is scoped with `workspace_id = this.workspaceId`; branch worker token issuance uses the API-key-resolved workspace rather than a fetched session workspace. Regression coverage: `src/branch/__tests__/handlers.test.ts` covers cross-workspace `spawn`, `merge`, `list`, and `get`.
- **C1/C2/C4 fixed** in reset-password flow: `ResetPasswordForm` clears prior local auth state before explicit recovery-token session install, submits recovery token/user proof, and `resetPasswordAction` validates the recovery token with Supabase Auth, compares it to the cookie-resolved user, and rejects mismatch before `updateUser`. Regression coverage: `apps/web/tests/app/auth/actions.test.ts` covers missing proof, invalid proof, proof mismatch, cookie/recovery mismatch, and verified success.
- **Deferred, not shipped in this pass**: latent profile-update C2, A1 OAuth callback same-origin redirect validation, A2 claim-page email side-effect rate limiting, and the broader MCP C6 sister audit outside `BranchHandlers`.

## Active findings — priority order

### 1. CRITICAL — C6 — `src/branch/handlers.ts:67-91` — Cross-workspace branch spawn via valid API key

`BranchHandlers.handleSpawn` looks up `sessions` by id under service-role (which bypasses RLS) without filtering by `this.workspaceId` (the API-key-resolved workspace). It then mints a tb-branch token bearing the *fetched* `session.workspace_id`. A holder of a valid API key for workspace A can call `branch.spawn` with a `sessionId` belonging to workspace B; the lookup succeeds, a branch row is inserted in B's workspace, and the returned tb-branch worker URL contains a token that authorizes thought writes into B's workspace.

The HMAC-token defense in `supabase/functions/tb-branch/index.ts` is correctly implemented at the edge — the issue is upstream in token issuance.

**Reproduction sketch** — given a valid API key for workspace A and a sessionId belonging to workspace B (e.g., observed in logs, leaked through error messages, or guessed): call the MCP server's `branch.spawn` tool with `{sessionId: "<B's session>", branchId: "x", branchFromThought: 1}`. Receive a `workerUrl` containing a token signed for B's workspace. POST thoughts to that URL — they land in B's `thoughts` table.

**Status 2026-04-25: fixed in ship pass.**

Applied fix:

```ts
// src/branch/handlers.ts:67 — current
const { data: session, error: sessErr } = await this.client
  .from("sessions")
  .select("id, workspace_id")
  .eq("id", sessionId)
  .single();

// Fix: scope the lookup by the API-key-resolved workspace
const { data: session, error: sessErr } = await this.client
  .from("sessions")
  .select("id, workspace_id")
  .eq("id", sessionId)
  .eq("workspace_id", this.workspaceId)
  .single();
```

The same scope filter was applied to every `sessions`, `thoughts`, and `branches` service-role operation in `handleSpawn`, `handleMerge`, `handleList`, `handleGet`, `insertMainTrackThought`, `resolveBranches`, and `getSessionWorkspaceId`.

### 2. HIGH — C1 + C2 + C4 — `apps/web/src/app/(auth)/actions.ts:109` — `resetPasswordAction` server-side defenses absent

The specimen. Commit `96bcb4a` added client-side gating to `ResetPasswordForm.tsx` (C3 defense) but the server action `resetPasswordAction` remains undefended at three layers:

- **C1 violation** — calls `supabase.auth.updateUser({ password })` under cookie-resolved session without comparing the resolved `user.id` against the principal embedded in the recovery hash that triggered this flow.
- **C2 violation** — `updateUser({password})` API takes no target user_id; the action accepts whatever principal the cookies resolve to.
- **C4 violation** — no `signOut({scope:'local'})` precedes the implicit setSession that the browser client performs in the receiving page. (The fix added gating but not signOut.)

**Status 2026-04-25: fixed in ship pass.**

Applied remediation:

- Browser page disables automatic hash detection, parses the recovery hash explicitly, clears prior local auth state with `signOut({ scope: 'local' })`, validates the recovery access token client-side, calls `setSession`, then submits `recoveryToken` and `recoveryUserId` with the form.
- `resetPasswordAction` requires the proof fields, validates `recoveryToken` via `supabase.auth.getUser(recoveryToken)`, compares the verified recovery user to the submitted proof and the cookie-resolved user, and refuses mutation on mismatch before calling `updateUser`.

### 3. MEDIUM — C2 latent — `apps/web/src/app/w/[workspaceSlug]/settings/account/actions.ts:19` — `updateProfileAction`

**Status 2026-04-25: deferred, not shipped in the critical/high pass.**

Calls `supabase.auth.updateUser({data:{first_name,last_name}})` with no target id and no prior principal verification. Currently *latent* because the routing topology (middleware-gated, no recovery-hash entry to this route) prevents an external principal from reaching this action. But the action itself is undefended — any future flow that contaminates cookies before this route is reached would silently rewrite the wrong user's display name.

**Recommended remediation:** apply the `verifiedSelfMutate(supabase, verifiedUid, fields)` wrapper described in **§ Recommended primitives**. Pass the workspace-scoped current user's id explicitly.

The sibling `updatePasswordAction` at line 52 is *defended* via knowledge-proof reverify (`signInWithPassword(getUser().email, currentPassword)` at line 46) — this is the canonical safe pattern for self-service password changes and is worth reusing.

### 4. MEDIUM — A1 — `apps/web/src/app/api/auth/callback/route.ts:20` — Open redirect via `next` param

**Status 2026-04-25: deferred, not shipped in the critical/high pass.**

```ts
if (next) {
  return NextResponse.redirect(`${origin}${next}`);
}
```

`next` is trusted verbatim. Origin pinning (`${origin}`) prevents cross-origin redirect, but allows arbitrary same-origin path including `/w/{otherWorkspaceSlug}/...`. An attacker can craft an OAuth callback URL where the `next` param points at a sensitive same-origin destination. RLS will block unauthorized data reads but the user lands somewhere they didn't intend.

**Recommended remediation:** validate `next` against an allow-list pattern.

```ts
const SAFE_NEXT_PATHS = /^\/(app|w\/[a-z0-9-]+\/(dashboard|sessions|billing|settings\/.*))$/;
if (next && SAFE_NEXT_PATHS.test(next)) {
  return NextResponse.redirect(`${origin}${next}`);
}
// Otherwise fall through to default redirect (workspace dashboard or /app).
```

### 5. LOW — A2 — `apps/web/src/app/(auth)/sign-up/claim/page.tsx:152` — Email-bombing via stripe_session_id

**Status 2026-04-25: deferred, not shipped in the critical/high pass.**

`admin.auth.resetPasswordForEmail(email, ...)` is called with `email` derived from a Stripe session retrieved by URL-supplied `stripe_session_id`. An attacker who acquires a `stripe_session_id` (these appear in `success_url`s and may leak via referrer headers, server logs, or screenshots) can trigger an unbounded number of password-reset emails to that customer.

Mitigations partially in place: GoTrue applies per-email rate-limiting on `resetPasswordForEmail`, and the send only fires on `userWasJustCreated` (refreshes/retries skip the send).

**Recommended remediation:** add a server-side rate-limit keyed on `(email, ip, time-window)` independent of GoTrue's; or add CAPTCHA on the claim page if abuse is observed.

---

## Class definitions

### C1 — PRINCIPAL-INSTALLED-AT-MUTATION (fundamental)

**Definition.** A server-side mutation authenticated via the request's session cookies does not verify that the resolved principal matches the principal the UI flow installed for this specific operation.

**Predicate.**

```ts
// A handler is C1-violating iff:
//   (a) it constructs a server-side Supabase client from request cookies, AND
//   (b) it performs at least one mutation against the resolved session principal, AND
//   (c) it does NOT compare the resolved user.id against an externally-provided
//       principal-bearing value (recovery hash, OAuth code, signed token, hidden
//       form field set by the client after a deliberate session install).

type Handler = (formData: FormData) => Promise<unknown>;

function violates_C1(handler: Handler): boolean {
  return (
    derives_principal_from_cookies_only(handler) &&
    mutates_principal_scoped_state(handler) &&
    !verifies_against_external_source(handler)
  );
}

// Suppression rule: handlers whose PURPOSE is to install or destroy the
// cookie-bound session itself (signIn, signOut, exchangeCodeForSession,
// middleware session refresh) are exempt — the cookie IS the authorized
// principal source for those flows by design.
```

**Members in audited surface:**

| File:line | Verdict | Notes |
|---|---|---|
| `apps/web/src/app/(auth)/actions.ts:109` `resetPasswordAction` | FIXED 2026-04-25 | Server action now verifies recovery token principal against cookie-resolved user before `updateUser`. |

**Recommended primitive.** See `verifiedSelfMutate` under § Recommended primitives.

---

### C2 — EXPLICIT-MUTATION-TARGET (fundamental, API-shape dependency)

**Definition.** A self-mutation API call (one that modifies the principal record itself) is invoked without an explicit target identifier, relying on ambient session for target resolution.

**Predicate.**

```ts
// A call site is C2-violating iff:
//   (a) the invoked API has the effect "modify the current authenticated user", AND
//   (b) the API signature does NOT include the target user identifier as a parameter, AND
//   (c) the call is NOT immediately preceded by a verified comparison establishing
//       that the ambient session principal IS the intended target.

// AST-grep query (TypeScript):
//   pattern: ($_).auth.updateUser($_)
// Then per-site: check for a preceding principal verification.
//
// Safe forms:
//   (a) supabase.auth.admin.updateUserById(verifiedUid, ...) — explicit target under
//       service-role, with verifiedUid established out-of-band.
//   (b) supabase.auth.updateUser(...) preceded by knowledge-proof reverify:
//       const { data: { user } } = await supabase.auth.getUser();
//       const { error } = await supabase.auth.signInWithPassword({
//         email: user.email, password: currentPasswordFromForm
//       });
//       if (error) return { error: 'Current password is incorrect.' };
//       await supabase.auth.updateUser({ password: newPassword });
```

**Members in audited surface:**

| File:line | Verdict | Notes |
|---|---|---|
| `apps/web/src/app/(auth)/actions.ts:109` | FIXED 2026-04-25 | Recovery token/user proof establishes the intended target before ambient-session `updateUser`. |
| `apps/web/src/app/w/[workspaceSlug]/settings/account/actions.ts:19` | **MEMBER** (latent) | `updateProfileAction` — routing currently prevents external principal but action is undefended. |
| `apps/web/src/app/w/[workspaceSlug]/settings/account/actions.ts:52` | NOT-MEMBER | `updatePasswordAction` — knowledge-proof reverify at line 46 satisfies (c). |

**Recommended primitive.** See `verifiedSelfMutate` under § Recommended primitives.

---

### C3 — ASYNC-SESSION-RACE (paradigm-relative)

**Definition.** A client-side flow installs an authenticated session asynchronously (via `setSession` from URL hash, `exchangeCodeForSession` in a useEffect, or `detectSessionInUrl` auto-detection) but allows user-actionable surfaces (form submission, link click, redirect trigger) to fire before that install has completed.

**Triage rationale.** This class only exists inside the `@supabase/ssr` browser-client + implicit-flow paradigm. A team using PKCE-only auth or server-side recovery-token exchange would never have it. Per user direction, treated as paradigm-relative — enumerated rather than formalized.

**Members in audited surface:**

| File:line | Verdict | Notes |
|---|---|---|
| `apps/web/src/app/(auth)/reset-password/ResetPasswordForm.tsx:21` | NOT-MEMBER (post-fix) | Specimen. Pre-fix MEMBER. Fix at lines 12, 20-28, 30-36 gates form render on `getSession()` resolving. |
| `apps/web/src/lib/session/use-session-realtime.ts:18` | NOT-MEMBER | No install (workspace pages have no hash); no interactive surface. |

**Watch-list trigger.** Any new file under `apps/web/src/app/(auth)/` that imports from `@/lib/supabase/client` AND renders an interactive surface should be re-audited against this predicate. Known future trigger candidates: magic-link landings, email-OTP landings, signup-confirmation landings — Supabase delivers all of these via the same implicit-hash flow by default.

---

### C4 — CROSS-FLOW-COOKIE-CONTAMINATION (fundamental)

**Definition.** A flow that establishes a new authenticated session does not first clear any prior session cookies that could otherwise pollute the server's view of the request when the flow's subsequent server action fires.

**Predicate.**

```ts
// A flow is C4-violating iff:
//   (a) it installs a new session (setSession, exchangeCodeForSession, or
//       implicit detectSessionInUrl), AND
//   (b) the install is client-side OR followed by a server action that reads cookies, AND
//   (c) it does NOT call signOut({ scope: 'local' }) BEFORE the install.

// Server-side installs (signInWithPassword in a server action,
// exchangeCodeForSession in a route handler) are exempt: they are atomic from
// the cookie perspective — subsequent same-request API calls use in-memory
// session, not stale cookies.

// Canonical defended client-component shape:
useEffect(() => {
  (async () => {
    const supabase = createClient();
    await supabase.auth.signOut({ scope: 'local' });        // (1) clear prior
    // Disable automatic detection so we control timing:
    //   createBrowserClient(url, key, { auth: { detectSessionInUrl: false } });
    // Parse hash explicitly:
    const params = new URLSearchParams(window.location.hash.slice(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
    window.history.replaceState(null, '', window.location.pathname);
    setReady(true);                                         // (2) only now allow form
  })();
}, []);
```

**Members in audited surface:**

| File:line | Verdict | Notes |
|---|---|---|
| `apps/web/src/app/(auth)/reset-password/ResetPasswordForm.tsx:21` | FIXED 2026-04-25 | Recovery flow now clears prior local auth state before explicit `setSession`. |
| `apps/web/src/app/(auth)/actions.ts:24` `signInAction` | NOT-MEMBER | Server-side install, atomic. |
| `apps/web/src/app/w/[workspaceSlug]/settings/account/actions.ts:46` | NOT-MEMBER | Same-user re-auth, no contamination vector. |
| `apps/web/src/app/api/auth/callback/route.ts:17` | NOT-MEMBER | Server-side install, atomic. |
| `apps/web/src/lib/session/use-session-realtime.ts:18` | NOT-MEMBER | Subscription only, no install. |

**Recommended primitive.** See `useFreshSessionInstall` under § Recommended primitives.

---

### C5 — PATH-PARAM-PRINCIPAL-VERIFICATION (fundamental)

**Definition.** A handler that uses a path parameter (e.g., `:workspaceSlug`, `:userId`) to scope a mutation does not verify that the path parameter resolves to a scope the current session is authorized to mutate.

**Audit result.** **No active members.** The class is *structurally absent* from the audited surface because every workspace-scoped table's RLS policy joins through `workspace_memberships` (or the `is_workspace_member(workspace_id)` SQL helper) and filters by `auth.uid()`. The application code can rely on RLS as the defense layer.

**Predicate.** Defended at the database layer. A SQL guard (runnable as CI):

```sql
-- C5 CI check — fail if any RLS policy on a table with workspace_id column
-- doesn't reference workspace_memberships AND auth.uid().
SELECT
  p.schemaname,
  p.tablename,
  p.polname,
  p.qual,
  p.with_check
FROM pg_policies p
JOIN information_schema.columns c
  ON c.table_name = p.tablename
 AND c.table_schema = p.schemaname
WHERE c.column_name = 'workspace_id'
  AND p.schemaname = 'public'
  -- Allow service-role bypass policies (they're intentional escape hatches)
  AND 'service_role' <> ALL(COALESCE(p.roles, '{}'))
  AND (
    (p.qual !~ '(workspace_memberships|is_workspace_member)' AND p.qual IS NOT NULL)
    OR p.qual !~ 'auth\.uid\(\)'
  );
-- Any row returned indicates a workspace-scoped table with RLS that does not
-- properly join through membership — investigate before merging.
```

**Verified safe RLS shapes** (currently in use across the monorepo):

- `workspaces_select_member`, `workspaces_update_admin` (with role filter), `workspaces_delete_owner`, `workspaces_insert_authenticated` — `apps/web/supabase/migrations/20260317000000_core_schema.sql:79-109`.
- `api_keys_member_access` — `is_workspace_member(workspace_id)` — `supabase/migrations/20260320191032_remote_schema.sql:926`.
- `sessions_member_access`, `thoughts_member_access` — same helper.
- `entities`, `relations`, `observations` (knowledge graph) — `workspace_member_access` — `supabase/migrations/20260322153858_add_workspace_id_to_knowledge_tables.sql:67-95`.
- `otel_events workspace_member_read` — `supabase/migrations/20260327113933_create_otel_events.sql:34`.

**Members verified NOT-MEMBER (RLS-defended):**

| File:line | Verdict | RLS that defends it |
|---|---|---|
| `apps/web/src/app/w/[workspaceSlug]/settings/workspace/actions.ts:24` `updateWorkspaceNameAction` | NOT-MEMBER | `workspaces_update_admin` (role-filtered) |
| `apps/web/src/app/w/[workspaceSlug]/api-keys/actions.ts:19` `createApiKeyAction` | NOT-MEMBER | `workspaces_select_member` + `api_keys_member_access` |
| `apps/web/src/app/w/[workspaceSlug]/api-keys/actions.ts:74` `revokeApiKeyAction` | NOT-MEMBER | `api_keys_member_access` (silent 0-row on forged keyId — UX issue, see **§ Side-finding SF2**) |
| `apps/web/src/lib/stripe/actions.ts:63` `createCheckoutSession` | NOT-MEMBER | `workspaces_select_member` |
| `apps/web/src/lib/stripe/actions.ts:109` `createBillingPortalSession` | NOT-MEMBER | `workspaces_select_member` |

**Note.** RLS sufficiency for C5 depends on the policy joining through `workspace_memberships` for `auth.uid()`. The SQL CI check above enforces this invariant going forward.

---

### C6 — ADMIN-BYPASS-PRINCIPAL-SOURCE (fundamental)

**Definition.** A code path operating with service-role / admin / RLS-bypass privileges derives the target principal from a request-controlled source (cookies, request body, headers, query params) rather than from an out-of-band verified source (signed event payload, verified token, system-generated job descriptor).

**Predicate.**

```ts
// Recommended context type for service-role handlers:
type WorkspaceContext = {
  workspaceId: string;
  provenance:
    | { source: 'api-key'; keyPrefix: string }              // bcrypt-verified at edge
    | { source: 'signed-token'; payloadHash: string }       // HMAC-verified
    | { source: 'signed-event'; eventId: string; signatureVerifiedAt: string }
    | { source: 'system-job'; triggerId: string };          // pgmq, postgres trigger
};

// A handler is C6-violating iff:
//   (a) it uses a service-role Supabase client, AND
//   (b) any .from(workspaceScopedTable).{select|update|delete|insert} call inside
//       it does NOT chain .eq('workspace_id', ctx.workspaceId).

// AST-grep approximation (TypeScript):
//   pattern: this.client.from($T).$M(...)
//     where $T ∈ workspaceScopedTables
//     AND chain does not include .eq('workspace_id', $$$ctx$$$.workspaceId)
```

**Members in audited surface:**

| File:line | Verdict | Notes |
|---|---|---|
| `src/branch/handlers.ts:67-91` `handleSpawn` | FIXED 2026-04-25 | `sessions`, `thoughts`, and `branches` operations now filter by API-key workspace. |
| `apps/web/src/app/(auth)/sign-up/claim/page.tsx` | NOT-MEMBER | Target email from Stripe-retrieved session (out-of-band verified). Side-finding A2 logged for email-bombing. |
| `apps/web/src/app/api/stripe/webhook/route.ts` | NOT-MEMBER | Stripe-signed event payload (verified via `STRIPE_WEBHOOK_SECRET`). |
| `supabase/functions/process-thought-queue/index.ts` | NOT-MEMBER | `thought_id` from pgmq message (DB trigger origin), workspace_id read from `thoughts` row, CRON_SECRET gate. |
| `supabase/functions/tb-branch/index.ts` | NOT-MEMBER (at edge) | HMAC-signed token, but trust passes upstream to issuer (`src/branch/handlers.ts`). |
| `src/auth/api-key.ts` | NOT-MEMBER | bcrypt-verified key → `workspace_id` from `api_keys` row. |

**Class-level escalation.** The pattern observed in `src/branch/handlers.ts:handleSpawn` (service-role lookup of a session by id without workspace cross-check) likely repeats across the MCP server's broader handler surface — `handleMerge`, `handleList`, `getSessionWorkspaceId`, and analogously the knowledge/, persistence/, observatory/ handler files. **A sister audit pass over the full MCP handler surface for workspace_id-filter discipline is recommended.**

**Recommended primitive.** See `WorkspaceScopedClient` under § Recommended primitives.

---

### A1 — REDIRECT-TARGET-NOT-VERIFIED (auxiliary, fundamental)

**Definition.** A server route returns `NextResponse.redirect(target)` (or framework equivalent) where `target` is derived from a request-controlled value AND `target` is not validated against an allow-list of expected destinations.

**Predicate.**

```ts
// Boolean predicate (route-handler level):
function violates_A1(route: RouteHandler): boolean {
  return (
    route.returns_redirect_with_request_derived_target &&
    !route.target_validated_against_allowlist
  );
}

// Defense pattern (allow-list regex):
const SAFE_NEXT_PATHS = /^\/(app|w\/[a-z0-9-]+\/(dashboard|sessions|billing|settings\/.*))$/;
if (next && SAFE_NEXT_PATHS.test(next)) {
  return NextResponse.redirect(`${origin}${next}`);
}
```

**Members in audited surface:**

| File:line | Verdict | Notes |
|---|---|---|
| `apps/web/src/app/api/auth/callback/route.ts:20` | **MEMBER** | Origin-pinned (no cross-origin) but same-origin path is unrestricted. See **Active findings § 4**. |

---

### A2 — OUT-OF-BAND-ACTION-WITHOUT-CALLER-AUTH (auxiliary, fundamental)

**Definition.** A server endpoint triggers an external side effect (email, SMS, webhook delivery, payment, notification) where the target of the side effect is named by request data AND the endpoint does not authenticate the caller as authorized to trigger that action for that target.

**Predicate.**

```ts
// Boolean predicate (endpoint level):
function violates_A2(endpoint: Endpoint): boolean {
  return (
    endpoint.triggers_external_side_effect &&
    endpoint.target_named_by_request_data &&
    !endpoint.authenticates_caller_for_target
  );
}

// Defense patterns (any one suffices):
//   (a) require authenticated caller AND verify caller has authority over target
//   (b) rate-limit per-(target, ip, time-window) at application layer (don't trust GoTrue alone)
//   (c) require CAPTCHA or proof-of-work for unauthenticated callers
//   (d) require cryptographic proof of target ownership (e.g., signed link)
```

**Members in audited surface:**

| File:line | Verdict | Notes |
|---|---|---|
| `apps/web/src/app/(auth)/sign-up/claim/page.tsx:152` | **MEMBER** | `resetPasswordForEmail` triggered by URL-supplied stripe_session_id. Partially mitigated by GoTrue rate-limit + `userWasJustCreated` gate. See **Active findings § 5**. |

---

## Recommended primitives

Implementing these three reusable primitives collapses the structural enforcement of C1, C2, C4, and C6 into a small surface area that is easy to audit and hard to misuse.

### `verifiedSelfMutate` — closes C1 + C2

```ts
// apps/web/src/lib/supabase/verified-mutate.ts (new)
import type { SupabaseClient } from '@supabase/supabase-js';

export async function verifiedSelfMutate(
  supabase: SupabaseClient,
  expectedUserId: string,
  fields: { password?: string; email?: string; data?: Record<string, unknown> },
): Promise<{ data?: unknown; error?: { message: string } }> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: { message: 'Not authenticated.' } };
  }
  if (user.id !== expectedUserId) {
    // The session principal is not who the calling flow believed it would be.
    // This is the C1 defense — refuse to proceed under a contaminated session.
    return { error: { message: 'Session principal mismatch.' } };
  }
  return await supabase.auth.updateUser(fields);
}
```

Server actions that self-mutate must derive `expectedUserId` from the same external signal that triggered the flow:

- For password-reset: parse the JWT in the URL hash client-side, write `sub` into a hidden form field, server reads it.
- For email-update: confirm via a signed verification link before applying.
- For settings: pass the workspace's resolved `currentUser.id` from the page (which was loaded under known cookies).

### `useFreshSessionInstall` — closes C4

```tsx
// apps/web/src/lib/session/use-fresh-session-install.ts (new)
'use client';
import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

type InstallFn = (supabase: ReturnType<typeof createBrowserClient>) => Promise<void>;

export function useFreshSessionInstall(installFn: InstallFn): { ready: boolean } {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { detectSessionInUrl: false } },  // C3 defense — explicit timing
      );
      await supabase.auth.signOut({ scope: 'local' });   // C4 defense — clear prior
      await installFn(supabase);                          // caller does explicit setSession
      setReady(true);
    })();
  }, []);

  return { ready };
}
```

Refactor `ResetPasswordForm.tsx` to use this hook with an `installFn` that explicitly parses the URL hash and calls `setSession`.

### `WorkspaceScopedClient` — closes C6

```ts
// src/lib/workspace-scoped-client.ts (new)
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type WorkspaceContext = {
  workspaceId: string;
  provenance:
    | { source: 'api-key'; keyPrefix: string }
    | { source: 'signed-token'; payloadHash: string }
    | { source: 'signed-event'; eventId: string; signatureVerifiedAt: string }
    | { source: 'system-job'; triggerId: string };
};

const WORKSPACE_SCOPED_TABLES = new Set([
  'workspaces', 'workspace_memberships', 'api_keys',
  'sessions', 'thoughts', 'branches',
  'entities', 'relations', 'observations',
  'otel_events',
  // Extend when new workspace-scoped tables are added.
]);

export class WorkspaceScopedClient {
  private client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string, public readonly ctx: WorkspaceContext) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  // Wrapped from() that auto-injects workspace_id filter for workspace-scoped tables.
  // For mutations, also enforces workspace_id in the inserted/updated row.
  from(table: string) {
    const builder = this.client.from(table);
    if (WORKSPACE_SCOPED_TABLES.has(table)) {
      // Return a proxy that injects .eq('workspace_id', ctx.workspaceId) on every
      // .select/.update/.delete chain, and rejects .insert that doesn't include
      // workspace_id matching ctx.workspaceId.
      return wrapForWorkspaceScope(builder, this.ctx.workspaceId);
    }
    return builder;
  }

  // Escape hatch for legitimate cross-workspace operations (system jobs only).
  // Marked unsafe so call sites are easy to grep.
  unsafeRawClient(): SupabaseClient {
    if (this.ctx.provenance.source !== 'system-job') {
      throw new Error('unsafeRawClient only allowed for system-job provenance');
    }
    return this.client;
  }
}

// wrapForWorkspaceScope is the workhorse: see implementation notes in the
// audit's Phase 3 reasoning (Thoughtbox session f87f023d, thought 83).
```

Refactor `BranchHandlers`, knowledge handlers, persistence handlers, and observatory handlers to use `WorkspaceScopedClient` instead of direct `createClient(url, serviceRoleKey)`. The escape hatch `unsafeRawClient()` is grep-able for audit.

---

## Sister audit recommendation

The C6 enumeration in this audit covered the obvious service-role usage sites but did not exhaustively traverse the MCP server's full handler surface. The pattern that produced the critical finding at `src/branch/handlers.ts:67` — service-role lookup by id without workspace cross-check — is a class of bug that almost certainly recurs in:

- `src/branch/handlers.ts` other methods (`handleMerge`, `handleList`, `getSessionWorkspaceId`)
- `src/knowledge/supabase-storage.ts`
- `src/persistence/supabase-storage.ts`
- `src/otel/otel-storage.ts`
- `src/observatory/channels/reasoning.ts`
- `src/server-factory.ts` (depending on how it dispatches to the above)

A sister audit pass should:

1. List every method in those files that performs a `.from()` query.
2. For each, check whether the chain includes `.eq('workspace_id', this.workspaceId)` or equivalent.
3. Report any that do not.

This pass could be largely automated via the AST-grep query in **C6 § Predicate** above. The recommended primitive `WorkspaceScopedClient` would, once adopted, make this class of bug structurally impossible — at which point the sister audit becomes a one-time refactor rather than an ongoing concern.

---

## Side-findings excluded from class space

| ID | Description | File:line | Disposition |
|---|---|---|---|
| SF2 | Silent 0-row revoke when forged keyId passed to revokeApiKeyAction | `apps/web/src/app/w/[workspaceSlug]/api-keys/actions.ts:74` | **UX, not security** — RLS prevents the cross-workspace mutation; user just sees false success. Recommend checking rowsAffected. |
| SF4 | MCP handler surface beyond `BranchHandlers` likely contains additional C6 instances | `src/{knowledge,persistence,otel,observatory}/...` | **Absorbed into C6** — see § Sister audit recommendation. |

---

## Provenance

- Thoughtbox session: `f87f023d-5ce8-4281-b6f4-694b70ca94f6` — full reasoning trail with branches, decision frames, belief snapshots, and atomic per-candidate verdicts.
- Specimen: described in conversation context at audit start; bug fix at commit `96bcb4a` on branch `fix/reset-password-hash-flow`.
- Canonical candidate list: see Thoughtbox thought 18 (Phase 0 belief_snapshot).
- Per-class predicate locks: thoughts 23-28 (Phase 1 belief_snapshots).
- Per-candidate verdicts: thoughts 30-77 (Phase 2 atomic verdicts).
- Formalizations: thoughts 79-83 (Phase 3 belief_snapshots).
- Side-findings sweep: thoughts 85-88 (Phase 4).
