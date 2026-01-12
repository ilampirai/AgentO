---
description: Manage project rules. List, add, remove, edit, enable, or disable rules enforced by AgentO.
---

# /agento:rules

Manage project rules that are enforced on every write operation.

## Usage

```
/agento:rules [action] [options]
```

## Actions

### List All Rules

```
/agento:rules
/agento:rules list
```

### Add a Rule

```
/agento:rules add "no console.log in production code" --pattern no-console --files "*.ts,*.js" --action BLOCK
```

Options:
- `--pattern` - Built-in pattern or custom string
- `--files` - File patterns (default: `*`)
- `--action` - BLOCK or WARN (default: WARN)

### Remove a Rule

```
/agento:rules remove USR001
```

### Edit a Rule

```
/agento:rules edit USR001 --description "Updated description" --action BLOCK
```

### Enable/Disable

```
/agento:rules enable USR001
/agento:rules disable USR001
```

## Built-in Patterns

| Pattern | What It Checks |
|---------|----------------|
| `no-inline-css` | No `<style>` tags or `style=""` |
| `no-console` | No `console.log` statements |
| `no-any` | No TypeScript `any` type |
| `max-lines` | File line limit (from config) |
| Custom string | Blocks if content contains string |

## Examples

```
/agento:rules add "no inline styles" --pattern no-inline-css --files "*.html,*.vue" --action BLOCK

/agento:rules add "no TODO comments" --pattern "// TODO" --action WARN

/agento:rules disable SYS001  # Disable line limit
```

## Rule Format

Rules are stored in `.agenticMemory/RULES.md`:

```markdown
### [USR001] No console.log
- Pattern: `no-console`
- Files: `*.ts, *.js`
- Action: BLOCK
- Enabled: true
```
