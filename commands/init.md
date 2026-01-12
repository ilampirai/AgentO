---
description: Initialize AgentO in a project. Auto-creates .mcp.json and .agenticMemory folder.
---

# /agento:init

Initialize AgentO in your project with one command.

## Usage

```
/agento:init
```

## What To Do

### Step 1: Create/Update `.mcp.json` in project root

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

If `.mcp.json` already exists with other servers, add the `agento` entry to `mcpServers`.

### Step 2: Create `.agenticMemory/` directory with these files:

- `FUNCTIONS.md` - Function index
- `RULES.md` - Project rules  
- `ARCHITECTURE.md` - Project structure
- `DISCOVERY.md` - Exploration log
- `ATTEMPTS.md` - Failed actions log
- `ERRORS.md` - Known errors & solutions
- `VERSIONS.md` - Dependency versions
- `DATASTRUCTURE.md` - Data models
- `config.json` - Settings
- `LOOP_STATE.json` - Loop tracking

Use template content from the plugin's `templates/` folder.

### Step 3: Confirm initialization

Reply: "AgentO initialized. MCP server registered."

## After Init

Just prompt normally. AgentO MCP tools enforce rules automatically:

```
"Build a login page"           # agento_write enforces rules
"Fix the auth bug"             # agento_read tracks discovery
"Run tests and fix failures"   # agento_test runs with retry
```

## MCP Tools Available

| Tool | Purpose |
|------|---------|
| agento_write | Write files with rule enforcement |
| agento_read | Read files with tracking |
| agento_bash | Execute commands safely |
| agento_rules | Manage project rules |
| agento_functions | Query function index |
| agento_index | Index the codebase |
| agento_loop | Start iteration loops |
| agento_test | Run tests with retry |
| agento_config | View/edit configuration |

