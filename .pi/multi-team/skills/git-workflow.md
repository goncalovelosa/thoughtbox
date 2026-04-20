# Git Workflow

## Rules

- Work is NOT complete until `git push` succeeds
- Never force push, `reset --hard`, or `clean -f` without explicit approval
- Always `git pull --rebase` before pushing
- Commit messages describe the *why*, not just the *what*
- Never commit directly to `main` — all work goes through feature branches

## Branch Naming

```
feat/short-description     # new feature
fix/short-description      # bug fix
refactor/short-description # structure change, behavior preserved
chore/short-description    # non-code work (deps, config, docs)
```

## Post-Edit Workflow

After every meaningful code edit or cluster of related edits:

1. **Review**: `git status` + `git diff` — understand what changed
2. **Stage**: Add specific files (not `git add .` — be selective)
3. **Commit**: Descriptive message explaining the *why*
4. **Verify**: Run relevant tests/checks if code was changed
5. **Record**: Note significant decisions or gotchas in your expertise file

## Commit Message Format

```
type(scope): short summary in imperative mood

Why this change was needed. What problem it solves.
What alternative was considered and why this was chosen instead.
```

## Before Pushing

```bash
git pull --rebase
pnpm test        # or relevant test command
git push
git status       # must show "up to date with origin"
```
