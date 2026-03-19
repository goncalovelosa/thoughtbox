# SPEC-02: theseus.sh Rewrite (Supabase Backend)

## Purpose

Rewrite `.claude/skills/theseus-protocol/scripts/theseus.sh` to use Supabase
as its state backend instead of local `.theseus/session.json`.

## Current State

`theseus.sh` reads/writes `.theseus/session.json` using `jq`. Commands:
`init`, `visa`, `checkpoint`, `outcome`, `status`.

## Target State

Same command interface. Replace all `jq` local file operations with `curl`
calls to Supabase REST API. No `.theseus/` directory created.

## Environment Requirements

The script requires two environment variables:
- `SUPABASE_URL` — project REST endpoint
- `SUPABASE_SERVICE_ROLE_KEY` — service_role key (bypasses RLS)

If either is unset, the script prints a clear error and exits 1.

## Command Rewrites

### `init <file1> <file2> ...`

Before:
```bash
save_json "{\"B\": 0, \"scope\": [...], ...}"
```

After:
```bash
# 1. Close any existing active theseus session
EXISTING=$(curl -sf "${SUPABASE_URL}/rest/v1/protocol_sessions?protocol=eq.theseus&status=eq.active&select=id" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    | jq -r '.[0].id // empty')

if [ -n "$EXISTING" ]; then
    curl -sf "${SUPABASE_URL}/rest/v1/protocol_sessions?id=eq.${EXISTING}" \
        -X PATCH \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"status": "superseded", "completed_at": "now()"}' > /dev/null
    echo "Warning: Closed stale active session: ${EXISTING}" >&2
fi

# 2. Create session
SESSION_ID=$(curl -sf "${SUPABASE_URL}/rest/v1/protocol_sessions" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{\"protocol\": \"theseus\", \"state_json\": {\"B\": 0, \"test_fail_count\": 0}}" \
    | jq -r '.[0].id')

# 2. Insert scope entries
for file in "$@"; do
    curl -sf "${SUPABASE_URL}/rest/v1/protocol_scope" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"session_id\": \"${SESSION_ID}\", \"file_path\": \"${file}\"}"
done

# 3. Git checkpoint (unchanged)
git add . && git commit -m "theseus (B=0,init): Start refactor session" || true
```

### `visa <file> <reason>`

Before: Append to local visas array and scope array.

After:
```bash
# 1. Get active session ID
# 2. Insert into protocol_visas
# 3. Insert into protocol_scope with source='visa'
```

### `checkpoint <message>`

Before: Syntactic tollbooth + local state update.

After:
```bash
# 1. Syntactic tollbooth (unchanged — local grep, no Supabase needed)
# 2. Git commit (unchanged)
# 3. Update session state_json in Supabase (last_checkpoint, test_fail_count=0)
# 4. Insert into protocol_audits
```

### `outcome <pass|fail>`

Before: Update local B state and test_fail_count.

After:
```bash
# 1. Get active session + state_json
# 2. On pass: update state_json { B: 0, test_fail_count: 0 }
# 3. On fail: increment test_fail_count
#    If >= 2: git reset --hard, update state_json { B: 0, test_fail_count: 0 }
#    If == 1: update state_json { B: 1, test_fail_count: 1 }
```

### `status`

Before: Read local JSON, print.

After:
```bash
# 1. Get active session + state_json + scope count + visa count
# 2. Print same format as before
```

## Helper Functions

```bash
# Get active session ID (reused by all commands)
get_active_session() {
    curl -sf "${SUPABASE_URL}/rest/v1/protocol_sessions?protocol=eq.theseus&status=eq.active&select=id,state_json&order=created_at.desc&limit=1" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        | jq -r '.[0] // empty'
}

# Update session state
update_session_state() {
    local session_id="$1"
    local state_json="$2"
    curl -sf "${SUPABASE_URL}/rest/v1/protocol_sessions?id=eq.${session_id}" \
        -X PATCH \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"state_json\": ${state_json}}"
}
```

## Error Handling

- Network failures: print error, exit 1. Do NOT fall back to local files.
- Missing env vars: print setup instructions, exit 1.
- No active session (for non-init commands): print error, exit 1.

## Acceptance Criteria

- [ ] All 5 commands work with Supabase backend
- [ ] No `.theseus/` directory created
- [ ] `jq` still used for JSON parsing (of curl responses), not for local file I/O
- [ ] Git operations (commit, reset) unchanged
- [ ] Script exits cleanly if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY unset
- [ ] Tollbooth grep is still local (no network round-trip for text matching)
