# Project Rules

Rules enforced by AgentO on every write operation.

## System Rules

### [SYS001] Maximum File Length
- Pattern: `max-lines`
- Files: `*`
- Action: BLOCK
- Enabled: true

Files must not exceed the configured line limit (default: 500 lines).

### [SYS002] No Duplicate Functions
- Pattern: `no-duplicates`
- Files: `*`
- Action: WARN
- Enabled: true

Warns when creating functions that already exist in the codebase.

## User Rules

Add your project-specific rules below using `/agento:rules add`.

### Example Rule Format

```markdown
### [USR001] Description
- Pattern: `pattern-name`
- Files: `*.ts, *.js`
- Action: BLOCK
- Enabled: true
```

Available patterns:
- `no-inline-css` - No `<style>` tags or `style=""` in templates
- `no-console` - No `console.log` statements
- `no-any` - No TypeScript `any` type
- Custom string - Blocks if content contains the string

