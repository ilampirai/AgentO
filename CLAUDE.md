# AgentO

When user runs `/agento <prompt>`, use ONLY AgentO MCP tools:

| Operation | Use |
|-----------|-----|
| Write | `agento_write` |
| Read | `agento_read` |
| Commands | `agento_bash` |
| Tests | `agento_test` |
| Fix loops | `agento_loop` |

Do NOT use built-in Write, Read, or Bash for `/agento` prompts.
