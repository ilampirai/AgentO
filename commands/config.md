---
description: View or modify AgentO v6.0 configuration. Control strict mode, auto-indexing, memory settings, and view health status.
---

# /agento:config

View or modify AgentO configuration and memory health.

## Usage

```
/agento:config [action] [key] [value]
```

## Actions

### View All Configuration

```
/agento:config
/agento:config get
```

### Set Value

```
/agento:config set strictMode false
/agento:config set memory.compactionTTLDays 7
```

### Reset to Defaults

```
/agento:config reset
/agento:config reset strictMode
```

### Memory Health Status

```
/agento:config status
```

Shows: function count, rule count, decision count, protected flow count, working memory token usage, dirty files, layered structure completeness.

## Configuration Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| strictMode | boolean | true | Block on violations (vs warn) |
| autoIndex | boolean | true | Auto-index on read/write |
| autoMemoryUpdate | boolean | true | Auto-update memory files |
| deferIndex | boolean | true | Defer indexing to explicit calls |
| memory.compactionTTLDays | number | 14 | Days before observations go stale |
| memory.maxDecisionsLoaded | number | 10 | Decisions included in session briefing |
| memory.maxDecisionsStored | number | 0 | Max stored (0 = unlimited) |
| memory.tokenBudgetWarn | number | 8000 | Token budget warning threshold |
| memory.autoContextOnWrite | boolean | true | Log writes to ACTIVE_CONTEXT.md |

## Config File

Stored in `.agenticMemory/config.json`.
