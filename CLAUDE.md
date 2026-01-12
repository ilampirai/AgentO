# AgentO v4.0.0 - MCP Edition

This project uses **AgentO MCP** for automatic code quality enforcement.

## How It Works

AgentO provides MCP tools that enforce rules on **every file operation**:

| Tool | What It Enforces |
|------|------------------|
| `agento_write` | Line limits, duplicates, user rules |
| `agento_read` | Auto-updates discovery & function index |
| `agento_bash` | Blocks previously failed commands |
| `agento_test` | Auto-detects framework, runs with retry |
| `agento_loop` | Iteration until success |

## Quick Start

Run `/agento:init` then just prompt normally — enforcement is automatic.

## Commands

| Command | Purpose |
|---------|---------|
| `/agento:init` | Initialize AgentO |
| `/agento:rules` | Manage rules |
| `/agento:functions` | Query function index |
| `/agento:index` | Index codebase |
| `/agento:loop` | Start fix loop |
| `/agento:test` | Run tests |
| `/agento:status` | Show status |
| `/agento:config` | Configuration |

## Memory Files

All memory is stored in `.agenticMemory/`:

- `FUNCTIONS.md` - Function signatures
- `RULES.md` - User rules
- `ARCHITECTURE.md` - Project structure
- `DISCOVERY.md` - Explored areas
- `ATTEMPTS.md` - Failed actions
- `ERRORS.md` - Known solutions
- `VERSIONS.md` - Dependencies
- `config.json` - Settings

## Default Rules

1. **500-line limit** - Files blocked if too long
2. **No duplicates** - Warns on similar functions
3. **User rules** - Add with `/agento:rules add`

## No Special Prefix Needed

After `/agento:init`, just talk normally:

```
"Build a login page"
"Fix the auth bug"
"Run tests until they pass"
```

AgentO MCP tools enforce everything automatically.
