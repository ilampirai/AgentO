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
| Search code | `agento_search` |
| **Index codebase** | `agento_index` |
| **Find entry points** | `agento_entrypoints` |
| **Get flow graph** | `agento_flow` |
| **Lookup symbols** | `agento_symbol` |

**Do NOT use built-in Write, Read, Bash, Grep, or Glob tools.**

## 🧠 Code Understanding Workflow (v5.0)

**BEFORE reading or modifying code:**

1. **For feature requests** (e.g., "add auth", "implement cart"):
   - Use `agento_entrypoints {query: "auth"}` to find entry points
   - Use `agento_flow {ids: [...], depth: 2}` to get call graph
   - Use `agento_symbol {ids: [...]}` for function details
   - **Only then** read specific files with `agento_read`

2. **Benefits:**
   - 90% token savings vs reading entire codebase
   - Clear understanding of code relationships
   - Fast navigation without file scanning

3. **⚠️ If function not found:**
   - **First**: Run `agento_index {force: true}` to reindex
   - **Then**: Try `agento_symbol` or `agento_entrypoints` again
   - **Finally**: If still not found, use `agento_search` and your thinking ability
   - **Never skip the reindex step** - it's critical for finding recent code

The AgentO tools automatically:
- Update memory files
- Enforce project rules
- Track functions and discoveries
- **Provide efficient code understanding via flow graph**


