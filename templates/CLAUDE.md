# AgentO Project (v6.0)

This project uses AgentO v6.0 with 4-layer memory hierarchy.

## Session Lifecycle

**Start:** `agento_memory { action: "resume", resume_action: "start" }`
**End:** `agento_memory { action: "resume", resume_action: "end", summary: "..." }`

## Tool Routing

| Built-in | Use Instead |
|----------|-------------|
| Write | `agento_write` (checks rules + decisions + flows) |
| Read | `agento_read` |
| Bash | `agento_bash` |
| Grep / Glob | `agento_search` |

## Before Writing: Check Constraints

```
agento_decide { action: "check", target_files: ["file.ts"] }
agento_flow { protect_action: "check", target_file: "file.ts" }
```

## After Decisions: Record Them

```
agento_decide { action: "record", decision: "...", affected_files: [...] }
```

## Code Understanding

```
agento_entrypoints { query: "feature" }
agento_flow { ids: [...], depth: 2 }
agento_symbol { name: "func" }
agento_read { path: "file.ts" }
```

If not found: `agento_index { force: true }` then retry.
