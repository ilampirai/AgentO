# @ilam/agento-mcp

**MCP server for [AgentO](https://github.com/ilampirai/AgentO) — code intelligence, enforcement, and decision tracking for Claude Code.**

[![npm](https://img.shields.io/npm/v/@ilam/agento-mcp)](https://www.npmjs.com/package/@ilam/agento-mcp)

## Setup

**Plugin users:** This package is auto-registered when you install the [AgentO plugin](https://github.com/ilampirai/AgentO).

**Standalone:** Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "agento": {
      "command": "npx",
      "args": ["-y", "@ilam/agento-mcp"]
    }
  }
}
```

## Tools (15)

| Tool | Purpose |
|------|---------|
| `agento_write` | Write with rule enforcement + decision/flow conflict checks |
| `agento_read` | Read with discovery tracking |
| `agento_bash` | Safe command execution |
| `agento_search` | Memory-first codebase search |
| `agento_memory` | Memory I/O, session resume, flat→layered migration |
| `agento_rules` | Project rule CRUD |
| `agento_functions` | Function index queries |
| `agento_index` | Index: functions, classes, types, routes, flow graph |
| `agento_config` | Config + memory health status |
| `agento_entrypoints` | Feature-based entry point discovery |
| `agento_flow` | Call graph subgraphs + flow protection |
| `agento_symbol` | Symbol lookup by name or ID |
| `agento_patterns` | Extraction pattern management (25 built-in, 8 languages) |
| `agento_decide` | Architectural decision tracking (record/query/check/list/why) |
| `agento_compact` | Memory compaction (analyze/propose/approve/reject/status) |

## v6.0 Features

- **4-layer memory hierarchy** — soul / core / working / surface
- **Decision tracking** — record decisions with rationale, detect conflicts before writes
- **Flow protection** — define critical paths, block unsafe edits
- **Session resume** — load briefing at start, snapshot at end, branch switching
- **Memory compaction** — promote observations to core, archive stale entries
- **Claude Code hooks** — PreToolUse flow gate, PostToolUse observation logger
- **Rule enforcement** — user-defined rules checked on every write
- **Dynamic patterns** — 25 built-in extraction patterns, AI-discoverable
- **Flow graph** — full call graph with efficient subgraph queries
- **Cross-referencing** — links types ↔ functions ↔ routes

## Memory Structure

```
.agenticMemory/
├── soul/        IDENTITY.md, PRINCIPLES.md
├── core/        DECISIONS.md, FLOWS.md, shadow indexes (.json)
├── working/     ACTIVE_CONTEXT.md, DISCOVERY.md, ATTEMPTS.md
├── surface/     FUNCTIONS.md, DATASTRUCTURE.md, PROJECT_MAP.md, FLOW_GRAPH.json
├── config.json
└── RULES.md
```

## Links

- [AgentO Plugin & Docs](https://github.com/ilampirai/AgentO)
- [Hooks Setup](https://github.com/ilampirai/AgentO/blob/main/mcp-server/docs/hooks-setup.md)
- [npm](https://www.npmjs.com/package/@ilam/agento-mcp)

## License

MIT
