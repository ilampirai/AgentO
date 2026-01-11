# Revert Instructions

## Current Safe Point: v2.1.0

Tag `v2.1.0` marks the stable state before the v3.0.0 transformation.

## Quick Revert Commands

### Option 1: Hard Reset (Discard all changes since v2.1.0)
```bash
git reset --hard v2.1.0
```

### Option 2: Create New Branch from v2.1.0 (Keep v3.0 work separately)
```bash
git checkout -b v3-backup          # Save current v3 work
git checkout main
git reset --hard v2.1.0            # Reset main to v2.1.0
```

### Option 3: Revert Specific Commits (Cherry-pick what to undo)
```bash
git log --oneline v2.1.0..HEAD     # See all commits since v2.1.0
git revert <commit-hash>           # Revert specific commit
```

### Option 4: Soft Reset (Keep files, undo commits)
```bash
git reset --soft v2.1.0            # Undo commits but keep file changes staged
git status                          # Review what changed
git checkout -- .                   # Discard all file changes if needed
```

## Verification After Revert

```bash
git log --oneline -1               # Should show v2.1.0 commit
git status                          # Should show clean working tree
```

## What's in v2.1.0

- Debug mode support
- Auto-split for files >500 lines
- CLAUDE.md routing
- Multi-agent orchestration
- Memory system (.agenticMemory)
- All hooks and scripts working

## Notes

- Tag is annotated and includes timestamp
- Push tag to remote: `git push origin v2.1.0`
- Delete tag locally: `git tag -d v2.1.0`
- Delete tag remotely: `git push origin --delete v2.1.0`

---
*Created: 2026-01-12*
*Safe Point Before: v3.0.0 Transformation*

