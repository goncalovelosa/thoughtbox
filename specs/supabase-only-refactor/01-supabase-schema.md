# SPEC-01: Supabase Schema for Protocol Enforcement

## Purpose

Define the Supabase tables and RPC functions that serve as the source of truth
for Theseus and Ulysses protocol sessions. These tables support both real-time
enforcement (hooks query them) and longitudinal analysis (supervisor agents
mine them for behavioral tendencies).

## Tables

### `protocol_sessions`

Unified session table for both protocols. Theseus and Ulysses share the same
session lifecycle (active -> terminal state) and the same hook query pattern
("is there an active session?").

```sql
create table protocol_sessions (
    id uuid primary key default gen_random_uuid(),
    protocol text not null check (protocol in ('theseus', 'ulysses')),
    workspace_id text,
    status text not null default 'active',
    check (
        (protocol = 'theseus' AND status IN (
            'active', 'superseded',
            'complete', 'audit_failure', 'scope_exhaustion'
        ))
        OR
        (protocol = 'ulysses' AND status IN (
            'active', 'superseded',
            'resolved', 'insufficient_information', 'environment_compromised'
        ))
    ),
    state_json jsonb not null default '{}',
    created_at timestamptz not null default now(),
    completed_at timestamptz
);

create index idx_protocol_sessions_active
    on protocol_sessions (protocol, status)
    where status = 'active';
```

`state_json` holds protocol-specific state:
- **Theseus**: `{ "B": 0, "test_fail_count": 0, "last_checkpoint": "sha" }`
- **Ulysses**: `{ "S": 0, "active_step": null, "surprise_register": [] }`

### `protocol_scope`

Files declared in-scope for a Theseus session. Also used by Ulysses if scope
tracking is added later.

```sql
create table protocol_scope (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references protocol_sessions(id) on delete cascade,
    file_path text not null,
    source text not null default 'init'
        check (source in ('init', 'visa')),
    created_at timestamptz not null default now(),
    unique (session_id, file_path)
);
```

### `protocol_visas`

Epistemic Visa applications for Theseus scope expansion.

```sql
create table protocol_visas (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references protocol_sessions(id) on delete cascade,
    file_path text not null,
    justification text not null,
    anti_pattern_acknowledged boolean not null default true,
    created_at timestamptz not null default now()
);
```

### `protocol_audits`

Cassandra Audit results for Theseus checkpoints.

```sql
create table protocol_audits (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references protocol_sessions(id) on delete cascade,
    diff_hash text not null,
    commit_message text not null,
    approved boolean not null,
    feedback text,
    created_at timestamptz not null default now()
);
```

### `protocol_history`

Step history for Ulysses sessions (plans, outcomes, reflections).

```sql
create table protocol_history (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references protocol_sessions(id) on delete cascade,
    event_type text not null
        check (event_type in ('plan', 'outcome', 'reflect', 'checkpoint')),
    event_json jsonb not null,
    created_at timestamptz not null default now()
);
```

## RPC Functions

### `check_protocol_enforcement`

Single-roundtrip function called by hooks before allowing file writes.
Returns enforcement decisions for both test lock and scope lock.

```sql
create or replace function check_protocol_enforcement(target_path text)
returns json as $$
declare
    session record;
    is_test_file boolean;
    is_in_scope boolean;
begin
    -- Find active session (any protocol)
    select * into session
    from protocol_sessions
    where status = 'active'
    order by created_at desc limit 1;

    if session is null then
        return json_build_object('enforce', false);
    end if;

    -- Test lock (Theseus only)
    if session.protocol = 'theseus' then
        is_test_file := target_path ~ '(/tests/|/test/|/__tests__/|\.test\.|\.spec\.)';
        if is_test_file then
            return json_build_object(
                'enforce', true,
                'blocked', true,
                'reason', 'TEST LOCK: Cannot modify test files during refactoring',
                'session_id', session.id
            );
        end if;

        -- Scope lock
        select exists(
            select 1 from protocol_scope
            where session_id = session.id
            and target_path like file_path || '%'
        ) into is_in_scope;

        if not is_in_scope then
            return json_build_object(
                'enforce', true,
                'blocked', true,
                'reason', 'VISA REQUIRED: File outside declared scope',
                'session_id', session.id
            );
        end if;
    end if;

    return json_build_object(
        'enforce', true,
        'blocked', false,
        'session_id', session.id,
        'protocol', session.protocol
    );
end;
$$ language plpgsql security definer set search_path = public;
```

## Row-Level Security

All tables should have RLS enabled. For initial implementation, use
service_role key from hooks (bypasses RLS). Future work: scope access by
workspace_id using Supabase Auth JWT claims.

## Migration

Create as a single Supabase migration file:
`supabase/migrations/<timestamp>_protocol_enforcement.sql`

## Acceptance Criteria

- [ ] All tables created with constraints and indexes
- [ ] `check_protocol_enforcement` RPC returns correct results for:
  - No active session -> `{ enforce: false }`
  - Active Theseus + test file -> blocked
  - Active Theseus + out-of-scope file -> blocked
  - Active Theseus + in-scope file -> allowed
  - Active Ulysses + any file -> allowed (Ulysses has no scope lock)
- [ ] RLS enabled on all tables
