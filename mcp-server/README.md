# @ilam/agento-mcp

**MCP server for the [AgentO Claude Code plugin](https://github.com/ilampirai/AgentO).** This package is automatically registered when you install the AgentO plugin. See the [GitHub repository](https://github.com/ilampirai/AgentO) for full documentation and installation instructions.

## Quick Start

**For most users:** Install the [AgentO plugin](https://github.com/ilampirai/AgentO) -- this MCP server is included automatically.

**Manual setup:** Add to your project's `.mcp.json`:

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

Then run `/agento:init` in Claude Code.

## Tools

| Tool | Purpose |
|------|---------|
| `agento_write` | Write files with rule enforcement |
| `agento_read` | Read files with auto-indexing |
| `agento_bash` | Execute commands safely |
| `agento_search` | Smart codebase search with memory integration |
| `agento_memory` | Direct memory file access and project context |
| `agento_rules` | Manage project rules |
| `agento_functions` | Query function index |
| `agento_index` | Index codebase (functions, classes, data structures, routes, flow graph) |
| `agento_config` | Configuration |
| `agento_entrypoints` | Find entry points for features |
| `agento_flow` | Get call graph subgraphs |
| `agento_symbol` | Lookup function/class details |
| `agento_patterns` | Manage extraction patterns (list, add, remove, test, suggest) |

## Features

- **Rule enforcement** - User-defined rules checked on every write
- **Duplicate detection** - Warns on similar function signatures
- **Dynamic pattern system** - 25 built-in extraction patterns for 8 languages
- **Data structure extraction** - Interfaces, types, enums, structs, models
- **Route extraction** - Express, FastAPI, Flask, NestJS, Next.js, Gin
- **Cross-referencing** - Links types to the functions that use them
- **Flow graph** - Full call graph with efficient subgraph queries
- **Auto-indexing** - Function index updated automatically
- **Test runner** - Auto-detects Playwright, Jest, pytest, PHPUnit

## Memory Files

Creates `.agenticMemory/` in your project:

| File | Purpose |
|------|---------|
| `FUNCTIONS.md` | Function signatures and dependencies |
| `PROJECT_MAP.md` | Project structure, modules, routes |
| `FLOW_GRAPH.json` | Call graph with symbol IDs |
| `DATASTRUCTURE.md` | Interfaces, types, enums, structs with cross-references |
| `RULES.md` | User-defined rules |
| `ARCHITECTURE.md` | Project structure and context |
| `DISCOVERY.md` | Explored areas |
| `ATTEMPTS.md` | Failed actions |
| `config.json` | Settings and custom patterns |

## Links

- [AgentO Plugin](https://github.com/ilampirai/AgentO)
- [Documentation](https://github.com/ilampirai/AgentO#readme)

## License

MIT
