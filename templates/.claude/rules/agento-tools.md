# AgentO v6.0 Tools (Mandatory)

## Session Lifecycle

**EVERY session MUST start with:**
```
agento_memory { action: "resume", resume_action: "start" }
```

**EVERY session MUST end with:**
```
agento_memory { action: "resume", resume_action: "end", summary: "What was accomplished" }
```

## Tool Routing

| Built-in | Use Instead |
|----------|-------------|
| Write | `agento_write` (checks rules + decisions + flows) |
| Read | `agento_read` (tracks discovery) |
| Bash | `agento_bash` (checks ATTEMPTS.md) |
| Grep / Glob | `agento_search` (memory-first) |

## Before Writing

1. `agento_decide { action: "check", target_files: ["file.ts"] }` — any constraints?
2. `agento_flow { protect_action: "check", target_file: "file.ts" }` — in a protected flow?
3. If conflicts: understand WHY before overriding with `force: true`

## After Significant Decisions

```
agento_decide { action: "record", decision: "...", affected_files: [...] }
```

## Code Understanding (90% token savings)

```
agento_entrypoints { query: "feature" }     → entry point IDs
agento_flow { ids: [...], depth: 2 }        → call graph subgraph
agento_symbol { name: "func" }              → function details
agento_read { path: "file.ts" }             → read ONLY what's needed
```

**If not found:** `agento_index { force: true }` then retry. Never skip reindex.
