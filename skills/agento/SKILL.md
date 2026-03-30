---
name: agento
description: |
  ALWAYS use this skill when AgentO MCP tools are available (agento_write, agento_read, agento_memory, agento_decide, agento_flow, agento_compact, agento_index, agento_search, agento_bash, agento_symbol, agento_entrypoints, agento_functions, agento_rules, agento_config, agento_patterns). This skill MUST activate on EVERY prompt in projects where AgentO is installed. It teaches the complete memory-first workflow: session lifecycle, decision tracking, flow protection, code understanding, and memory compaction. Make sure to use this skill whenever AgentO MCP tools are detected, even if the user doesn't explicitly mention AgentO.
version: 6.0.0
---

# AgentO v6.0 — Memory-First Code Intelligence

AgentO is not a file editor. It is a **memory system that writes code**. Every action builds memory. Every write checks memory. Every session starts by loading memory and ends by saving it.

## Three Rules

1. **Memory before code.** Load context before touching files.
2. **Decide before writing.** Check for conflicts, record decisions, protect flows.
3. **Leave it better.** End every session with a snapshot so the next one starts smarter.

## Tool Routing — MANDATORY

NEVER use Claude's built-in tools when AgentO equivalents exist:

| Built-in | Use Instead |
|----------|-------------|
| Write | `agento_write` |
| Read | `agento_read` |
| Bash | `agento_bash` |
| Grep / Glob | `agento_search` |

## Session Lifecycle — MANDATORY

### Every Session Starts With

```
agento_memory { action: "resume", resume_action: "start" }
```

This loads a briefing from all 4 memory layers. Read it. It IS your context.

### Every Session Ends With

```
agento_memory { action: "resume", resume_action: "end", summary: "What was accomplished" }
```

This snapshots state for the next session.

## Memory Hierarchy (4 Layers)

```
.agenticMemory/
├── soul/           — IDENTITY.md, PRINCIPLES.md          (what this project IS — never changes)
├── core/           — DECISIONS.md, FLOWS.md               (what was decided — changes rarely)
│   ├── .decisions.json                                    (shadow index for fast parsing)
│   └── .flows.json                                        (shadow index)
├── working/        — ACTIVE_CONTEXT.md, DISCOVERY.md      (what's happening now — changes often)
├── surface/        — FUNCTIONS.md, PROJECT_MAP.md          (auto-generated code index)
│   ├── DATASTRUCTURE.md, FLOW_GRAPH.json
│   ├── ERRORS.md, VERSIONS.md
├── .branch-context/ — Per-branch session state
├── .archive/        — Compacted observations
├── config.json      — Settings
└── RULES.md         — User-defined enforcement rules
```

## The 15 Tools

| Tool | Purpose | When |
|------|---------|------|
| `agento_write` | Write files | Every file write. Checks rules + decisions + flows. Use `force: true` to override conflicts. |
| `agento_read` | Read files | Every file read. Tracks in DISCOVERY.md. |
| `agento_bash` | Run commands | Shell commands. Checks ATTEMPTS.md for known failures. |
| `agento_search` | Search code | Codebase search. Memory-aware, updates DISCOVERY.md. |
| `agento_memory` | Memory ops | Session resume/end, migration, read/write/append memory files, update project context. |
| `agento_index` | Index codebase | Extracts functions, classes, types, routes. Builds flow graph. Post-index flow verification. |
| `agento_entrypoints` | Find entry points | Before modifying code. Find where features start (e.g., "auth", "payment"). |
| `agento_flow` | Call graph + flow protection | Get subgraphs OR define/check/verify/list/update protected flows. |
| `agento_symbol` | Symbol lookup | Get function/class details by name or ID. Token-efficient alternative to reading files. |
| `agento_decide` | Decision tracking | Record decisions, check conflicts, query history, explain constraints (why). |
| `agento_compact` | Memory compaction | Analyze stale observations, propose promotions/archives, approve/reject. |
| `agento_rules` | Rule management | Add/remove/edit/enable/disable enforcement rules. |
| `agento_functions` | Function queries | Query function index directly. |
| `agento_config` | Configuration | View/set config. Memory health status. |
| `agento_patterns` | Pattern management | Manage extraction patterns (25 built-in, 8 languages). |

## Workflow: Understand → Decide → Write → Close

### Phase 1: Understand

Before touching any code:

```
agento_memory { action: "resume", resume_action: "start" }
agento_entrypoints { query: "feature-keyword" }
agento_flow { ids: [...], depth: 2, direction: "both" }
agento_symbol { name: "functionName" }
agento_read { path: "only-the-file-you-need.ts" }
```

This uses ~500 tokens vs ~10,000+ for reading entire files. 90% savings.

### Phase 2: Decide

Before writing:

```
agento_decide { action: "check", target_files: ["file.ts"] }
agento_flow { protect_action: "check", target_file: "file.ts" }
```

If conflicts found: read the decision rationale. Either respect the constraint or override with `force: true` (logged as observation).

For significant architectural choices, record them:

```
agento_decide {
  action: "record",
  decision: "Use JWT tokens instead of sessions",
  alternatives: [{ option: "Server sessions", rejected_reason: "Stateless preferred for scaling" }],
  affected_files: ["auth/login.ts", "middleware/auth.ts"],
  confidence: 8
}
```

### Phase 3: Write

```
agento_write { path: "file.ts", content: "..." }
```

If blocked by conflict:

```
agento_write { path: "file.ts", content: "...", force: true }
```

Force writes are logged to ACTIVE_CONTEXT.md automatically.

### Phase 4: Close

```
agento_memory { action: "resume", resume_action: "end", summary: "Added JWT auth" }
```

## Decision Tracking

Decisions are the memory of WHY code exists the way it does.

| Action | Use |
|--------|-----|
| `record` | Record a new decision with rationale and alternatives |
| `query` | Search decisions by keyword |
| `check` | Check files for decision conflicts + flow impact |
| `list` | List recent decisions |
| `why` | Explain why a file/symbol has constraints |

**Always check before writing:** `agento_decide { action: "check", target_files: [...] }`

**Always record significant choices:** `agento_decide { action: "record", ... }`

## Flow Protection

Protected flows guard critical multi-file code paths from accidental breakage.

| Action | Use |
|--------|-----|
| `define` | Create a new protected flow with name, steps, and files |
| `check` | Check if a file is in any protected flow |
| `verify` | Verify all flow files still exist |
| `list` | List all protected flows |
| `update` | Modify an existing flow |

**Define important flows:**
```
agento_flow {
  protect_action: "define",
  flow_name: "User Authentication",
  steps: ["validate-input", "hash-password", "check-db", "create-session"],
  files: ["auth/login.ts", "auth/session.ts", "middleware/auth.ts"]
}
```

**Check before editing:** `agento_flow { protect_action: "check", target_file: "auth/login.ts" }`

Graph nodes in protected flows are annotated with a lock icon.

## Memory Compaction

When ACTIVE_CONTEXT.md grows large (>10 observations), compact it:

```
agento_compact { action: "analyze" }     — See staleness + token usage
agento_compact { action: "propose" }     — Generate compaction proposal
agento_compact { action: "approve" }     — Execute: promote to core, archive stale
agento_compact { action: "status" }      — Token estimates per layer
```

The session briefing will nudge you when compaction is needed.

## Branch Context

When switching git branches:

```
agento_memory { action: "resume", resume_action: "switch_branch", branch: "feature/new-thing" }
```

Saves the current branch's context and loads the target's.

## Code Understanding (90% Token Savings)

**ALWAYS use flow graph tools before reading files:**

```
agento_entrypoints { query: "auth" }        → entry point IDs
agento_flow { ids: [...], depth: 2 }        → call graph subgraph (~500 tokens)
agento_symbol { name: "getUser" }           → function details (~100 tokens)
agento_read { path: "file.ts" }             → read ONLY what's needed
```

**If symbol not found — reindex first (ALWAYS):**

```
agento_index { force: true }
agento_symbol { name: "functionName" }
agento_search { query: "functionName" }     — last resort
```

## Configuration

| Key | Default | Purpose |
|-----|---------|---------|
| strictMode | true | Block vs warn on rule violations |
| autoIndex | true | Auto-index on read/write |
| deferIndex | true | Defer indexing to explicit calls |
| memory.compactionTTLDays | 14 | Days before observations go stale |
| memory.maxDecisionsLoaded | 10 | Decisions in session briefing |
| memory.tokenBudgetWarn | 8000 | Token budget warning threshold |
| memory.autoContextOnWrite | true | Log writes to ACTIVE_CONTEXT |

Check health: `agento_config { action: "status" }`

## First-Time Setup

If no `.agenticMemory/` exists:
```
agento_memory { action: "init" }
agento_index { force: true }
```

If migrating from v5.x flat layout:
```
agento_memory { action: "migrate" }
```

## Pattern System

25 built-in extraction patterns covering JS/TS, Python, PHP, Go, Rust, Java:
- Functions, classes, methods
- Data structures (interfaces, types, enums, structs, models)
- Routes (Express, FastAPI, Flask, NestJS, Next.js, Gin)
- React hooks

AI-discoverable patterns with suggest/approve lifecycle: `agento_patterns { action: "suggest" }`
