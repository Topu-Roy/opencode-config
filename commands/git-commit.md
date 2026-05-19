---
description: Stage, analyze, validate, bump version, and commit with detailed conventional format
agent: planner
subtask: true
---

# Git Commit Command

Stage changes, validate, bump version, commit: $ARGUMENTS

## Workflow

### Step 1: Stage and List Changed Files
```bash
git add -A
git diff --cached --name-only
git diff --cached --stat
```

### Step 2: Parallel Subagent Review (Batched)
If **>3 changed files**, spawn subagents in parallel to review batches:

**Batching strategy:**
- Split files into groups of 3-5
- One subagent per batch
- Each subagent runs `git diff --cached -- "<file>"` for its files
- Each checks security + change analysis in ONE pass

**Per-file checks (each subagent):**
- **Security (BLOCK if found):** `password|secret|key|token|api_key|aws_key|private|credential` in diff
- **Warn (allow):** `console.log|debugger`
- **Change type:** new file, logic change, import change, removal

If **≤3 changed files**, review directly without subagents.

### Step 3: Aggregate and Determine Commit Type
Collect all subagent results, then determine type:
- `feat` — new functionality, new files
- `fix` — bug fixes, logic corrections
- `refactor` — restructuring without behavior change
- `docs` — documentation only
- `test` — test files
- `chore` — deps, configs, maintenance
- `perf` — performance
- `ci` — CI/CD

Priority: `feat` > `fix` > `refactor` > `perf` > `test` > `docs` > `ci` > `chore`

### Step 4: Version Bump
Find version file (check in order):
- `package.json` → `"version": "x.y.z"`
- `pyproject.toml` → `version = "x.y.z"`
- `Cargo.toml` → `version = "x.y.z"`
- `VERSION` or `version.txt`

Bump based on commit type:
- `feat` → MINOR
- `fix` / `refactor` / `docs` → PATCH
- breaking → MAJOR

Update and stage:
```bash
git add <version-file>
```

### Step 5: Commit and Show Result
Generate commit message:
```
[type]: [subject]

- <file1>: <change summary>
- <file2>: <change summary>

<stats from git diff --cached --shortstat>
```

Execute:
```bash
git commit -m "..."
git log -1 --oneline
```

## Rules
- **BLOCK** if secrets found in any batch
- **WARN** if console.log in any batch
- **ONLY** review files with actual changes
- **REQUIRED** version file must exist
- **PARALLELIZE** when >3 files for speed

## Version Bump Logic

| Change Type | Bump |
|-------------|------|
| feat (new) | MINOR |
| fix | PATCH |
| refactor | PATCH |
| docs | PATCH |
| breaking | MAJOR |

---

**Execute workflow. Return concise result.**
