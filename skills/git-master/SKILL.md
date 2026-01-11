---
name: git-master
description: Git expert for version control operations including commits, branches, merging, rebasing, and history analysis.
---

# Git Master Skill

Expert-level Git operations for version control.

## Commit Standards

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | Description |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation only |
| style | Formatting, no code change |
| refactor | Code change, no feature/fix |
| perf | Performance improvement |
| test | Adding/updating tests |
| chore | Build, tools, dependencies |

### Examples

```bash
feat(auth): add password reset functionality

- Add forgot password endpoint
- Add email sending service
- Add password reset token generation

Closes #123

---

fix(cart): prevent negative quantities

Previously, users could enter negative numbers in quantity field,
resulting in incorrect totals.

Added validation to reject quantities below 1.

Fixes #456
```

## Branch Strategy

### GitFlow

```
main          ─────●─────────────●─────────────●─────
                   ↑             ↑             ↑
hotfix        ────●┘             │             │
                                 │             │
release       ──────────●────────┘             │
                        ↑                      │
develop       ●────●────●────●────●────●───────┘
              ↑    ↑    ↑    ↑    ↑    ↑
feature       ●────┘    │    │    │    │
feature            ●────┘    │    │    │
feature                 ●────┘    │    │
```

### Branch Naming

```
feature/ABC-123-add-user-auth
bugfix/ABC-456-fix-login-error
hotfix/ABC-789-security-patch
release/v1.2.0
```

## Common Operations

### Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/ABC-123-description
```

### Commit Changes

```bash
git add -p                    # Interactive staging
git commit -m "type(scope): message"
```

### Update Branch with Latest

```bash
# Rebase (preferred for feature branches)
git fetch origin
git rebase origin/develop

# Merge (if rebase causes issues)
git merge origin/develop
```

### Squash Commits Before PR

```bash
git rebase -i HEAD~3          # Squash last 3 commits
# Change 'pick' to 'squash' for commits to combine
```

### Undo Last Commit (Keep Changes)

```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)

```bash
git reset --hard HEAD~1
```

### Stash Changes

```bash
git stash                     # Stash changes
git stash pop                 # Apply and remove stash
git stash list                # List stashes
git stash apply stash@{0}     # Apply specific stash
```

## History Analysis

### Find When Bug Introduced

```bash
git bisect start
git bisect bad HEAD           # Current is broken
git bisect good v1.0.0        # This version worked
# Git will checkout commits to test
git bisect good               # If this commit works
git bisect bad                # If this commit is broken
git bisect reset              # When done
```

### Search Commit History

```bash
git log --oneline --grep="login"           # Search messages
git log --oneline -S "functionName"        # Search code changes
git log --oneline --author="name"          # By author
git log --oneline --since="2024-01-01"     # By date
```

### View File History

```bash
git log --oneline -- path/to/file          # Commits touching file
git blame path/to/file                      # Line-by-line history
```

## Conflict Resolution

### During Rebase

```bash
# 1. Fix conflicts in files
# 2. Stage resolved files
git add <resolved-files>
# 3. Continue rebase
git rebase --continue
# Or abort if needed
git rebase --abort
```

### During Merge

```bash
# 1. Fix conflicts in files
# 2. Stage resolved files
git add <resolved-files>
# 3. Complete merge
git commit
```

## Co-authored Commits

When working with AgentO:

```bash
git commit -m "feat(auth): add login functionality

Co-authored-by: AgentO <agento@example.com>"
```

## Safety Rules

- Never force push to main/develop
- Always pull before push
- Create backup branch before risky operations
- Use `--dry-run` for destructive operations first
