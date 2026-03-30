#!/usr/bin/env bash
# Sync src/lib/supabase/database.types.ts from the linked Supabase project.
# Generates fresh types, diffs against the local file, and overwrites if different.
# Usage: ./scripts/sync-db-types.sh
#        npm run db:types:sync

set -euo pipefail

TYPES_FILE="src/lib/supabase/database.types.ts"
TMPFILE="$(mktemp /tmp/supabase-types-XXXXXX.ts)"
trap 'rm -f "$TMPFILE"' EXIT

echo "→ Fetching types from linked Supabase project…"
# In CI, SUPABASE_PROJECT_ID + SUPABASE_ACCESS_TOKEN are used (--linked requires .temp/project-ref which is gitignored)
if [ -n "${SUPABASE_PROJECT_ID:-}" ]; then
  supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public 2>/dev/null > "$TMPFILE"
else
  supabase gen types typescript --linked --schema public 2>/dev/null > "$TMPFILE"
fi

if diff -q "$TYPES_FILE" "$TMPFILE" > /dev/null 2>&1; then
  echo "✓ Types are already up to date."
  exit 0
fi

echo "! Diff detected — updating $TYPES_FILE"
cp "$TMPFILE" "$TYPES_FILE"
echo "✓ Types updated."
