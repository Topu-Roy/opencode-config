---
description: Stage and commit with intelligent conventional format
agent: planner
subtask: true
---

# Git Commit Command

Stage changes, analyze, generate commit message, commit: $ARGUMENTS

## Process

1. **Check branch**: `git branch --show-current`
2. **Stage all**: `git add -A`
3. **Analyze staged**: `git diff --cached --stat` + `git diff --cached`
4. **Determine type** from changed files:
   - `feat` — new files, new functionality
   - `fix` — bug fixes, logic corrections
   - `refactor` — restructuring without behavior change
   - `docs` — documentation changes
   - `test` — test files only
   - `chore` — dependencies, configs, maintenance
   - `perf` — performance changes
   - `ci` — CI/CD files
5. **Generate message**: conventional format with bullet points
6. **Commit**: `git commit -m "..."`
7. **Show result**: branch, commit hash, files changed

## Message Format

```
[type]: [subject]

- [change 1]
- [change 2]
- [change 3]

[files] files changed, [lines] insertions(+), [deletions](-)
```

## Decision

- If changes include secrets/console.log → warn, block
- If ambiguous type → default to `chore`
- If no staged changes → error, exit

---

**Execute automatically. Show result only.**