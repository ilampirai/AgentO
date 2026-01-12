# AgentO Tools (Mandatory)

**ALWAYS use AgentO MCP tools for file operations:**

| Operation | Required Tool |
|-----------|---------------|
| Write files | `agento_write` |
| Read files | `agento_read` |
| Run commands | `agento_bash` |
| Run tests | `agento_test` |
| Fix iterations | `agento_loop` |

## Rules

1. **NEVER** use built-in `Write` tool → use `agento_write`
2. **NEVER** use built-in `Read` tool → use `agento_read`
3. **NEVER** use built-in `Bash` tool → use `agento_bash`

## Why

AgentO tools automatically:
- Update `.agenticMemory/` files (FUNCTIONS.md, DISCOVERY.md)
- Enforce project rules from RULES.md
- Track errors and failed attempts
- Detect duplicate functions

Using built-in tools bypasses all enforcement.

