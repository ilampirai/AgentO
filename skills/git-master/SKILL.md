# Git Master Skill

Advanced git workflows, best practices, and automation patterns.

## Commit Message Standards

### Conventional Commits Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types
| Type | When to Use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `refactor` | Code change, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding/updating tests |
| `chore` | Build, deps, config |
| `ci` | CI/CD changes |

### Examples
```bash
feat(auth): add JWT refresh token support
fix(api): handle null response in user endpoint
docs(readme): update installation instructions
refactor(utils): extract date formatting to helper
```

## Branch Strategy

### GitFlow Pattern
```
main ─────────────────────────────────────►
  │                                    ▲
  └─► develop ──────────────────────┬──┘
        │         │         │       │
        └─► feature/auth    │       │
                  │         │       │
                  └─────────┴───────┘
                        merge
```

### Branch Naming
```
feature/{ticket}-{description}    # feature/AUTH-123-jwt-refresh
bugfix/{ticket}-{description}     # bugfix/BUG-456-null-check
hotfix/{description}              # hotfix/critical-auth-fix
release/{version}                 # release/v2.1.0
```

## Common Workflows

### Start New Feature
```bash
git checkout develop
git pull origin develop
git checkout -b feature/TICKET-description
```

### Sync with Develop
```bash
git fetch origin
git rebase origin/develop
# OR if shared branch:
git merge origin/develop
```

### Interactive Rebase (Clean History)
```bash
git rebase -i HEAD~5

# In editor:
pick abc1234 First commit
squash def5678 WIP
squash ghi9012 More WIP
reword jkl3456 Final implementation
drop mno7890 Debug code
```

### Cherry Pick Specific Commit
```bash
git cherry-pick <commit-hash>
# With conflict resolution:
git cherry-pick --continue
```

### Bisect to Find Bug
```bash
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
# Test each commit, mark good/bad
git bisect good  # or git bisect bad
# When found:
git bisect reset
```

## Conflict Resolution

### Strategy
1. **Understand both changes** - read the conflict markers
2. **Check context** - `git log --oneline --graph`
3. **Resolve thoughtfully** - don't just accept one side
4. **Test after resolve** - run tests before committing

### Conflict Markers
```
<<<<<<< HEAD (your changes)
const value = newImplementation();
=======
const value = oldImplementation();
>>>>>>> feature-branch (incoming changes)
```

### Resolution Commands
```bash
# Accept ours (current branch)
git checkout --ours <file>

# Accept theirs (incoming branch)
git checkout --theirs <file>

# Manual edit, then:
git add <file>
git rebase --continue
```

## Undo Operations

### Undo Last Commit (Keep Changes)
```bash
git reset --soft HEAD~1
```

### Undo Last Commit (Discard Changes)
```bash
git reset --hard HEAD~1
```

### Undo Pushed Commit (Safe)
```bash
git revert <commit-hash>
git push
```

### Recover Deleted Branch
```bash
git reflog
git checkout -b recovered-branch <hash>
```

## Stash Patterns

### Save Work Temporarily
```bash
git stash push -m "WIP: feature description"
```

### Apply and Keep
```bash
git stash apply stash@{0}
```

### Apply and Remove
```bash
git stash pop
```

### List Stashes
```bash
git stash list
```

## Hooks Setup

### Pre-commit (Lint/Format)
```bash
# .git/hooks/pre-commit
#!/bin/sh
npm run lint
npm run format:check
```

### Commit-msg (Validate Format)
```bash
# .git/hooks/commit-msg
#!/bin/sh
commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|ci)(\(.+\))?: .{1,50}'
if ! grep -qE "$commit_regex" "$1"; then
    echo "Invalid commit message format"
    exit 1
fi
```

## Git Aliases (Recommended)

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --all"
git config --global alias.unstage "reset HEAD --"
git config --global alias.last "log -1 HEAD"
```

## Monorepo Patterns

### Sparse Checkout
```bash
git clone --filter=blob:none --sparse <repo>
git sparse-checkout set packages/my-package
```

### Subtree (Include External Repo)
```bash
git subtree add --prefix=vendor/lib <repo> main --squash
git subtree pull --prefix=vendor/lib <repo> main --squash
```

## When to Use What

| Situation | Command |
|-----------|---------|
| Clean up messy commits | `git rebase -i` |
| Undo local mistake | `git reset` |
| Undo pushed mistake | `git revert` |
| Save work temporarily | `git stash` |
| Find when bug introduced | `git bisect` |
| Bring one commit | `git cherry-pick` |
| Sync with upstream | `git rebase` or `git merge` |

## Integration with AgentO

When handling git operations:

1. **Before commits**: Check RULES.md for commit standards
2. **Before push**: Verify branch naming
3. **On conflicts**: Offer resolution strategies
4. **After major changes**: Suggest commit message
5. **Log errors**: Record git failures in ATTEMPTS.md

