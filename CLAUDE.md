# AgentO v6.0 - Memory Hierarchy + Decision Tracking

When user runs `/agento <prompt>`, use ONLY AgentO MCP tools:

| Operation | Use |
|-----------|-----|
| Write | `agento_write` (with force flag for overrides) |
| Read | `agento_read` |
| Commands | `agento_bash` |
| Search | `agento_search` |
| **Index codebase** | `agento_index` |
| **Get flow graph** | `agento_flow` (also: flow protection) |
| **Lookup symbols** | `agento_symbol` |
| **Find entry points** | `agento_entrypoints` |
| **Track decisions** | `agento_decide` |
| **Compact memory** | `agento_compact` |

Do NOT use built-in Write, Read, Bash, Grep, or Glob for `/agento` prompts.

## Session Start (CRITICAL)

**Every session MUST begin with:**
```
agento_memory { action: "resume", resume_action: "start" }
```
This loads the session briefing from all memory layers (soul → core → working → surface).

**Every session SHOULD end with:**
```
agento_memory { action: "resume", resume_action: "end", summary: "What was accomplished" }
```

## Memory Layers

| Layer | Purpose | Files |
|-------|---------|-------|
| **Soul** | Project identity & principles (never changes) | `soul/IDENTITY.md`, `soul/PRINCIPLES.md` |
| **Core** | Decisions & protected flows (changes rarely) | `core/DECISIONS.md`, `core/FLOWS.md` |
| **Working** | Active context & observations (changes often) | `working/ACTIVE_CONTEXT.md`, `working/DISCOVERY.md` |
| **Surface** | Code index (auto-generated) | `surface/FUNCTIONS.md`, `surface/PROJECT_MAP.md` |

## Decision Tracking

Before making architectural choices, check existing decisions:
```
agento_decide { action: "check", target_files: ["path/to/file.ts"] }
```

After making a decision, record it:
```
agento_decide { action: "record", decision: "Use JWT for auth", alternatives: [{option: "Sessions", rejected_reason: "Stateless preferred"}], affected_files: ["auth/login.ts"] }
```

To understand why constraints exist:
```
agento_decide { action: "why", file: "auth/login.ts" }
```

## Flow Protection

Protected flows prevent accidental breakage of critical paths.

Define a flow:
```
agento_flow { protect_action: "define", flow_name: "Auth Flow", description: "Login to session", steps: ["validate", "hash", "check-db", "create-session"], files: ["auth/login.ts", "auth/session.ts"] }
```

Check before editing:
```
agento_flow { protect_action: "check", target_file: "auth/login.ts" }
```

## Write Tool (Updated)

`agento_write` now checks decisions and flows before writing:
- If conflicts found: returns report, **does not write**
- To override: `agento_write { path: "...", content: "...", force: true }`
- Force writes are logged as observations in ACTIVE_CONTEXT.md

## Memory Compaction

When observations accumulate (>10), compact:
```
agento_compact { action: "analyze" }   → See staleness
agento_compact { action: "propose" }   → Generate proposal
agento_compact { action: "approve" }   → Execute compaction
```

## Code Understanding Workflow

**BEFORE writing or modifying code, ALWAYS:**

1. **Start session** with `agento_memory { action: "resume", resume_action: "start" }`
2. **Understand the codebase**: Check `PROJECT_MAP.md`, use `agento_entrypoints`, `agento_flow`
3. **Check constraints**: `agento_decide { action: "check", target_files: [...] }`
4. **Write with enforcement**: `agento_write { path: "...", content: "..." }`
5. **Record decisions**: `agento_decide { action: "record", ... }` for significant choices

## Fallback Workflow

If you cannot find a function/symbol:
1. `agento_index { force: true }` — reindex
2. Try `agento_symbol` or `agento_entrypoints` again
3. Use `agento_search` as last resort

## Branch Context

When switching branches:
```
agento_memory { action: "resume", resume_action: "switch_branch", branch: "feature/new-feature" }
```

## Migration (from v5.x)

If using an older flat `.agenticMemory/` layout:
```
agento_memory { action: "migrate" }
```
This moves files to the layered structure and generates IDENTITY.md.
