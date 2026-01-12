---
description: Execute a prompt using AgentO MCP tools. Ensures all file operations use agento_write, agento_read, agento_bash.
---

# /agento

Execute a prompt with AgentO tools.

## Usage

```
/agento <your prompt here>
```

## Examples

```
/agento Build a login page from PRD.md
/agento Fix the authentication bug
/agento Run tests and fix failures until all pass
```

## What To Do

For the given prompt, complete the task using ONLY these tools:

| Operation | Tool |
|-----------|------|
| Write files | `agento_write` |
| Read files | `agento_read` |
| Run commands | `agento_bash` |
| Run tests | `agento_test` |
| Iterate fixes | `agento_loop` |

**Do NOT use built-in Write, Read, or Bash tools.**

The AgentO tools automatically:
- Update memory files
- Enforce project rules
- Track functions and discoveries

