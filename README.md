# AgentO v6.0

**MCP-based code intelligence, enforcement, and decision tracking for Claude Code.**

AgentO intercepts all file operations through its MCP server — enforcing rules, tracking architectural decisions, protecting critical flows, and maintaining a 4-layer memory hierarchy that persists across sessions.

[![npm](https://img.shields.io/npm/v/@ilam/agento-mcp)](https://www.npmjs.com/package/@ilam/agento-mcp)

## What's New in v6.0

- **4-Layer Memory** — soul/core/working/surface hierarchy with session resume
- **Decision Tracking** — record, query, and enforce architectural decisions
- **Flow Protection** — define critical paths, block unsafe edits, verify integrity
- **Memory Compaction** — auto-detect stale observations, propose promotions/archives
- **Branch Context** — per-branch working state with seamless switching
- **Claude Code Hooks** — PreToolUse flow gates + PostToolUse observation logging
- **Always-On Skill** — auto-activates when plugin is installed, teaches Claude the full memory-first workflow without requiring `/agento` prefix

## Installation

```bash
# Marketplace (recommended)
claude plugin marketplace add ilampirai/AgentO
claude plugin install AgentO

# Manual
git clone https://github.com/ilampirai/AgentO.git
claude plugin install "path/to/AgentO"
```

The MCP server ([`@ilam/agento-mcp`](https://www.npmjs.com/package/@ilam/agento-mcp)) is auto-registered.

## Always-On Skill

AgentO includes a **skill** (`skills/agento/SKILL.md`) that auto-activates when the plugin is installed. Unlike slash commands that require `/agento` prefix, the skill loads into Claude's context automatically and teaches the complete v6.0 workflow:

- Session lifecycle (resume at start, snapshot at end)
- Tool routing (agento_write instead of Write, etc.)
- Decision checking before every write
- Flow protection awareness
- Code understanding via flow graph (90% token savings)
- Memory compaction when observations accumulate

**No configuration needed.** Install the plugin, and Claude uses AgentO's memory-first workflow on every prompt.

## Quick Start

```
/agento:init
```

Creates `.claude/rules/agento-tools.md` and `.agenticMemory/` with the full layered structure.

## MCP Tools (15)

| Tool | Purpose |
|------|---------|
| `agento_write` | Write with rule enforcement, decision/flow conflict checks, `force` override |
| `agento_read` | Read with discovery tracking |
| `agento_bash` | Safe command execution |
| `agento_search` | Memory-first codebase search |
| `agento_memory` | Memory I/O + session resume + migration |
| `agento_rules` | CRUD for project rules |
| `agento_functions` | Query function index |
| `agento_index` | Full indexer: functions, classes, types, routes, flow graph |
| `agento_config` | Configuration + memory health status |
| `agento_entrypoints` | Find entry points by feature name |
| `agento_flow` | Call graph subgraphs + flow protection (define/check/verify/list/update) |
| `agento_symbol` | Lookup function/class details by name or ID |
| `agento_patterns` | Manage extraction patterns (25 built-in, 8 languages) |
| `agento_decide` | Record/query/check/list decisions + explain constraints (`why`) |
| `agento_compact` | Analyze/propose/approve/reject memory compaction |

## Memory Hierarchy

```
.agenticMemory/
├── soul/                  # Never changes
│   ├── IDENTITY.md        # Project name, description, tech stack
│   └── PRINCIPLES.md      # Engineering & design principles
├── core/                  # Changes rarely
│   ├── DECISIONS.md       # Architectural decisions with rationale
│   ├── FLOWS.md           # Protected critical flows
│   ├── .decisions.json    # Shadow index (fast parsing)
│   └── .flows.json        # Shadow index
├── working/               # Changes often
│   ├── ACTIVE_CONTEXT.md  # Current session state, observations
│   ├── DISCOVERY.md       # Explored areas
│   └── ATTEMPTS.md        # Failed actions
├── surface/               # Auto-generated
│   ├── FUNCTIONS.md       # Function signatures + dependencies
│   ├── DATASTRUCTURE.md   # Interfaces, types, enums, structs
│   ├── PROJECT_MAP.md     # Modules, classes, routes
│   ├── FLOW_GRAPH.json    # Full call graph
│   ├── ERRORS.md          # Known errors + solutions
│   └── VERSIONS.md        # Dependency versions
├── .branch-context/       # Per-branch session state
├── .archive/              # Compacted observations
├── config.json            # Settings
└── RULES.md               # User-defined rules
```

## Key Workflows

### Session Resume
```
agento_memory { action: "resume", resume_action: "start" }   # Load briefing
agento_memory { action: "resume", resume_action: "end" }     # Snapshot state
```

### Decision Tracking
```
agento_decide { action: "record", decision: "Use JWT", affected_files: ["auth.ts"] }
agento_decide { action: "check", target_files: ["auth.ts"] }
agento_decide { action: "why", file: "auth.ts" }
```

### Flow Protection
```
agento_flow { protect_action: "define", flow_name: "Auth", files: ["auth.ts", "session.ts"] }
agento_flow { protect_action: "check", target_file: "auth.ts" }
```

### Write with Conflict Detection
```
agento_write { path: "auth.ts", content: "..." }         # Blocked if conflicts
agento_write { path: "auth.ts", content: "...", force: true }  # Override + log
```

### Code Understanding (90% token savings)
```
agento_entrypoints { query: "auth" }        # Find entry points
agento_flow { ids: [...], depth: 2 }        # Get call graph (500 tokens)
agento_symbol { name: "getUser" }           # Function details
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| strictMode | true | Block vs warn on rule violations |
| autoIndex | true | Auto-index on read/write |
| deferIndex | true | Defer indexing to explicit calls |
| memory.compactionTTLDays | 14 | Days before observations go stale |
| memory.maxDecisionsLoaded | 10 | Decisions included in session briefing |
| memory.tokenBudgetWarn | 8000 | Token budget warning threshold |
| memory.autoContextOnWrite | true | Log writes to ACTIVE_CONTEXT |

## Pattern System

25 built-in patterns covering:
- **Functions:** JS/TS, Python, PHP, Go, Rust, Java
- **Data Structures:** interfaces, types, enums, structs, models, dataclasses
- **Routes:** Express, FastAPI, Flask, NestJS, Next.js, Gin
- **Hooks:** React custom hooks

AI-discoverable patterns with test/suggest/approve lifecycle.

## Claude Code Hooks

Optional hard-gate enforcement via Claude Code hooks:

| Hook | Trigger | Action |
|------|---------|--------|
| `pre-write-check.sh` | PreToolUse (Write) | Blocks native Write if file is in protected flow |
| `post-change-review.sh` | PostToolUse (Write/Edit) | Logs file changes to ACTIVE_CONTEXT |

See [`docs/hooks-setup.md`](mcp-server/docs/hooks-setup.md) for installation.

## Migration

### v5.x → v6.0

```
agento_memory { action: "migrate" }
```

Atomic copy-first migration: moves files to layered structure, generates `IDENTITY.md` from `package.json` + README, creates `DECISIONS.md`, `FLOWS.md`, `PRINCIPLES.md`, `ACTIVE_CONTEXT.md`.

### v4.x → v5.x → v6.0

Run migrate, then `agento_index { force: true }` to rebuild all indexes.

## License

MIT
