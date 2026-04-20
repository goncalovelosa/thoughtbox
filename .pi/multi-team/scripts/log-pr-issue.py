#!/usr/bin/env python3
"""
Log a PR issue finding to .pi/multi-team/logs/pr-issues.jsonl.

Each entry is a structured record of a finding from automated review
(Greptile, manual review, etc.) tied to a specific PR and commit.
Over time this builds a dataset of recurring failure modes.

Usage:
    python3 .pi/multi-team/scripts/log-pr-issue.py \
        --pr 223 \
        --commit bb0fae8 \
        --severity P1 \
        --category reliability \
        --file src/auth/static-workspace.ts \
        --description "Failed upsert still populates cache, preventing retry"

    # Batch mode: reads entries from stdin as JSON lines
    python3 .pi/multi-team/scripts/log-pr-issue.py --batch < findings.jsonl

Categories:
    security       Credential leaks, auth bypasses, exposed secrets
    reliability    Caching bugs, race conditions, zombie state, error swallowing
    correctness    Wrong logic, missing wiring, dead code, always-true guards
    test-hygiene   Env var leaks, missing teardown, coverage gaps
    enforcement    CI checks that don't catch what they claim to
    metadata       Hardcoded values in generated output, doc inconsistencies
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))
LOG_PATH = PROJECT_DIR / ".pi/multi-team/logs/pr-issues.jsonl"

SEVERITIES = {"P0", "P1", "P2", "P3"}
CATEGORIES = {
    "security",
    "reliability",
    "correctness",
    "test-hygiene",
    "enforcement",
    "metadata",
}


def git(cmd: str) -> str:
    r = subprocess.run(["git"] + cmd.split(), cwd=PROJECT_DIR,
                       capture_output=True, text=True)
    return r.stdout.strip()


def make_entry(
    pr: int,
    commit: str,
    severity: str,
    category: str,
    file: str,
    description: str,
    source: str = "greptile",
    resolved_in: str | None = None,
) -> dict:
    assert severity in SEVERITIES, f"severity must be one of {SEVERITIES}"
    assert category in CATEGORIES, f"category must be one of {CATEGORIES}"

    return {
        "timestamp":   datetime.now(timezone.utc).isoformat(),
        "pr":          pr,
        "commit":      commit,
        "severity":    severity,
        "category":    category,
        "file":        file,
        "description": description,
        "source":      source,
        "resolved_in": resolved_in,
    }


def write_entry(entry: dict, dry_run: bool = False) -> None:
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(entry)
    if dry_run:
        print(line)
    else:
        with open(LOG_PATH, "a") as f:
            f.write(line + "\n")
        print(f"  ✓ Logged [{entry['severity']}] {entry['category']} — {entry['file']}")


def summary() -> None:
    if not LOG_PATH.exists():
        print("No issues logged yet.")
        return

    entries = [json.loads(l) for l in LOG_PATH.read_text().splitlines() if l.strip()]
    if not entries:
        print("No issues logged yet.")
        return

    from collections import Counter
    by_cat  = Counter(e["category"] for e in entries)
    by_sev  = Counter(e["severity"] for e in entries)
    by_file = Counter(e["file"] for e in entries)

    print(f"\n── PR Issue Log Summary ({'─' * 40})")
    print(f"  Total entries: {len(entries)}")
    print(f"\n  By severity:")
    for sev in ["P0", "P1", "P2", "P3"]:
        if by_sev[sev]:
            print(f"    {sev}: {by_sev[sev]}")
    print(f"\n  By category:")
    for cat, count in by_cat.most_common():
        print(f"    {cat:<16} {count}")
    print(f"\n  Most affected files:")
    for file, count in by_file.most_common(5):
        print(f"    {count}x  {file}")
    print()


def main() -> None:
    parser = argparse.ArgumentParser(description="Log a PR issue finding.")
    parser.add_argument("--pr",          type=int,   help="PR number")
    parser.add_argument("--commit",      type=str,   help="Commit SHA (short ok)")
    parser.add_argument("--severity",    type=str,   choices=list(SEVERITIES))
    parser.add_argument("--category",    type=str,   choices=list(CATEGORIES))
    parser.add_argument("--file",        type=str,   help="File path")
    parser.add_argument("--description", type=str,   help="One-line description")
    parser.add_argument("--source",      type=str,   default="greptile")
    parser.add_argument("--resolved-in", type=str,   help="Commit SHA where fixed")
    parser.add_argument("--dry-run",     action="store_true")
    parser.add_argument("--batch",       action="store_true",
                        help="Read JSON entries from stdin")
    parser.add_argument("--summary",     action="store_true",
                        help="Print summary of logged issues")
    args = parser.parse_args()

    if args.summary:
        summary()
        return

    if args.batch:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            entry = make_entry(**data)
            write_entry(entry, dry_run=args.dry_run)
        return

    required = ["pr", "commit", "severity", "category", "file", "description"]
    missing = [f for f in required if getattr(args, f.replace("-", "_")) is None]
    if missing:
        parser.error(f"Missing required arguments: {', '.join(missing)}")

    entry = make_entry(
        pr=args.pr,
        commit=args.commit,
        severity=args.severity,
        category=args.category,
        file=args.file,
        description=args.description,
        source=args.source,
        resolved_in=args.resolved_in,
    )
    write_entry(entry, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
