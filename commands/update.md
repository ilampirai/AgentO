---
description: Update AgentO plugin to latest version. Example: /AgentO:update
---

# Update Command

Update AgentO plugin to the latest version.

## Usage

```
/AgentO:update
```

## Methods

### Method 1: Git Pull (If Cloned)

If you installed via git clone:

```bash
cd ~/.claude/plugins/AgentO  # or wherever plugin is installed
git pull origin main
```

Then restart Claude Code or run:
```
/AgentO:reload
```

### Method 2: Reinstall (Cleanest)

```bash
# Remove old version
claude plugin remove AgentO

# Install latest
claude plugin add ilampirai/AgentO
```

### Method 3: In-Place Update (This Command)

When you run `/AgentO:update`, AgentO will:

1. Check current version from `plugin.json`
2. Fetch latest version from GitHub
3. Compare versions
4. If newer available:
   - Download latest
   - Replace plugin files
   - Preserve local config
5. Report what changed

## Output

```
🔄 Checking for updates...

Current: v2.0.0
Latest:  v2.1.0

📦 Update available!

Changes in v2.1.0:
- Added debug mode
- Fixed memory initialization
- New test modes

Updating...
✓ Downloaded latest
✓ Replaced plugin files
✓ Preserved .agenticMemory/

✅ Updated to v2.1.0

Restart Claude Code to apply changes.
```

## If Already Latest

```
🔄 Checking for updates...

Current: v2.0.0
Latest:  v2.0.0

✓ Already on latest version!
```

## Preserve Local Data

Update does NOT touch:
- `.agenticMemory/` in your projects
- Custom agents in `.agenticMemory/agents/`
- Your `RULES.md` customizations
- `config.json` routing changes

Only plugin source files are replaced.

## Force Update

To force reinstall even if same version:

```
/AgentO:update --force
```

## Check Version Only

```
/AgentO:update --check
```

Output:
```
Current: v2.0.0
Latest:  v2.1.0
Update available! Run /AgentO:update to install.
```

## Manual Update Steps

If the command doesn't work, do it manually:

```bash
# 1. Find plugin location
claude plugin list --path

# 2. Go to plugin directory
cd [plugin-path]/AgentO

# 3. Pull latest (if git repo)
git pull origin main

# 4. Or remove and reinstall
claude plugin remove AgentO
claude plugin add ilampirai/AgentO
```

## After Update

1. Restart Claude Code (or start new session)
2. Run `/AgentO:start` in your project to update memory files if needed
3. Check `/AgentO:debug status` to verify version

