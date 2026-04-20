#!/usr/bin/env bash
set -e

echo "=== Running Agent Verification Suite ==="

echo "1. Running tsc (typecheck)..."
npx tsc --noEmit

echo "2. Running architecture boundary check..."
node scripts/qa/verify-architecture.mjs

echo "3. Running design token check..."
node scripts/qa/verify-design-tokens.mjs

echo "4. Running view-model vitest suite..."
npx vitest run src/lib/session/

echo "=== All Checks Passed! ==="
