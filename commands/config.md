---
description: View or modify AgentO configuration. Control line limits, strict mode, auto-indexing, and more.
---

# /agento:config

View or modify AgentO configuration.

## Usage

```
/agento:config [action] [key] [value]
```

## Actions

### View All Configuration

```
/agento:config
```

### Get Specific Value

```
/agento:config lineLimit
/agento:config get strictMode
```

### Set Value

```
/agento:config set lineLimit 400
/agento:config set strictMode false
/agento:config set testFramework jest
```

### Reset to Defaults

```
/agento:config reset              # Reset all
/agento:config reset lineLimit    # Reset single key
```

## Configuration Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| lineLimit | number | 500 | Max lines per file |
| strictMode | boolean | true | Block on violations (vs warn) |
| autoIndex | boolean | true | Auto-index on read/write |
| autoMemoryUpdate | boolean | true | Auto-update memory files |
| testFramework | string | "auto" | Test framework preference |
| maxLoopIterations | number | 10 | Default max loop iterations |

## Examples

### Increase Line Limit

```
/agento:config set lineLimit 750
```

### Disable Strict Mode

```
/agento:config set strictMode false
```

Now violations will warn instead of block.

### Force Jest for Testing

```
/agento:config set testFramework jest
```

### Reset Everything

```
/agento:config reset
```

## Config File

Configuration is stored in `.agenticMemory/config.json`:

```json
{
  "lineLimit": 500,
  "strictMode": true,
  "autoIndex": true,
  "autoMemoryUpdate": true,
  "testFramework": "auto",
  "maxLoopIterations": 10
}
```



