#!/usr/bin/env python3
"""
Post-task fitness recorder for .pi/multi-team.

Records 10 binary fitness evaluations to the niche archive after each task.
Run at the end of every task as part of landing-the-plane, after tests pass
and before pushing.

Usage:
    python3 .pi/multi-team/scripts/record-fitness.py
    python3 .pi/multi-team/scripts/record-fitness.py --dry-run
    python3 .pi/multi-team/scripts/record-fitness.py --skip-tests
    python3 .pi/multi-team/scripts/record-fitness.py --niche feature:cross-subsystem
    python3 .pi/multi-team/scripts/record-fitness.py --transcript PATH
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

try:
    import yaml
except ImportError:
    yaml = None  # type: ignore

# ── Paths ─────────────────────────────────────────────────────────────────────

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))
MULTI_TEAM_DIR = PROJECT_DIR / ".pi/multi-team"
ARCHIVE_DIR = MULTI_TEAM_DIR / "archive"
CONFIG_PATH = MULTI_TEAM_DIR / "config.yaml"
CLAUDE_STATE = PROJECT_DIR / ".claude/state"
PI_SESSIONS = Path.home() / ".pi/agent/sessions"


# ── Config ────────────────────────────────────────────────────────────────────

def load_config() -> dict:
    """Load config.yaml. Falls back to hardcoded defaults if yaml unavailable."""
    defaults = {
        "langsmith_dataset": "multi-team-fitness",
        "budget_ceilings": {
            "single-file": 50_000,
            "multi-file": 150_000,
            "cross-subsystem": 400_000,
        },
        "round_ceilings": {
            "feature": 8, "bug": 6, "refactor": 6, "infra": 5, "research": 4,
        },
        "branch_prefixes": {
            "feat/": "feature", "feature/": "feature",
            "fix/": "bug", "bug/": "bug",
            "refactor/": "refactor",
            "chore/": "infra", "infra/": "infra",
            "docs/": "research", "research/": "research",
        },
        "complexity": {"single_file_max": 1, "multi_file_max_dirs": 2},
        "adr_required_for": [
            "feature:cross-subsystem", "refactor:cross-subsystem",
        ],
    }
    if yaml is None or not CONFIG_PATH.exists():
        return defaults
    try:
        with open(CONFIG_PATH) as f:
            loaded = yaml.safe_load(f)
        # Deep merge: loaded values override defaults
        for k, v in loaded.items():
            if isinstance(v, dict) and isinstance(defaults.get(k), dict):
                defaults[k].update(v)
            else:
                defaults[k] = v
        return defaults
    except Exception:
        return defaults


CONFIG = load_config()


# ── Data model ────────────────────────────────────────────────────────────────

@dataclass
class FitnessRecord:
    timestamp: str
    blueprint_hash: str
    niche: str
    branch: str
    task_ref: str

    # Binary evaluations (None = could not determine)
    tests_pass:               Optional[bool] = None
    no_regressions:           Optional[bool] = None
    validation_shipped:       Optional[bool] = None
    spec_before_impl:         Optional[bool] = None
    adr_for_arch:             Optional[bool] = None
    terminal_state_reported:  Optional[bool] = None
    prediction_committed:     Optional[bool] = None
    stepping_stone_recorded:  Optional[bool] = None
    cost_under_budget:        Optional[bool] = None
    rounds_under_ceiling:     Optional[bool] = None

    # Raw measurements
    token_cost:        Optional[int] = None
    delegation_rounds: Optional[int] = None

    # Derived
    fitness:           Optional[float] = None

    def evaluations(self) -> list[Optional[bool]]:
        return [
            self.tests_pass, self.no_regressions, self.validation_shipped,
            self.spec_before_impl, self.adr_for_arch, self.terminal_state_reported,
            self.prediction_committed, self.stepping_stone_recorded,
            self.cost_under_budget, self.rounds_under_ceiling,
        ]

    def compute_fitness(self) -> float:
        determined = [e for e in self.evaluations() if e is not None]
        if not determined:
            return 0.0
        return sum(1 for e in determined if e) / len(determined)


# ── Git ───────────────────────────────────────────────────────────────────────

def git(cmd: str) -> str:
    result = subprocess.run(
        ["git"] + cmd.split(), cwd=PROJECT_DIR,
        capture_output=True, text=True,
    )
    return result.stdout.strip()


def get_branch() -> str:
    return git("branch --show-current") or "unknown"


def get_blueprint_hash() -> str:
    config_path = MULTI_TEAM_DIR / "multi-team-config.yaml"
    if config_path.exists():
        r = subprocess.run(
            ["git", "hash-object", str(config_path)],
            capture_output=True, text=True,
        )
        return r.stdout.strip()[:8] or "unknown"
    return "unknown"


def get_changed_files() -> list[str]:
    out = git("diff --name-only main...HEAD")
    return [f for f in out.splitlines() if f]


# ── Niche classification ──────────────────────────────────────────────────────

def classify_niche(branch: str, changed_files: list[str]) -> str:
    prefixes: dict[str, str] = CONFIG["branch_prefixes"]
    task_type = next(
        (t for p, t in prefixes.items() if branch.startswith(p)),
        "research",
    )

    n = len(changed_files)
    single_max: int = CONFIG["complexity"]["single_file_max"]
    multi_max_dirs: int = CONFIG["complexity"]["multi_file_max_dirs"]

    if n <= single_max:
        complexity = "single-file"
    else:
        top_dirs = {Path(f).parts[0] for f in changed_files if Path(f).parts}
        complexity = (
            "cross-subsystem" if len(top_dirs) > multi_max_dirs else "multi-file"
        )

    return f"{task_type}:{complexity}"


# ── Transcript discovery ──────────────────────────────────────────────────────

def find_latest_transcript() -> Optional[Path]:
    """Find the most recent pi session transcript for this project."""
    if not PI_SESSIONS.exists():
        return None

    # Pi encodes project path: /a/b/c -> --a-b-c--
    project_last = PROJECT_DIR.name  # e.g. "thoughtbox-staging"

    best: Optional[Path] = None
    best_mtime = 0.0

    for sessions_dir in PI_SESSIONS.iterdir():
        if not sessions_dir.is_dir():
            continue
        if project_last not in sessions_dir.name:
            continue
        for transcript in sessions_dir.glob("*.jsonl"):
            mtime = transcript.stat().st_mtime
            if mtime > best_mtime:
                best_mtime = mtime
                best = transcript

    return best


def parse_transcript(path: Path) -> dict:
    """Extract text and token usage from a pi session transcript."""
    lines = path.read_text(errors="replace").splitlines()
    total_tokens = 0

    for line in lines:
        if not line.strip():
            continue
        try:
            msg = json.loads(line)
            usage = None
            if isinstance(msg, dict):
                inner = msg.get("message", msg)
                if isinstance(inner, dict):
                    usage = inner.get("usage")
            if usage and isinstance(usage, dict):
                total_tokens += usage.get("input_tokens", 0)
                total_tokens += usage.get("cache_creation_input_tokens", 0)
                total_tokens += usage.get("cache_read_input_tokens", 0)
                total_tokens += usage.get("output_tokens", 0)
        except (json.JSONDecodeError, KeyError):
            continue

    return {
        "text": "\n".join(lines),
        "token_cost": total_tokens or None,
    }


# ── Binary evaluators ─────────────────────────────────────────────────────────

def eval_tests_pass() -> bool:
    result = subprocess.run(
        ["pnpm", "test", "--run"],
        cwd=PROJECT_DIR, capture_output=True, timeout=300,
    )
    return result.returncode == 0


def eval_no_regressions() -> Optional[bool]:
    sentinel = CLAUDE_STATE / "tests-passed-since-edit"
    if not CLAUDE_STATE.exists():
        return None
    return sentinel.exists()


def eval_validation_shipped(text: Optional[str]) -> Optional[bool]:
    if not text:
        return None
    # Explicit BLOCK verdict takes priority
    if re.search(r"\bBLOCK\b", text):
        return False
    if re.search(r"\bSHIP\b", text):
        return True
    return None


def eval_spec_before_impl(changed_files: list[str]) -> Optional[bool]:
    src_files = [f for f in changed_files if f.startswith("src/")]
    if not src_files:
        return True  # No implementation — requirement doesn't apply
    spec_files = [f for f in changed_files if f.startswith(".specs/")]
    return len(spec_files) > 0


def eval_adr_for_arch(changed_files: list[str], niche: str) -> bool:
    required_niches: list[str] = CONFIG["adr_required_for"]
    if niche not in required_niches:
        return True  # Not required — pass
    adr_files = [f for f in changed_files if f.startswith(".adr/")]
    return len(adr_files) > 0


def eval_terminal_state_reported(text: Optional[str]) -> Optional[bool]:
    if not text:
        return None
    terminal = ["resolved", "insufficient_information", "environment_compromised"]
    return any(t in text for t in terminal)


def eval_prediction_committed(text: Optional[str]) -> Optional[bool]:
    if not text:
        return None
    return bool(re.search(r"\bPrimary:\s", text)) and bool(re.search(r"\bRecovery:\s", text))


def eval_stepping_stone_recorded(text: Optional[str]) -> Optional[bool]:
    if not text:
        return None
    patterns = [
        r"Ruled-out approaches:",
        r"Falsified Hypotheses:",
        r"do not retry",
        r"stepping.stone",
    ]
    return any(re.search(p, text, re.IGNORECASE) for p in patterns)


def eval_cost_under_budget(token_cost: Optional[int], niche: str) -> Optional[bool]:
    if not token_cost:
        return None
    complexity = niche.split(":")[1] if ":" in niche else "single-file"
    ceiling: int = CONFIG["budget_ceilings"].get(complexity, 200_000)
    return token_cost <= ceiling


def eval_rounds(text: Optional[str], niche: str) -> tuple[Optional[bool], Optional[int]]:
    if not text:
        return None, None
    patterns = [
        r"@[\w][\w\s\-]+:",       # @Backend Developer:
        r"Delegating to\s+\w",    # Delegating to Engineering Lead
        r"\bdelegate\b.{1,40}\bto\b",
    ]
    count = sum(len(re.findall(p, text, re.IGNORECASE)) for p in patterns)
    if count == 0:
        return None, None
    task_type = niche.split(":")[0]
    ceiling: int = CONFIG["round_ceilings"].get(task_type, 6)
    return count <= ceiling, count


# ── Archive ───────────────────────────────────────────────────────────────────

def _fmt(v: Optional[bool]) -> str:
    if v is None:
        return "null"
    return "true" if v else "false"


def write_history(record: FitnessRecord) -> Path:
    niche_dir = ARCHIVE_DIR / record.niche
    niche_dir.mkdir(parents=True, exist_ok=True)
    path = niche_dir / "fitness-history.jsonl"
    with open(path, "a") as f:
        f.write(json.dumps(asdict(record)) + "\n")
    return path


def update_elite(record: FitnessRecord) -> bool:
    """Promote record to elite if it outperforms the current one. Returns True if promoted."""
    niche_dir = ARCHIVE_DIR / record.niche
    niche_dir.mkdir(parents=True, exist_ok=True)
    elite_path = niche_dir / "elite.yaml"

    current_fitness = 0.0
    if elite_path.exists():
        m = re.search(r"^fitness:\s*([\d.]+)", elite_path.read_text(), re.MULTILINE)
        if m:
            current_fitness = float(m.group(1))

    if record.fitness is None:
        return False
    if elite_path.exists() and record.fitness <= current_fitness:
        return False

    determined = sum(1 for v in record.evaluations() if v is not None)
    content = f"""\
# Elite blueprint for niche: {record.niche}
# Updated: {record.timestamp}
# Fitness: {record.fitness:.1%} ({determined}/10 evaluations determined)

blueprint_hash: {record.blueprint_hash}
fitness: {record.fitness:.6f}
promoted_from_branch: {record.branch}
promoted_at: {record.timestamp}

evaluations:
  tests_pass:              {_fmt(record.tests_pass)}
  no_regressions:          {_fmt(record.no_regressions)}
  validation_shipped:      {_fmt(record.validation_shipped)}
  spec_before_impl:        {_fmt(record.spec_before_impl)}
  adr_for_arch:            {_fmt(record.adr_for_arch)}
  terminal_state_reported: {_fmt(record.terminal_state_reported)}
  prediction_committed:    {_fmt(record.prediction_committed)}
  stepping_stone_recorded: {_fmt(record.stepping_stone_recorded)}
  cost_under_budget:       {_fmt(record.cost_under_budget)}
  rounds_under_ceiling:    {_fmt(record.rounds_under_ceiling)}

raw:
  token_cost:        {record.token_cost or "null"}
  delegation_rounds: {record.delegation_rounds or "null"}
"""
    elite_path.write_text(content)
    return True


# ── LangSmith ─────────────────────────────────────────────────────────────────

def _read_dotenv(key: str) -> Optional[str]:
    for env_file in [PROJECT_DIR / ".env", MULTI_TEAM_DIR / ".env"]:
        if not env_file.exists():
            continue
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            if k.strip() == key:
                return v.strip().strip("\"'") or None
    return None


def post_to_langsmith(record: FitnessRecord) -> bool:
    api_key = os.environ.get("LANGSMITH_API_KEY") or _read_dotenv("LANGSMITH_API_KEY")
    dataset_name = (
        os.environ.get("LANGSMITH_DATASET")
        or _read_dotenv("LANGSMITH_DATASET")
        or CONFIG.get("langsmith_dataset")
    )
    if not api_key or not dataset_name:
        return False

    try:
        from langsmith import Client  # type: ignore
        client = Client(api_key=api_key)

        try:
            ds = client.read_dataset(dataset_name=dataset_name)
        except Exception:
            ds = client.create_dataset(
                dataset_name=dataset_name,
                description="Multi-team fitness records — blueprint evolution archive",
            )

        client.create_example(
            inputs={
                "niche":          record.niche,
                "branch":         record.branch,
                "blueprint_hash": record.blueprint_hash,
            },
            outputs={
                "tests_pass":               record.tests_pass,
                "no_regressions":           record.no_regressions,
                "validation_shipped":       record.validation_shipped,
                "spec_before_impl":         record.spec_before_impl,
                "adr_for_arch":             record.adr_for_arch,
                "terminal_state_reported":  record.terminal_state_reported,
                "prediction_committed":     record.prediction_committed,
                "stepping_stone_recorded":  record.stepping_stone_recorded,
                "cost_under_budget":        record.cost_under_budget,
                "rounds_under_ceiling":     record.rounds_under_ceiling,
                "fitness":                  record.fitness,
                "token_cost":               record.token_cost,
                "delegation_rounds":        record.delegation_rounds,
            },
            dataset_id=ds.id,
            metadata={
                "timestamp": record.timestamp,
                "task_ref":  record.task_ref,
            },
        )
        return True
    except ImportError:
        print("  LangSmith: install langsmith package to enable posting", file=sys.stderr)
        return False
    except Exception as e:
        print(f"  LangSmith error: {e}", file=sys.stderr)
        return False


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Record post-task fitness metrics for the multi-team blueprint archive."
    )
    parser.add_argument("--transcript", type=Path, help="Path to pi session transcript")
    parser.add_argument("--niche", help="Override niche classification")
    parser.add_argument("--dry-run", action="store_true", help="Print without writing")
    parser.add_argument("--skip-tests", action="store_true", help="Skip running pnpm test")
    args = parser.parse_args()

    print("── Multi-team Fitness Recorder ──────────────────────────────────")

    # Context
    branch        = get_branch()
    changed_files = get_changed_files()
    blueprint     = get_blueprint_hash()
    niche         = args.niche or classify_niche(branch, changed_files)

    print(f"  Branch:    {branch}")
    print(f"  Niche:     {niche}")
    print(f"  Files:     {len(changed_files)} changed vs main")
    print(f"  Blueprint: {blueprint}")

    # Transcript
    transcript_path = args.transcript or find_latest_transcript()
    transcript_data: Optional[dict] = None
    if transcript_path and Path(transcript_path).exists():
        print(f"  Transcript: {Path(transcript_path).name}")
        transcript_data = parse_transcript(Path(transcript_path))
    else:
        print("  Transcript: not found — transcript-based evals will be null")

    text        = transcript_data["text"]       if transcript_data else None
    token_cost  = transcript_data["token_cost"] if transcript_data else None

    # Build record
    record = FitnessRecord(
        timestamp      = datetime.now(timezone.utc).isoformat(),
        blueprint_hash = blueprint,
        niche          = niche,
        branch         = branch,
        task_ref       = branch,
        token_cost     = token_cost,
    )

    # Evaluators
    print()
    print("  Evaluations:")

    def run(label: str, fn) -> Optional[bool]:
        try:
            result = fn()
            sym   = "✓" if result is True else ("✗" if result is False else "·")
            word  = "pass" if result is True else ("FAIL" if result is False else "n/a")
            print(f"    {sym}  {label:<32} {word}")
            return result
        except subprocess.TimeoutExpired:
            print(f"    ·  {label:<32} timeout")
            return None
        except Exception as e:
            print(f"    ·  {label:<32} error: {e}")
            return None

    if not args.skip_tests:
        record.tests_pass = run("tests_pass", eval_tests_pass)
    else:
        print(f"    ·  {'tests_pass':<32} skipped")

    record.no_regressions          = run("no_regressions",          eval_no_regressions)
    record.validation_shipped      = run("validation_shipped",      lambda: eval_validation_shipped(text))
    record.spec_before_impl        = run("spec_before_impl",        lambda: eval_spec_before_impl(changed_files))
    record.adr_for_arch            = run("adr_for_arch",            lambda: eval_adr_for_arch(changed_files, niche))
    record.terminal_state_reported = run("terminal_state_reported", lambda: eval_terminal_state_reported(text))
    record.prediction_committed    = run("prediction_committed",    lambda: eval_prediction_committed(text))
    record.stepping_stone_recorded = run("stepping_stone_recorded", lambda: eval_stepping_stone_recorded(text))
    record.cost_under_budget       = run("cost_under_budget",       lambda: eval_cost_under_budget(token_cost, niche))

    rounds_pass, rounds_count = eval_rounds(text, niche)
    record.rounds_under_ceiling = run("rounds_under_ceiling", lambda: rounds_pass)
    record.delegation_rounds    = rounds_count

    record.fitness = record.compute_fitness()

    determined = sum(1 for v in record.evaluations() if v is not None)
    passed     = sum(1 for v in record.evaluations() if v is True)

    print()
    print(f"  Fitness:  {record.fitness:.0%}  ({passed}/{determined} determined evals passing)")
    if token_cost:
        print(f"  Tokens:   {token_cost:,}")
    if rounds_count:
        print(f"  Rounds:   {rounds_count}")

    # Write
    print()
    if args.dry_run:
        print("  (dry-run — nothing written)")
    else:
        path = write_history(record)
        print(f"  ✓ Written  → {path.relative_to(PROJECT_DIR)}")

        promoted = update_elite(record)
        elite_path = ARCHIVE_DIR / niche / "elite.yaml"
        if promoted:
            print(f"  ✓ Elite    → {elite_path.relative_to(PROJECT_DIR)}")
        else:
            if elite_path.exists():
                m = re.search(r"^fitness:\s*([\d.]+)", elite_path.read_text(), re.MULTILINE)
                current = float(m.group(1)) if m else 0.0
                print(f"  · Elite unchanged  (current {current:.0%}, this {record.fitness:.0%})")
            else:
                promoted2 = update_elite(record)
                if promoted2:
                    print(f"  ✓ First elite → {elite_path.relative_to(PROJECT_DIR)}")
                else:
                    print("  · First elite skipped (fitness could not be determined)")

        if post_to_langsmith(record):
            print(f"  ✓ LangSmith → dataset '{CONFIG.get('langsmith_dataset')}'")
        else:
            print("  · LangSmith: set LANGSMITH_DATASET in .env to enable")

    print()


if __name__ == "__main__":
    main()
