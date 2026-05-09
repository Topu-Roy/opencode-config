---
description: Stage, analyze, validate, bump version, and commit with detailed conventional format
agent: planner
subtask: true
---

# Git Commit Command

Stage changes, validate, bump version, commit: $ARGUMENTS

## Pre-Commit Workflow

### Step 1: Check Current State
```bash
git status
git branch --show-current
```

### Step 2: Stage All Changes
```bash
git add -A
git diff --cached --stat
```

### Step 3: Security Scan - Check Each Staged File
For EACH file in staged changes, run:
```bash
git diff --cached -- "<file>" | grep -iE "(password|secret|key|token|api_key|aws_key|private|credential)" || echo "clean"
```

- If ANY match found → BLOCK commit, warn user
- If console.log/debug found → warn but allow (user responsibility)

### Step 4: Analyze Each File Individually
For EACH staged file, run:
```bash
git diff --cached -- "<file>"
```

Generate detailed change description for each:
- Function names changed
- Logic changes
- New imports
- Removed code

### Step 5: Determine Commit Type
Based on analyzed changes:
- `feat` — new functionality, new files
- `fix` — bug fixes, logic corrections
- `refactor` — restructuring without behavior change
- `docs` — documentation only
- `test` — test files
- `chore` — deps, configs, maintenance
- `perf` — performance
- `ci` — CI/CD

### Step 6: Version Bump
Check for version file:
- `package.json` → `"version": "x.y.z"` in root
- `pyproject.toml` → `version = "x.y.z"`
- `Cargo.toml` → `version = "x.y.z"`
- `VERSION` or `version.txt` → plain text

Determine bump type from changes:
- `feat` added → MINOR bump
- `fix` / `refactor` → PATCH bump
- breaking changes → MAJOR bump

Update version file:
```bash
# Replace version in file
# If major: x+1.0.0
# If minor: x.y+1.0
# If patch: x.y.z+1
```

Stage version bump:
```bash
git add <version-file>
```

### Step 7: Generate Detailed Commit Message
Format:
```
[type]: [subject]

[Detailed body with bullet points for EACH file]

[File stats from git diff --cached --shortstat]

Co-authored-by: [if applicable]
```

Example body:
```
- src/auth/login.ts: Added JWT token generation, integrated bcrypt for password hashing
- src/utils/jwt.ts: New file - token creation and validation utilities
- package.json: Added jsonwebtoken dependency, bumped version to 1.1.0

2 files changed, 150 insertions(+), 10 deletions(-)
```

### Step 8: Execute Commit
```bash
git commit -m "..."
```

### Step 9: Show Result
```bash
git log -1 --oneline
git branch --show-current
```

## Validation Rules

- **BLOCK** if secrets/keys/tokens detected in staged files
- **WARN** if console.log present (user decides)
- **REQUIRED** version file must exist to commit

## Version Bump Logic

| Change Type | Bump |
|-------------|------|
| feat (new) | MINOR |
| fix | PATCH |
| refactor | PATCH |
| docs | PATCH |
| breaking | MAJOR |

---

**Execute full workflow. Return detailed result.**