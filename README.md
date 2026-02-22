# AgentO v5.2.0

**MCP-based code quality enforcement and intelligent code understanding for Claude Code.**

AgentO provides hard enforcement of code quality rules at the tool level. Unlike soft prompt-based approaches, AgentO's MCP server intercepts all file operations and enforces rules automatically. The indexer extracts functions, data structures, routes, and builds a full flow graph for efficient code navigation.

## Dependency

- **MCP Server:** [`@ilam/agento-mcp`](https://www.npmjs.com/package/@ilam/agento-mcp) (auto-installed with plugin)

## Features

- **Hard Enforcement** - Rules enforced at tool level, not suggestions
- **Auto Tool Routing** - `.claude/rules/` ensures AgentO tools are always used
- **User Rules** - Add custom rules via `/agento:rules`
- **Duplicate Detection** - Warns on similar function signatures
- **Auto-Indexing** - Function index updated on every read/write
- **Test Runner** - Auto-detects Playwright, Jest, pytest, PHPUnit
- **Fix Loops** - Iterate until tests pass
- **Flow Graph Tools** - Code understanding with 90% token savings
  - `agento_entrypoints` - Find entry points for features
  - `agento_flow` - Get call graph subgraphs
  - `agento_symbol` - Lookup function/class details
- **Dynamic Pattern System (v5.2)** - Self-improving extraction patterns
  - 25 built-in patterns covering JS/TS, Python, PHP, Go, Rust, Java
  - Data structure extraction (interfaces, types, enums, structs, models)
  - Route extraction (Express, FastAPI, Flask, NestJS, Next.js, Gin)
  - Cross-referencing between types and functions
  - AI-discoverable patterns with test/suggest/approve lifecycle

## Installation

### From Marketplace (Recommended)

```bash
claude plugin marketplace add ilampirai/AgentO
claude plugin install AgentO
```

**That's it.** The MCP server (`@ilam/agento-mcp`) is auto-registered.

### Local Installation

```bash
git clone https://github.com/ilampirai/AgentO.git
claude plugin install "path/to/AgentO"
```

To update a local installation:

```bash
cd path/to/AgentO
git pull
claude plugin install "path/to/AgentO"
```

## Quick Start

```
/agento:init
```

This creates:
- `.claude/rules/agento-tools.md` - Forces AgentO tool usage
- `.agenticMemory/` - Memory files

Then prompt normally (no prefix needed):

```
"Build a login page"
"Fix the authentication bug"
"Run tests and fix any failures"
```

The `.claude/rules/` file ensures AgentO tools are used for all prompts automatically.

## Commands

| Command | Description |
|---------|-------------|
| `/agento:init` | Initialize AgentO in project |
| `/agento:rules` | Manage project rules |
| `/agento:functions` | Query function index |
| `/agento:index` | Index the codebase (generates flow graph, data structures, routes) |
| `/agento:loop` | Start fix iteration loop |
| `/agento:test` | Run tests with retry |
| `/agento:status` | Show AgentO status |
| `/agento:config` | View/edit configuration |
| `/agento:flow` | Use flow graph tools |
| `/agento:symbol` | Lookup symbol details |

## MCP Tools

| Tool | Purpose |
|------|---------|
| `agento_write` | Write file with rule enforcement |
| `agento_read` | Read file with tracking |
| `agento_bash` | Execute command safely |
| `agento_search` | Smart codebase search with memory integration |
| `agento_memory` | Direct memory file access (includes `context` action for project vision) |
| `agento_rules` | CRUD for rules |
| `agento_functions` | Query function index |
| `agento_index` | Index codebase (functions, classes, data structures, routes, flow graph) |
| `agento_config` | Configuration |
| `agento_entrypoints` | Find entry points for features (e.g., "auth", "cart") |
| `agento_flow` | Get call graph subgraph for specific functions |
| `agento_symbol` | Lookup function/class details by name or ID |
| `agento_patterns` | Manage extraction patterns (list, add, remove, test, suggest) |

## Memory Files

AgentO stores all state in `.agenticMemory/`:

| File | Purpose |
|------|---------|
| `FUNCTIONS.md` | Function signatures and dependencies |
| `PROJECT_MAP.md` | Unified project structure, modules, routes |
| `FLOW_GRAPH.json` | Full call graph with symbol IDs |
| `DATASTRUCTURE.md` | Interfaces, types, enums, structs with cross-references |
| `RULES.md` | User-defined rules |
| `ARCHITECTURE.md` | Project structure and context |
| `DISCOVERY.md` | Explored areas |
| `ATTEMPTS.md` | Failed actions (blocked patterns) |
| `ERRORS.md` | Known errors and solutions |
| `VERSIONS.md` | Dependency versions |
| `config.json` | Settings and custom extraction patterns |

## Configuration

```
/agento:config set lineLimit 400
/agento:config set strictMode false
```

| Setting | Default | Description |
|---------|---------|-------------|
| lineLimit | 0 (unlimited) | Max lines per file (0 = no limit) |
| strictMode | true | Block vs warn on violations |
| autoIndex | true | Auto-index on read/write |
| autoMemoryUpdate | true | Auto-update memory files |
| deferIndex | true | Defer indexing to explicit `agento_index` calls |

## Adding Rules

```
/agento:rules add "no console.log" --pattern no-console --action BLOCK
/agento:rules add "no inline styles" --pattern no-inline-css --files "*.html" --action WARN
```

Built-in patterns:
- `no-inline-css` - No `<style>` or `style=""`
- `no-console` - No `console.log`
- `no-any` - No TypeScript `any`
- Custom string - Blocks if content contains it

## Dynamic Pattern System

AgentO v5.2 introduces a dynamic extraction pattern system. The indexer uses configurable regex patterns to extract functions, data structures, and routes from source code.

### Default Coverage

- **Functions:** JS/TS (function, arrow, method), Python (def), PHP, Go (func), Rust (fn), Java
- **Data Structures:** TS (interface, type, enum), Python (dataclass, Pydantic), Go (struct), Rust (struct/enum), Java (record)
- **Routes:** Express, FastAPI, Flask, NestJS, Next.js API routes, Gin
- **Hooks:** React custom hooks (use*)

### Managing Patterns

```
agento_patterns { action: "list" }
agento_patterns { action: "list", category: "route" }
agento_patterns { action: "test", pattern: { regex: "...", captures: { name: 1 } }, testCode: "..." }
agento_patterns { action: "add", pattern: { id: "my-pattern", ... } }
agento_patterns { action: "remove", id: "my-pattern" }
```

AI can discover new patterns during indexing and propose them via `suggest`. Discovered patterns require explicit `approve` before activation.

### Project Context

Set project vision and conventions in ARCHITECTURE.md:

```
agento_memory { action: "context", content: "vision: TradeBook is a real-time trading platform" }
agento_memory { action: "context", content: "conventions: Use camelCase, prefer composition over inheritance" }
```

## Flow Graph Workflow

```
User: "Add authentication"

1. agento_entrypoints {query: "auth"}    -- Find entry point IDs
2. agento_flow {ids: [...], depth: 2}    -- Get call graph (500 tokens)
3. agento_symbol {ids: [...]}            -- Get function details
4. agento_read {path: "..."}             -- Read only needed files
```

This workflow uses 500-1000 tokens instead of reading the entire codebase (10k+).

## Architecture

```
User Prompt
     |
Claude (Default)
     |
AgentO MCP Server
|-- agento_write    -> Checks rules -> Marks dirty
|-- agento_read     -> Updates DISCOVERY.md
|-- agento_bash     -> Checks ATTEMPTS.md
|-- agento_search   -> Memory-first search -> Updates DISCOVERY.md
|-- agento_index    -> Extracts functions, classes, data structures, routes
|                      Builds flow graph, cross-references types
|-- agento_patterns -> Manages extraction patterns
|-- agento_test     -> Auto-detects framework
     |
Memory Files (.agenticMemory/)
```

## Migration

### v5.1 to v5.2

1. Run `/agento:index` to populate `DATASTRUCTURE.md` and route data in `PROJECT_MAP.md`
2. Existing memory files are preserved
3. `config.json` gains a `patterns` array (empty by default, defaults are in code)
4. `lineLimit` default is now 0 (unlimited); define constraints via `/agento:rules`

### v4.0 to v5.x

1. Run `/agento:index` to generate `PROJECT_MAP.md` and `FLOW_GRAPH.json`
2. Use flow graph tools for code understanding
3. All existing memory files are preserved

## License

MIT
