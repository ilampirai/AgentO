---
description: Reload AgentO plugin configuration without restarting Claude Code. Example: /AgentO:reload
---

# Reload Command

Reload AgentO configuration and memory files.

## Usage

```
/AgentO:reload
```

## What It Does

1. Re-reads all configuration files:
   - `.agenticMemory/config.json`
   - `.agenticMemory/RULES.md`
   - `hooks/hooks.json`

2. Refreshes memory state:
   - Reloads DISCOVERY.md
   - Reloads FUNCTIONS.md index
   - Clears any cached context

3. Resets session state:
   - Clears debug mode setting
   - Resets loop state
   - Refreshes agent routing

## When to Use

| Scenario | Use Reload? |
|----------|-------------|
| Changed RULES.md manually | ✅ Yes |
| Updated config.json | ✅ Yes |
| After git pull on plugin | ✅ Yes |
| Plugin seems stuck | ✅ Yes |
| Normal operation | ❌ No |

## Output

```
🔄 Reloading AgentO...

✓ config.json loaded
✓ RULES.md loaded (5 rules)
✓ hooks.json loaded (6 hooks)
✓ Memory files refreshed
✓ Session state reset

✅ AgentO reloaded!

Version: 2.0.0
Debug: OFF
Active project: [project-name]
```

## Reload vs Restart

| Action | What Happens |
|--------|--------------|
| `/AgentO:reload` | Re-reads config files, fast |
| Restart Claude Code | Full plugin reload, slower |

Use reload for config changes.
Use restart for plugin code changes.

## Options

### Reload Specific Component

```
/AgentO:reload config    # Just config.json
/AgentO:reload rules     # Just RULES.md
/AgentO:reload memory    # Just memory files
/AgentO:reload hooks     # Just hooks
```

### Force Full Reload

```
/AgentO:reload --full
```

Equivalent to restarting Claude Code (reloads everything).

