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

### Step 2: Single-Pass Review of Changed Files Only
For EACH changed file from `git diff --cached --name-only`, run:
```bash
git diff --cached -- "<file>"
```

For each file, check BOTH security and changes in ONE pass:

**Security checks (changed files ONLY):**
- Scan diff for: `password|secret|key|token|api_key|aws_key|private|credential`
- If match found → BLOCK commit, warn user
- Check for `console.log|debugger` → warn but allow

**Change analysis (changed files ONLY):**
- New files added
- Function/logic changes
- Import changes
- Removed code

### Step 3: Determine Commit Type
Based on the changed files:
- `feat` — new functionality, new files
- `fix` — bug fixes, logic corrections
- `refactor` — restructuring without behavior change
- `docs` — documentation only
- `test` — test files
- `chore` — deps, configs, maintenance
- `perf` — performance
- `ci` — CI/CD

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
- **BLOCK** if secrets found in changed files
- **WARN** if console.log in changed files
- **ONLY** review files with actual changes
- **REQUIRED** version file must exist

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
