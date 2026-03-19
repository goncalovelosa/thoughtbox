# SPEC-03: ulysses.sh Rewrite (Supabase Backend)

## Purpose

Rewrite `.claude/skills/ulysses-protocol/scripts/ulysses.sh` to use Supabase
as its state backend instead of local `.ulysses/session.json`.

## Current State

`ulysses.sh` reads/writes `.ulysses/session.json` using `jq`. Commands:
`init`, `plan`, `outcome`, `reflect`, `status`.

State shape:
```json
{
    "S": 0,
    "surprise_register": [],
    "checkpoints": ["initial"],
    "history": [],
    "hypotheses": [],
    "active_step": null
}
```

## Target State

Same command interface. Replace local file operations with Supabase REST
calls. State stored in `protocol_sessions.state_json`. Step history stored in
`protocol_history`.

## Environment Requirements

Same as SPEC-02: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

## Command Rewrites

### `init`

```bash
# 1. Close any existing active ulysses session
EXISTING=$(curl -sf "${SUPABASE_URL}/rest/v1/protocol_sessions?protocol=eq.ulysses&status=eq.active&select=id" \
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

# 2. Create session with initial state
SESSION_ID=$(curl -sf "${SUPABASE_URL}/rest/v1/protocol_sessions" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d '{"protocol": "ulysses", "state_json": {"S": 0, "surprise_register": [], "checkpoints": ["initial"], "hypotheses": [], "active_step": null}}' \
    | jq -r '.[0].id')

# 2. Git checkpoint (unchanged)
git add . && git commit -m "ulysses (S=0): init session" || true
```

### `plan "<primary>" "<recovery>" [--irreversible]`

```bash
# 1. Get active session
# 2. Check S \!= 2 (from state_json)
# 3. Build step object
# 4. Update state_json.active_step via PATCH
# 5. Insert plan event into protocol_history
```

### `outcome <type> [--severity N] [--details "..."]`

```bash
# 1. Get active session + state_json
# 2. Check active_step exists
# 3. Insert outcome event into protocol_history
# 4. Update state_json:
#    - expected: S=0, clear active_step, add checkpoint
#    - unexpected + severity 1: S++, clear active_step
#    - unexpected + severity 2: S=2, clear active_step
# 5. On S=0: git commit checkpoint
```

### `reflect "<hypothesis>" "<falsification>"`

```bash
# 1. Get active session + state_json
# 2. Append hypothesis to state_json.hypotheses
# 3. Reset S=0
# 4. Insert reflect event into protocol_history
# 5. Git checkpoint
```

### `status`

```bash
# 1. Get active session + state_json
# 2. Count protocol_history events
# 3. Print formatted status
```

## Differences from Theseus Rewrite

- No scope or visa tables (Ulysses has no scope lock)
- State is more complex (surprise register, hypothesis chain, active step)
- `protocol_history` table used for step-by-step audit trail
- Git checkpoint behavior is the same

## Acceptance Criteria

- [ ] All 5 commands work with Supabase backend
- [ ] No `.ulysses/` directory created
- [ ] State machine logic (S transitions) unchanged
- [ ] Surprise register maintained in state_json (capped at 3)
- [ ] Git operations unchanged
- [ ] Script exits cleanly if Supabase env vars unset
