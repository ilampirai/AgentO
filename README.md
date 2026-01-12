# AgentO v4.0.2

**MCP-based code quality enforcement for Claude Code.**

AgentO provides hard enforcement of code quality rules at the tool level. Unlike soft prompt-based approaches, AgentO's MCP server intercepts all file operations and enforces rules automatically.

## Features

- **Hard Enforcement** - Rules enforced at tool level, not suggestions
- **Auto Tool Routing** - `.claude/rules/` ensures AgentO tools are always used
- **500-Line Limit** - Blocks writes that exceed line limit
- **Duplicate Detection** - Warns on similar function signatures
- **User Rules** - Add custom rules via `/agento:rules`
- **Auto-Indexing** - Function index updated on every read/write
- **Test Runner** - Auto-detects Playwright, Jest, pytest, PHPUnit
- **Fix Loops** - Iterate until tests pass

## Installation

```bash
claude plugin install "path/to/AgentO"
```

**That's it!** The MCP server (`@ilam/agento-mcp`) is auto-registered.

## Quick Start

```
/agento:init
```

This creates:
- `.claude/rules/agento-tools.md` - Forces AgentO tool usage
- `.agenticMemory/` - Memory files

Then just prompt normally (no prefix needed):

```
"Build a login page"
"Fix the authentication bug"  
"Run tests and fix any failures"
```

The `.claude/rules/` file ensures AgentO tools are used for ALL prompts automatically.

## Commands

| Command | Description |
|---------|-------------|
| `/agento:init` | Initialize AgentO in project |
| `/agento:rules` | Manage project rules |
| `/agento:functions` | Query function index |
| `/agento:index` | Index the codebase |
| `/agento:loop` | Start fix iteration loop |
| `/agento:test` | Run tests with retry |
| `/agento:status` | Show AgentO status |
| `/agento:config` | View/edit configuration |

## MCP Tools

| Tool | Purpose |
|------|---------|
| `agento_write` | Write file with rule enforcement |
| `agento_read` | Read file with tracking |
| `agento_bash` | Execute command safely |
| `agento_memory` | Direct memory file access |
| `agento_rules` | CRUD for rules |
| `agento_functions` | Query function index |
| `agento_index` | Index codebase |
| `agento_loop` | Iteration loop control |
| `agento_test` | Test runner |
| `agento_config` | Configuration |

## Memory Files

AgentO stores all state in `.agenticMemory/`:

| File | Purpose |
|------|---------|
| `FUNCTIONS.md` | Function signatures & dependencies |
| `RULES.md` | System & user rules |
| `ARCHITECTURE.md` | Project structure |
| `DISCOVERY.md` | Explored areas |
| `ATTEMPTS.md` | Failed actions (blocked patterns) |
| `ERRORS.md` | Known errors & solutions |
| `VERSIONS.md` | Dependency versions |
| `DATASTRUCTURE.md` | Data models & schemas |
| `config.json` | Settings |
| `LOOP_STATE.json` | Active loop state |

## Configuration

```
/agento:config set lineLimit 400
/agento:config set strictMode false
/agento:config set testFramework jest
```

| Setting | Default | Description |
|---------|---------|-------------|
| lineLimit | 500 | Max lines per file |
| strictMode | true | Block vs warn on violations |
| autoIndex | true | Auto-index on read/write |
| autoMemoryUpdate | true | Auto-update memory files |
| testFramework | auto | Test framework |
| maxLoopIterations | 10 | Default max loop iterations |

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

## Fix Loops

```
/agento:loop "Fix test failures" --until "All tests passed" --max 5 --test "npm test"
```

AgentO will:
1. Run the test command
2. If marker not found, fix issues
3. Repeat until success or max iterations

## Architecture

```
User Prompt
     ↓
Claude (Default)
     ↓
AgentO MCP Server
├── agento_write → Checks rules → Updates FUNCTIONS.md
├── agento_read → Updates DISCOVERY.md
├── agento_bash → Checks ATTEMPTS.md
└── agento_test → Auto-detects framework
     ↓
Memory Files (.agenticMemory/)
```

## v3.0.0 → v4.0.0 Migration

If upgrading from v3.0.0:

1. Your `.agenticMemory/` files are preserved
2. Sub-agents are removed (no longer needed)
3. Skills are now in MCP tools
4. Hooks are replaced by MCP enforcement
5. `/AgentO` prefix is optional (enforcement is automatic)

## License

MIT
