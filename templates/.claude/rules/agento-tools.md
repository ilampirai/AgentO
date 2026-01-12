# AgentO Tools (Mandatory)

**ALWAYS use AgentO MCP tools for file operations:**

| Operation | Required Tool |
|-----------|---------------|
| Write files | `agento_write` |
| Read files | `agento_read` |
| Run commands | `agento_bash` |
| Run tests | `agento_test` |
| Fix iterations | `agento_loop` |
| Search code | `agento_search` |

## Rules

1. **NEVER** use built-in `Write` tool → use `agento_write`
2. **NEVER** use built-in `Read` tool → use `agento_read`
3. **NEVER** use built-in `Bash` tool → use `agento_bash`
4. **NEVER** use built-in `Grep`/`Glob` tools → use `agento_search`

## Why

AgentO tools automatically:
- Update `.agenticMemory/` files (FUNCTIONS.md, DISCOVERY.md)
- Enforce project rules from RULES.md
- Track errors and failed attempts
- Detect duplicate functions
- Smart search with memory-first lookups

Using built-in tools bypasses all enforcement.

