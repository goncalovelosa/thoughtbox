# SPEC-04: Hook Enforcement via Supabase

## Purpose

Add protocol enforcement to `pre_tool_use.sh` that queries Supabase for
active protocol sessions before allowing file writes.

## Current State

`pre_tool_use.sh` already intercepts Write/Edit/Bash tool calls and enforces:
- Dangerous rm prevention
- Protected file write protection
- Claude directory modification protection
- Protected working directory protection
- Dangerous git operation prevention
- Commit message format validation
- Read-before-write guard

It does NOT check for active Theseus/Ulysses sessions.

## Target State

Add a new check early in the hook that queries Supabase for active protocol
sessions. If an active Theseus session exists, enforce test lock and scope
lock. If an active Ulysses session exists, enforce the plan gate (warn if
no active step recorded).

## Implementation

### New function: `check_protocol_enforcement`

```bash
check_protocol_enforcement() {
    local tool="$1"
    local input="$2"

    # Only enforce on file-writing tools
    case "$tool" in
        Write|Edit|MultiEdit) ;;
        *) return 0 ;;
    esac

    # Quick exit: no Supabase config, no enforcement
    [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ] && return 0

    local file_path
    file_path=$(echo "$input" | jq -r '.file_path // ""')
    [ -z "$file_path" ] && return 0

    # Single RPC call to check enforcement
    local result
    result=$(curl -sf --max-time 3 \
        "${SUPABASE_URL}/rest/v1/rpc/check_protocol_enforcement" \
        -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"target_path\": \"${file_path}\"}")

    if [ $? -ne 0 ]; then
        echo "WARNING: Protocol enforcement check failed (network/timeout). Allowing write." >&2
        return 0
    fi

    local blocked reason
    blocked=$(echo "$result" | jq -r '.blocked // false')
    reason=$(echo "$result" | jq -r '.reason // ""')

    if [ "$blocked" = "true" ]; then
        echo "BLOCKED: $reason" >&2
        exit 2
    fi

    return 0
}
```

### Integration point

Add the call after the existing protected-file and claude-dir checks, before
the read-guard enforcement:

```bash
# ... existing checks ...

# Protocol enforcement (Theseus/Ulysses)
check_protocol_enforcement "$tool_name" "$tool_input"

# ... read-guard enforcement ...
```

### Failure mode

If the Supabase call fails (network error, timeout), the hook returns 0
(allow). This is a deliberate choice: a flaky network should not block all
file writes. The enforcement is best-effort from hooks; the scripts
(`theseus.sh`, `ulysses.sh`) are the primary enforcement path.

The `--max-time 3` flag ensures the hook never exceeds its 5-second timeout.

## Environment Variables

Hooks need `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. These should be
set in the shell environment (exported in shell profile or via direnv).
They MUST NOT be hardcoded in the hook script.

## Ulysses-Specific Enforcement (Future)

The initial implementation only enforces Theseus gates (test lock, scope
lock). Ulysses enforcement (plan gate, reflect gate) is advisory — the hook
can warn but should not block, since Ulysses actions are not scope-bound.

Future work: add PostToolUse integration for Ulysses outcome prompts.

## Acceptance Criteria

- [ ] `pre_tool_use.sh` queries Supabase when env vars are set
- [ ] Test lock: blocks writes to test files during active Theseus session
- [ ] Scope lock: blocks writes to out-of-scope files during Theseus session
- [ ] Graceful degradation: no enforcement if Supabase is unreachable
- [ ] No enforcement if env vars are unset (backward compatible)
- [ ] Hook stays within 5-second timeout budget
- [ ] No hardcoded credentials
