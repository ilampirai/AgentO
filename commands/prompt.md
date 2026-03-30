---
description: Execute a prompt using AgentO v6.0 MCP tools. Memory-first workflow with decision tracking, flow protection, and session lifecycle.
---

# /agento

Execute a prompt with AgentO's memory-first workflow.

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

For the given prompt, complete the task using ONLY AgentO tools.

**Do NOT use built-in Write, Read, Bash, Grep, or Glob tools.**

### Step 1: Load Session Context

```
agento_memory { action: "resume", resume_action: "start" }
```

### Step 2: Understand the Code (before modifying)

```
agento_entrypoints { query: "feature" }
agento_flow { ids: [...], depth: 2, direction: "both" }
agento_symbol { name: "functionName" }
agento_read { path: "only-what-you-need.ts" }
```

### Step 3: Check Constraints (before writing)

```
agento_decide { action: "check", target_files: ["file.ts"] }
agento_flow { protect_action: "check", target_file: "file.ts" }
```

### Step 4: Write with Enforcement

```
agento_write { path: "file.ts", content: "..." }
```

If blocked by conflict: `agento_write { path: "...", content: "...", force: true }`

### Step 5: Record Significant Decisions

```
agento_decide { action: "record", decision: "...", affected_files: [...] }
```

### Step 6: Close Session

```
agento_memory { action: "resume", resume_action: "end", summary: "What was done" }
```

## Tool Reference

| Operation | Tool |
|-----------|------|
| Write files | `agento_write` (rules + decisions + flows checked) |
| Read files | `agento_read` |
| Run commands | `agento_bash` |
| Search code | `agento_search` |
| Index codebase | `agento_index` |
| Find entry points | `agento_entrypoints` |
| Call graph / flow protection | `agento_flow` |
| Lookup symbols | `agento_symbol` |
| Track decisions | `agento_decide` |
| Compact memory | `agento_compact` |
| Manage rules | `agento_rules` |
| Query functions | `agento_functions` |
| Configuration | `agento_config` |
| Manage patterns | `agento_patterns` |
| Memory ops | `agento_memory` |

## If Function Not Found

```
agento_index { force: true }
agento_symbol { name: "functionName" }
agento_search { query: "functionName" }
```

Never skip the reindex step.
