# @ilam/agento-mcp

MCP server for AgentO - Hard enforcement of code quality rules in Claude Code.

## Quick Start

Add to your project's `.mcp.json`:

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

## What It Does

AgentO MCP provides tools that enforce code quality on every file operation:

| Tool | Purpose |
|------|---------|
| `agento_write` | Write files with rule enforcement (line limits, duplicates) |
| `agento_read` | Read files with auto-indexing |
| `agento_bash` | Execute commands safely |
| `agento_rules` | Manage project rules |
| `agento_functions` | Query function index |
| `agento_index` | Index the codebase |
| `agento_loop` | Run fix iterations |
| `agento_test` | Run tests with retry |
| `agento_config` | Configuration |

## Features

- **500-line file limit** - Blocks writes that exceed limit
- **Duplicate detection** - Warns on similar functions
- **User rules** - Add custom rules via `agento_rules`
- **Auto-indexing** - Function index updated automatically
- **Test runner** - Auto-detects Playwright, Jest, pytest, PHPUnit
- **Fix loops** - Iterate until tests pass

## Memory Files

Creates `.agenticMemory/` in your project:

- `FUNCTIONS.md` - Function signatures
- `RULES.md` - Project rules
- `ARCHITECTURE.md` - Project structure
- `DISCOVERY.md` - Explored areas
- `ATTEMPTS.md` - Failed actions
- `config.json` - Settings

## Links

- [AgentO Plugin](https://github.com/ilampirai/AgentO)
- [Documentation](https://github.com/ilampirai/AgentO#readme)

## License

MIT

